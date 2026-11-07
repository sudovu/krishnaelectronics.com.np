import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentAdminFromRequest } from '@/lib/auth';
import { z } from 'zod';
import nodemailer from 'nodemailer';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

async function sendInquiryEmailNotification(inquiry: {
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  customerAddress?: string | null;
  type: string;
  subject: string;
  message: string;
}) {
  const targetEmail = process.env.ADMIN_INQUIRY_EMAIL || 'krishnaelectronics2077@gmail.com';
  const emailUser = process.env.EMAIL_USER || process.env.SMTP_USER || 'krishnaelectronics2077@gmail.com';
  const emailPass = process.env.EMAIL_APP_PASSWORD || process.env.SMTP_PASS;

  const cleanPhoneDigits = inquiry.customerPhone.replace(/[^0-9]/g, '');
  const waReplyLink = `https://wa.me/977${cleanPhoneDigits.startsWith('977') ? cleanPhoneDigits.slice(3) : cleanPhoneDigits}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #0b132b; padding: 18px 24px; text-align: center;">
        <h2 style="color: #00f0ff; margin: 0; font-size: 18px; font-weight: bold; letter-spacing: 0.5px;">KRISHNA ELECTRONICS ORDER &amp; SUPPLIERS</h2>
        <p style="color: #94a3b8; margin: 6px 0 0; font-size: 13px;">New Customer Website Inquiry Alert</p>
      </div>
      <div style="padding: 24px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; color: #64748b; width: 140px;">Customer Name:</td>
            <td style="padding: 10px 0; font-weight: bold; color: #0f172a;">${inquiry.customerName}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; color: #64748b;">Phone Number:</td>
            <td style="padding: 10px 0; font-weight: bold;"><a href="tel:${inquiry.customerPhone}" style="color: #0066ff; text-decoration: none;">${inquiry.customerPhone}</a></td>
          </tr>
          ${inquiry.customerEmail ? `
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; color: #64748b;">Email Address:</td>
            <td style="padding: 10px 0;"><a href="mailto:${inquiry.customerEmail}" style="color: #0066ff; text-decoration: none;">${inquiry.customerEmail}</a></td>
          </tr>` : ''}
          ${inquiry.customerAddress ? `
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; color: #64748b;">Address / Location:</td>
            <td style="padding: 10px 0; color: #0f172a;">${inquiry.customerAddress}</td>
          </tr>` : ''}
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; color: #64748b;">Category / Type:</td>
            <td style="padding: 10px 0; color: #0f172a;">${inquiry.type}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; color: #64748b;">Subject:</td>
            <td style="padding: 10px 0; font-weight: bold; color: #0f172a;">${inquiry.subject}</td>
          </tr>
          <tr>
            <td style="padding: 14px 0 6px; color: #64748b;" colspan="2">Customer Message:</td>
          </tr>
          <tr>
            <td style="padding: 14px; background-color: #f8fafc; border-radius: 6px; color: #334155; line-height: 1.6;" colspan="2">
              ${inquiry.message.replace(/\n/g, '<br/>')}
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
        Krishna Electronics &amp; Order Suppliers | Birendranagar, Surkhet | 9858083951
      </div>
    </div>
  `;

  // Option A: Resend API if configured
  if (process.env.RESEND_API_KEY) {
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM || 'Krishna Electronics <onboarding@resend.dev>',
          to: [targetEmail],
          reply_to: inquiry.customerEmail || undefined,
          subject: `🔔 New Website Inquiry: ${inquiry.customerName} - ${inquiry.subject}`,
          html,
        }),
      });
      console.log('✓ Successfully emailed inquiry notification via Resend to', targetEmail);
      return;
    } catch (err) {
      console.error('Failed to send email via Resend:', err);
    }
  }

  // Option B: Nodemailer with Gmail SMTP
  if (!emailPass) {
    console.log('[Notice] EMAIL_APP_PASSWORD is not set. To receive automatic emails, add EMAIL_APP_PASSWORD in Vercel settings.');
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    });

    await transporter.sendMail({
      from: `"Krishna Electronics Web" <${emailUser}>`,
      to: targetEmail,
      replyTo: inquiry.customerEmail || undefined,
      subject: `🔔 New Website Inquiry: ${inquiry.customerName} - ${inquiry.subject}`,
      html,
    });
    console.log('✓ Successfully emailed inquiry notification to', targetEmail);
  } catch (err) {
    console.error('Failed to send inquiry email notification:', err);
  }
}

async function sendInquiryWhatsAppNotification(inquiry: {
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  customerAddress?: string | null;
  type: string;
  subject: string;
  message: string;
}) {
  const adminPhone = process.env.ADMIN_WHATSAPP_PHONE || process.env.CALLMEBOT_PHONE || '9779858083951';
  const cleanAdminPhone = adminPhone.replace(/[^0-9]/g, '');

  const textMessage = 
    `🔔 *NEW WEBSITE INQUIRY*\n` +
    `*Store:* Krishna Electronics, Surkhet\n\n` +
    `👤 *Name:* ${inquiry.customerName}\n` +
    `📞 *Phone:* ${inquiry.customerPhone}\n` +
    (inquiry.customerEmail ? `✉️ *Email:* ${inquiry.customerEmail}\n` : '') +
    (inquiry.customerAddress ? `📍 *Address:* ${inquiry.customerAddress}\n` : '') +
    `📋 *Type:* ${inquiry.type}\n` +
    `📝 *Subject:* ${inquiry.subject}\n\n` +
    `💬 *Message:*\n${inquiry.message}\n\n` +
    `👉 Quick reply to customer: https://wa.me/977${inquiry.customerPhone.replace(/[^0-9]/g, '').replace(/^977/, '')}`;

  // 1. CallMeBot WhatsApp API (Free automated personal WhatsApp message)
  const callMeBotKey = process.env.CALLMEBOT_API_KEY;
  if (callMeBotKey) {
    try {
      const url = `https://api.callmebot.com/whatsapp.php?phone=${cleanAdminPhone}&text=${encodeURIComponent(textMessage)}&apikey=${callMeBotKey}`;
      const res = await fetch(url);
      if (res.ok) {
        console.log('✓ Successfully dispatched automated WhatsApp alert to owner via CallMeBot');
        return;
      }
    } catch (err) {
      console.error('CallMeBot WhatsApp notification error:', err);
    }
  }

  // 2. Generic WhatsApp Gateway / Webhook (e.g. Green API, UltraMsg, Wasapi)
  const webhookUrl = process.env.WHATSAPP_GATEWAY_URL || process.env.WHATSAPP_WEBHOOK_URL;
  if (webhookUrl) {
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: cleanAdminPhone,
          message: textMessage,
          inquiry,
        }),
      });
      console.log('✓ Dispatched automated WhatsApp alert via gateway webhook');
      return;
    } catch (err) {
      console.error('WhatsApp gateway error:', err);
    }
  }

  // 3. WhatsApp Cloud API (Official Meta Graph API)
  const waToken = process.env.WHATSAPP_API_TOKEN;
  const waPhoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (waToken && waPhoneId) {
    try {
      await fetch(`https://graph.facebook.com/v19.0/${waPhoneId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${waToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: cleanAdminPhone,
          type: 'text',
          text: { body: textMessage },
        }),
      });
      console.log('✓ Dispatched automated WhatsApp alert via Meta Cloud API');
      return;
    } catch (err) {
      console.error('Meta WhatsApp API error:', err);
    }
  }

  // 4. Telegram Bot API (Zero-setup instant notification channel)
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
      console.log('✓ Dispatched automated alert via Telegram');
      return;
    } catch (err) {
      console.error('Telegram dispatch error:', err);
    }
  }

  console.log('[Notice] For automatic WhatsApp alerts directly to your phone, set CALLMEBOT_API_KEY in Vercel settings.');
}

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

    // Automatically dispatch email and WhatsApp notifications to Krishna Electronics store team
    Promise.allSettled([
      sendInquiryEmailNotification(inquiry),
      sendInquiryWhatsAppNotification(inquiry),
    ]).catch((err) => {
      console.error('Async inquiry notification dispatch error:', err);
    });

    return NextResponse.json(
      { success: true, message: 'Inquiry submitted successfully', id: inquiry.id },
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
