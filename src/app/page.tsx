import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import HeroSlider from '@/components/public/HeroSlider';
import ProductCard from '@/components/public/ProductCard';
import CampaignPopup from '@/components/public/CampaignPopup';
import { 
  Laptop, 
  Wifi, 
  ShieldCheck, 
  Cpu, 
  Wrench, 
  Printer, 
  ArrowRight, 
  CheckCircle2, 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  ExternalLink,
  Sparkles,
  Zap,
  Award,
  Layers,
  MessageSquare,
  Truck,
  CreditCard,
  ChevronRight
} from 'lucide-react';
import { formatNPR } from '@/lib/formatters';
import type { Metadata } from 'next';

export const revalidate = 30;

export const metadata: Metadata = {
  title: 'Krishna Electronics & Order Suppliers | Electronics, Laptop Repair & CCTV in Surkhet',
  description: 'Krishna Electronics & Order Suppliers is the leading electronics store & IT service center in Birendranagar, Surkhet, Nepal. We supply laptops, Wi-Fi 6 routers, Hikvision CCTV, IoT smart devices, chip-level computer repairs, and institutional AMC support across Karnali Province.',
  keywords: [
    'Krishna Electronics',
    'Krishna Electronics Surkhet',
    'electronics shop in surkhet',
    'computer shop surkhet',
    'laptop repair surkhet',
    'cctv camera installation surkhet',
    'birendranagar electronics',
    'karnali province IT hardware',
    'कृष्ण इलेक्ट्रोनिक्स सुर्खेत',
  ],
  alternates: {
    canonical: 'https://krishnaelectronics.com.np',
  },
};

export default async function HomePage() {
  // Concurrently fetch homepage datasets for sub-second database response
  const [
    banners,
    categories,
    featuredProducts,
    latestArrivals,
    services,
    brands,
    settings,
  ] = await Promise.all([
    prisma.banner.findMany({
      where: { status: 'PUBLISHED', isApproved: true },
      orderBy: { orderIndex: 'asc' },
    }).catch(() => []),
    prisma.category.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: { orderIndex: 'asc' },
    }).catch(() => []),
    prisma.product.findMany({
      where: { status: 'PUBLISHED', isFeatured: true },
      include: {
        category: true,
        subcategory: true,
        brand: true,
      },
      take: 8,
      orderBy: { createdAt: 'desc' },
    }).catch(() => []),
    prisma.product.findMany({
      where: { status: 'PUBLISHED', isNewArrival: true },
      include: {
        category: true,
        subcategory: true,
        brand: true,
      },
      take: 4,
      orderBy: { createdAt: 'desc' },
    }).catch(() => []),
    prisma.service.findMany({
      where: { isActive: true },
      orderBy: { orderIndex: 'asc' },
    }).catch(() => []),
    prisma.brand.findMany({
      where: { isPopular: true },
      take: 12,
    }).catch(() => []),
    prisma.setting.findUnique({
      where: { id: 'site-settings' },
    }).catch(() => null),
  ]);

  // Category Icon Resolver
  const getCategoryIcon = (iconName: string | null) => {
    switch (iconName) {
      case 'Laptop': return <Laptop className="w-6 h-6 text-brand-600" />;
      case 'Wifi': return <Wifi className="w-6 h-6 text-brand-600" />;
      case 'ShieldAlert': return <ShieldCheck className="w-6 h-6 text-brand-600" />;
      case 'Cpu': return <Cpu className="w-6 h-6 text-brand-600" />;
      case 'Wrench': return <Wrench className="w-6 h-6 text-brand-600" />;
      case 'Printer': return <Printer className="w-6 h-6 text-brand-600" />;
      default: return <Layers className="w-6 h-6 text-brand-600" />;
    }
  };

  const rawLocation = settings?.locationAddress || 'Birendranagar, Surkhet';
  const businessLocation = (rawLocation.includes('Birendranagar-12') || rawLocation === 'Birendranagar, Surkhet, Nepal')
    ? 'Birendranagar, Surkhet'
    : rawLocation;
  const businessHours = settings?.businessHours || 'Sunday – Friday: 9:30 AM – 6:30 PM | Saturday: Closed (On-call emergency services available)';
  const phone = settings?.contactPhone || '083-522006';
  const whatsapp = settings?.contactWhatsapp || '9858083951';

  // Resilient fallback to manifest if database is initializing or empty
  let displayFeaturedProducts = featuredProducts;
  if (!displayFeaturedProducts || displayFeaturedProducts.length === 0) {
    try {
      const manifest = require('@/business/krishna-electronics/data.json');
      const catMap = new Map((manifest.categories || []).map((c: any) => [c.slug, c]));
      const brandMap = new Map((manifest.brands || []).map((b: any) => [b.slug, b]));
      displayFeaturedProducts = (manifest.products || [])
        .filter((p: any) => p.isFeatured)
        .map((p: any, idx: number) => ({
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
          isFeatured: true,
          isPopular: Boolean(p.isPopular),
          isNewArrival: Boolean(p.isNewArrival),
          isDeal: Boolean(p.isDeal),
          primaryImage: p.primaryImage || '/images/logo.png',
          gallery: typeof p.gallery === 'string' ? p.gallery : JSON.stringify(p.gallery || []),
          status: 'PUBLISHED',
          viewsCount: 0,
          createdAt: new Date(),
          category: catMap.get(p.categorySlug) || { name: p.categorySlug, slug: p.categorySlug },
          brand: brandMap.get(p.brandSlug) || (p.brandSlug ? { name: p.brandSlug, slug: p.brandSlug } : null),
        }));
    } catch (_) {}
  }

  // Parse homepage customizer configurations
  let homeConfig: any = {};
  try {
    if (settings?.homeConfig) {
      homeConfig = typeof settings.homeConfig === 'string'
        ? JSON.parse(settings.homeConfig)
        : settings.homeConfig;
    }
  } catch (_) {}

  // Check for admin-published promo grid banner
  const promoBanner = banners.find((b) => b.position === 'PROMO_GRID' || b.position === 'OFFER_BANNER');

  return (
    <div className="space-y-16 lg:space-y-24 pb-16">
      {/* 0. Promotional Campaign Pop-up Modal on website visit */}
      <CampaignPopup banners={banners as any} />

      {/* 1. Dynamic Hero Slider */}
      <HeroSlider banners={banners as any} />

      {/* 2. Customer Trust & Value Guarantee Strip */}
      <section className="max-w-7xl mx-auto px-4 -mt-8 sm:-mt-10 relative z-20">
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xl p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0 border border-brand-100">
              <ShieldCheck className="w-5 h-5 text-brand-600" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-navy-900 uppercase tracking-wider">100% Genuine Brands</h4>
              <p className="text-xs text-slate-500 mt-0.5">Authorized TP-Link, Dell, Hikvision</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0 border border-brand-100">
              <Wrench className="w-5 h-5 text-brand-600" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-navy-900 uppercase tracking-wider">Chip-Level Repair Lab</h4>
              <p className="text-xs text-slate-500 mt-0.5">Motherboard micro-soldering in Surkhet</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0 border border-brand-100">
              <Truck className="w-5 h-5 text-brand-600" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-navy-900 uppercase tracking-wider">Karnali Dispatch</h4>
              <p className="text-xs text-slate-500 mt-0.5">Surkhet Valley delivery &amp; courier</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0 border border-brand-100">
              <CreditCard className="w-5 h-5 text-brand-600" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-navy-900 uppercase tracking-wider">Transparent NPR Pricing</h4>
              <p className="text-xs text-slate-500 mt-0.5">Clear invoices with official warranty</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Core Category Grid */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-600 bg-brand-50 px-3 py-1 rounded-full mb-2.5 border border-brand-100">
              <Layers className="w-3.5 h-3.5" />
              <span>{homeConfig.categoryBadge || 'Explore Department Catalogs'}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-navy-900 tracking-tight">
              {homeConfig.categoryTitle || 'Product Categories'}
            </h2>
            <p className="text-sm text-slate-500 mt-1 max-w-2xl">
              {homeConfig.categorySubtitle || 'Select a specialized category for commercial equipment, networking, and smart electronics.'}
            </p>
          </div>

          <Link
            href="/products"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-brand-600 hover:text-brand-700 transition group"
          >
            <span>View All Categories</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/products?category=${cat.slug}`}
              className="group bg-white p-5 rounded-2xl border border-slate-200/90 hover:border-brand-500 hover:shadow-xl hover:shadow-brand-500/10 transition-all duration-300 flex flex-col items-center text-center text-slate-800"
            >
              <div className="w-14 h-14 rounded-2xl bg-slate-50 group-hover:bg-brand-50 border border-slate-200 group-hover:border-brand-200 flex items-center justify-center mb-3 transition-colors duration-300">
                {getCategoryIcon(cat.icon)}
              </div>
              <h3 className="font-bold text-xs sm:text-sm text-navy-900 group-hover:text-brand-600 transition leading-snug line-clamp-2">
                {cat.name}
              </h3>
              <span className="text-[11px] text-slate-500 mt-1 font-mono bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">
                {cat._count?.products ?? 0} Products
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* 4. Featured Products Showcase */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-cyan-700 bg-cyan-50 px-3 py-1 rounded-full mb-2.5 border border-cyan-100">
              <Zap className="w-3.5 h-3.5 text-cyan-600" />
              <span>{homeConfig.featuredBadge || 'Verified Top Recommendations'}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-navy-900 tracking-tight">
              {homeConfig.featuredTitle || 'Featured Electronics & Hardware'}
            </h2>
            <p className="text-sm text-slate-500 mt-1 max-w-2xl">
              {homeConfig.featuredSubtitle || 'Top-selling routers, surveillance cameras, laptops, and IoT devices in Surkhet.'}
            </p>
          </div>

          <Link
            href="/products?featured=true"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-brand-600 hover:text-brand-700 transition group"
          >
            <span>See All Featured</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {displayFeaturedProducts && displayFeaturedProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {displayFeaturedProducts.map((product) => (
              <ProductCard key={product.id} product={product as any} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center text-xs text-slate-500">
            No products marked as featured yet. Mark items as &quot;Featured&quot; in Admin Panel to showcase them here.
          </div>
        )}
      </section>

      {/* 5. Mid-Page Promotional or IoT Showcase Banner */}
      <section className="max-w-7xl mx-auto px-4">
        {promoBanner ? (
          <div className="relative rounded-3xl bg-navy-950 text-white overflow-hidden border border-navy-700 shadow-2xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center p-8 md:p-12">
            <div className="lg:col-span-7 space-y-4">
              {promoBanner.badgeText && (
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-500/20 text-cyan-accent text-xs font-bold uppercase tracking-wider border border-cyan-500/30">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{promoBanner.badgeText}</span>
                </div>
              )}
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight">
                {promoBanner.title}
              </h3>
              {promoBanner.subtitle && (
                <p className="text-slate-300 text-sm leading-relaxed max-w-xl">
                  {promoBanner.subtitle}
                </p>
              )}
              {promoBanner.discountPercent && (
                <div className="inline-flex items-center gap-1 px-3 py-1 bg-red-600/30 border border-red-500 text-red-300 text-xs font-bold rounded-lg">
                  <span>Special Promotion: {promoBanner.discountPercent}% Off</span>
                </div>
              )}
              <div className="pt-2">
                <Link
                  href={promoBanner.ctaLink || '/products'}
                  className="px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition shadow-md inline-flex items-center gap-2"
                >
                  <span>{promoBanner.ctaText || 'Explore Now'}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
            <div className="lg:col-span-5 rounded-2xl overflow-hidden aspect-[16/10] bg-navy-900 border border-navy-700">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={promoBanner.imageUrl || 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=1200&q=80'}
                alt={promoBanner.title}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        ) : (
          <div className="relative rounded-3xl bg-gradient-to-r from-[#060B18] via-[#0B132B] to-[#0A1A3A] text-white overflow-hidden p-8 md:p-12 border border-slate-800 shadow-2xl">
            {/* Ambient light glow */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl pointer-events-none"></div>

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 space-y-4">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/20 text-cyan-accent text-xs font-bold uppercase tracking-wider border border-cyan-500/30">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{homeConfig.showcaseBadge || 'Next-Gen Smart Living'}</span>
                </div>
                <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight">
                  {homeConfig.showcaseTitle || 'Transform Your Home & Facility with IoT Automation'}
                </h3>
                <p className="text-slate-300 text-sm leading-relaxed max-w-xl">
                  {homeConfig.showcaseSubtitle || 'We supply and commission automated water tank controllers, smart circuit breakers, Sonoff/Tuya Wi-Fi relays, and environmental telemetry sensors across Karnali Province. Control everything from your smartphone.'}
                </p>
                <div className="pt-2 flex flex-wrap gap-3">
                  <Link
                    href={homeConfig.showcaseCtaLink || '/services/iot-smart-device-solutions'}
                    className="px-6 py-3 bg-cyan-accent hover:bg-cyan-400 text-navy-950 font-extrabold text-xs uppercase tracking-wider rounded-xl transition shadow-lg shadow-cyan-500/20"
                  >
                    {homeConfig.showcaseCtaText || 'Explore IoT Solutions'}
                  </Link>
                  <Link
                    href={homeConfig.showcaseCtaSecondaryLink || '/contact'}
                    className="px-6 py-3 bg-navy-800/90 hover:bg-navy-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl border border-slate-700 transition"
                  >
                    {homeConfig.showcaseCtaSecondaryText || 'Request Smart Site Survey'}
                  </Link>
                </div>
              </div>

              <div className="lg:col-span-5 grid grid-cols-2 gap-4">
                <div className="bg-navy-900/80 backdrop-blur-md p-4.5 rounded-2xl border border-slate-800 hover:border-slate-700 transition">
                  <div className="text-cyan-accent font-black text-lg mb-1">
                    {homeConfig.showcaseFeature1Title || 'Mobile App'}
                  </div>
                  <div className="text-xs text-slate-300 leading-relaxed">
                    {homeConfig.showcaseFeature1Desc || 'Remote control of lights, pumps & AC from anywhere'}
                  </div>
                </div>
                <div className="bg-navy-900/80 backdrop-blur-md p-4.5 rounded-2xl border border-slate-800 hover:border-slate-700 transition">
                  <div className="text-cyan-accent font-black text-lg mb-1">
                    {homeConfig.showcaseFeature2Title || 'Energy Saving'}
                  </div>
                  <div className="text-xs text-slate-300 leading-relaxed">
                    {homeConfig.showcaseFeature2Desc || 'Real-time kWh telemetry & automated cut-off schedules'}
                  </div>
                </div>
                <div className="bg-navy-900/80 backdrop-blur-md p-4.5 rounded-2xl border border-slate-800 hover:border-slate-700 transition">
                  <div className="text-cyan-accent font-black text-lg mb-1">
                    {homeConfig.showcaseFeature3Title || 'Tank Automation'}
                  </div>
                  <div className="text-xs text-slate-300 leading-relaxed">
                    {homeConfig.showcaseFeature3Desc || 'Automatic water pump on/off with dry-run protection'}
                  </div>
                </div>
                <div className="bg-navy-900/80 backdrop-blur-md p-4.5 rounded-2xl border border-slate-800 hover:border-slate-700 transition">
                  <div className="text-cyan-accent font-black text-lg mb-1">
                    {homeConfig.showcaseFeature4Title || 'Professional Lab'}
                  </div>
                  <div className="text-xs text-slate-300 leading-relaxed">
                    {homeConfig.showcaseFeature4Desc || 'Tested and calibrated for local 220V grid stability'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 6. Professional Technical Services Showcase */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-600 bg-brand-50 px-3 py-1 rounded-full mb-2.5 border border-brand-100">
            <Wrench className="w-3.5 h-3.5 text-brand-600" />
            <span>{homeConfig.servicesBadge || 'Certified Laboratory & On-Site Support'}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-navy-900 tracking-tight">
            {homeConfig.servicesTitle || 'Repair, Installation & Maintenance Services'}
          </h2>
          <p className="text-sm text-slate-500 mt-2">
            {homeConfig.servicesSubtitle || 'From chip-level laptop motherboard diagnostics to enterprise optical fiber cabling and corporate Annual Maintenance Contracts (AMC).'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((svc) => (
            <div
              key={svc.id}
              className="bg-white rounded-2xl border border-slate-200/90 hover:border-brand-500 hover:shadow-xl hover:shadow-brand-500/5 transition-all duration-300 p-6 flex flex-col justify-between group"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mb-4 border border-brand-100 group-hover:scale-105 transition-transform">
                  <Wrench className="w-6 h-6 text-brand-600" />
                </div>

                <h3 className="font-bold text-base text-navy-900 mb-2 group-hover:text-brand-600 transition-colors">
                  {svc.title}
                </h3>

                <p className="text-xs text-slate-500 leading-relaxed mb-4">
                  {svc.shortDescription}
                </p>

                <div className="text-xs font-semibold text-slate-800 mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between">
                  <span className="text-slate-500 font-normal">Pricing: </span>
                  {svc.startingPrice ? (
                    <span className="text-brand-600 font-mono font-bold">
                      Starts from {formatNPR(svc.startingPrice)}
                    </span>
                  ) : (
                    <span className="text-brand-600 font-medium">{svc.pricingNote || 'Quotation on request'}</span>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <Link
                  href={`/services/${svc.slug}`}
                  className="text-xs font-bold text-navy-900 hover:text-brand-600 inline-flex items-center gap-1 transition"
                >
                  <span>Service Details</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>

                <Link
                  href={`/contact?service=${encodeURIComponent(svc.title)}`}
                  className="px-3.5 py-1.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold transition shadow-sm"
                >
                  Request Quote
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 7. Why Customers Rely on Us */}
      <section className="bg-slate-100/70 py-16 lg:py-20 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center max-w-xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-black text-navy-900 tracking-tight">
              {homeConfig.whyTitle || 'Why Customers Rely on Us'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-2">
              {homeConfig.whySubtitle || `Serving Birendranagar and Karnali Province with genuine hardware, transparent pricing, and deep technical mastery.`}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition space-y-3">
              <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-5 h-5 text-brand-600" />
              </div>
              <h4 className="font-bold text-sm text-navy-900">
                {homeConfig.whyCard1Title || '100% Genuine Brands'}
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                {homeConfig.whyCard1Desc || 'Authorized TP-Link, MikroTik, Hikvision, Dell, HP, and Sonoff equipment with genuine manufacturer warranties.'}
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition space-y-3">
              <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Wrench className="w-5 h-5 text-brand-600" />
              </div>
              <h4 className="font-bold text-sm text-navy-900">
                {homeConfig.whyCard2Title || 'Chip-Level Repair Lab'}
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                {homeConfig.whyCard2Desc || 'Advanced micro-soldering, motherboard component tracing, clean OS flashing, and diagnostic instruments under one roof.'}
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition space-y-3">
              <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Award className="w-5 h-5 text-brand-600" />
              </div>
              <h4 className="font-bold text-sm text-navy-900">
                {homeConfig.whyCard3Title || 'Enterprise AMC Contracts'}
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                {homeConfig.whyCard3Desc || 'Guaranteed response SLA, routine preventative maintenance, and on-call engineer dispatch for institutions.'}
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition space-y-3">
              <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <MapPin className="w-5 h-5 text-brand-600" />
              </div>
              <h4 className="font-bold text-sm text-navy-900">
                {homeConfig.whyCard4Title || 'Local Store & Lab'}
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                {homeConfig.whyCard4Desc || `Walk into our physical facility in ${businessLocation} for direct consultation, live testing, and handover.`}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Popular Brands Showcase */}
      {brands && brands.length > 0 && (
        <section className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-8">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Authorized Brands &amp; Technology Partners
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
            {brands.map((b) => (
              <Link
                key={b.id}
                href={`/products?brand=${b.slug}`}
                className="px-5 py-2.5 bg-white rounded-xl border border-slate-200/80 font-bold text-xs text-slate-700 hover:text-brand-600 hover:border-brand-500 hover:shadow-md transition-all shadow-sm"
              >
                {b.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 9. Location & Store Visit Section */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="bg-[#0B132B] rounded-3xl text-white p-8 md:p-12 border border-slate-800 shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-accent uppercase tracking-wider">
                <MapPin className="w-4 h-4" />
                <span>{homeConfig.locationBadge || 'Visit Our Local Facility'}</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black tracking-tight">
                {homeConfig.locationTitle || settings?.siteName || 'Krishna Electronics Order & Suppliers'}
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed max-w-xl">
                {homeConfig.locationSubtitle || settings?.siteDescription || 'Whether you need a quick laptop diagnostic, a custom CCTV quote for your property, or bulk office IT equipment, our doors are open.'}
              </p>

              <div className="space-y-2.5 pt-2 text-xs text-slate-300">
                <div className="flex items-center gap-2.5">
                  <MapPin className="w-4 h-4 text-cyan-accent shrink-0" />
                  <span className="font-semibold text-white">{businessLocation}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-cyan-accent shrink-0" />
                  <span>{businessHours}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Zap className="w-4 h-4 text-cyan-accent shrink-0" />
                  <span>Serving Surkhet Valley, Dailekh, Jajarkot, Jumla, and Karnali Province</span>
                </div>
              </div>

              <div className="pt-4 flex flex-wrap gap-3">
                <Link
                  href="/contact"
                  className="px-6 py-3 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition shadow-md"
                >
                  Send Inquiry / Request Callback
                </Link>
                <Link
                  href="/services"
                  className="px-6 py-3 bg-navy-800 hover:bg-navy-700 text-slate-200 rounded-xl font-semibold text-xs border border-slate-700 transition"
                >
                  View All Services
                </Link>
              </div>
            </div>

            <div className="lg:col-span-5 bg-navy-950 p-6 rounded-2xl border border-slate-800 space-y-4 text-xs">
              <div className="font-bold text-cyan-accent uppercase tracking-wider text-[11px]">
                Direct Order &amp; Quotation Inquiries
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">
                Need an immediate estimate for products, fiber splicing, or router setup? Send an instant message directly to our desk.
              </p>
              <div className="p-3.5 bg-navy-900 rounded-xl border border-slate-800">
                <div className="text-slate-400 text-[11px] mb-1">Default Transaction Currency</div>
                <div className="text-base font-extrabold text-white font-mono">
                  {settings?.currencyCode || 'NPR'} ({settings?.currencySymbol || 'रु'})
                </div>
              </div>
              <div className="p-3.5 bg-navy-900 rounded-xl border border-slate-800">
                <div className="text-slate-400 text-[11px] mb-1">Local Valley Dispatch</div>
                <div className="text-white font-medium">
                  {settings?.deliveryInfo || 'Prompt local delivery across Surkhet Valley and scheduled dispatch throughout Karnali Province.'}
                </div>
              </div>
              {whatsapp && (
                <a
                  href={`https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent('Hello Krishna Electronics desk, I would like to visit your store / request a quote.')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-sm"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Chat on WhatsApp Directly</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
