import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentAdminFromRequest, logAudit } from '@/lib/auth';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = getCurrentAdminFromRequest(req);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { status, adminNotes } = await req.json();

    const updated = await prisma.inquiry.update({
      where: { id: params.id },
      data: {
        status: status !== undefined ? status : undefined,
        adminNotes: adminNotes !== undefined ? adminNotes : undefined,
      },
    });

    await logAudit({
      userId: admin.id,
      userName: admin.name,
      action: 'UPDATE_INQUIRY',
      entity: 'Inquiry',
      entityId: updated.id,
      details: `Updated inquiry status to ${status}`,
      ipAddress: req.headers.get('x-forwarded-for') || 'local',
    });

    return NextResponse.json({ success: true, inquiry: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update inquiry' }, { status: 500 });
  }
}
