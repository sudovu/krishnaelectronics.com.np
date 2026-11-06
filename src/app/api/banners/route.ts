import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentAdminFromRequest, logAudit } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const all = searchParams.get('all') === 'true';

    const where: any = {};
    if (!all) {
      where.status = 'PUBLISHED';
      where.isApproved = true;
    }

    const banners = await prisma.banner.findMany({
      where,
      orderBy: { orderIndex: 'asc' },
    });

    return NextResponse.json({ banners });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch banners' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = getCurrentAdminFromRequest(req);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();
    if (!data.title || !data.imageUrl) {
      return NextResponse.json(
        { error: 'Banner title and image URL are required.' },
        { status: 400 }
      );
    }

    const discount = data.discountPercent !== undefined && data.discountPercent !== null && data.discountPercent !== '' && !isNaN(parseInt(data.discountPercent, 10))
      ? parseInt(data.discountPercent, 10)
      : null;

    const startDate = data.startDate && !isNaN(Date.parse(data.startDate)) ? new Date(data.startDate) : null;
    const endDate = data.endDate && !isNaN(Date.parse(data.endDate)) ? new Date(data.endDate) : null;

    const banner = await prisma.banner.create({
      data: {
        title: data.title,
        subtitle: data.subtitle || '',
        badgeText: data.badgeText || '',
        ctaText: data.ctaText || 'Learn More',
        ctaLink: data.ctaLink || '/products',
        position: data.position || 'HERO_SLIDER',
        imageUrl: data.imageUrl,
        discountPercent: discount,
        couponCode: data.couponCode || null,
        startDate: startDate,
        endDate: endDate,
        isAiGenerated: Boolean(data.isAiGenerated),
        aiPrompt: data.aiPrompt || null,
        aiStyle: data.aiStyle || null,
        status: data.status || 'DRAFT',
        isApproved: Boolean(data.isApproved),
      },
    });

    await logAudit({
      userId: admin.id,
      userName: admin.name,
      action: 'CREATE_BANNER_DRAFT',
      entity: 'Banner',
      entityId: banner.id,
      details: `Created draft promotional banner "${banner.title}"`,
      ipAddress: req.headers.get('x-forwarded-for') || 'local',
    });

    return NextResponse.json({ success: true, banner }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create banner' }, { status: 500 });
  }
}
