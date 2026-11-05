import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentAdminFromRequest, logAudit } from '@/lib/auth';

export async function GET() {
  try {
    const faqs = await prisma.fAQ.findMany({
      orderBy: { orderIndex: 'asc' },
    });
    return NextResponse.json({ faqs });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch FAQs' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = getCurrentAdminFromRequest(req);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { question, answer, category, orderIndex, isActive } = await req.json();
    if (!question || !answer) {
      return NextResponse.json({ error: 'Question and answer are required' }, { status: 400 });
    }

    const faq = await prisma.fAQ.create({
      data: {
        question,
        answer,
        category: category || 'General',
        orderIndex: orderIndex ? parseInt(orderIndex, 10) : 0,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      },
    });

    await logAudit({
      userId: admin.id,
      userName: admin.name,
      action: 'CREATE_FAQ',
      entity: 'FAQ',
      entityId: faq.id,
      details: `Created FAQ "${question}"`,
    });

    return NextResponse.json({ success: true, faq }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create FAQ' }, { status: 500 });
  }
}
