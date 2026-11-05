import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentAdminFromRequest, logAudit } from '@/lib/auth';
import { z } from 'zod';

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
