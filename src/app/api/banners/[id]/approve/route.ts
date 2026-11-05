import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentAdminFromRequest, hasPermission, logAudit } from '@/lib/auth';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = getCurrentAdminFromRequest(req);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(admin.role, 'canApproveBanners')) {
      return NextResponse.json(
        { error: 'Forbidden: Only Super-Admin or Admin roles can approve promotional banners.' },
        { status: 403 }
      );
    }

    const banner = await prisma.banner.findUnique({
      where: { id: params.id },
    });

    if (!banner) {
      return NextResponse.json({ error: 'Banner not found' }, { status: 404 });
    }

    // Set approved and publish
    const approved = await prisma.banner.update({
      where: { id: params.id },
      data: {
        isApproved: true,
        approvedBy: admin.email,
        approvedAt: new Date(),
        status: 'PUBLISHED',
      },
    });

    await logAudit({
      userId: admin.id,
      userName: admin.name,
      action: 'APPROVE_BANNER',
      entity: 'Banner',
      entityId: approved.id,
      details: `Approved and published banner "${approved.title}" (AI-generated: ${approved.isAiGenerated})`,
      ipAddress: req.headers.get('x-forwarded-for') || 'local',
    });

    return NextResponse.json({
      success: true,
      message: 'Banner successfully approved and published to the live website.',
      banner: approved,
    });
  } catch (error: any) {
    console.error('Approve banner error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to approve banner' },
      { status: 500 }
    );
  }
}
