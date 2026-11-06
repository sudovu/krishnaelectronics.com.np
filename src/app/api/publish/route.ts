import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentAdminFromRequest, logAudit } from '@/lib/auth';
import { clearProfileCache } from '@/platform/engine/tenant-loader';
import { revalidatePath } from 'next/cache';

export async function POST(req: NextRequest) {
  try {
    const admin = getCurrentAdminFromRequest(req);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized: Please log in first.' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { publishBanners = true, publishProducts = true } = body;

    let publishedBannersCount = 0;
    if (publishBanners) {
      // Publish any approved banners that are still in DRAFT
      const result = await prisma.banner.updateMany({
        where: {
          isApproved: true,
          status: 'DRAFT',
        },
        data: {
          status: 'PUBLISHED',
        },
      });
      publishedBannersCount = result.count;
    }

    let publishedProductsCount = 0;
    if (publishProducts) {
      const result = await prisma.product.updateMany({
        where: {
          status: 'DRAFT',
        },
        data: {
          status: 'PUBLISHED',
          publishedAt: new Date(),
        },
      });
      publishedProductsCount = result.count;
    }

    // Touch site-settings updatedAt to invalidate server caches
    await prisma.setting.update({
      where: { id: 'site-settings' },
      data: { updatedAt: new Date() },
    }).catch(() => {});

    clearProfileCache();

    // Revalidate critical paths
    try {
      revalidatePath('/', 'layout');
      revalidatePath('/products', 'page');
      revalidatePath('/services', 'page');
      revalidatePath('/about', 'page');
      revalidatePath('/contact', 'page');
      revalidatePath('/faqs', 'page');
    } catch (_) {
      // revalidatePath in non-static contexts is ignored gracefully
    }

    // Get live storefront metrics
    const [productsCount, servicesCount, bannersCount] = await Promise.all([
      prisma.product.count({ where: { status: 'PUBLISHED' } }),
      prisma.service.count({ where: { isActive: true } }),
      prisma.banner.count({ where: { status: 'PUBLISHED' } }),
    ]);

    await logAudit({
      userId: admin.id,
      userName: admin.name,
      action: 'PUBLISH_LIVE_WEBSITE',
      entity: 'Platform',
      details: `Published live website updates. Active products: ${productsCount}, Services: ${servicesCount}, Banners: ${bannersCount}. Newly published banners: ${publishedBannersCount}.`,
      ipAddress: req.headers.get('x-forwarded-for') || 'local',
    });

    return NextResponse.json({
      success: true,
      message: 'Website published successfully! All changes are now live.',
      publishedAt: new Date().toISOString(),
      stats: {
        productsCount,
        servicesCount,
        bannersCount,
        newlyPublishedBanners: publishedBannersCount,
        newlyPublishedProducts: publishedProductsCount,
      },
    });
  } catch (error: any) {
    console.error('Publish error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to publish changes to live website.' },
      { status: 500 }
    );
  }
}
