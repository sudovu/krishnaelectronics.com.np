import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import ProductCard from '@/components/public/ProductCard';
import { 
  Filter, 
  Search, 
  SlidersHorizontal, 
  ArrowLeft, 
  X, 
  Home, 
  ChevronRight, 
  Layers, 
  ShieldCheck, 
  CheckCircle2,
  Sparkles,
  ArrowUpDown,
  MessageSquare
} from 'lucide-react';
import type { Metadata } from 'next';

export const revalidate = 30;

export async function generateMetadata({ searchParams }: ProductsPageProps): Promise<Metadata> {
  const q = searchParams.q?.trim();
  const cat = searchParams.category;
  
  let title = 'Electronics & IT Products Catalog | Krishna Electronics Surkhet';
  let description = 'Shop genuine laptops, Wi-Fi 6 routers, CCTV surveillance cameras, toner cartridges, IoT relays & accessories in Birendranagar, Surkhet. Verified brand warranties & fast Karnali delivery.';
  
  if (q) {
    title = `"${q}" Price in Surkhet, Nepal | Krishna Electronics`;
    description = `Buy genuine ${q} in Surkhet at lowest NPR rates. In-stock hardware, official warranty, and on-site support from Krishna Electronics Order & Suppliers.`;
  } else if (cat) {
    const formattedCat = cat.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    title = `${formattedCat} Price in Surkhet, Nepal | Krishna Electronics`;
    description = `Browse official ${formattedCat} in Surkhet, Karnali Province. Genuine products with warranty from Krishna Electronics Order & Suppliers.`;
  }

  return {
    title,
    description,
    keywords: [
      'electronics catalog surkhet',
      'buy electronics in surkhet',
      'computer store birendranagar',
      'laptops price in surkhet',
      'wi-fi routers surkhet',
      'cctv camera price surkhet',
      'toner cartridge in surkhet',
      'Krishna Electronics products',
      'इलेक्ट्रोनिक्स पसल सुर्खेत',
    ],
    openGraph: {
      title,
      description,
      url: 'https://krishnaelectronics.com.np/products',
      images: [{ url: 'https://krishnaelectronics.com.np/images/logo.png', width: 1600, height: 1600 }],
    },
  };
}

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
      orList.push({ title: { contains: v, ...modeOpt } });
      orList.push({ shortDescription: { contains: v, ...modeOpt } });
      orList.push({ fullDescription: { contains: v, ...modeOpt } });
      orList.push({ sku: { contains: v, ...modeOpt } });
      orList.push({ category: { name: { contains: v, ...modeOpt } } });
      orList.push({ brand: { name: { contains: v, ...modeOpt } } });
    }
    return orList;
  };

  let products: any[] = [];
  let categories: any[] = [];
  let brands: any[] = [];

  try {
    // 1. Fetch Categories for sidebar
    categories = await prisma.category.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: {
            products: {
              where: { status: 'PUBLISHED' },
            },
          },
        },
      },
      orderBy: { orderIndex: 'asc' },
    });

    // 2. Fetch Popular Brands for sidebar
    brands = await prisma.brand.findMany({
      where: { isPopular: true },
      orderBy: { name: 'asc' },
    });

    // 3. Search or Browse Products
    if (searchTokens.length > 0) {
      let results: any[] = [];
      try {
        const andClauses = searchTokens.map((tok) => ({
          OR: buildTokenClause(tok, true),
        }));
        results = await prisma.product.findMany({
          where: {
            ...baseWhere,
            AND: andClauses,
          },
          include: {
            category: true,
            subcategory: true,
            brand: true,
          },
          orderBy,
        });
      } catch {
        const andClauses = searchTokens.map((tok) => ({
          OR: buildTokenClause(tok, false),
        }));
        results = await prisma.product.findMany({
          where: {
            ...baseWhere,
            AND: andClauses,
          },
          include: {
            category: true,
            subcategory: true,
            brand: true,
          },
          orderBy,
        });
      }
      products = results;

      // Score-based sorting for exact matches
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
    console.error('Notice: Products query fallback activated:', err);
    try {
      const manifest = require('@/business/krishna-electronics/data.json');
      const catMap = new Map((manifest.categories || []).map((c: any) => [c.slug, c]));
      const brandMap = new Map((manifest.brands || []).map((b: any) => [b.slug, b]));
      
      let canonicalList = (manifest.products || []).filter((p: any) => p.status === 'PUBLISHED');
      if (categorySlug) {
        canonicalList = canonicalList.filter((p: any) => p.categorySlug === categorySlug);
      }
      if (brandSlug) {
        canonicalList = canonicalList.filter((p: any) => p.brandSlug === brandSlug);
      }
      if (stockOnly) {
        canonicalList = canonicalList.filter((p: any) => p.stockStatus === 'IN_STOCK');
      }
      if (featuredOnly) {
        canonicalList = canonicalList.filter((p: any) => p.isFeatured);
      }
      if (cleanQuery) {
        const ql = cleanQuery.toLowerCase();
        canonicalList = canonicalList.filter((p: any) => 
          p.title?.toLowerCase().includes(ql) || 
          p.sku?.toLowerCase().includes(ql) || 
          p.shortDescription?.toLowerCase().includes(ql)
        );
      }

      products = canonicalList.map((p: any, idx: number) => ({
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
        createdAt: new Date(),
        category: catMap.get(p.categorySlug) || { name: p.categorySlug, slug: p.categorySlug },
        brand: brandMap.get(p.brandSlug) || (p.brandSlug ? { name: p.brandSlug, slug: p.brandSlug } : null),
      }));

      if (categories.length === 0) {
        categories = (manifest.categories || []).map((c: any) => ({
          id: c.slug,
          name: c.name,
          slug: c.slug,
          icon: c.icon,
          _count: {
            products: (manifest.products || []).filter((p: any) => p.categorySlug === c.slug && p.status === 'PUBLISHED').length,
          },
        }));
      }

      if (brands.length === 0) {
        brands = (manifest.brands || []).map((b: any) => ({
          id: b.slug,
          name: b.name,
          slug: b.slug,
          isPopular: b.isPopular,
        }));
      }
    } catch (_) {
      products = [];
    }
  }

  // Active filters helper
  const hasActiveFilters = Boolean(cleanQuery || categorySlug || brandSlug || stockOnly || featuredOnly);

  // Active category/brand display names
  const activeCategory = categories.find((c) => c.slug === categorySlug);
  const activeBrand = brands.find((b) => b.slug === brandSlug);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:py-12">
      {/* 1. Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs text-slate-500 mb-4" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-brand-600 flex items-center gap-1">
          <Home className="w-3.5 h-3.5" />
          <span>Home</span>
        </Link>
        <ChevronRight className="w-3 h-3 text-slate-400" />
        <Link href="/products" className={categorySlug ? 'hover:text-brand-600' : 'text-slate-800 font-bold'}>
          Products Marketplace
        </Link>
        {activeCategory && (
          <>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span className="text-slate-800 font-bold">{activeCategory.name}</span>
          </>
        )}
      </nav>

      {/* 2. Page Header Banner */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 pb-6 border-b border-slate-200/80">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-600 bg-brand-50 px-3 py-1 rounded-full mb-2 border border-brand-100">
            <Layers className="w-3.5 h-3.5" />
            <span>Official Hardware Marketplace • Surkhet</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-navy-900 tracking-tight">
            {activeCategory ? activeCategory.name : 'Electronics, Networking & IT Hardware'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            {activeCategory 
              ? `Browse authentic ${activeCategory.name} available for direct pickup or local delivery in Surkhet.`
              : 'Browse genuine Wi-Fi 6 routers, surveillance cameras, business laptops, IoT smart relays, and printer toners with official warranty.'}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-slate-500">Showing</span>
          <span className="px-2.5 py-1 bg-navy-950 text-white rounded-lg text-xs font-bold font-mono">
            {products.length} Products
          </span>
        </div>
      </div>

      {/* 3. Active Filter Chips Row (if any filter is selected) */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 mb-6 p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">Active Filters:</span>

          {cleanQuery && (
            <Link
              href={`/products?${new URLSearchParams({
                ...(categorySlug ? { category: categorySlug } : {}),
                ...(brandSlug ? { brand: brandSlug } : {}),
                ...(stockOnly ? { stock: 'in_stock' } : {}),
                ...(featuredOnly ? { featured: 'true' } : {}),
                sort,
              }).toString()}`}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-300 text-xs font-semibold text-slate-800 hover:border-red-400 hover:text-red-600 transition shadow-sm"
            >
              <span>Search: &ldquo;{cleanQuery}&rdquo;</span>
              <X className="w-3 h-3 text-slate-400" />
            </Link>
          )}

          {activeCategory && (
            <Link
              href={`/products?${new URLSearchParams({
                ...(cleanQuery ? { q: cleanQuery } : {}),
                ...(brandSlug ? { brand: brandSlug } : {}),
                ...(stockOnly ? { stock: 'in_stock' } : {}),
                ...(featuredOnly ? { featured: 'true' } : {}),
                sort,
              }).toString()}`}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 border border-brand-200 text-xs font-semibold text-brand-700 hover:border-red-400 hover:text-red-600 transition shadow-sm"
            >
              <span>Category: {activeCategory.name}</span>
              <X className="w-3 h-3 text-brand-400" />
            </Link>
          )}

          {activeBrand && (
            <Link
              href={`/products?${new URLSearchParams({
                ...(cleanQuery ? { q: cleanQuery } : {}),
                ...(categorySlug ? { category: categorySlug } : {}),
                ...(stockOnly ? { stock: 'in_stock' } : {}),
                ...(featuredOnly ? { featured: 'true' } : {}),
                sort,
              }).toString()}`}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-300 text-xs font-semibold text-slate-800 hover:border-red-400 hover:text-red-600 transition shadow-sm"
            >
              <span>Brand: {activeBrand.name}</span>
              <X className="w-3 h-3 text-slate-400" />
            </Link>
          )}

          {stockOnly && (
            <Link
              href={`/products?${new URLSearchParams({
                ...(cleanQuery ? { q: cleanQuery } : {}),
                ...(categorySlug ? { category: categorySlug } : {}),
                ...(brandSlug ? { brand: brandSlug } : {}),
                ...(featuredOnly ? { featured: 'true' } : {}),
                sort,
              }).toString()}`}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-700 hover:border-red-400 hover:text-red-600 transition shadow-sm"
            >
              <span>In Stock Only</span>
              <X className="w-3 h-3 text-emerald-400" />
            </Link>
          )}

          <Link
            href="/products"
            className="text-xs font-bold text-red-600 hover:underline ml-auto"
          >
            Clear all filters
          </Link>
        </div>
      )}

      {/* 4. Main Catalog Grid (Sidebar + Products) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar Filters */}
        <aside className="lg:col-span-3 space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-6 sticky top-28">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-2 text-sm font-extrabold text-navy-900 uppercase tracking-wider">
                <SlidersHorizontal className="w-4 h-4 text-brand-600" />
                <span>Filter Catalog</span>
              </div>
              {hasActiveFilters && (
                <Link
                  href="/products"
                  className="text-xs font-bold text-brand-600 hover:underline"
                >
                  Reset
                </Link>
              )}
            </div>

            {/* Category Filter Group */}
            <div>
              <h3 className="text-xs font-bold text-navy-900 uppercase tracking-wider mb-2.5 flex items-center justify-between">
                <span>Categories</span>
              </h3>
              <div className="space-y-1 text-xs">
                <Link
                  href={`/products?${new URLSearchParams({ 
                    ...(cleanQuery ? { q: cleanQuery } : {}), 
                    ...(brandSlug ? { brand: brandSlug } : {}),
                    ...(stockOnly ? { stock: 'in_stock' } : {}),
                    sort,
                  }).toString()}`}
                  className={`flex items-center justify-between py-2 px-3 rounded-xl transition ${
                    !categorySlug 
                      ? 'bg-brand-600 text-white font-bold shadow-sm' 
                      : 'text-slate-600 hover:bg-slate-50'
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
                      ...(stockOnly ? { stock: 'in_stock' } : {}),
                      sort,
                    }).toString()}`}
                    className={`flex items-center justify-between py-2 px-3 rounded-xl transition ${
                      categorySlug === c.slug
                        ? 'bg-brand-600 text-white font-bold shadow-sm'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="truncate">{c.name}</span>
                    <span className={`text-[11px] font-mono px-1.5 py-0.2 rounded-full ${
                      categorySlug === c.slug ? 'bg-white/20 text-white' : 'text-slate-400 bg-slate-100'
                    }`}>
                      {c._count?.products ?? 0}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Brand Filter Group */}
            <div className="border-t border-slate-100 pt-5">
              <h3 className="text-xs font-bold text-navy-900 uppercase tracking-wider mb-2.5">
                Brands &amp; Partners
              </h3>
              <div className="space-y-1 text-xs max-h-56 overflow-y-auto pr-1">
                <Link
                  href={`/products?${new URLSearchParams({ 
                    ...(cleanQuery ? { q: cleanQuery } : {}), 
                    ...(categorySlug ? { category: categorySlug } : {}),
                    ...(stockOnly ? { stock: 'in_stock' } : {}),
                    sort,
                  }).toString()}`}
                  className={`flex items-center justify-between py-1.5 px-3 rounded-lg transition ${
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
                      ...(stockOnly ? { stock: 'in_stock' } : {}),
                      sort,
                    }).toString()}`}
                    className={`flex items-center justify-between py-1.5 px-3 rounded-lg transition ${
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

            {/* Availability Filter */}
            <div className="border-t border-slate-100 pt-5">
              <h3 className="text-xs font-bold text-navy-900 uppercase tracking-wider mb-2.5">
                Stock Status
              </h3>
              <Link
                href={`/products?${new URLSearchParams({
                  ...(cleanQuery ? { q: cleanQuery } : {}),
                  ...(categorySlug ? { category: categorySlug } : {}),
                  ...(brandSlug ? { brand: brandSlug } : {}),
                  stock: stockOnly ? '' : 'in_stock',
                  sort,
                }).toString()}`}
                className={`flex items-center gap-2.5 py-2 px-3 rounded-xl transition text-xs ${
                  stockOnly ? 'bg-emerald-50 text-emerald-700 font-bold border border-emerald-200' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className={`w-4 h-4 rounded border flex items-center justify-center ${stockOnly ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300'}`}>
                  {stockOnly && <CheckCircle2 className="w-3.5 h-3.5" />}
                </div>
                <span>In Stock Only</span>
              </Link>
            </div>

            {/* Quick Contact & Custom Order Card */}
            <div className="border-t border-slate-100 pt-5 bg-gradient-to-br from-slate-50 to-brand-50/30 p-4 rounded-xl border border-brand-100/50">
              <div className="text-xs font-bold text-navy-900 mb-1 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-brand-600" />
                <span>Need a specific part?</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed mb-3">
                Can&apos;t find your exact router, battery, or screen? We procure hardware on request across Nepal.
              </p>
              <a
                href="https://wa.me/9779858083951?text=Hello%20Krishna%20Electronics,%20I%20am%20looking%20for%20a%20specific%20product%20in%20Surkhet."
                target="_blank"
                rel="noopener noreferrer"
                className="block text-center py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition shadow-sm"
              >
                Inquire on WhatsApp
              </a>
            </div>
          </div>
        </aside>

        {/* Product Cards Grid & Sorting Bar */}
        <main className="lg:col-span-9 space-y-6">
          {/* Active Search & Sort Bar */}
          <div className="bg-white p-4 sm:p-4.5 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-600 w-full sm:w-auto">
              {cleanQuery ? (
                <span>
                  Showing results matching <span className="font-extrabold text-navy-900 font-mono">&ldquo;{cleanQuery}&rdquo;</span>
                </span>
              ) : (
                <span className="font-medium text-slate-500">
                  Showing all published catalog listings
                </span>
              )}
            </div>

            {/* Sort Options */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end text-xs">
              <span className="text-slate-400 font-medium flex items-center gap-1">
                <ArrowUpDown className="w-3.5 h-3.5" />
                <span>Sort:</span>
              </span>
              <div className="flex flex-wrap gap-1">
                <Link
                  href={`/products?${new URLSearchParams({ 
                    ...(cleanQuery ? { q: cleanQuery } : {}), 
                    ...(categorySlug ? { category: categorySlug } : {}), 
                    ...(brandSlug ? { brand: brandSlug } : {}),
                    ...(stockOnly ? { stock: 'in_stock' } : {}),
                    sort: 'newest' 
                  }).toString()}`}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    sort === 'newest' 
                      ? 'bg-navy-950 text-white shadow-sm' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Newest
                </Link>
                <Link
                  href={`/products?${new URLSearchParams({ 
                    ...(cleanQuery ? { q: cleanQuery } : {}), 
                    ...(categorySlug ? { category: categorySlug } : {}), 
                    ...(brandSlug ? { brand: brandSlug } : {}),
                    ...(stockOnly ? { stock: 'in_stock' } : {}),
                    sort: 'price_asc' 
                  }).toString()}`}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    sort === 'price_asc' 
                      ? 'bg-navy-950 text-white shadow-sm' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Price: Low &uarr;
                </Link>
                <Link
                  href={`/products?${new URLSearchParams({ 
                    ...(cleanQuery ? { q: cleanQuery } : {}), 
                    ...(categorySlug ? { category: categorySlug } : {}), 
                    ...(brandSlug ? { brand: brandSlug } : {}),
                    ...(stockOnly ? { stock: 'in_stock' } : {}),
                    sort: 'price_desc' 
                  }).toString()}`}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    sort === 'price_desc' 
                      ? 'bg-navy-950 text-white shadow-sm' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Price: High &darr;
                </Link>
              </div>
            </div>
          </div>

          {/* Product Cards Grid */}
          {products.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200/90 p-12 sm:p-16 text-center space-y-4 shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center border border-slate-200">
                <Search className="w-8 h-8" />
              </div>
              <h3 className="font-extrabold text-lg text-navy-900">No matching products found</h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                We could not find products matching your current query or filters. Try searching by generic term (e.g. &ldquo;router&rdquo;, &ldquo;toner&rdquo;, &ldquo;cord&rdquo;) or reset your filters.
              </p>
              <div className="pt-2">
                <Link
                  href="/products"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-brand-500/20"
                >
                  <ArrowLeft className="w-4 h-4" />
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
