import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedAdmin, hasPermission } from '@/lib/auth';
import { z } from 'zod';
import { 
  generateInquiryReference, 
  processInquiryNotifications,
  EnhancedInquiryPayload
} from '@/lib/notifications/inquiry-notification';
import { 
  getStorageProvider, 
  validateAttachmentBuffer, 
  generateAttachmentStorageKey,
  MAX_ATTACHMENT_COUNT,
  StoredAttachment,
  StorageConfigurationError
} from '@/lib/storage';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// In-memory rate limiting to prevent spam
interface RateLimitRecord {
  count: number;
  resetAt: number;
}
const rateLimitMap = new Map<string, RateLimitRecord>();
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const RATE_LIMIT_MAX_REQUESTS = 6; // Max 6 submissions per 10 minutes per IP

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return true;
  }
  record.count += 1;
  return false;
}

async function isDistributedRateLimited(ip: string): Promise<boolean> {
  // Layer 1: In-memory fast path on the active container
  if (isRateLimited(ip)) {
    return true;
  }

  // Layer 2: Persistent database-backed count across all serverless lambda containers
  try {
    const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);
    const recentSubmissions = await prisma.auditLog.count({
      where: {
        action: 'INQUIRY_SUBMITTED',
        ipAddress: ip,
        createdAt: { gte: windowStart },
      },
    });
    if (recentSubmissions >= RATE_LIMIT_MAX_REQUESTS) {
      return true;
    }
  } catch (err) {
    // Safe fallback to in-memory layer if DB read encounters transient timeout
    console.warn('[RateLimit] Notice: Using in-memory layer for IP check:', err);
  }

  return false;
}

const inquiryZodSchema = z.object({
  customerName: z.string().min(2, 'Name must be at least 2 characters').max(100),
  customerPhone: z.string().min(7, 'Please provide a valid phone number').max(20),
  customerEmail: z.string().email().optional().or(z.literal('')),
  customerAddress: z.string().max(200).optional().or(z.literal('')),
  category: z.enum(['PRODUCT', 'WHATSAPP', 'REPAIR', 'SERVICE', 'GENERAL']).default('GENERAL'),
  type: z.enum(['PRODUCT_INQUIRY', 'SERVICE_REQUEST', 'AMC_REQUEST', 'DIRECT_ORDER', 'GENERAL_INQUIRY']).default('GENERAL_INQUIRY'),
  subject: z.string().min(2).max(200).default('Website Inquiry'),
  message: z.string().min(5, 'Message must be at least 5 characters').max(3000),
  productId: z.string().optional().nullable(),
  serviceId: z.string().optional().nullable(),
  deviceCategory: z.string().max(100).optional().nullable(),
  deviceBrand: z.string().max(100).optional().nullable(),
  deviceModel: z.string().max(100).optional().nullable(),
  preferredDate: z.string().max(100).optional().nullable(),
  preferredContact: z.enum(['PHONE', 'WHATSAPP', 'EMAIL']).default('PHONE'),
  productDetails: z.string().optional().nullable(),
  serviceDetails: z.string().optional().nullable(),
});

function extractClientIp(req: NextRequest): string {
  // Trust proxy-verified x-real-ip first (set by Vercel Edge Proxy)
  const realIp = req.headers.get('x-real-ip')?.trim();
  if (realIp) return realIp;

  // Fallback to first hop of x-forwarded-for if present
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    const firstHop = forwarded.split(',')[0]?.trim();
    if (firstHop) return firstHop;
  }

  return 'local';
}

export async function POST(req: NextRequest) {
  const ip = extractClientIp(req);

  // 1. Rate Limiting Check (Multi-layer: in-memory fast path + persistent database count)
  if (await isDistributedRateLimited(ip)) {
    return NextResponse.json(
      { error: 'Too many submissions received. Please wait a few minutes before submitting another request.' },
      { status: 429 }
    );
  }

  const uploadedAttachments: StoredAttachment[] = [];
  const storage = getStorageProvider();

  try {
    const contentType = req.headers.get('content-type') || '';
    let parsedFields: Record<string, any> = {};
    const rawFiles: File[] = [];

    // 2. Parse Multipart vs JSON
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();

      // Check honeypot field
      const hp = formData.get('website_hp');
      if (hp && String(hp).trim().length > 0) {
        // Silent rejection of bot submissions
        return NextResponse.json({ success: true, reference: 'KE-SPAM-PREV', message: 'Inquiry received.' });
      }

      formData.forEach((value, key) => {
        if (value instanceof File) {
          if (key === 'attachments' || key === 'files' || key.startsWith('attachment_')) {
            if (value.size > 0 && value.name) {
              rawFiles.push(value);
            }
          }
        } else {
          parsedFields[key] = value;
        }
      });
    } else {
      const json = await req.json();
      if (json.website_hp && String(json.website_hp).trim().length > 0) {
        return NextResponse.json({ success: true, reference: 'KE-SPAM-PREV', message: 'Inquiry received.' });
      }
      parsedFields = json;
    }

    // 3. Schema validation
    const validated = inquiryZodSchema.parse(parsedFields);
    const reference = generateInquiryReference();

    // 4. File attachments validation and persistence
    if (rawFiles.length > MAX_ATTACHMENT_COUNT) {
      return NextResponse.json(
        { error: `Maximum ${MAX_ATTACHMENT_COUNT} attachments permitted per inquiry.` },
        { status: 400 }
      );
    }

    try {
      for (const file of rawFiles) {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const validation = validateAttachmentBuffer(buffer, file.name, file.type);
        if (!validation.valid) {
          // Rollback any already uploaded files
          for (const uploaded of uploadedAttachments) {
            await storage.delete(uploaded.storageKey).catch(() => {});
          }
          return NextResponse.json(
            { error: `File "${file.name}": ${validation.error}` },
            { status: 400 }
          );
        }

        const attachmentId = `att_${crypto.randomBytes(8).toString('hex')}`;
        const storageKey = generateAttachmentStorageKey(reference, file.name);

        const uploadRes = await storage.upload(
          buffer,
          storageKey,
          validation.detectedMime || file.type || 'application/octet-stream',
          file.name
        );

        uploadedAttachments.push({
          id: attachmentId,
          originalName: file.name,
          mimeType: validation.detectedMime || file.type || 'application/octet-stream',
          size: buffer.length,
          storageKey: uploadRes.storageKey,
          storageProvider: uploadRes.provider,
          createdAt: new Date().toISOString(),
        });
      }
    } catch (uploadError: any) {
      if (uploadError instanceof StorageConfigurationError || uploadError?.name === 'StorageConfigurationError') {
        return NextResponse.json(
          {
            error: 'File attachments are temporarily disabled: Cloud object storage (S3/Cloudflare R2) is not configured in this production environment. Please submit your request without attachments, or contact the store directly.',
            code: 'STORAGE_NOT_CONFIGURED',
          },
          { status: 503 }
        );
      }
      throw uploadError;
    }

    // 5. Database Persistence
    let createdInquiry;
    try {
      createdInquiry = await prisma.inquiry.create({
        data: {
          reference,
          customerName: validated.customerName,
          customerPhone: validated.customerPhone,
          customerEmail: validated.customerEmail || null,
          customerAddress: validated.customerAddress || null,
          category: validated.category,
          type: validated.type,
          subject: validated.subject,
          message: validated.message,
          productId: validated.productId || null,
          serviceId: validated.serviceId || null,
          deviceCategory: validated.deviceCategory || null,
          deviceBrand: validated.deviceBrand || null,
          deviceModel: validated.deviceModel || null,
          preferredDate: validated.preferredDate || null,
          preferredContact: validated.preferredContact,
          productDetails: validated.productDetails || null,
          serviceDetails: validated.serviceDetails || null,
          attachments: JSON.stringify(uploadedAttachments),
          status: 'NEW',
          emailStatus: 'PENDING',
          whatsappStatus: 'NOT_CONFIGURED',
        },
      });
    } catch (dbError: any) {
      // Rollback uploaded attachments on DB failure
      for (const uploaded of uploadedAttachments) {
        await storage.delete(uploaded.storageKey).catch(() => {});
      }
      throw dbError;
    }

    // Record distributed audit entry for multi-instance rate limiting & auditing
    await prisma.auditLog.create({
      data: {
        action: 'INQUIRY_SUBMITTED',
        entity: 'Inquiry',
        entityId: createdInquiry.id,
        ipAddress: ip,
        details: `Customer inquiry submitted: ${reference} (${validated.category})`,
      },
    }).catch(() => {});

    // 6. Fetch store settings for notification details
    const [settings, service, product] = await Promise.all([
      prisma.setting.findUnique({ where: { id: 'site-settings' } }).catch(() => null),
      validated.serviceId ? prisma.service.findUnique({ where: { id: validated.serviceId } }).catch(() => null) : null,
      validated.productId ? prisma.product.findUnique({ where: { id: validated.productId } }).catch(() => null) : null,
    ]);

    // Parse product details if passed or lookup from DB
    let structuredProduct = null;
    if (product) {
      structuredProduct = {
        id: product.id,
        title: product.title,
        sku: product.sku,
        price: product.offerPrice || product.regularPrice,
        image: product.primaryImage,
      };
    } else if (validated.productDetails) {
      try {
        structuredProduct = JSON.parse(validated.productDetails);
      } catch {}
    }

    // 7. Dispatch notifications asynchronously without blocking HTTP response
    const notificationPayload: EnhancedInquiryPayload = {
      inquiryId: createdInquiry.id,
      reference,
      customerName: validated.customerName,
      customerPhone: validated.customerPhone,
      customerEmail: validated.customerEmail || null,
      customerAddress: validated.customerAddress || null,
      category: validated.category,
      type: validated.type,
      subject: validated.subject,
      message: validated.message,
      deviceCategory: validated.deviceCategory || null,
      deviceBrand: validated.deviceBrand || null,
      deviceModel: validated.deviceModel || null,
      preferredDate: validated.preferredDate || null,
      productDetails: structuredProduct,
      serviceDetails: service ? { id: service.id, title: service.title, slug: service.slug } : null,
      attachments: uploadedAttachments,
      preferredContact: validated.preferredContact,
      storePhone: settings?.contactPhone || '083-522006',
      storeWhatsapp: settings?.contactWhatsapp || '9858083951',
      storeEmail: settings?.contactEmail || 'krishanelectronics2077@gmail.com',
      storeAddress: settings?.locationAddress || 'Birendranagar, Surkhet',
      siteName: settings?.siteName || 'Krishna Electronics Order & Suppliers',
    };

    // Execute notification pipeline in background
    processInquiryNotifications(notificationPayload).catch((notifyErr) => {
      console.error('[Inquiry API] Async notification pipeline error:', notifyErr);
    });

    // 8. Clean on-site response with reference ID - NO external redirects
    return NextResponse.json(
      {
        success: true,
        reference: createdInquiry.reference,
        id: createdInquiry.id,
        message: 'Your inquiry has been received successfully. Our team will contact you shortly.',
        attachmentsCount: uploadedAttachments.length,
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0]?.message || 'Validation error' }, { status: 400 });
    }
    console.error('[Inquiry API] Submission error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process inquiry submission.' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const admin = await getAuthenticatedAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized: Administrative authentication required.' }, { status: 401 });
    }

    if (!hasPermission(admin.role, 'canManageInquiries')) {
      return NextResponse.json(
        { error: 'Forbidden: Your role does not have permission to view customer inquiries.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || '';
    const type = searchParams.get('type') || '';
    const category = searchParams.get('category') || '';

    const where: any = {};
    if (status) where.status = status;
    if (type) where.type = type;
    if (category) where.category = category;

    const inquiries = await prisma.inquiry.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({ inquiries });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch inquiries' }, { status: 500 });
  }
}
