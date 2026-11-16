import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import ProductCard from '@/components/public/ProductCard';
import { formatNPR } from '@/lib/formatters';
import { generateProductSeo } from '@/lib/seo/product-seo';
import { 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  MapPin, 
  MessageSquare, 
  Phone, 
  ArrowLeft,
  Truck,
  RotateCcw,
  Tag,
  Home,
  ChevronRight,
  Sparkles,
  Award,
  Layers,
  Clock,
  Zap,
  Check
} from 'lucide-react';
import type { Metadata } from 'next';

export const revalidate = 60;

interface ProductDetailPageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: ProductDetailPageProps): Promise<Metadata> {
  let product: any = await prisma.product.findUnique({
    where: { slug: params.slug },
    include: { brand: true, category: true, subcategory: true },
  }).catch(() => null);

  if (!product) {
    try {
      const manifest = require('@/business/krishna-electronics/data.json');
      const cp = (manifest.products || []).find((p: any) => p.slug === params.slug);
      if (cp && cp.status === 'PUBLISHED') {
        product = {
          ...cp,
          brand: cp.brandSlug ? { name: (manifest.brands || []).find((b: any) => b.slug === cp.brandSlug)?.name || cp.brandSlug } : null,
          category: { name: (manifest.categories || []).find((c: any) => c.slug === cp.categorySlug)?.name || cp.categorySlug },
        };
      }
    } catch (_) {}
  }

  if (!product) {
    return { title: 'Product Not Found | Krishna Electronics' };
  }

  const siteUrl = 'https://krishnaelectronics.com.np';
  const seo = generateProductSeo({
    title: product.title,
    brandName: product.brand?.name,
    categoryName: product.category?.name,
    subcategoryName: (product as any).subcategory?.name,
    regularPrice: product.regularPrice,
    offerPrice: product.offerPrice,
    specifications: product.specifications,
    warranty: product.warranty,
    shortDescription: product.shortDescription,
  });

  const title = (product as any).metaTitle || seo.metaTitle;
  const description = (product as any).metaDescription || seo.metaDescription;
  const keywords = (product as any).seoKeywords
    ? (product as any).seoKeywords.split(',').map((s: string) => s.trim()).filter(Boolean)
    : seo.keywordsList;

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: `${siteUrl}/products/${product.slug}`,
    },
    openGraph: {
      title,
      description,
      url: `${siteUrl}/products/${product.slug}`,
      siteName: 'Krishna Electronics Order & Suppliers',
      images: [
        {
          url: product.primaryImage,
          width: 800,
          height: 800,
          alt: product.title,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [product.primaryImage],
    },
  };
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  let product: any = await prisma.product.findUnique({
    where: { slug: params.slug },
    include: {
      category: true,
      subcategory: true,
      brand: true,
    },
  }).catch(() => null);

  // Resilient canonical manifest fallback
  if (!product) {
    try {
      const manifest = require('@/business/krishna-electronics/data.json');
      const cp = (manifest.products || []).find((p: any) => p.slug === params.slug);
      if (cp && cp.status === 'PUBLISHED') {
        const catMap = new Map((manifest.categories || []).map((c: any) => [c.slug, c]));
        const brandMap = new Map((manifest.brands || []).map((b: any) => [b.slug, b]));
        product = {
          ...cp,
          id: cp.sku ? `prod-${cp.sku}` : cp.slug,
          categoryId: cp.categorySlug,
          brandId: cp.brandSlug,
          category: catMap.get(cp.categorySlug) || {
            id: cp.categorySlug,
            name: cp.categorySlug,
            slug: cp.categorySlug,
          },
          brand: brandMap.get(cp.brandSlug) || (cp.brandSlug ? {
            id: cp.brandSlug,
            name: cp.brandSlug,
            slug: cp.brandSlug,
          } : null),
          subcategory: null,
          specifications: typeof cp.specifications === 'string' ? cp.specifications : JSON.stringify(cp.specifications || []),
          gallery: typeof cp.gallery === 'string' ? cp.gallery : JSON.stringify(cp.gallery || []),
          viewsCount: 25,
        };
      }
    } catch (_) {}
  }

  if (!product || product.status !== 'PUBLISHED') {
    notFound();
  }

  // Increment views count asynchronously
  prisma.product.update({
    where: { id: product.id },
    data: { viewsCount: { increment: 1 } },
  }).catch(() => {});

  // Fetch related products in same category
  let relatedProducts: any[] = [];
  try {
    relatedProducts = await prisma.product.findMany({
      where: {
        categoryId: product.categoryId,
        id: { not: product.id },
        status: 'PUBLISHED',
      },
      include: {
        category: true,
        subcategory: true,
        brand: true,
      },
      take: 4,
    });
  } catch {
    try {
      const manifest = require('@/business/krishna-electronics/data.json');
      relatedProducts = (manifest.products || [])
        .filter((p: any) => p.categorySlug === product.categoryId && p.slug !== product.slug && p.status === 'PUBLISHED')
        .slice(0, 4);
    } catch (_) {
      relatedProducts = [];
    }
  }

  // Fetch settings for contact / WhatsApp
  const settings = await prisma.setting.findUnique({
    where: { id: 'site-settings' },
  }).catch(() => null);

  // Parse specifications
  let specifications: Array<{ name: string; value: string }> = [];
  try {
    specifications = JSON.parse(product.specifications || '[]');
  } catch {
    specifications = [];
  }

  const isDiscounted = Boolean(product.offerPrice && product.offerPrice < product.regularPrice);
  const currentPrice = isDiscounted ? (product.offerPrice as number) : product.regularPrice;
  const savings = isDiscounted ? product.regularPrice - (product.offerPrice as number) : 0;
  const whatsappNumber = settings?.contactWhatsapp || '9858083951';
  const storePhone = settings?.contactPhone || '083-522006';

  const whatsappMessage = encodeURIComponent(
    `Hello Krishna Electronics, I am interested in purchasing/inquiring about: ${product.title} (SKU: ${product.sku || 'N/A'}) listed for NPR ${currentPrice}. Please provide availability and payment details.`
  );

  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    image: [product.primaryImage],
    description: product.shortDescription || product.fullDescription,
    sku: product.sku,
    mpn: product.sku,
    brand: {
      '@type': 'Brand',
      name: product.brand?.name || 'Krishna Electronics',
    },
    category: product.category?.name,
    offers: {
      '@type': 'Offer',
      url: `https://krishnaelectronics.com.np/products/${product.slug}`,
      priceCurrency: 'NPR',
      price: product.offerPrice || product.regularPrice,
      priceValidUntil: '2027-12-31',
      itemCondition: 'https://schema.org/NewCondition',
      availability: product.stockStatus === 'OUT_OF_STOCK'
        ? 'https://schema.org/OutOfStock'
        : 'https://schema.org/InStock',
      seller: {
        '@type': 'Organization',
        name: 'Krishna Electronics Order & Suppliers',
        telephone: storePhone || '083-522006',
        address: {
          '@type': 'PostalAddress',
          streetAddress: 'Birendranagar',
          addressLocality: 'Surkhet',
          addressRegion: 'Karnali Province',
          addressCountry: 'NP',
        },
      },
    },
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://krishnaelectronics.com.np',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: product.category?.name || 'Products',
        item: `https://krishnaelectronics.com.np/products?category=${product.category?.slug || ''}`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: product.title,
        item: `https://krishnaelectronics.com.np/products/${product.slug}`,
      },
    ],
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      {/* 1. Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-slate-500 mb-6 flex-wrap" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-brand-600 flex items-center gap-1">
          <Home className="w-3.5 h-3.5" />
          <span>Home</span>
        </Link>
        <ChevronRight className="w-3 h-3 text-slate-400" />
        <Link href="/products" className="hover:text-brand-600">
          Products
        </Link>
        {product.category && (
          <>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <Link href={`/products?category=${product.category.slug}`} className="hover:text-brand-600">
              {product.category.name}
            </Link>
          </>
        )}
        <ChevronRight className="w-3 h-3 text-slate-400" />
        <span className="text-slate-800 font-bold truncate max-w-xs">{product.title}</span>
      </nav>

      {/* 2. Main Product Showcase Block */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 lg:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Left: Product Image Canvas & Quick Assurance Badges */}
        <div className="lg:col-span-5 space-y-4">
          <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-gradient-to-b from-slate-50 to-white border border-slate-200/90 p-8 flex items-center justify-center">
            {/* Badges on Image */}
            <div className="absolute top-4 left-4 z-10 flex flex-col gap-1.5">
              {isDiscounted && product.discountPercent && (
                <span className="px-3 py-1 bg-red-600 text-white text-[11px] font-extrabold uppercase tracking-wider rounded-lg shadow-sm">
                  {product.discountPercent}% OFF
                </span>
              )}
              {product.isFeatured && (
                <span className="px-2.5 py-0.5 bg-brand-600 text-white text-[10px] font-bold rounded-md shadow-sm">
                  FEATURED
                </span>
              )}
            </div>

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={product.primaryImage}
              alt={product.title}
              className="w-full h-full object-contain hover:scale-105 transition-transform duration-500 ease-out"
              loading="eager"
            />
          </div>

          {/* Quick Assurance Strip */}
          <div className="grid grid-cols-3 gap-2.5 text-center text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-col items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-brand-600" />
              <span className="font-bold text-navy-900 text-[11px]">100% Genuine</span>
              <span className="text-[10px] text-slate-400 truncate">{product.brand?.name || 'Authorized'}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-col items-center gap-1">
              <Truck className="w-4 h-4 text-brand-600" />
              <span className="font-bold text-navy-900 text-[11px]">Surkhet Valley</span>
              <span className="text-[10px] text-slate-400">Fast Dispatch</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-col items-center gap-1">
              <RotateCcw className="w-4 h-4 text-brand-600" />
              <span className="font-bold text-navy-900 text-[11px]">Store Pickup</span>
              <span className="text-[10px] text-slate-400">Buddhapath</span>
            </div>
          </div>
        </div>

        {/* Right: Product Details & Purchase Actions */}
        <div className="lg:col-span-7 flex flex-col justify-between">
          <div>
            {/* Brand, SKU & Stock Status Row */}
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              {product.brand && (
                <span className="px-3 py-1 bg-brand-50 text-brand-600 rounded-lg text-xs font-extrabold uppercase tracking-wider border border-brand-100">
                  {product.brand.name}
                </span>
              )}

              {product.sku && (
                <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-mono font-medium">
                  SKU: {product.sku}
                </span>
              )}

              {product.stockStatus === 'IN_STOCK' ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>In Stock ({product.stockQuantity ?? 10} available)</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 rounded-lg text-xs font-bold border border-amber-200">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Limited Stock / On Order</span>
                </span>
              )}
            </div>

            {/* Product Title */}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-navy-900 tracking-tight leading-tight">
              {product.title}
            </h1>

            {/* Verified Auth Badge */}
            <div className="flex items-center gap-2 mt-2.5 text-xs text-slate-500">
              <div className="flex items-center text-amber-500">
                {'★'.repeat(5)}
              </div>
              <span className="font-medium text-slate-600">Official Brand Certified</span>
              <span>•</span>
              <span className="text-slate-400 font-mono">Surkhet Tech Hub</span>
            </div>

            {/* High-Impact Price Showcase */}
            <div className="mt-5 p-5 rounded-2xl bg-slate-50 border border-slate-200/90 flex flex-col sm:flex-row sm:items-baseline justify-between gap-3">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl sm:text-4xl font-black text-navy-900 font-mono tracking-tight">
                  {formatNPR(currentPrice)}
                </span>
                {isDiscounted && (
                  <>
                    <span className="text-lg text-slate-400 line-through font-mono">
                      {formatNPR(product.regularPrice)}
                    </span>
                    <span className="px-2.5 py-0.5 bg-red-100 text-red-700 text-xs font-extrabold rounded-md">
                      Save {formatNPR(savings)} ({product.discountPercent}%)
                    </span>
                  </>
                )}
              </div>
              <span className="text-xs text-slate-400 font-medium">
                Transparent Price (NPR रु)
              </span>
            </div>

            {/* Short Description */}
            {product.shortDescription && (
              <p className="mt-4 text-sm text-slate-600 leading-relaxed">
                {product.shortDescription}
              </p>
            )}

            {/* Warranty Coverage Banner */}
            {product.warranty && (
              <div className="mt-4 flex items-center gap-2.5 p-3.5 bg-brand-50/60 border border-brand-100 rounded-xl text-xs text-navy-900">
                <ShieldCheck className="w-4 h-4 text-brand-600 shrink-0" />
                <span>
                  <strong className="font-bold">Official Warranty Coverage:</strong> {product.warranty}
                </span>
              </div>
            )}
          </div>

          {/* Action CTAs */}
          <div className="pt-6 mt-6 border-t border-slate-100 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {whatsappNumber ? (
                <a
                  href={`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${whatsappMessage}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-6 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-extrabold text-sm uppercase tracking-wider transition shadow-lg shadow-emerald-600/25 active:scale-[0.98]"
                >
                  <MessageSquare className="w-5 h-5" />
                  <span>Order via WhatsApp</span>
                </a>
              ) : (
                <Link
                  href={`/contact?inquiry=${encodeURIComponent(product.title)}&sku=${product.sku}`}
                  className="inline-flex items-center justify-center gap-2 px-6 py-4 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-extrabold text-sm uppercase tracking-wider transition shadow-lg shadow-brand-600/25"
                >
                  <MessageSquare className="w-5 h-5" />
                  <span>Request Quotation</span>
                </Link>
              )}

              <a
                href={`tel:${storePhone}`}
                className="inline-flex items-center justify-center gap-2 px-6 py-4 bg-navy-950 hover:bg-navy-900 text-white rounded-xl font-bold text-sm tracking-wide transition shadow-md active:scale-[0.98]"
              >
                <Phone className="w-4 h-4 text-cyan-accent" />
                <span>Call Store Desk</span>
              </a>
            </div>

            <div className="flex items-center justify-center gap-2 text-xs text-slate-500 pt-1">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Direct store pickup at Buddhapath, Surkhet or scheduled local delivery across Karnali Province.</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Specifications & Detailed Overview */}
      <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          {/* Specifications Table */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-2 text-lg font-black text-navy-900 mb-5 pb-3 border-b border-slate-100">
              <Zap className="w-5 h-5 text-brand-600" />
              <h2>Technical Specifications</h2>
            </div>

            {specifications.length === 0 ? (
              <p className="text-xs text-slate-500">Structured specifications available upon inquiry.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {specifications.map((item, idx) => (
                  <div key={idx} className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex flex-col justify-center">
                    <span className="font-bold text-slate-400 text-[10px] uppercase tracking-wider">
                      {item.name}
                    </span>
                    <span className="font-semibold text-navy-900 mt-0.5 text-xs">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Full Overview Description */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-2 text-lg font-black text-navy-900 mb-5 pb-3 border-b border-slate-100">
              <Layers className="w-5 h-5 text-brand-600" />
              <h2>Product Overview &amp; Description</h2>
            </div>
            <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-line space-y-3">
              {product.fullDescription}
            </div>
          </div>
        </div>

        {/* Right Sidebar: Store Information & Related Hardware */}
        <div className="lg:col-span-4 space-y-6">
          {/* Store Facility Info Card */}
          <div className="bg-[#0B132B] text-white p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4 text-xs">
            <h3 className="font-black text-xs text-cyan-accent uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-accent" />
              <span>Surkhet Facility Support</span>
            </h3>
            <div className="space-y-3 text-slate-300">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-cyan-accent shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-white">Physical Store &amp; Lab</div>
                  <div className="text-slate-400 text-[11px]">Birendranagar, Surkhet, Nepal</div>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-cyan-accent shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-white">Operating Hours</div>
                  <div className="text-slate-400 text-[11px]">Sun – Fri: 9:30 AM – 6:30 PM</div>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-cyan-accent shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-white">Direct Warranty Support</div>
                  <div className="text-slate-400 text-[11px]">Authorized manufacturer replacements</div>
                </div>
              </div>
            </div>
          </div>

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
              <h3 className="font-extrabold text-sm text-navy-900 pb-3 border-b border-slate-100 flex items-center justify-between">
                <span>Related Equipment</span>
                <span className="text-[11px] font-normal text-slate-400">{relatedProducts.length} items</span>
              </h3>
              <div className="space-y-3">
                {relatedProducts.map((rp) => (
                  <Link
                    key={rp.id || rp.slug}
                    href={`/products/${rp.slug}`}
                    className="flex items-center gap-3 p-2 rounded-2xl hover:bg-slate-50 transition-colors group"
                  >
                    <div className="w-14 h-14 rounded-xl bg-slate-50 border border-slate-200/80 overflow-hidden shrink-0 p-1 flex items-center justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={rp.primaryImage} alt={rp.title} className="w-full h-full object-contain group-hover:scale-105 transition-transform" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-xs text-navy-900 group-hover:text-brand-600 transition line-clamp-1">
                        {rp.title}
                      </h4>
                      <div className="text-xs font-mono font-bold text-navy-900 mt-0.5">
                        {formatNPR(rp.offerPrice || rp.regularPrice)}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. Mobile Sticky Bottom Action Bar (One-Thumb Reach) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 p-3 shadow-2xl flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[10px] text-slate-400 truncate max-w-[140px] font-medium">{product.title}</div>
          <div className="text-base font-extrabold text-navy-900 font-mono leading-tight">{formatNPR(currentPrice)}</div>
        </div>

        <div className="flex items-center gap-2">
          {whatsappNumber && (
            <a
              href={`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${whatsappMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-md"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Inquire</span>
            </a>
          )}
          <a
            href={`tel:${storePhone}`}
            className="p-2.5 bg-navy-950 text-white rounded-xl"
            title="Call Store"
          >
            <Phone className="w-4 h-4 text-cyan-accent" />
          </a>
        </div>
      </div>
    </div>
  );
}
