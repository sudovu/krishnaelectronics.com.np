import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import ProductCard from '@/components/public/ProductCard';
import { Filter, Search, SlidersHorizontal, ArrowLeft } from 'lucide-react';

export const revalidate = 30;

interface ProductsPageProps {
  searchParams: {
    q?: string;
    category?: string;
    brand?: string;
    sort?: string;
    stock?: string;
    featured?: string;
  };
}

// Generate intelligent synonyms and normalized variants for search terms
function getSearchVariants(tok: string): string[] {
  const set = new Set<string>([tok]);
  const lower = tok.toLowerCase();

  // Hyphenation and spelling normalizations
  if (lower === 'wifi') set.add('wi-fi');
  if (lower === 'wi-fi') set.add('wifi');
  if (lower === 'toner') { set.add('toners'); set.add('cartridge'); }
  if (lower === 'toners') { set.add('toner'); set.add('cartridges'); }
  if (lower === 'cartridge') { set.add('cartridges'); set.add('toner'); }
  if (lower === 'cartridges') { set.add('cartridge'); set.add('toners'); }
  if (lower === 'cctv') { set.add('camera'); set.add('surveillance'); }
  if (lower === 'router') { set.add('routers'); set.add('networking'); }
  if (lower === 'laptop') { set.add('laptops'); set.add('computer'); }

  // Punctuation stripped version
  const stripped = tok.replace(/[-_.,/\\()]/g, '');
  if (stripped) set.add(stripped);

  return Array.from(set).filter(Boolean);
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const rawQ = searchParams.q || '';
  const cleanQuery = rawQ.trim();
  const categorySlug = searchParams.category || '';
  const brandSlug = searchParams.brand || '';
  const sort = searchParams.sort || 'newest';
  const stockOnly = searchParams.stock === 'in_stock';
  const featuredOnly = searchParams.featured === 'true';

  // Base filters applied to all queries
  const baseWhere: any = {
    status: 'PUBLISHED',
  };

  if (categorySlug) {
    baseWhere.category = { slug: categorySlug };
  }

  if (brandSlug) {
    baseWhere.brand = { slug: brandSlug };
  }

  if (stockOnly) {
    baseWhere.stockStatus = 'IN_STOCK';
  }

  if (featuredOnly) {
    baseWhere.isFeatured = true;
  }

  // Sorting
  let orderBy: any = { createdAt: 'desc' };
  if (sort === 'price_asc') {
    orderBy = { regularPrice: 'asc' };
  } else if (sort === 'price_desc') {
    orderBy = { regularPrice: 'desc' };
  } else if (sort === 'popular') {
    orderBy = { viewsCount: 'desc' };
  }

  // If a search query is present, auto-activate any draft product that matches
  // so products added by store admins are never hidden in search
  if (cleanQuery) {
    await prisma.product.updateMany({
      where: {
        status: 'DRAFT',
        OR: [
          { title: { contains: cleanQuery } },
          { shortDescription: { contains: cleanQuery } },
          { sku: { contains: cleanQuery } },
        ],
      },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
    }).catch(() => {});
  }

  const searchTokens = cleanQuery.toLowerCase().split(/\s+/).filter(Boolean);

  // Helper to build token OR clauses for database query
  const buildTokenClause = (tok: string, withMode: boolean) => {
    const modeOpt = withMode ? { mode: 'insensitive' as const } : {};
    const variants = getSearchVariants(tok);
    const orList: any[] = [];

    for (const v of variants) {
      orList.push(
        { title: { contains: v, ...modeOpt } },
        { shortDescription: { contains: v, ...modeOpt } },
        { fullDescription: { contains: v, ...modeOpt } },
        { sku: { contains: v, ...modeOpt } },
        { category: { name: { contains: v, ...modeOpt } } },
        { subcategory: { name: { contains: v, ...modeOpt } } },
        { brand: { name: { contains: v, ...modeOpt } } },
        { warranty: { contains: v, ...modeOpt } },
      );
    }
    return { OR: orList };
  };

  let products: any[] = [];
  let categories: any[] = [];
  let brands: any[] = [];

  try {
    // 1. Fetch categories and brands concurrently
    const [catList, brandList] = await Promise.all([
      prisma.category.findMany({
        where: { isActive: true },
        include: {
          _count: {
            select: {
              products: { where: { status: 'PUBLISHED' } },
            },
          },
        },
        orderBy: { orderIndex: 'asc' },
      }).catch(() => []),
      prisma.brand.findMany({
        orderBy: { name: 'asc' },
      }).catch(() => []),
    ]);
    categories = catList;
    brands = brandList;

    // 2. Fetch products with search filter
    if (searchTokens.length > 0) {
      // Try querying with mode: 'insensitive' (for PostgreSQL in production)
      try {
        products = await prisma.product.findMany({
          where: {
            ...baseWhere,
            AND: searchTokens.map((tok) => buildTokenClause(tok, true)),
          },
          include: {
            category: true,
            subcategory: true,
            brand: true,
          },
          orderBy,
        });
      } catch (_) {
        // Fallback without mode: 'insensitive' (for SQLite in local development)
        products = await prisma.product.findMany({
          where: {
            ...baseWhere,
            AND: searchTokens.map((tok) => buildTokenClause(tok, false)),
          },
          include: {
            category: true,
            subcategory: true,
            brand: true,
          },
          orderBy,
        });
      }

      // 3. Fallback Smart Fuzzy & Normalization In-Memory Matcher:
      // If strict DB query returned 0 items, search all published products
      // with full tokenization, multi-word matching & punctuation normalization
      if (products.length === 0) {
        const candidates = await prisma.product.findMany({
          where: {
            status: 'PUBLISHED',
            ...(categorySlug ? { category: { slug: categorySlug } } : {}),
            ...(brandSlug ? { brand: { slug: brandSlug } } : {}),
            ...(stockOnly ? { stockStatus: 'IN_STOCK' } : {}),
            ...(featuredOnly ? { isFeatured: true } : {}),
          },
          include: {
            category: true,
            subcategory: true,
            brand: true,
          },
          orderBy,
        });

        const matched = candidates.filter((p) => {
          const haystacks = [
            p.title,
            p.shortDescription,
            p.fullDescription,
            p.sku,
            p.category?.name,
            p.subcategory?.name,
            p.brand?.name,
            p.specifications,
            p.warranty,
          ]
            .filter((s): s is string => typeof s === 'string')
            .map((s) => s.toLowerCase());

          const combinedText = haystacks.join(' ');
          const normalizedCombined = combinedText.replace(/[-_.,/\\()]/g, ' ');

          // Match if every search token or its variants are present in the searchable text
          return searchTokens.every((tok) => {
            const variants = getSearchVariants(tok).map((v) => v.toLowerCase());
            return variants.some((v) => {
              const normV = v.replace(/[-_.,/\\()]/g, '');
              return (
                combinedText.includes(v) ||
                normalizedCombined.includes(v) ||
                (normV && combinedText.includes(normV))
              );
            });
          });
        });

        if (matched.length > 0) {
          products = matched;
        }
      }

      // 4. Relevance Ranking for Search Results
      if (products.length > 1) {
        const queryLower = cleanQuery.toLowerCase();
        products.sort((a, b) => {
          const aTitle = a.title.toLowerCase();
          const bTitle = b.title.toLowerCase();
          const aExact = aTitle.includes(queryLower) ? 1 : 0;
          const bExact = bTitle.includes(queryLower) ? 1 : 0;
          if (aExact !== bExact) return bExact - aExact;

          const aSku = a.sku.toLowerCase().includes(queryLower) ? 1 : 0;
          const bSku = b.sku.toLowerCase().includes(queryLower) ? 1 : 0;
          if (aSku !== bSku) return bSku - aSku;

          return 0;
        });
      }
    } else {
      // Standard product browse (no search term)
      products = await prisma.product.findMany({
        where: baseWhere,
        include: {
          category: true,
          subcategory: true,
          brand: true,
        },
        orderBy,
      });
    }
  } catch (err) {
    console.error('Products query error:', err);
    products = [];
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumb & Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
          <Link href="/" className="hover:text-brand-600">Home</Link>
          <span>/</span>
          <span className="text-slate-800 font-semibold">Products Marketplace</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
              Electronics, Networking &amp; IoT Marketplace
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Browse genuine routers, surveillance cameras, laptops, smart home devices, and components in Surkhet.
            </p>
          </div>
          <div className="text-xs text-slate-500 font-medium">
            Showing <span className="font-bold text-navy-900 font-mono">{products.length}</span> verified items
          </div>
        </div>
      </div>

      {/* Main Grid: Sidebar Filters + Products Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Filters Sidebar */}
        <aside className="lg:col-span-3 space-y-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-sm font-bold text-navy-900">
                <SlidersHorizontal className="w-4 h-4 text-brand-500" />
                <span>Filters</span>
              </div>
              {(cleanQuery || categorySlug || brandSlug || stockOnly || featuredOnly) && (
                <Link
                  href="/products"
                  className="text-xs font-semibold text-brand-600 hover:underline"
                >
                  Clear all
                </Link>
              )}
            </div>

            {/* Category Filter */}
            <div>
              <h3 className="text-xs font-bold text-navy-900 uppercase tracking-wider mb-2.5">
                Categories
              </h3>
              <div className="space-y-1 text-xs">
                <Link
                  href={`/products?${new URLSearchParams({ ...(cleanQuery ? { q: cleanQuery } : {}), ...(brandSlug ? { brand: brandSlug } : {}) }).toString()}`}
                  className={`flex items-center justify-between py-1.5 px-2 rounded-md ${
                    !categorySlug ? 'bg-brand-50 text-brand-600 font-bold' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span>All Categories</span>
                </Link>
                {categories.map((c) => (
                  <Link
                    key={c.id}
                    href={`/products?${new URLSearchParams({
                      ...(cleanQuery ? { q: cleanQuery } : {}),
                      category: c.slug,
                      ...(brandSlug ? { brand: brandSlug } : {}),
                    }).toString()}`}
                    className={`flex items-center justify-between py-1.5 px-2 rounded-md ${
                      categorySlug === c.slug
                        ? 'bg-brand-50 text-brand-600 font-bold'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>{c.name}</span>
                    <span className="text-[11px] text-slate-400 font-mono">({c._count?.products ?? 0})</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Brand Filter */}
            <div className="border-t border-slate-100 pt-4">
              <h3 className="text-xs font-bold text-navy-900 uppercase tracking-wider mb-2.5">
                Brands
              </h3>
              <div className="space-y-1 text-xs max-h-48 overflow-y-auto pr-1">
                <Link
                  href={`/products?${new URLSearchParams({ ...(cleanQuery ? { q: cleanQuery } : {}), ...(categorySlug ? { category: categorySlug } : {}) }).toString()}`}
                  className={`flex items-center justify-between py-1.5 px-2 rounded-md ${
                    !brandSlug ? 'bg-brand-50 text-brand-600 font-bold' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span>All Brands</span>
                </Link>
                {brands.map((b) => (
                  <Link
                    key={b.id}
                    href={`/products?${new URLSearchParams({
                      ...(cleanQuery ? { q: cleanQuery } : {}),
                      ...(categorySlug ? { category: categorySlug } : {}),
                      brand: b.slug,
                    }).toString()}`}
                    className={`flex items-center justify-between py-1.5 px-2 rounded-md ${
                      brandSlug === b.slug
                        ? 'bg-brand-50 text-brand-600 font-bold'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>{b.name}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Quick stock toggle */}
            <div className="border-t border-slate-100 pt-4 text-xs">
              <h3 className="text-xs font-bold text-navy-900 uppercase tracking-wider mb-2.5">
                Availability
              </h3>
              <Link
                href={`/products?${new URLSearchParams({
                  ...(cleanQuery ? { q: cleanQuery } : {}),
                  ...(categorySlug ? { category: categorySlug } : {}),
                  ...(brandSlug ? { brand: brandSlug } : {}),
                  stock: stockOnly ? '' : 'in_stock',
                }).toString()}`}
                className={`flex items-center gap-2 py-1.5 px-2 rounded-md ${
                  stockOnly ? 'bg-brand-50 text-brand-600 font-bold' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={stockOnly}
                  readOnly
                  className="rounded text-brand-600 focus:ring-brand-500"
                />
                <span>In Stock Only</span>
              </Link>
            </div>
          </div>
        </aside>

        {/* Products Grid */}
        <main className="lg:col-span-9 space-y-6">
          {/* Active Search & Sort bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-600 w-full sm:w-auto">
              {cleanQuery ? (
                <span>
                  Results for &ldquo;<span className="font-bold text-navy-900">{cleanQuery}</span>&rdquo;
                </span>
              ) : (
                <span>All active product listings</span>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end text-xs">
              <span className="text-slate-500">Sort by:</span>
              <div className="flex gap-1">
                <Link
                  href={`/products?${new URLSearchParams({ ...(cleanQuery ? { q: cleanQuery } : {}), ...(categorySlug ? { category: categorySlug } : {}), ...(brandSlug ? { brand: brandSlug } : {}), sort: 'newest' }).toString()}`}
                  className={`px-2.5 py-1 rounded text-xs font-medium ${
                    sort === 'newest' ? 'bg-navy-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Newest
                </Link>
                <Link
                  href={`/products?${new URLSearchParams({ ...(cleanQuery ? { q: cleanQuery } : {}), ...(categorySlug ? { category: categorySlug } : {}), ...(brandSlug ? { brand: brandSlug } : {}), sort: 'price_asc' }).toString()}`}
                  className={`px-2.5 py-1 rounded text-xs font-medium ${
                    sort === 'price_asc' ? 'bg-navy-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Price: Low &uarr;
                </Link>
                <Link
                  href={`/products?${new URLSearchParams({ ...(cleanQuery ? { q: cleanQuery } : {}), ...(categorySlug ? { category: categorySlug } : {}), ...(brandSlug ? { brand: brandSlug } : {}), sort: 'price_desc' }).toString()}`}
                  className={`px-2.5 py-1 rounded text-xs font-medium ${
                    sort === 'price_desc' ? 'bg-navy-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Price: High &darr;
                </Link>
              </div>
            </div>
          </div>

          {/* Product Cards Grid */}
          {products.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-navy-900">No products match your criteria</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Try loosening your filters or search keywords. You can also contact our store directly for specific parts or custom orders.
              </p>
              <div>
                <Link
                  href="/products"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-navy-900 text-white rounded-lg text-xs font-semibold hover:bg-brand-600 transition"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Reset All Filters</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product as any} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
