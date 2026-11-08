import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentAdminFromRequest, logAudit } from '@/lib/auth';
import { z } from 'zod';
import { 
  buildWhatsAppInquiryUrl, 
  sendInquiryEmails, 
  dispatchAutomatedWhatsApp 
} from '@/lib/notifications/inquiry-notification';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const inquirySchema = z.object({
  customerName: z.string().min(2, 'Name must be at least 2 characters'),
  customerPhone: z.string().min(7, 'Please provide a valid phone number'),
  customerEmail: z.string().email().optional().or(z.literal('')),
  customerAddress: z.string().optional().or(z.literal('')),
  type: z.enum(['PRODUCT_INQUIRY', 'SERVICE_REQUEST', 'AMC_REQUEST', 'DIRECT_ORDER', 'GENERAL_INQUIRY']).default('GENERAL_INQUIRY'),
  subject: z.string().default('General Inquiry'),
  message: z.string().min(5, 'Message must be at least 5 characters'),
  productId: z.string().optional().nullable(),
  serviceId: z.string().optional().nullable(),
  preferredContact: z.enum(['PHONE', 'WHATSAPP', 'EMAIL']).default('PHONE'),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const validated = inquirySchema.parse(json);

    const inquiry = await prisma.inquiry.create({
      data: {
        customerName: validated.customerName,
        customerPhone: validated.customerPhone,
        customerEmail: validated.customerEmail || null,
        customerAddress: validated.customerAddress || null,
        type: validated.type,
        subject: validated.subject || 'Website Inquiry',
        message: validated.message,
        productId: validated.productId,
        serviceId: validated.serviceId,
        preferredContact: validated.preferredContact,
        status: 'NEW',
      },
    });

    // Fetch site settings and entity titles for notification dispatch
    const [settings, service, product] = await Promise.all([
      prisma.setting.findUnique({ where: { id: 'site-settings' } }).catch(() => null),
      validated.serviceId ? prisma.service.findUnique({ where: { id: validated.serviceId } }).catch(() => null) : null,
      validated.productId ? prisma.product.findUnique({ where: { id: validated.productId } }).catch(() => null) : null,
    ]);

    const notificationPayload = {
      inquiryId: inquiry.id,
      customerName: validated.customerName,
      customerPhone: validated.customerPhone,
      customerEmail: validated.customerEmail || null,
      customerAddress: validated.customerAddress || null,
      type: validated.type,
      subject: validated.subject || 'Website Inquiry',
      message: validated.message,
      serviceTitle: service?.title || null,
      productTitle: product?.title || null,
      preferredContact: validated.preferredContact,
      storePhone: settings?.contactPhone || '083-522006',
      storeWhatsapp: settings?.contactWhatsapp || '9858083951',
      storeEmail: settings?.contactEmail || 'krishnaelectronics2077@gmail.com',
      storeAddress: settings?.locationAddress || 'Birendranagar, Surkhet',
      siteName: settings?.siteName || 'Krishna Electronics Order & Suppliers',
    };

    const whatsappUrl = buildWhatsAppInquiryUrl(notificationPayload);

    // Dispatch email notifications asynchronously
    sendInquiryEmails(notificationPayload).catch((err) => {
      console.error('[Inquiry API] Email dispatch error:', err);
    });

    // Attempt automated outbound WhatsApp API dispatch if configured
    dispatchAutomatedWhatsApp(notificationPayload).catch((err) => {
      console.warn('[Inquiry API] Outbound WhatsApp webhook error:', err);
    });

    return NextResponse.json(
      { 
        success: true, 
        message: 'Inquiry submitted successfully', 
        id: inquiry.id,
        whatsappUrl 
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Error submitting inquiry:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to submit inquiry' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const admin = getCurrentAdminFromRequest(req);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || '';
    const type = searchParams.get('type') || '';

    const where: any = {};
    if (status) where.status = status;
    if (type) where.type = type;

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
