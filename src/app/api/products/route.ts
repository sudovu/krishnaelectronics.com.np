import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentAdminFromRequest, logAudit } from '@/lib/auth';
import { z } from 'zod';

const productSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  sku: z.string().min(1, 'SKU is required (can be single digit, e.g. 1)'),
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
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('PUBLISHED'),
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

    const cleanQ = q.trim();
    const searchTokens = cleanQ.toLowerCase().split(/\s+/).filter(Boolean);

    const baseWhere: any = {};
    if (category) {
      baseWhere.category = { slug: category };
    }
    if (brand) {
      baseWhere.brand = { slug: brand };
    }
    if (status) {
      baseWhere.status = status;
    }

    const buildTokenClause = (tok: string, withMode: boolean) => {
      const modeOpt = withMode ? { mode: 'insensitive' as const } : {};
      return {
        OR: [
          { title: { contains: tok, ...modeOpt } },
          { sku: { contains: tok, ...modeOpt } },
          { shortDescription: { contains: tok, ...modeOpt } },
          { fullDescription: { contains: tok, ...modeOpt } },
          { category: { name: { contains: tok, ...modeOpt } } },
          { subcategory: { name: { contains: tok, ...modeOpt } } },
          { brand: { name: { contains: tok, ...modeOpt } } },
        ],
      };
    };

    let products: any[] = [];
    let total = 0;

    if (searchTokens.length > 0) {
      try {
        const where = {
          ...baseWhere,
          AND: searchTokens.map((tok) => buildTokenClause(tok, true)),
        };
        [products, total] = await Promise.all([
          prisma.product.findMany({
            where,
            include: { category: true, subcategory: true, brand: true },
            orderBy: { createdAt: 'desc' },
            take,
            skip,
          }),
          prisma.product.count({ where }),
        ]);
      } catch (_) {
        const where = {
          ...baseWhere,
          AND: searchTokens.map((tok) => buildTokenClause(tok, false)),
        };
        [products, total] = await Promise.all([
          prisma.product.findMany({
            where,
            include: { category: true, subcategory: true, brand: true },
            orderBy: { createdAt: 'desc' },
            take,
            skip,
          }),
          prisma.product.count({ where }),
        ]);
      }

      // Smart In-Memory Fallback if strict DB query returned 0 items
      if (products.length === 0) {
        const allCandidates = await prisma.product.findMany({
          where: baseWhere,
          include: { category: true, subcategory: true, brand: true },
          orderBy: { createdAt: 'desc' },
        });

        const matched = allCandidates.filter((p) => {
          const haystacks = [
            p.title,
            p.shortDescription,
            p.fullDescription,
            p.sku,
            p.category?.name,
            p.subcategory?.name,
            p.brand?.name,
          ]
            .filter((s): s is string => typeof s === 'string')
            .map((s) => s.toLowerCase());

          const combined = haystacks.join(' ');
          const norm = combined.replace(/[-_.,/\\()]/g, ' ');

          return searchTokens.every(
            (tok) =>
              combined.includes(tok) ||
              norm.includes(tok) ||
              (tok === 'wifi' && combined.includes('wi-fi')) ||
              (tok === 'wi-fi' && combined.includes('wifi'))
          );
        });

        products = matched.slice(skip, skip + take);
        total = matched.length;
      }
    } else {
      [products, total] = await Promise.all([
        prisma.product.findMany({
          where: baseWhere,
          include: { category: true, subcategory: true, brand: true },
          orderBy: { createdAt: 'desc' },
          take,
          skip,
        }),
        prisma.product.count({ where: baseWhere }),
      ]);
    }

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
