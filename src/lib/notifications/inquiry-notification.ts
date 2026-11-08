import nodemailer from 'nodemailer';

export interface InquiryNotificationParams {
  inquiryId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  customerAddress?: string | null;
  type: string;
  subject: string;
  message: string;
  serviceTitle?: string | null;
  productTitle?: string | null;
  preferredContact?: string;
  storePhone?: string;
  storeWhatsapp?: string;
  storeEmail?: string;
  storeAddress?: string;
  siteName?: string;
}

/**
 * Builds a direct click-to-chat WhatsApp link to send inquiry/booking to the store
 */
export function buildWhatsAppInquiryUrl(params: InquiryNotificationParams): string {
  const storePhoneRaw = params.storeWhatsapp || params.storePhone || '9858083951';
  let cleanPhone = storePhoneRaw.replace(/[^0-9]/g, '');
  if (cleanPhone.length === 10) {
    cleanPhone = `977${cleanPhone}`;
  }

  const typeLabel = params.type === 'SERVICE_REQUEST' ? '🛠️ Service Booking' : '💬 Inquiry';

  const text = `*New Website ${typeLabel}*
*Customer:* ${params.customerName}
*Phone:* ${params.customerPhone}
${params.customerEmail ? `*Email:* ${params.customerEmail}\n` : ''}${params.customerAddress ? `*Location:* ${params.customerAddress}\n` : ''}*Subject:* ${params.subject}
${params.serviceTitle ? `*Service:* ${params.serviceTitle}\n` : ''}${params.productTitle ? `*Product:* ${params.productTitle}\n` : ''}*Preferred Contact:* ${params.preferredContact || 'PHONE'}

*Message:*
${params.message}

_Booking Ref: #${params.inquiryId.slice(-6).toUpperCase()}_`;

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
}

/**
 * Builds a WhatsApp reply link for staff to contact the customer directly
 */
export function buildWhatsAppReplyUrl(customerPhone: string, customerName: string, subject: string): string {
  let cleanPhone = customerPhone.replace(/[^0-9]/g, '');
  if (cleanPhone.length === 10) {
    cleanPhone = `977${cleanPhone}`;
  }

  const greeting = `Namaste ${customerName}, this is Krishna Electronics Order & Suppliers (Birendranagar, Surkhet). Regarding your inquiry about "${subject}": `;
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(greeting)}`;
}

/**
 * Dispatches email notifications to store staff and customer
 */
export async function sendInquiryEmails(params: InquiryNotificationParams) {
  const host = process.env.SMTP_HOST;
  const user = process.env.EMAIL_USER || process.env.SMTP_USER || 'krishnaelectronics2077@gmail.com';
  const pass = process.env.EMAIL_APP_PASSWORD || process.env.SMTP_PASS;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const toAdminEmail = process.env.ADMIN_INQUIRY_EMAIL || params.storeEmail || process.env.ADMIN_NOTIFY_EMAIL || 'krishnaelectronics2077@gmail.com';
  const siteName = params.siteName || 'Krishna Electronics Order & Suppliers';

  const isBooking = params.type === 'SERVICE_REQUEST';
  const emailSubject = `[${isBooking ? 'SERVICE BOOKING' : 'WEBSITE INQUIRY'}] from ${params.customerName}: ${params.subject}`;

  const cleanCustomerPhone = params.customerPhone.replace(/[^0-9]/g, '');
  const waReplyLink = `https://wa.me/977${cleanCustomerPhone.startsWith('977') ? cleanCustomerPhone.slice(3) : cleanCustomerPhone}`;

  // 1. Resend API if configured
  if (process.env.RESEND_API_KEY) {
    try {
      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM || 'Krishna Electronics <onboarding@resend.dev>',
          to: [toAdminEmail],
          reply_to: params.customerEmail || undefined,
          subject: emailSubject,
          html: buildAdminEmailHtml(params, siteName, isBooking, waReplyLink),
        }),
      });
      if (resendRes.ok) {
        console.log('✓ Successfully dispatched inquiry email via Resend API');
        return { adminEmailSent: true, customerEmailSent: false, provider: 'resend' };
      }
    } catch (e: any) {
      console.warn('Resend API dispatch error:', e.message);
    }
  }

  // 2. Nodemailer SMTP if configured
  if (host && user && pass) {
    try {
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });

      // Email to Store Staff
      await transporter.sendMail({
        from: `"${siteName}" <${user}>`,
        to: toAdminEmail,
        replyTo: params.customerEmail || undefined,
        subject: emailSubject,
        html: buildAdminEmailHtml(params, siteName, isBooking, waReplyLink),
      });

      // Confirmation email to customer (if email provided)
      let customerEmailSent = false;
      if (params.customerEmail) {
        const customerHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
            <div style="background-color: #0b132b; padding: 20px; color: #ffffff; text-align: center;">
              <h2 style="margin: 0; font-size: 20px;">${siteName}</h2>
              <p style="margin: 4px 0 0; color: #00F0FF; font-size: 13px;">${isBooking ? 'Service Booking Confirmation' : 'Inquiry Confirmation'}</p>
            </div>
            <div style="padding: 24px; color: #1e293b; font-size: 14px; line-height: 1.6;">
              <p>Namaste <strong>${params.customerName}</strong>,</p>
              <p>Thank you for reaching out. We have successfully received your ${isBooking ? 'service request' : 'inquiry'} regarding <strong>${params.subject}</strong>.</p>
              <p>Our engineering team in Birendranagar, Surkhet will review your details and contact you via <strong>${params.preferredContact || 'PHONE'}</strong> shortly.</p>
              <div style="background-color: #f8fafc; border-left: 4px solid #0066FF; padding: 12px; margin: 16px 0; font-size: 13px;">
                <strong>Your Message:</strong><br/>
                ${params.message}
              </div>
              <p style="font-size: 13px; font-weight: bold;">
                📞 Call: <a href="tel:${params.storePhone || '087520000'}" style="color: #0066FF;">${params.storePhone || 'Surkhet Lab'}</a> | 
                💬 WhatsApp: <a href="${buildWhatsAppInquiryUrl(params)}">Chat with Us</a>
              </p>
            </div>
            <div style="background-color: #f1f5f9; padding: 12px; text-align: center; color: #64748b; font-size: 11px;">
              ${siteName} • ${params.storeAddress || 'Birendranagar, Surkhet, Nepal'}
            </div>
          </div>
        `;

        await transporter.sendMail({
          from: `"${siteName}" <${user}>`,
          to: params.customerEmail,
          subject: `We have received your ${isBooking ? 'service booking' : 'inquiry'} - ${siteName}`,
          html: customerHtml,
        });
        customerEmailSent = true;
      }

      return { adminEmailSent: true, customerEmailSent, provider: 'smtp' };
    } catch (err: any) {
      console.error('[Inquiry Notification] Error sending email via SMTP:', err.message);
      return { adminEmailSent: false, customerEmailSent: false, error: err.message };
    }
  }

  console.log(`[Inquiry Notification] SMTP credentials not set. Simulated notification for inquiry #${params.inquiryId}`);
  return {
    adminEmailSent: false,
    customerEmailSent: false,
    note: 'SMTP not configured in environment (SMTP_HOST, SMTP_USER, SMTP_PASS).'
  };
}

function buildAdminEmailHtml(params: InquiryNotificationParams, siteName: string, isBooking: boolean, waReplyLink: string) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #0b132b; padding: 18px 24px; text-align: center;">
        <h2 style="color: #00f0ff; margin: 0; font-size: 18px; font-weight: bold; letter-spacing: 0.5px;">${siteName.toUpperCase()}</h2>
        <p style="color: #94a3b8; margin: 6px 0 0; font-size: 13px;">New ${isBooking ? 'Service Booking' : 'Customer Website Inquiry'} Alert</p>
      </div>
      <div style="padding: 24px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; color: #64748b; width: 140px;">Customer Name:</td>
            <td style="padding: 10px 0; font-weight: bold; color: #0f172a;">${params.customerName}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; color: #64748b;">Phone Number:</td>
            <td style="padding: 10px 0; font-weight: bold;"><a href="tel:${params.customerPhone}" style="color: #0066ff; text-decoration: none;">${params.customerPhone}</a></td>
          </tr>
          ${params.customerEmail ? `
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; color: #64748b;">Email Address:</td>
            <td style="padding: 10px 0;"><a href="mailto:${params.customerEmail}" style="color: #0066ff; text-decoration: none;">${params.customerEmail}</a></td>
          </tr>` : ''}
          ${params.customerAddress ? `
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; color: #64748b;">Address / Location:</td>
            <td style="padding: 10px 0; color: #0f172a;">${params.customerAddress}</td>
          </tr>` : ''}
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; color: #64748b;">Category / Type:</td>
            <td style="padding: 10px 0; color: #0f172a;">${params.type}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; color: #64748b;">Subject:</td>
            <td style="padding: 10px 0; font-weight: bold; color: #0f172a;">${params.subject}</td>
          </tr>
          <tr>
            <td style="padding: 14px 0 6px; color: #64748b;" colspan="2">Customer Message:</td>
          </tr>
          <tr>
            <td style="padding: 14px; background-color: #f8fafc; border-radius: 6px; color: #334155; line-height: 1.6;" colspan="2">
              ${params.message.replace(/\n/g, '<br/>')}
            </td>
          </tr>
        </table>

        <div style="margin-top: 24px; text-align: center;">
          <a href="${waReplyLink}" style="display: inline-block; background-color: #25D366; color: white; padding: 10px 22px; border-radius: 6px; font-weight: bold; text-decoration: none; font-size: 13px;">
            💬 Reply to Customer on WhatsApp
          </a>
        </div>
      </div>
      <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 12px; text-align: center; font-size: 12px; color: #94a3b8;">
        ${siteName} | Birendranagar, Surkhet
      </div>
    </div>
  `;
}

/**
 * Automated Outbound WhatsApp Message Dispatcher
 * Dispatches automated alerts to owner and/or customer via CallMeBot, Telegram, WhatsApp Webhook, or Meta Cloud API
 */
export async function dispatchAutomatedWhatsApp(params: InquiryNotificationParams) {
  const adminPhone = process.env.ADMIN_NOTIFY_PHONE || params.storeWhatsapp || '9858083951';
  let cleanAdminPhone = adminPhone.replace(/[^0-9]/g, '');
  if (cleanAdminPhone.length === 10) cleanAdminPhone = `977${cleanAdminPhone}`;

  const textMessage = 
    `🔔 *New Website ${params.type === 'SERVICE_REQUEST' ? 'Service Booking' : 'Inquiry'}*\n` +
    `👤 *Name:* ${params.customerName}\n` +
    `📞 *Phone:* ${params.customerPhone}\n` +
    (params.customerEmail ? `✉️ *Email:* ${params.customerEmail}\n` : '') +
    (params.customerAddress ? `📍 *Address:* ${params.customerAddress}\n` : '') +
    `📋 *Subject:* ${params.subject}\n` +
    (params.serviceTitle ? `🛠️ *Service:* ${params.serviceTitle}\n` : '') +
    (params.productTitle ? `📦 *Product:* ${params.productTitle}\n` : '') +
    `💬 *Message:* ${params.message}`;

  // 1. CallMeBot WhatsApp API
  const callMeBotKey = process.env.CALLMEBOT_API_KEY;
  if (callMeBotKey) {
    try {
      const url = `https://api.callmebot.com/whatsapp.php?phone=${cleanAdminPhone}&text=${encodeURIComponent(textMessage)}&apikey=${callMeBotKey}`;
      const res = await fetch(url);
      if (res.ok) {
        console.log('✓ Successfully dispatched automated WhatsApp alert to owner via CallMeBot');
        return { dispatched: true, provider: 'callmebot' };
      }
    } catch (err: any) {
      console.error('CallMeBot WhatsApp notification error:', err.message);
    }
  }

  // 2. Generic WhatsApp Gateway / Webhook
  const webhookUrl = process.env.WHATSAPP_GATEWAY_URL || process.env.WHATSAPP_WEBHOOK_URL;
  if (webhookUrl) {
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: cleanAdminPhone,
          message: textMessage,
          params,
        }),
      });
      return { dispatched: true, provider: 'webhook' };
    } catch (e: any) {
      console.warn('[WhatsApp Notification] Webhook failed:', e.message);
    }
  }

  // 3. WhatsApp Cloud API (Meta Graph API)
  const metaToken = process.env.WHATSAPP_API_TOKEN;
  const metaPhoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (metaToken && metaPhoneId) {
    try {
      await fetch(`https://graph.facebook.com/v19.0/${metaPhoneId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${metaToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: cleanAdminPhone,
          type: 'text',
          text: { body: textMessage },
        }),
      });
      return { dispatched: true, provider: 'meta-cloud-api' };
    } catch (e: any) {
      console.warn('[WhatsApp Notification] Meta API failed:', e.message);
    }
  }

  // 4. Telegram Bot API
  const tgToken = process.env.TELEGRAM_BOT_TOKEN;
  const tgChatId = process.env.TELEGRAM_CHAT_ID;
  if (tgToken && tgChatId) {
    try {
      await fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: tgChatId,
          text: textMessage,
        }),
      });
      return { dispatched: true, provider: 'telegram' };
    } catch (err: any) {
      console.error('Telegram dispatch error:', err.message);
    }
  }

  return { dispatched: false, note: 'Direct WhatsApp link generated for client dispatch.' };
}
