import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentAdminFromRequest, hasPermission, logAudit } from '@/lib/auth';
import { z } from 'zod';
import { generateProductSeo } from '@/lib/seo/product-seo';

const updateProductSchema = z.object({
  title: z.string().min(3).optional(),
  sku: z.string().trim().min(1, 'SKU is required (can be single digit, e.g. 1)').optional(),
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
  metaTitle: z.string().optional().nullable(),
  metaDescription: z.string().optional().nullable(),
  seoKeywords: z.string().optional().nullable(),
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

    const finalSku = validated.sku !== undefined ? validated.sku.trim().toUpperCase() : undefined;

    // If SKU changed, verify uniqueness against all other products
    if (finalSku && finalSku !== existingProduct.sku.trim().toUpperCase()) {
      const skuCheck = await prisma.product.findFirst({
        where: {
          sku: finalSku,
          NOT: { id: params.id },
        },
      });
      if (skuCheck) {
        return NextResponse.json(
          {
            error: `SKU "${finalSku}" is already in use by another product: "${skuCheck.title}".`,
            conflictingProduct: {
              id: skuCheck.id,
              title: skuCheck.title,
              sku: skuCheck.sku,
            },
          },
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

    // Automatically optimize SEO keywords, title, and description on every edit
    const finalTitle = validated.title ?? existingProduct.title;
    const finalCategoryId = validated.categoryId ?? existingProduct.categoryId;
    const finalBrandId = validated.brandId !== undefined ? validated.brandId : existingProduct.brandId;
    const finalSubcategoryId = validated.subcategoryId !== undefined ? validated.subcategoryId : existingProduct.subcategoryId;
    const finalSpecs = validated.specifications ?? existingProduct.specifications;
    const finalWarranty = validated.warranty !== undefined ? validated.warranty : existingProduct.warranty;
    const finalShortDesc = validated.shortDescription ?? existingProduct.shortDescription;

    let metaTitle = validated.metaTitle;
    let metaDescription = validated.metaDescription;
    let seoKeywords = validated.seoKeywords;

    if (!metaTitle || !metaDescription || !seoKeywords) {
      const [category, brand, subcategory] = await Promise.all([
        prisma.category.findUnique({ where: { id: finalCategoryId } }),
        finalBrandId ? prisma.brand.findUnique({ where: { id: finalBrandId } }) : null,
        finalSubcategoryId ? prisma.subcategory.findUnique({ where: { id: finalSubcategoryId } }) : null,
      ]);

      const autoSeo = generateProductSeo({
        title: finalTitle,
        brandName: brand?.name,
        categoryName: category?.name,
        subcategoryName: subcategory?.name,
        regularPrice: finalRegularPrice,
        offerPrice: finalOfferPrice,
        specifications: finalSpecs,
        warranty: finalWarranty,
        shortDescription: finalShortDesc,
      });

      if (!metaTitle) metaTitle = autoSeo.metaTitle;
      if (!metaDescription) metaDescription = autoSeo.metaDescription;
      if (!seoKeywords) seoKeywords = autoSeo.seoKeywords;
    }

    const updatedProduct = await prisma.product.update({
      where: { id: params.id },
      data: {
        ...validated,
        sku: finalSku ?? existingProduct.sku,
        metaTitle,
        metaDescription,
        seoKeywords,
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
