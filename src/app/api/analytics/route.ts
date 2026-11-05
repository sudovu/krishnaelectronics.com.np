import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentAdminFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const admin = getCurrentAdminFromRequest(req);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Real Products Data
    const [totalProducts, publishedProducts, draftProducts] = await Promise.all([
      prisma.product.count(),
      prisma.product.count({ where: { status: 'PUBLISHED' } }),
      prisma.product.count({ where: { status: 'DRAFT' } }),
    ]);

    // 2. Real Inquiries & Order Requests
    const [totalInquiries, newInquiries, resolvedInquiries] = await Promise.all([
      prisma.inquiry.count(),
      prisma.inquiry.count({ where: { status: 'NEW' } }),
      prisma.inquiry.count({ where: { status: 'RESOLVED' } }),
    ]);

    // 3. Most Viewed Products (Real DB views count)
    const mostViewedProducts = await prisma.product.findMany({
      where: { status: 'PUBLISHED' },
      select: {
        id: true,
        title: true,
        slug: true,
        regularPrice: true,
        offerPrice: true,
        viewsCount: true,
        stockQuantity: true,
      },
      orderBy: { viewsCount: 'desc' },
      take: 5,
    });

    // 4. Inventory Stock Alerts
    const lowStockProducts = await prisma.product.findMany({
      where: {
        OR: [
          { stockStatus: 'LOW_STOCK' },
          { stockStatus: 'OUT_OF_STOCK' },
          { stockQuantity: { lte: 3 } },
        ],
      },
      select: {
        id: true,
        title: true,
        sku: true,
        stockQuantity: true,
        stockStatus: true,
      },
      take: 10,
    });

    // 5. Active Promotions & Banners
    const activePromotions = await prisma.banner.findMany({
      where: {
        status: 'PUBLISHED',
        isApproved: true,
      },
      select: {
        id: true,
        title: true,
        position: true,
        discountPercent: true,
        isAiGenerated: true,
      },
    });

    // 6. Recent Admin Activities (Real Audit Log)
    const recentAuditLogs = await prisma.auditLog.findMany({
      take: 8,
      orderBy: { createdAt: 'desc' },
    });

    // 7. Categories Breakdown
    const categoriesWithCount = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        _count: { select: { products: true } },
      },
      orderBy: { orderIndex: 'asc' },
    });

    return NextResponse.json({
      success: true,
      metrics: {
        products: {
          total: totalProducts,
          published: publishedProducts,
          drafts: draftProducts,
        },
        inquiries: {
          total: totalInquiries,
          new: newInquiries,
          resolved: resolvedInquiries,
        },
        activePromotionsCount: activePromotions.length,
        lowStockCount: lowStockProducts.length,
      },
      mostViewedProducts,
      lowStockProducts,
      activePromotions,
      recentAuditLogs,
      categoriesWithCount,
      externalAnalytics: {
        status: 'UNCONFIGURED',
        message: 'Google Analytics 4 (GA4) / Plausible tag is not yet linked. Pageviews tracked internally via database counter. To view external bounce rate and visitor search acquisition, configure your Measurement ID in Website Settings.',
      },
      salesAndRevenue: {
        status: 'INQUIRY_AND_DIRECT_QUOTE_MODE',
        message: 'Online transactional card payment gateway is currently disabled in favor of Direct Quotation, WhatsApp Orders, and In-Store POS. Sales revenue figures will display once direct checkout gateway is activated.',
      },
    });
  } catch (error: any) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
