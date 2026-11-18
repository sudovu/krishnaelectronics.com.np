import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { prisma } from '@/lib/prisma';
import { sendWhatsAppTemplateMessage, sendWhatsAppTextMessage, isWhatsAppConfigured } from '@/lib/whatsapp';
import { StoredAttachment, signAttachmentAccessToken } from '@/lib/storage';

export interface EnhancedInquiryPayload {
  inquiryId: string;
  reference: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  customerAddress?: string | null;
  type: string; // 'PRODUCT_INQUIRY' | 'SERVICE_REQUEST' | 'AMC_REQUEST' | 'DIRECT_ORDER' | 'GENERAL_INQUIRY'
  category: string; // 'PRODUCT' | 'WHATSAPP' | 'REPAIR' | 'SERVICE' | 'GENERAL'
  subject: string;
  message: string;
  deviceCategory?: string | null;
  deviceBrand?: string | null;
  deviceModel?: string | null;
  preferredDate?: string | null;
  productDetails?: {
    id?: string;
    title: string;
    sku: string;
    price: number | string;
    url?: string;
    image?: string;
  } | null;
  serviceDetails?: {
    id?: string;
    title: string;
    slug?: string;
    startingPrice?: number | string;
  } | null;
  attachments?: StoredAttachment[];
  preferredContact?: string;
  storePhone?: string;
  storeWhatsapp?: string;
  storeEmail?: string;
  storeAddress?: string;
  siteName?: string;
}

/**
 * Generates a human-friendly unique reference code: KE-YYMMDD-XXXX
 * e.g., KE-261118-A7X9
 */
export function generateInquiryReference(): string {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const randomChars = crypto.randomBytes(3).toString('hex').toUpperCase().slice(0, 4);
  return `KE-${yy}${mm}${dd}-${randomChars}`;
}

/**
 * Strips carriage returns, newlines, and tabs to prevent email header/CRLF injection.
 */
export function sanitizeHeader(str: string | null | undefined): string {
  if (!str) return '';
  return String(str).replace(/[\r\n\t]/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Builds standard email subject with strict CRLF injection protection
 */
export function getEmailSubject(payload: EnhancedInquiryPayload): string {
  const isRepair = payload.category === 'REPAIR' || payload.type === 'SERVICE_REQUEST';
  const isProduct = payload.category === 'PRODUCT' || payload.type === 'PRODUCT_INQUIRY';
  
  let prefix = '[WEBSITE INQUIRY]';
  if (isRepair) prefix = '[REPAIR BOOKING]';
  if (isProduct) prefix = '[PRODUCT INQUIRY]';

  const cleanRef = sanitizeHeader(payload.reference);
  const cleanName = sanitizeHeader(payload.customerName);
  const cleanPhone = sanitizeHeader(payload.customerPhone);

  return `${prefix} Ref: ${cleanRef} - ${cleanName} (${cleanPhone})`;
}

/**
 * Safely escapes HTML special characters to prevent HTML/XSS injection in emails.
 */
export function escapeHtml(str: string | null | undefined): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Builds the rich HTML email sent to store staff (krishanelectronics2077@gmail.com)
 */
export function buildStaffNotificationEmailHtml(payload: EnhancedInquiryPayload): string {
  const siteName = payload.siteName || 'Krishna Electronics Order & Suppliers';
  const cleanPhone = payload.customerPhone.replace(/[^0-9]/g, '');
  const waReplyLink = `https://wa.me/977${cleanPhone.startsWith('977') ? cleanPhone.slice(3) : cleanPhone}?text=${encodeURIComponent(`Namaste ${payload.customerName}, this is Krishna Electronics regarding your enquiry ${payload.reference}: `)}`;

  const isRepair = payload.category === 'REPAIR' || payload.type === 'SERVICE_REQUEST';
  const isProduct = payload.category === 'PRODUCT' || payload.type === 'PRODUCT_INQUIRY';

  // Build attachments list with secure tokenized links
  let attachmentsHtml = '';
  if (payload.attachments && payload.attachments.length > 0) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://krishnaelectronics.com.np';
    const items = payload.attachments.map((att) => {
      const token = signAttachmentAccessToken(att.id, 86400 * 7); // 7-day token
      const downloadUrl = `${baseUrl}/api/inquiries/attachments/${att.id}?token=${token}`;
      const sizeMb = (att.size / (1024 * 1024)).toFixed(2);
      return `<li style="margin-bottom: 6px;">
        <a href="${downloadUrl}" target="_blank" style="color: #0066ff; font-weight: bold; text-decoration: underline;">
          📎 ${escapeHtml(att.originalName)}
        </a>
        <span style="color: #64748b; font-size: 12px;"> (${escapeHtml(att.mimeType)}, ${sizeMb} MB)</span>
      </li>`;
    }).join('');

    attachmentsHtml = `
      <div style="margin-top: 18px; padding: 14px; background-color: #f1f5f9; border-radius: 8px; border: 1px solid #cbd5e1;">
        <strong style="color: #0f172a; font-size: 13px;">Customer Uploaded Files (${payload.attachments.length}):</strong>
        <ul style="margin: 8px 0 0; padding-left: 18px; font-size: 13px;">
          ${items}
        </ul>
      </div>
    `;
  }

  return `
    <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
      <!-- Header -->
      <div style="background-color: #0b132b; padding: 22px 26px; text-align: center; border-bottom: 3px solid #00F0FF;">
        <h2 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 800; letter-spacing: 0.5px;">${escapeHtml(siteName.toUpperCase())}</h2>
        <p style="color: #00F0FF; margin: 6px 0 0; font-size: 13px; font-weight: bold;">
          ${isRepair ? '🛠️ NEW REPAIR / SERVICE BOOKING' : isProduct ? '📦 NEW PRODUCT ENQUIRY' : '💬 NEW CUSTOMER ENQUIRY'}
        </p>
      </div>

      <!-- Reference Banner -->
      <div style="background-color: #f8fafc; padding: 12px 26px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;">
        <span style="font-size: 12px; color: #64748b; font-weight: bold;">Reference Number:</span>
        <span style="font-size: 15px; font-weight: 900; color: #0066FF; font-family: monospace; background-color: #e0f2fe; padding: 4px 10px; border-radius: 6px;">
          ${escapeHtml(payload.reference)}
        </span>
      </div>

      <!-- Main Body -->
      <div style="padding: 26px;">
        <!-- Customer Details -->
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 9px 0; color: #64748b; width: 140px; font-weight: 600;">Customer Name:</td>
            <td style="padding: 9px 0; font-weight: 700; color: #0f172a;">${escapeHtml(payload.customerName)}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 9px 0; color: #64748b; font-weight: 600;">Phone Number:</td>
            <td style="padding: 9px 0; font-weight: 700;">
              <a href="tel:${escapeHtml(payload.customerPhone)}" style="color: #0066FF; text-decoration: none;">📞 ${escapeHtml(payload.customerPhone)}</a>
            </td>
          </tr>
          ${payload.customerEmail ? `
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 9px 0; color: #64748b; font-weight: 600;">Email Address:</td>
            <td style="padding: 9px 0;"><a href="mailto:${escapeHtml(payload.customerEmail)}" style="color: #0066FF; text-decoration: none;">✉️ ${escapeHtml(payload.customerEmail)}</a></td>
          </tr>` : ''}
          ${payload.customerAddress ? `
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 9px 0; color: #64748b; font-weight: 600;">Location / Address:</td>
            <td style="padding: 9px 0; color: #0f172a;">📍 ${escapeHtml(payload.customerAddress)}</td>
          </tr>` : ''}
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 9px 0; color: #64748b; font-weight: 600;">Preferred Contact:</td>
            <td style="padding: 9px 0; font-weight: 600; color: #0f172a;">${escapeHtml(payload.preferredContact || 'PHONE')}</td>
          </tr>

          ${isRepair ? `
          <!-- Repair Details -->
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 9px 0; color: #64748b; font-weight: 600;">Device Category:</td>
            <td style="padding: 9px 0; font-weight: 700; color: #0284c7;">${escapeHtml(payload.deviceCategory || 'Not Specified')}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 9px 0; color: #64748b; font-weight: 600;">Device Brand & Model:</td>
            <td style="padding: 9px 0; font-weight: 600; color: #0f172a;">${escapeHtml(payload.deviceBrand || '')} ${escapeHtml(payload.deviceModel || '')}</td>
          </tr>
          ${payload.preferredDate ? `
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 9px 0; color: #64748b; font-weight: 600;">Preferred Date:</td>
            <td style="padding: 9px 0; font-weight: 600; color: #0f172a;">🗓️ ${escapeHtml(payload.preferredDate)}</td>
          </tr>` : ''}
          ` : ''}

          ${isProduct && payload.productDetails ? `
          <!-- Product Details -->
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 9px 0; color: #64748b; font-weight: 600;">Product:</td>
            <td style="padding: 9px 0; font-weight: 700; color: #0f172a;">${escapeHtml(payload.productDetails.title)}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 9px 0; color: #64748b; font-weight: 600;">SKU & Price:</td>
            <td style="padding: 9px 0; font-weight: 600; color: #0f172a;">SKU: ${escapeHtml(payload.productDetails.sku)} | Price: NPR ${escapeHtml(String(payload.productDetails.price))}</td>
          </tr>
          ` : ''}
        </table>

        <!-- Message Box -->
        <div style="margin-top: 18px;">
          <div style="font-size: 12px; font-weight: bold; color: #475569; margin-bottom: 6px;">
            ${isRepair ? 'FAULT DESCRIPTION / SYMPTOMS:' : 'CUSTOMER MESSAGE / REQUIREMENTS:'}
          </div>
          <div style="padding: 14px; background-color: #f8fafc; border-left: 4px solid #0066FF; border-radius: 4px; color: #1e293b; font-size: 13px; line-height: 1.6;">
            ${escapeHtml(payload.message).replace(/\n/g, '<br/>')}
          </div>
        </div>

        <!-- Attachments Section -->
        ${attachmentsHtml}

        <!-- Quick Action Buttons -->
        <div style="margin-top: 26px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center;">
          <a href="${waReplyLink}" target="_blank" style="display: inline-block; background-color: #25D366; color: #ffffff; padding: 11px 22px; border-radius: 8px; font-weight: bold; text-decoration: none; font-size: 13px; margin: 4px 6px;">
            💬 Reply on WhatsApp
          </a>
          <a href="tel:${escapeHtml(payload.customerPhone)}" style="display: inline-block; background-color: #0b132b; color: #ffffff; padding: 11px 22px; border-radius: 8px; font-weight: bold; text-decoration: none; font-size: 13px; margin: 4px 6px;">
            📞 Call Customer Directly
          </a>
        </div>
      </div>

      <!-- Footer -->
      <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 14px; text-align: center; font-size: 11px; color: #64748b;">
        Krishna Electronics Order &amp; Suppliers • Birendranagar, Surkhet, Nepal<br/>
        Notification sent automatically via Krishna Electronics On-Site Enquiry Engine.
      </div>
    </div>
  `;
}

/**
 * Builds the confirmation email sent to the customer
 */
export function buildCustomerConfirmationEmailHtml(payload: EnhancedInquiryPayload): string {
  const siteName = payload.siteName || 'Krishna Electronics Order & Suppliers';
  const isRepair = payload.category === 'REPAIR' || payload.type === 'SERVICE_REQUEST';

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
      <div style="background-color: #0b132b; padding: 22px; text-align: center; border-bottom: 3px solid #00F0FF;">
        <h2 style="color: #ffffff; margin: 0; font-size: 20px;">${escapeHtml(siteName)}</h2>
        <p style="color: #00F0FF; margin: 6px 0 0; font-size: 13px; font-weight: bold;">
          ${isRepair ? 'Service Booking Confirmation' : 'Enquiry Confirmation'}
        </p>
      </div>
      <div style="padding: 24px; color: #1e293b; font-size: 14px; line-height: 1.6;">
        <p>Namaste <strong>${escapeHtml(payload.customerName)}</strong>,</p>
        <p>
          Thank you for reaching out to Krishna Electronics. We have successfully logged your ${isRepair ? 'repair booking request' : 'enquiry'}.
        </p>
        <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 14px; border-radius: 8px; margin: 18px 0; text-align: center;">
          <span style="font-size: 12px; color: #166534; font-weight: bold; display: block;">YOUR TRACKING REFERENCE:</span>
          <span style="font-size: 18px; font-weight: 900; color: #15803d; font-family: monospace; display: block; margin-top: 4px;">
            ${escapeHtml(payload.reference)}
          </span>
        </div>
        <p>
          Our technical team in Birendranagar, Surkhet will review your details and contact you shortly via <strong>${escapeHtml(payload.preferredContact || 'PHONE')}</strong>.
        </p>
        <div style="background-color: #f8fafc; border-left: 4px solid #0066FF; padding: 12px; margin: 16px 0; font-size: 13px;">
          <strong>Summary:</strong><br/>
          ${escapeHtml(payload.message).replace(/\n/g, '<br/>')}
        </div>
        <p style="font-size: 13px; color: #475569;">
          Store Location: Birendranagar, Surkhet, Nepal<br/>
          Phone: ${escapeHtml(payload.storePhone || '083-522006')} | WhatsApp: ${escapeHtml(payload.storeWhatsapp || '9858083951')}
        </p>
      </div>
      <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 12px; text-align: center; color: #64748b; font-size: 11px;">
        ${escapeHtml(siteName)} • Surkhet, Karnali Province, Nepal
      </div>
    </div>
  `;
}

/**
 * Dispatches staff email notification to krishanelectronics2077@gmail.com
 */
export async function sendStaffInquiryEmail(payload: EnhancedInquiryPayload): Promise<{ sent: boolean; error?: string }> {
  const host = process.env.SMTP_HOST;
  const user = process.env.EMAIL_USER || process.env.SMTP_USER || 'krishanelectronics2077@gmail.com';
  const pass = process.env.EMAIL_APP_PASSWORD || process.env.SMTP_PASS;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const targetEmail = process.env.ADMIN_INQUIRY_EMAIL || payload.storeEmail || 'krishanelectronics2077@gmail.com';
  const siteName = payload.siteName || 'Krishna Electronics Order & Suppliers';

  const emailSubject = getEmailSubject(payload);
  const htmlContent = buildStaffNotificationEmailHtml(payload);

  // 1. Resend API if configured
  if (process.env.RESEND_API_KEY) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM || `${siteName} <onboarding@resend.dev>`,
          to: [targetEmail],
          reply_to: payload.customerEmail || undefined,
          subject: emailSubject,
          html: htmlContent,
        }),
      });
      if (res.ok) {
        console.log(`[Email Dispatch] Successfully sent staff notification via Resend API (Ref: ${payload.reference})`);
        return { sent: true };
      }
      const errText = await res.text();
      console.warn('[Email Dispatch] Resend API error response:', errText);
    } catch (err: any) {
      console.warn('[Email Dispatch] Resend API request failed:', err.message);
    }
  }

  // 2. SMTP Transport (Gmail / Custom SMTP)
  if (host && user && pass) {
    try {
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });

      await transporter.sendMail({
        from: `"${siteName}" <${user}>`,
        to: targetEmail,
        replyTo: payload.customerEmail || undefined,
        subject: emailSubject,
        html: htmlContent,
      });

      console.log(`[Email Dispatch] Successfully sent staff notification via SMTP (Ref: ${payload.reference})`);
      return { sent: true };
    } catch (err: any) {
      console.error('[Email Dispatch] SMTP error:', err.message);
      return { sent: false, error: err.message };
    }
  }

  console.log(`[Email Dispatch] Notice: SMTP not configured (SMTP_HOST/USER/PASS). Notification logged for ${targetEmail}`);
  return { sent: false, error: 'SMTP credentials not configured in environment.' };
}

/**
 * Dispatches customer acknowledgement email if customer provided their email address
 */
export async function sendCustomerConfirmationEmail(payload: EnhancedInquiryPayload): Promise<{ sent: boolean; error?: string }> {
  if (!payload.customerEmail) return { sent: false };

  const host = process.env.SMTP_HOST;
  const user = process.env.EMAIL_USER || process.env.SMTP_USER || 'krishanelectronics2077@gmail.com';
  const pass = process.env.EMAIL_APP_PASSWORD || process.env.SMTP_PASS;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const siteName = payload.siteName || 'Krishna Electronics Order & Suppliers';

  const html = buildCustomerConfirmationEmailHtml(payload);
  const subject = `Your request has been received - Ref: ${sanitizeHeader(payload.reference)} | ${sanitizeHeader(siteName)}`;

  if (process.env.RESEND_API_KEY) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM || `${siteName} <onboarding@resend.dev>`,
          to: [payload.customerEmail],
          subject,
          html,
        }),
      });
      if (res.ok) return { sent: true };
    } catch {}
  }

  if (host && user && pass) {
    try {
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
      await transporter.sendMail({
        from: `"${siteName}" <${user}>`,
        to: payload.customerEmail,
        subject,
        html,
      });
      return { sent: true };
    } catch (e: any) {
      return { sent: false, error: e.message };
    }
  }

  return { sent: false };
}

/**
 * Orchestrates full asynchronous notification pipeline:
 * 1. Dispatches staff email
 * 2. Records outbox entry for retries / audit
 * 3. Sends customer acknowledgement via WhatsApp Cloud API if configured
 * 4. Updates Prisma Inquiry record status
 */
export async function processInquiryNotifications(payload: EnhancedInquiryPayload): Promise<void> {
  try {
    // 1. Staff Email
    const emailResult = await sendStaffInquiryEmail(payload);
    
    // Also try customer confirmation email
    if (payload.customerEmail) {
      sendCustomerConfirmationEmail(payload).catch(() => {});
    }

    // 2. WhatsApp Notification (Meta Cloud API if configured)
    let whatsappStatus = 'NOT_CONFIGURED';
    let whatsappError: string | undefined;
    let whatsappMessageId: string | undefined;

    if (isWhatsAppConfigured()) {
      const text = `Namaste ${payload.customerName}, thank you for contacting Krishna Electronics. We have received your inquiry (Ref: ${payload.reference}). Our team in Surkhet will contact you shortly.`;
      const waResult = await sendWhatsAppTextMessage(payload.customerPhone, text);
      if (waResult.success) {
        whatsappStatus = 'SENT';
        whatsappMessageId = waResult.messageId;
      } else {
        whatsappStatus = 'FAILED';
        whatsappError = waResult.error;
      }
    }

    // 3. Update Inquiry record in DB
    await prisma.inquiry.update({
      where: { id: payload.inquiryId },
      data: {
        emailStatus: emailResult.sent ? 'SENT' : 'FAILED',
        emailError: emailResult.error || null,
        emailSentAt: emailResult.sent ? new Date() : null,
        whatsappStatus,
        whatsappError: whatsappError || null,
        whatsappMessageId: whatsappMessageId || null,
        whatsappSentAt: whatsappStatus === 'SENT' ? new Date() : null,
      },
    }).catch((err) => {
      console.warn('[processInquiryNotifications] Could not update Inquiry status:', err.message);
    });

    // 4. Record to NotificationOutbox for bounded retry if email failed
    const idempotencyKey = `email-${payload.inquiryId}-${payload.reference}`;
    await prisma.notificationOutbox.upsert({
      where: { idempotencyKey },
      create: {
        inquiryId: payload.inquiryId,
        channel: 'EMAIL',
        recipient: payload.storeEmail || 'krishanelectronics2077@gmail.com',
        payload: JSON.stringify(payload),
        status: emailResult.sent ? 'SENT' : 'PENDING',
        attempts: emailResult.sent ? 1 : 0,
        lastError: emailResult.error || null,
        idempotencyKey,
        sentAt: emailResult.sent ? new Date() : null,
      },
      update: {
        status: emailResult.sent ? 'SENT' : 'PENDING',
        attempts: { increment: 1 },
        lastError: emailResult.error || null,
        sentAt: emailResult.sent ? new Date() : null,
      },
    }).catch((err) => {
      console.warn('[processInquiryNotifications] Outbox logging notice:', err.message);
    });
  } catch (error: any) {
    console.error('[processInquiryNotifications] Unhandled notification error:', error);
  }
}

export const OUTBOX_LEASE_TIMEOUT_MS = 5 * 60 * 1000; // 5-minute lease for crash recovery

/**
 * Outbox Retry Worker Engine:
 * Processes queued notifications with bounded attempts (max 3), exponential backoff,
 * atomic conditional claiming (prevents duplicate sends), and crash recovery leases.
 * Can be invoked via Vercel Cron (/api/cron/process-notifications).
 */
export async function processPendingNotificationOutbox(limit: number = 10): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
  skipped: number;
}> {
  let processed = 0;
  let succeeded = 0;
  let failed = 0;
  let skipped = 0;

  try {
    const now = Date.now();
    const staleLeaseCutoff = new Date(now - OUTBOX_LEASE_TIMEOUT_MS);

    // Select PENDING records OR stale PROCESSING records whose previous worker crashed
    const records = await prisma.notificationOutbox.findMany({
      where: {
        OR: [
          { status: 'PENDING' },
          { status: 'PROCESSING', updatedAt: { lt: staleLeaseCutoff } },
        ],
        attempts: { lt: 3 },
      },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });

    for (const record of records) {
      // Exponential backoff check: 2 min, 4 min, 8 min (only for PENDING retries)
      if (record.status === 'PENDING' && record.attempts > 0) {
        const backoffMs = Math.pow(2, record.attempts) * 60 * 1000;
        if (now - record.updatedAt.getTime() < backoffMs) {
          skipped++;
          continue;
        }
      }

      // Atomic conditional claim: prevents race condition duplicates across concurrent workers
      // and safely recovers records left in PROCESSING after a container or worker crash
      const claimResult = await prisma.notificationOutbox.updateMany({
        where: {
          id: record.id,
          OR: [
            { status: 'PENDING' },
            { status: 'PROCESSING', updatedAt: { lt: staleLeaseCutoff } },
          ],
        },
        data: {
          status: 'PROCESSING',
          attempts: { increment: 1 },
          updatedAt: new Date(now),
        },
      });

      // If count is 0, another worker already claimed this record concurrently; skip immediately
      if (claimResult.count === 0) {
        skipped++;
        continue;
      }

      processed++;

      let payload: EnhancedInquiryPayload;
      try {
        payload = JSON.parse(record.payload);
      } catch (parseErr: any) {
        await prisma.notificationOutbox.update({
          where: { id: record.id },
          data: { status: 'FAILED', lastError: `Corrupt payload JSON: ${parseErr.message}` },
        });
        failed++;
        continue;
      }

      if (record.channel === 'EMAIL') {
        const sendRes = await sendStaffInquiryEmail(payload);
        if (sendRes.sent) {
          await prisma.notificationOutbox.update({
            where: { id: record.id },
            data: { status: 'SENT', sentAt: new Date(), lastError: null },
          });
          await prisma.inquiry.update({
            where: { id: record.inquiryId },
            data: { emailStatus: 'SENT', emailSentAt: new Date(), emailError: null },
          }).catch(() => null);
          succeeded++;
        } else {
          // Bounded retry ceiling check
          const currentAttempts = record.attempts + 1;
          const finalFailure = currentAttempts >= record.maxAttempts;
          await prisma.notificationOutbox.update({
            where: { id: record.id },
            data: {
              status: finalFailure ? 'FAILED' : 'PENDING',
              lastError: sendRes.error || 'Retry attempt failed',
            },
          });
          if (finalFailure) {
            await prisma.inquiry.update({
              where: { id: record.inquiryId },
              data: { emailStatus: 'FAILED', emailError: sendRes.error || null },
            }).catch(() => null);
          }
          failed++;
        }
      } else {
        skipped++;
      }
    }
  } catch (err: any) {
    console.error('[processPendingNotificationOutbox] Error:', err.message);
  }

  return { processed, succeeded, failed, skipped };
}
