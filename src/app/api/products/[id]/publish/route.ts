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

    if (!hasPermission(admin.role, 'canPublishProducts')) {
      return NextResponse.json(
        { error: 'Forbidden: Your role does not have permission to publish content.' },
        { status: 403 }
      );
    }

    const product = await prisma.product.findUnique({
      where: { id: params.id },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Explicit Validation Check before publishing
    const validationErrors: string[] = [];
    if (!product.title || product.title.trim().length < 3) {
      validationErrors.push('Product title must be at least 3 characters.');
    }
    if (!product.sku || product.sku.trim().length < 1) {
      validationErrors.push('SKU is required.');
    }
    if (!product.regularPrice || product.regularPrice <= 0) {
      validationErrors.push('Valid regular price in NPR is required.');
    }
    if (!product.primaryImage || !product.primaryImage.startsWith('http')) {
      validationErrors.push('A valid high-resolution primary image URL is required.');
    }
    if (!product.shortDescription || product.shortDescription.trim().length < 10) {
      validationErrors.push('A clear short description (minimum 10 characters) is required.');
    }
    if (!product.fullDescription || product.fullDescription.trim().length < 20) {
      validationErrors.push('A comprehensive full description (minimum 20 characters) is required.');
    }

    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          error: 'Validation failed before publication.',
          details: validationErrors,
        },
        { status: 422 }
      );
    }

    // Publish
    const updated = await prisma.product.update({
      where: { id: params.id },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
    });

    await logAudit({
      userId: admin.id,
      userName: admin.name,
      action: 'PUBLISH_PRODUCT',
      entity: 'Product',
      entityId: updated.id,
      details: `Explicitly published product "${updated.title}" after validation checks.`,
      ipAddress: req.headers.get('x-forwarded-for') || 'local',
    });

    return NextResponse.json({
      success: true,
      message: 'Product validated and published successfully.',
      product: updated,
    });
  } catch (error: any) {
    console.error('Publish error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to publish product' },
      { status: 500 }
    );
  }
}
