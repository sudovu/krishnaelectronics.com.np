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
  Tag
} from 'lucide-react';
import type { Metadata } from 'next';

export const revalidate = 60;

interface ProductDetailPageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: ProductDetailPageProps): Promise<Metadata> {
  const product = await prisma.product.findUnique({
    where: { slug: params.slug },
    include: { brand: true, category: true, subcategory: true },
  });

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
  const product = await prisma.product.findUnique({
    where: { slug: params.slug },
    include: {
      category: true,
      subcategory: true,
      brand: true,
    },
  });

  if (!product || product.status !== 'PUBLISHED') {
    notFound();
  }

  // Increment views count asynchronously
  prisma.product.update({
    where: { id: product.id },
    data: { viewsCount: { increment: 1 } },
  }).catch(() => {});

  // Fetch related products in same category
  const relatedProducts = await prisma.product.findMany({
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
    take: 3,
  }).catch(() => []);

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

  const isDiscounted = product.offerPrice && product.offerPrice < product.regularPrice;
  const currentPrice = isDiscounted ? product.offerPrice : product.regularPrice;
  const whatsappNumber = settings?.contactWhatsapp || '';
  const storePhone = settings?.contactPhone || '';

  const whatsappMessage = encodeURIComponent(
    `Hello Krishna Electronics, I am interested in purchasing/inquiring about: ${product.title} (SKU: ${product.sku}) listed for NPR ${currentPrice}. Please provide availability and payment details.`
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
    <div className="max-w-7xl mx-auto px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500 mb-6 flex-wrap">
        <Link href="/" className="hover:text-brand-600">Home</Link>
        <span>/</span>
        <Link href="/products" className="hover:text-brand-600">Marketplace</Link>
        <span>/</span>
        <Link href={`/products?category=${product.category.slug}`} className="hover:text-brand-600">
          {product.category.name}
        </Link>
        <span>/</span>
        <span className="text-slate-800 font-semibold truncate max-w-xs">{product.title}</span>
      </div>

      {/* Main Product Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Left: Product Images */}
        <div className="lg:col-span-5 space-y-4">
          <div className="aspect-square w-full rounded-xl overflow-hidden bg-slate-50 border border-slate-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={product.primaryImage}
              alt={product.title}
              className="w-full h-full object-cover object-center"
            />
          </div>

          <div className="grid grid-cols-3 gap-3 text-center text-xs text-slate-500">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex flex-col items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-cyan-600" />
              <span className="font-semibold text-slate-700">Official Brand</span>
              <span className="text-[11px] text-slate-600">{product.brand?.name || 'Genuine'}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex flex-col items-center gap-1">
              <Truck className="w-4 h-4 text-cyan-600" />
              <span className="font-semibold text-slate-700">Delivery</span>
              <span className="text-[11px] text-slate-600">Surkhet Valley</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex flex-col items-center gap-1">
              <RotateCcw className="w-4 h-4 text-cyan-600" />
              <span className="font-semibold text-slate-700">Store Pickup</span>
              <span className="text-[11px] text-slate-600">Buddhapath</span>
            </div>
          </div>
        </div>

        {/* Right: Product Details & Purchase Actions */}
        <div className="lg:col-span-7 flex flex-col justify-between">
          <div>
            {/* Badges Row */}
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              {product.brand && (
                <span className="px-2.5 py-1 bg-brand-50 text-brand-600 rounded-md text-xs font-bold uppercase tracking-wider">
                  {product.brand.name}
                </span>
              )}

              <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-mono">
                SKU: {product.sku}
              </span>

              {product.stockStatus === 'IN_STOCK' ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-md text-xs font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>In Stock ({product.stockQuantity} available)</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 rounded-md text-xs font-semibold">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Limited / On Order</span>
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight leading-tight">
              {product.title}
            </h1>

            {/* Price Box */}
            <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-baseline gap-3">
              <span className="text-3xl font-black text-navy-900 font-mono">
                {formatNPR(currentPrice)}
              </span>
              {isDiscounted && (
                <>
                  <span className="text-base text-slate-400 line-through font-mono">
                    {formatNPR(product.regularPrice)}
                  </span>
                  <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded">
                    Save {product.discountPercent}%
                  </span>
                </>
              )}
              <span className="text-xs text-slate-400 ml-auto font-sans">
                Tax inclusive (NPR)
              </span>
            </div>

            {/* Short Description */}
            <p className="mt-4 text-sm text-slate-600 leading-relaxed">
              {product.shortDescription}
            </p>

            {/* Warranty Info */}
            {product.warranty && (
              <div className="mt-4 flex items-center gap-2 p-3 bg-cyan-50/50 border border-cyan-100 rounded-lg text-xs text-cyan-900">
                <ShieldCheck className="w-4 h-4 text-cyan-600 shrink-0" />
                <span><strong className="font-semibold">Warranty Coverage:</strong> {product.warranty}</span>
              </div>
            )}
          </div>

          {/* Action CTAs */}
          <div className="pt-6 mt-6 border-t border-slate-200 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {whatsappNumber ? (
                <a
                  href={`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${whatsappMessage}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm transition shadow-md shadow-emerald-600/20"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Order via WhatsApp</span>
                </a>
              ) : (
                <Link
                  href={`/contact?inquiry=${encodeURIComponent(product.title)}&sku=${product.sku}`}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-bold text-sm transition shadow-md shadow-brand-500/20"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Request Quotation</span>
                </Link>
              )}

              <Link
                href={`/contact?inquiry=${encodeURIComponent(product.title)}&sku=${product.sku}`}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-navy-900 hover:bg-navy-800 text-white rounded-xl font-bold text-sm transition shadow-md"
              >
                <Phone className="w-4 h-4 text-cyan-accent" />
                <span>Contact Store Desk</span>
              </Link>
            </div>

            <div className="text-center text-xs text-slate-500">
              Pick up directly at our Buddhapath, Surkhet store or request local Valley delivery.
            </div>
          </div>
        </div>
      </div>

      {/* Specifications & Overview */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-navy-900 mb-4 pb-2 border-b border-slate-100">
              Technical Specifications
            </h2>

            {specifications.length === 0 ? (
              <p className="text-xs text-slate-500">Specifications available upon inquiry.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {specifications.map((item, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex flex-col justify-center">
                    <span className="font-semibold text-slate-500 text-[11px] uppercase tracking-wide">
                      {item.name}
                    </span>
                    <span className="font-medium text-navy-900 mt-0.5 text-xs">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-navy-900 mb-4 pb-2 border-b border-slate-100">
              Product Overview &amp; Description
            </h2>
            <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
              {product.fullDescription}
            </div>
          </div>
        </div>

        {/* Right Sidebar: Store Details & Related Products */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-navy-950 text-white p-6 rounded-2xl border border-navy-800 shadow-sm space-y-4 text-xs">
            <h3 className="font-bold text-sm text-cyan-accent uppercase tracking-wider">
              Store Information
            </h3>
            <div className="space-y-2 text-slate-300">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-cyan-accent shrink-0 mt-0.5" />
                <span>Birendranagar, Surkhet</span>
              </div>
              <div className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-cyan-accent shrink-0 mt-0.5" />
                <span>Authorized sales &amp; service warranty support</span>
              </div>
            </div>
          </div>

          {relatedProducts.length > 0 && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-navy-900 pb-2 border-b border-slate-100">
                Related Equipment
              </h3>
              <div className="space-y-4">
                {relatedProducts.map((rp) => (
                  <Link
                    key={rp.id}
                    href={`/products/${rp.slug}`}
                    className="flex items-center gap-3 group"
                  >
                    <div className="w-16 h-16 rounded-lg bg-slate-50 border border-slate-200 overflow-hidden shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={rp.primaryImage} alt={rp.title} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-xs text-navy-900 group-hover:text-brand-600 transition line-clamp-1">
                        {rp.title}
                      </h4>
                      <p className="text-xs font-mono font-bold text-brand-600 mt-0.5">
                        {formatNPR(rp.offerPrice || rp.regularPrice)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
