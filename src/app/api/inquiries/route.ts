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

    const cleanPhoneDigits = inquiry.customerPhone.replace(/[^0-9]/g, '');
    const waReplyLink = `https://wa.me/977${cleanPhoneDigits.startsWith('977') ? cleanPhoneDigits.slice(3) : cleanPhoneDigits}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #0b132b; padding: 18px 24px; text-align: center;">
          <h2 style="color: #00f0ff; margin: 0; font-size: 18px; font-weight: bold; letter-spacing: 0.5px;">KRISHNA ELECTRONICS ORDER &amp; SUPPLIERS</h2>
          <p style="color: #94a3b8; margin: 6px 0 0; font-size: 13px;">New Customer Inquiry Alert</p>
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
          Krishna Electronics &amp; Order Suppliers | Birendranagar-12, Surkhet, Nepal | 9858083951
        </div>
      </div>
    `;

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

    // Automatically dispatch email notification to krishnaelectronics2077@gmail.com
    sendInquiryEmailNotification(inquiry).catch((err) => {
      console.error('Async inquiry email dispatch error:', err);
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
