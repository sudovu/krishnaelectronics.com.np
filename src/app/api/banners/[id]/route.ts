import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentAdminFromRequest, logAudit } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = getCurrentAdminFromRequest(req);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();
    const updated = await prisma.banner.update({
      where: { id: params.id },
      data: {
        title: data.title,
        subtitle: data.subtitle,
        badgeText: data.badgeText,
        ctaText: data.ctaText,
        ctaLink: data.ctaLink,
        position: data.position || undefined,
        imageUrl: data.imageUrl,
        discountPercent: data.discountPercent !== undefined ? (data.discountPercent ? parseInt(data.discountPercent, 10) : null) : undefined,
        couponCode: data.couponCode,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        isApproved: data.isApproved !== undefined ? Boolean(data.isApproved) : undefined,
        status: data.status,
      },
    });

    try {
      revalidatePath('/', 'layout');
    } catch (_) {}

    await logAudit({
      userId: admin.id,
      userName: admin.name,
      action: 'UPDATE_BANNER',
      entity: 'Banner',
      entityId: updated.id,
      details: `Updated banner "${updated.title}"`,
      ipAddress: req.headers.get('x-forwarded-for') || 'local',
    });

    return NextResponse.json({ success: true, banner: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update banner' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = getCurrentAdminFromRequest(req);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const banner = await prisma.banner.findUnique({
      where: { id: params.id },
    });
    if (!banner) {
      return NextResponse.json({ error: 'Banner not found' }, { status: 404 });
    }

    await prisma.banner.delete({
      where: { id: params.id },
    });

    try {
      revalidatePath('/', 'layout');
    } catch (_) {}

    await logAudit({
      userId: admin.id,
      userName: admin.name,
      action: 'DELETE_BANNER',
      entity: 'Banner',
      entityId: params.id,
      details: `Deleted banner "${banner.title}"`,
      ipAddress: req.headers.get('x-forwarded-for') || 'local',
    });

    return NextResponse.json({ success: true, message: 'Banner deleted' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete banner' }, { status: 500 });
  }
}
