import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedAdmin, hasPermission, logAudit } from '@/lib/auth';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await getAuthenticatedAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized: Administrative authentication required.' }, { status: 401 });
    }

    if (!hasPermission(admin.role, 'canManageSettings') && !hasPermission(admin.role, 'canManageServices')) {
      return NextResponse.json(
        { error: 'Forbidden: Your role does not have permission to modify FAQs.' },
        { status: 403 }
      );
    }

    const { id } = params;
    const body = await req.json();

    const updateData: any = {};
    if (body.question !== undefined) updateData.question = body.question;
    if (body.answer !== undefined) updateData.answer = body.answer;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.orderIndex !== undefined) updateData.orderIndex = parseInt(body.orderIndex, 10);
    if (body.isActive !== undefined) updateData.isActive = Boolean(body.isActive);

    const faq = await prisma.fAQ.update({
      where: { id },
      data: updateData,
    });

    await logAudit({
      userId: admin.id,
      userName: admin.name,
      action: 'UPDATE_FAQ',
      entity: 'FAQ',
      entityId: id,
      details: `Updated FAQ "${faq.question}"`,
    });

    return NextResponse.json({ success: true, faq });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update FAQ' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await getAuthenticatedAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized: Administrative authentication required.' }, { status: 401 });
    }

    if (!hasPermission(admin.role, 'canManageSettings') && !hasPermission(admin.role, 'canManageServices')) {
      return NextResponse.json(
        { error: 'Forbidden: Your role does not have permission to delete FAQs.' },
        { status: 403 }
      );
    }

    const { id } = params;
    const faq = await prisma.fAQ.delete({
      where: { id },
    });

    await logAudit({
      userId: admin.id,
      userName: admin.name,
      action: 'DELETE_FAQ',
      entity: 'FAQ',
      entityId: id,
      details: `Deleted FAQ "${faq.question}"`,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete FAQ' }, { status: 500 });
  }
}
