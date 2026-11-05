import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentAdminFromRequest, logAudit } from '@/lib/auth';
import { z } from 'zod';

const productSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  sku: z.string().min(2, 'SKU must be at least 2 characters'),
  categoryId: z.string().min(1, 'Category is required'),
  subcategoryId: z.string().optional().nullable(),
  brandId: z.string().optional().nullable(),
  regularPrice: z.number().positive('Regular price must be greater than zero'),
  offerPrice: z.number().positive().optional().nullable(),
  discountPercent: z.number().min(0).max(100).optional().nullable(),
  stockQuantity: z.number().int().min(0).default(0),
  stockStatus: z.enum(['IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK']).default('IN_STOCK'),
  shortDescription: z.string().min(5, 'Short description is required'),
  fullDescription: z.string().min(10, 'Full description is required'),
  specifications: z.string().default('[]'),
  warranty: z.string().optional().nullable(),
  isFeatured: z.boolean().default(false),
  isPopular: z.boolean().default(false),
  isNewArrival: z.boolean().default(false),
  isDeal: z.boolean().default(false),
  primaryImage: z.string().url('Primary image must be a valid URL'),
  gallery: z.string().default('[]'),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('DRAFT'),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q') || '';
    const category = searchParams.get('category') || '';
    const brand = searchParams.get('brand') || '';
    const status = searchParams.get('status') || '';
    const take = parseInt(searchParams.get('take') || '50', 10);
    const skip = parseInt(searchParams.get('skip') || '0', 10);

    const where: any = {};
    if (q) {
      where.OR = [
        { title: { contains: q } },
        { sku: { contains: q } },
        { shortDescription: { contains: q } },
      ];
    }
    if (category) {
      where.category = { slug: category };
    }
    if (brand) {
      where.brand = { slug: brand };
    }
    if (status) {
      where.status = status;
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: true,
          subcategory: true,
          brand: true,
        },
        orderBy: { createdAt: 'desc' },
        take,
        skip,
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({ products, total });
  } catch (error: any) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = getCurrentAdminFromRequest(req);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const json = await req.json();
    const validated = productSchema.parse(json);

    // Generate unique slug from title
    let baseSlug = validated.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    let slug = baseSlug;
    let count = 1;
    while (await prisma.product.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${count++}`;
    }

    // Check SKU uniqueness
    const existingSku = await prisma.product.findUnique({
      where: { sku: validated.sku },
    });
    if (existingSku) {
      return NextResponse.json(
        { error: `SKU "${validated.sku}" is already in use by another product.` },
        { status: 400 }
      );
    }

    // If offer price is given, calculate discount percentage automatically if not provided
    let discountPercent = validated.discountPercent;
    if (validated.offerPrice && validated.regularPrice && validated.offerPrice < validated.regularPrice) {
      discountPercent = Math.round(
        ((validated.regularPrice - validated.offerPrice) / validated.regularPrice) * 100
      );
    }

    const newProduct = await prisma.product.create({
      data: {
        ...validated,
        slug,
        discountPercent,
        publishedAt: validated.status === 'PUBLISHED' ? new Date() : null,
      },
      include: {
        category: true,
        brand: true,
      },
    });

    await logAudit({
      userId: admin.id,
      userName: admin.name,
      action: 'CREATE_PRODUCT',
      entity: 'Product',
      entityId: newProduct.id,
      details: `Created product "${newProduct.title}" (Status: ${newProduct.status})`,
      ipAddress: req.headers.get('x-forwarded-for') || 'local',
    });

    return NextResponse.json({ success: true, product: newProduct }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Error creating product:', error);
    return NextResponse.json({ error: error.message || 'Failed to create product' }, { status: 500 });
  }
}
