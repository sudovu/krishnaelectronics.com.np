import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedAdmin, hasPermission, logAudit } from '@/lib/auth';
import { z } from 'zod';
import { generateProductSeo } from '@/lib/seo/product-seo';

const productSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  sku: z.string().trim().min(1, 'SKU is required (can be single digit, e.g. 1)'),
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
  metaTitle: z.string().optional().nullable(),
  metaDescription: z.string().optional().nullable(),
  seoKeywords: z.string().optional().nullable(),
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

    // Enforce publication boundaries:
    // Public requests MUST strictly see PUBLISHED products only.
    // Only authenticated administrative sessions can view DRAFT or ARCHIVED inventory.
    const admin = await getAuthenticatedAdmin(req);

    const baseWhere: any = {};
    if (category) {
      baseWhere.category = { slug: category };
    }
    if (brand) {
      baseWhere.brand = { slug: brand };
    }

    if (!admin) {
      // Strictly enforce published products for public visitors
      baseWhere.status = 'PUBLISHED';
    } else {
      if (status && status !== 'ALL') {
        baseWhere.status = status;
      }
    }

    const buildTokenClause = (tok: string, withMode: boolean) => {
      const modeOpt = withMode ? { mode: 'insensitive' as const } : {};
      return {
        OR: [
          { title: { contains: tok, ...modeOpt } },
          { sku: { contains: tok, ...modeOpt } },
          { shortDescription: { contains: tok, ...modeOpt } },
          { fullDescription: { contains: tok, ...modeOpt } },
          { seoKeywords: { contains: tok, ...modeOpt } },
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
            (p as any).seoKeywords,
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
    console.error('Notice: Database product query encountered notice, activating resilient manifest fallback:', error);
    try {
      const manifest = require('@/business/krishna-electronics/data.json');
      if (manifest?.products?.length > 0) {
        const catMap = new Map((manifest.categories || []).map((c: any) => [c.slug, c]));
        const brandMap = new Map((manifest.brands || []).map((b: any) => [b.slug, b]));
        const fallbackProducts = manifest.products.map((p: any, idx: number) => ({
          id: p.sku ? `prod-${p.sku}` : `prod-${idx + 1}`,
          title: p.title,
          slug: p.slug,
          sku: p.sku,
          regularPrice: p.regularPrice,
          offerPrice: p.offerPrice || null,
          discountPercent: p.discountPercent || null,
          stockQuantity: p.stockQuantity ?? 10,
          stockStatus: p.stockStatus || 'IN_STOCK',
          shortDescription: p.shortDescription || '',
          fullDescription: p.fullDescription || '',
          specifications: typeof p.specifications === 'string' ? p.specifications : JSON.stringify(p.specifications || []),
          warranty: p.warranty || null,
          isFeatured: Boolean(p.isFeatured),
          isPopular: Boolean(p.isPopular),
          isNewArrival: Boolean(p.isNewArrival),
          isDeal: Boolean(p.isDeal),
          primaryImage: p.primaryImage || '/images/logo.png',
          gallery: typeof p.gallery === 'string' ? p.gallery : JSON.stringify(p.gallery || []),
          status: p.status || 'PUBLISHED',
          viewsCount: 0,
          createdAt: new Date().toISOString(),
          category: catMap.get(p.categorySlug) || { name: p.categorySlug, slug: p.categorySlug },
          brand: brandMap.get(p.brandSlug) || (p.brandSlug ? { name: p.brandSlug, slug: p.brandSlug } : null),
        }));
        return NextResponse.json({ products: fallbackProducts, total: fallbackProducts.length });
      }
    } catch (fallbackErr) {
      console.error('Manifest fallback notice:', fallbackErr);
    }
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await getAuthenticatedAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized: Administrative authentication required.' }, { status: 401 });
    }

    const json = await req.json();
    const validated = productSchema.parse(json);

    // Enforce publication permissions on product creation
    if (validated.status === 'PUBLISHED' && !hasPermission(admin.role, 'canPublishProducts')) {
      return NextResponse.json(
        { error: 'Forbidden: Your role does not have permission to publish products directly to the live catalog. You may save as DRAFT.' },
        { status: 403 }
      );
    }

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

    const finalSku = validated.sku.trim().toUpperCase();

    // Check SKU uniqueness
    const existingSku = await prisma.product.findFirst({
      where: { sku: finalSku },
    });
    if (existingSku) {
      return NextResponse.json(
        {
          error: `SKU "${finalSku}" is already in use by another product: "${existingSku.title}".`,
          conflictingProduct: {
            id: existingSku.id,
            title: existingSku.title,
            sku: existingSku.sku,
          },
        },
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

    // Automatically optimize SEO keywords and meta if not manually specified
    let metaTitle = validated.metaTitle;
    let metaDescription = validated.metaDescription;
    let seoKeywords = validated.seoKeywords;

    if (!metaTitle || !metaDescription || !seoKeywords) {
      const [category, brand, subcategory] = await Promise.all([
        prisma.category.findUnique({ where: { id: validated.categoryId } }),
        validated.brandId ? prisma.brand.findUnique({ where: { id: validated.brandId } }) : null,
        validated.subcategoryId ? prisma.subcategory.findUnique({ where: { id: validated.subcategoryId } }) : null,
      ]);

      const autoSeo = generateProductSeo({
        title: validated.title,
        brandName: brand?.name,
        categoryName: category?.name,
        subcategoryName: subcategory?.name,
        regularPrice: validated.regularPrice,
        offerPrice: validated.offerPrice,
        specifications: validated.specifications,
        warranty: validated.warranty,
        shortDescription: validated.shortDescription,
      });

      if (!metaTitle) metaTitle = autoSeo.metaTitle;
      if (!metaDescription) metaDescription = autoSeo.metaDescription;
      if (!seoKeywords) seoKeywords = autoSeo.seoKeywords;
    }

    const newProduct = await prisma.product.create({
      data: {
        ...validated,
        sku: finalSku,
        metaTitle,
        metaDescription,
        seoKeywords,
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
