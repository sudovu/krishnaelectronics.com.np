import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentAdminFromRequest, hasPermission, logAudit } from '@/lib/auth';
import { z } from 'zod';

const updateProductSchema = z.object({
  title: z.string().min(3).optional(),
  sku: z.string().min(2).optional(),
  categoryId: z.string().min(1).optional(),
  subcategoryId: z.string().optional().nullable(),
  brandId: z.string().optional().nullable(),
  regularPrice: z.number().positive().optional(),
  offerPrice: z.number().positive().optional().nullable(),
  discountPercent: z.number().min(0).max(100).optional().nullable(),
  stockQuantity: z.number().int().min(0).optional(),
  stockStatus: z.enum(['IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK']).optional(),
  shortDescription: z.string().min(5).optional(),
  fullDescription: z.string().min(10).optional(),
  specifications: z.string().optional(),
  warranty: z.string().optional().nullable(),
  isFeatured: z.boolean().optional(),
  isPopular: z.boolean().optional(),
  isNewArrival: z.boolean().optional(),
  isDeal: z.boolean().optional(),
  primaryImage: z.string().url().optional(),
  gallery: z.string().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: {
        category: true,
        subcategory: true,
        brand: true,
      },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ product });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = getCurrentAdminFromRequest(req);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const existingProduct = await prisma.product.findUnique({
      where: { id: params.id },
    });
    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const json = await req.json();
    const validated = updateProductSchema.parse(json);

    // If SKU changed, verify uniqueness
    if (validated.sku && validated.sku !== existingProduct.sku) {
      const skuCheck = await prisma.product.findUnique({
        where: { sku: validated.sku },
      });
      if (skuCheck) {
        return NextResponse.json(
          { error: `SKU "${validated.sku}" is already in use.` },
          { status: 400 }
        );
      }
    }

    // Auto-calculate discount if offerPrice is updated
    let discountPercent = validated.discountPercent;
    const finalRegularPrice = validated.regularPrice ?? existingProduct.regularPrice;
    const finalOfferPrice = validated.offerPrice !== undefined ? validated.offerPrice : existingProduct.offerPrice;
    if (finalOfferPrice && finalRegularPrice && finalOfferPrice < finalRegularPrice) {
      discountPercent = Math.round(((finalRegularPrice - finalOfferPrice) / finalRegularPrice) * 100);
    }

    const updatedProduct = await prisma.product.update({
      where: { id: params.id },
      data: {
        ...validated,
        discountPercent,
        publishedAt:
          validated.status === 'PUBLISHED' && existingProduct.status !== 'PUBLISHED'
            ? new Date()
            : existingProduct.publishedAt,
      },
      include: {
        category: true,
        brand: true,
      },
    });

    await logAudit({
      userId: admin.id,
      userName: admin.name,
      action: 'UPDATE_PRODUCT',
      entity: 'Product',
      entityId: updatedProduct.id,
      details: `Updated product "${updatedProduct.title}" (Status: ${updatedProduct.status})`,
      ipAddress: req.headers.get('x-forwarded-for') || 'local',
    });

    return NextResponse.json({ success: true, product: updatedProduct });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Error updating product:', error);
    return NextResponse.json({ error: error.message || 'Failed to update product' }, { status: 500 });
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

    if (!hasPermission(admin.role, 'canDeleteProducts')) {
      return NextResponse.json(
        { error: 'Forbidden: Your role does not have permission to delete products.' },
        { status: 403 }
      );
    }

    const product = await prisma.product.findUnique({
      where: { id: params.id },
    });
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    await prisma.product.delete({
      where: { id: params.id },
    });

    await logAudit({
      userId: admin.id,
      userName: admin.name,
      action: 'DELETE_PRODUCT',
      entity: 'Product',
      entityId: params.id,
      details: `Deleted product "${product.title}" (SKU: ${product.sku})`,
      ipAddress: req.headers.get('x-forwarded-for') || 'local',
    });

    return NextResponse.json({ success: true, message: 'Product deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}
