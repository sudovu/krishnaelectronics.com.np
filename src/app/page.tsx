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
  MessageSquare
} from 'lucide-react';
import { formatNPR } from '@/lib/formatters';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  // Fetch real banners from DB
  const banners = await prisma.banner.findMany({
    where: { status: 'PUBLISHED', isApproved: true },
    orderBy: { orderIndex: 'asc' },
  }).catch(() => []);

  // Fetch categories
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    include: {
      _count: {
        select: { products: true }
      }
    },
    orderBy: { orderIndex: 'asc' },
  }).catch(() => []);

  // Fetch featured products
  const featuredProducts = await prisma.product.findMany({
    where: { status: 'PUBLISHED', isFeatured: true },
    include: {
      category: true,
      subcategory: true,
      brand: true,
    },
    take: 8,
    orderBy: { createdAt: 'desc' },
  }).catch(() => []);

  // Fetch latest arrivals
  const latestArrivals = await prisma.product.findMany({
    where: { status: 'PUBLISHED', isNewArrival: true },
    include: {
      category: true,
      subcategory: true,
      brand: true,
    },
    take: 4,
    orderBy: { createdAt: 'desc' },
  }).catch(() => []);

  // Fetch services
  const services = await prisma.service.findMany({
    where: { isActive: true },
    orderBy: { orderIndex: 'asc' },
  }).catch(() => []);

  // Fetch brands
  const brands = await prisma.brand.findMany({
    where: { isPopular: true },
    take: 12,
  }).catch(() => []);

  // Fetch site settings
  const settings = await prisma.setting.findUnique({
    where: { id: 'site-settings' },
  }).catch(() => null);

  // Category Icon Resolver
  const getCategoryIcon = (iconName: string | null) => {
    switch (iconName) {
      case 'Laptop': return <Laptop className="w-6 h-6 text-brand-500" />;
      case 'Wifi': return <Wifi className="w-6 h-6 text-brand-500" />;
      case 'ShieldAlert': return <ShieldCheck className="w-6 h-6 text-brand-500" />;
      case 'Cpu': return <Cpu className="w-6 h-6 text-brand-500" />;
      case 'Wrench': return <Wrench className="w-6 h-6 text-brand-500" />;
      case 'Printer': return <Printer className="w-6 h-6 text-brand-500" />;
      default: return <Layers className="w-6 h-6 text-brand-500" />;
    }
  };

  const businessLocation = settings?.locationAddress || 'Birendranagar-12, Surkhet, Nepal';
  const businessHours = settings?.businessHours || 'Sun - Fri: 9:30 AM - 6:30 PM | Saturday: Closed (On-call emergency services)';

  return (
    <div className="space-y-16 pb-16">
      {/* 0. Promotional Campaign Pop-up Modal on website visit */}
      <CampaignPopup banners={banners as any} />

      {/* 1. Dynamic Hero Slider */}
      <HeroSlider banners={banners as any} />

      {/* 2. Core Category Grid */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-600 bg-brand-50 px-2.5 py-1 rounded-md mb-2">
              <Layers className="w-3.5 h-3.5" />
              <span>Explore Department Catalogs</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
              Product Categories
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Select a specialized category for commercial equipment, networking, and smart electronics.
            </p>
          </div>

          <Link
            href="/products"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700 transition"
          >
            <span>View All Products</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/products?category=${cat.slug}`}
              className="group bg-white p-5 rounded-xl border border-slate-200 hover:border-brand-500 hover:shadow-lg transition-all flex flex-col items-center text-center text-slate-800"
            >
              <div className="w-14 h-14 rounded-full bg-slate-50 group-hover:bg-brand-50 border border-slate-200 group-hover:border-brand-200 flex items-center justify-center mb-3 transition-colors">
                {getCategoryIcon(cat.icon)}
              </div>
              <h3 className="font-bold text-xs text-navy-900 group-hover:text-brand-600 transition leading-snug line-clamp-2">
                {cat.name}
              </h3>
              <span className="text-[11px] text-slate-600 mt-1 font-mono">
                {cat._count.products} Products
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. Featured Products Showcase */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-cyan-600 bg-cyan-50 px-2.5 py-1 rounded-md mb-2">
              <Zap className="w-3.5 h-3.5" />
              <span>Verified Top Recommendations</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
              Featured Electronics &amp; Hardware
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Top-selling routers, surveillance cameras, laptops, and IoT devices in Surkhet.
            </p>
          </div>

          <Link
            href="/products?featured=true"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700 transition"
          >
            <span>See All Featured</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product as any} />
          ))}
        </div>
      </section>

      {/* 4. IoT & Smart Technology Showcase Banner */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="relative rounded-2xl bg-gradient-to-r from-navy-950 via-navy-900 to-brand-900 text-white overflow-hidden p-8 md:p-12 border border-navy-700 shadow-xl">
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-accent text-xs font-bold uppercase tracking-wider border border-cyan-500/30">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Next-Gen Smart Living</span>
              </div>
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight">
                Transform Your Home &amp; Facility with IoT Automation
              </h3>
              <p className="text-slate-300 text-sm leading-relaxed max-w-xl">
                We supply and commission automated water tank controllers, smart circuit breakers, Sonoff/Tuya Wi-Fi relays, and environmental telemetry sensors across Karnali Province. Control everything from your smartphone.
              </p>
              <div className="pt-2 flex flex-wrap gap-3">
                <Link
                  href="/services/iot-smart-device-solutions"
                  className="px-5 py-2.5 bg-cyan-accent hover:bg-cyan-400 text-navy-950 font-bold text-xs uppercase tracking-wider rounded-lg transition shadow-md"
                >
                  Explore IoT Solutions
                </Link>
                <Link
                  href="/contact"
                  className="px-5 py-2.5 bg-navy-800 hover:bg-navy-700 text-white font-semibold text-xs rounded-lg border border-navy-600 transition"
                >
                  Request Smart Site Survey
                </Link>
              </div>
            </div>

            <div className="lg:col-span-5 grid grid-cols-2 gap-4">
              <div className="bg-navy-800/80 backdrop-blur-sm p-4 rounded-xl border border-navy-700">
                <div className="text-cyan-accent font-extrabold text-xl mb-1">Mobile App</div>
                <div className="text-xs text-slate-300">Remote control of lights, pumps &amp; AC from anywhere</div>
              </div>
              <div className="bg-navy-800/80 backdrop-blur-sm p-4 rounded-xl border border-navy-700">
                <div className="text-cyan-accent font-extrabold text-xl mb-1">Energy Saving</div>
                <div className="text-xs text-slate-300">Real-time kWh telemetry &amp; automated cut-off schedules</div>
              </div>
              <div className="bg-navy-800/80 backdrop-blur-sm p-4 rounded-xl border border-navy-700">
                <div className="text-cyan-accent font-extrabold text-xl mb-1">Tank Automation</div>
                <div className="text-xs text-slate-300">Automatic water pump on/off with dry-run protection</div>
              </div>
              <div className="bg-navy-800/80 backdrop-blur-sm p-4 rounded-xl border border-navy-700">
                <div className="text-cyan-accent font-extrabold text-xl mb-1">Professional Lab</div>
                <div className="text-xs text-slate-300">Tested and calibrated for local 220V grid stability</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Professional Technical Services Showcase */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-600 bg-brand-50 px-2.5 py-1 rounded-md mb-2">
            <Wrench className="w-3.5 h-3.5" />
            <span>Certified Laboratory &amp; On-Site Support</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
            Repair, Installation &amp; Maintenance Services
          </h2>
          <p className="text-sm text-slate-500 mt-2">
            From chip-level laptop motherboard diagnostics to enterprise optical fiber cabling and corporate Annual Maintenance Contracts (AMC).
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((svc) => (
            <div
              key={svc.id}
              className="bg-white rounded-xl border border-slate-200 hover:border-brand-500/50 hover:shadow-xl transition-all p-6 flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mb-4 border border-brand-100">
                  <Wrench className="w-6 h-6 text-brand-500" />
                </div>

                <h3 className="font-bold text-base text-navy-900 mb-2">
                  {svc.title}
                </h3>

                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  {svc.shortDescription}
                </p>

                <div className="text-xs font-semibold text-slate-800 mb-4 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <span className="text-slate-500 font-normal">Pricing: </span>
                  {svc.startingPrice ? (
                    <span className="text-brand-600 font-mono font-bold">
                      Starts from {formatNPR(svc.startingPrice)}
                    </span>
                  ) : (
                    <span className="text-brand-600">{svc.pricingNote}</span>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <Link
                  href={`/services/${svc.slug}`}
                  className="text-xs font-bold text-navy-900 hover:text-brand-600 inline-flex items-center gap-1 transition"
                >
                  <span>Service Details</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>

                <Link
                  href={`/contact?service=${encodeURIComponent(svc.title)}`}
                  className="px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-white rounded-md text-xs font-medium transition"
                >
                  Request Quote
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. Why Choose Krishna Electronics */}
      <section className="bg-slate-100/70 py-16 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center max-w-xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
              Why Customers Rely on Us
            </h2>
            <p className="text-xs text-slate-500 mt-2">
              Serving Birendranagar and Karnali Province with genuine hardware, transparent pricing, and deep technical mastery.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-5 h-5 text-brand-500" />
              </div>
              <h4 className="font-bold text-sm text-navy-900">100% Genuine Brands</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Authorized TP-Link, MikroTik, Hikvision, Dell, HP, and Sonoff equipment with genuine manufacturer warranties.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Wrench className="w-5 h-5 text-brand-500" />
              </div>
              <h4 className="font-bold text-sm text-navy-900">Chip-Level Repair Lab</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Advanced micro-soldering, motherboard component tracing, clean OS flashing, and diagnostic instruments under one roof.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Award className="w-5 h-5 text-brand-500" />
              </div>
              <h4 className="font-bold text-sm text-navy-900">Enterprise AMC Contracts</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Guaranteed response SLA, routine preventative maintenance, and on-call engineer dispatch for institutions across Surkhet.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <MapPin className="w-5 h-5 text-brand-500" />
              </div>
              <h4 className="font-bold text-sm text-navy-900">Surkhet Facility Location</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Walk into our physical facility in Birendranagar-12, Surkhet for direct consultation, live testing, and handover.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Popular Brands Showcase */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-6">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Authorized Brands &amp; Technology Partners
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10 opacity-70 hover:opacity-100 transition-opacity">
          {brands.map((b) => (
            <Link
              key={b.id}
              href={`/products?brand=${b.slug}`}
              className="px-4 py-2 bg-white rounded-lg border border-slate-200 font-bold text-xs text-slate-700 hover:text-brand-600 hover:border-brand-400 transition shadow-sm"
            >
              {b.name}
            </Link>
          ))}
        </div>
      </section>

      {/* 8. Location & Store Visit Section */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="bg-navy-900 rounded-2xl text-white p-8 md:p-12 border border-navy-800 shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-accent uppercase tracking-wider">
                <MapPin className="w-4 h-4" />
                <span>Visit Our Surkhet Facility</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Krishna Electronics Order &amp; Suppliers
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Whether you need a quick laptop diagnostic, a custom CCTV quote for your property, or bulk office IT equipment, our doors are open in the heart of Birendranagar.
              </p>

              <div className="space-y-2 pt-2 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-cyan-accent shrink-0" />
                  <span className="font-semibold text-white">{businessLocation}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-cyan-accent shrink-0" />
                  <span>{businessHours}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-cyan-accent shrink-0" />
                  <span>Serving Surkhet Valley, Dailekh, Jajarkot, Jumla, and Karnali Province</span>
                </div>
              </div>

              <div className="pt-4 flex flex-wrap gap-3">
                <Link
                  href="/contact"
                  className="px-6 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-lg font-bold text-xs uppercase tracking-wider transition shadow-md"
                >
                  Send Inquiry / Request Callback
                </Link>
                <Link
                  href="/services"
                  className="px-6 py-2.5 bg-navy-800 hover:bg-navy-700 text-slate-200 rounded-lg font-semibold text-xs border border-navy-700 transition"
                >
                  View All Services
                </Link>
              </div>
            </div>

            <div className="lg:col-span-5 bg-navy-950 p-6 rounded-xl border border-navy-800 space-y-4 text-xs">
              <div className="font-bold text-cyan-accent uppercase tracking-wider text-[11px]">
                Direct Order &amp; Quotation Inquiries
              </div>
              <p className="text-slate-400 text-xs">
                Need an immediate estimate for products, fiber splicing, or router setup? Send an instant message directly to our desk.
              </p>
              <div className="p-3 bg-navy-900 rounded-lg border border-navy-800">
                <div className="text-slate-400 text-[11px] mb-1">Default Transaction Currency</div>
                <div className="text-base font-bold text-white font-mono">
                  Nepalese Rupee (NPR / रु)
                </div>
              </div>
              <div className="p-3 bg-navy-900 rounded-lg border border-navy-800">
                <div className="text-slate-400 text-[11px] mb-1">Local Valley Dispatch</div>
                <div className="text-white font-medium">
                  Same-day delivery across Birendranagar municipal area.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
