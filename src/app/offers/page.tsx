import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import ProductCard from '@/components/public/ProductCard';
import { Zap, Tag, Calendar, ArrowRight } from 'lucide-react';
import { formatDate } from '@/lib/formatters';
import type { Metadata } from 'next';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Special Offers, Discounts & Festive Deals | Krishna Electronics Surkhet',
  description: 'Exclusive seasonal discounts on laptops, Wi-Fi 6 routers, CCTV security camera kits, toner cartridges, and smart IoT home devices in Surkhet, Nepal.',
  keywords: [
    'electronics offers surkhet',
    'laptop discount surkhet',
    'cctv camera offers nepal',
    'router deals surkhet',
    'festive discount krishna electronics',
    'छुट अफर सुर्खेत',
  ],
};

export default async function OffersPage() {
  const [promotions, discountedProducts] = await Promise.all([
    prisma.banner.findMany({
      where: {
        status: 'PUBLISHED',
        isApproved: true,
      },
      orderBy: { orderIndex: 'asc' },
    }).catch(() => []),
    prisma.product.findMany({
      where: {
        status: 'PUBLISHED',
        discountPercent: { gt: 0 },
      },
      include: {
        category: true,
        subcategory: true,
        brand: true,
      },
      orderBy: { discountPercent: 'desc' },
    }).catch(() => []),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 space-y-12">
      {/* Header Banner */}
      <div className="bg-navy-950 text-white rounded-2xl p-8 md:p-12 border border-navy-800 shadow-xl relative overflow-hidden">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-accent text-xs font-bold uppercase tracking-wider border border-cyan-500/30">
            <Zap className="w-3.5 h-3.5" />
            <span>Seasonal Promotions &amp; Deals</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
            Surkhet Special Offers
          </h1>

          <p className="text-slate-300 text-sm leading-relaxed">
            Take advantage of exclusive discounted pricing on Wi-Fi 6 hardware, smart home modules, and complete CCTV surveillance bundles. All offers include genuine manufacturer warranties and local technical setup support.
          </p>
        </div>
      </div>

      {/* Active Promotion Campaigns */}
      {promotions.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-navy-900 flex items-center gap-2">
            <Tag className="w-5 h-5 text-brand-500" />
            <span>Active Campaigns &amp; Banners</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {promotions.map((promo) => (
              <div
                key={promo.id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col md:flex-row"
              >
                <div className="md:w-1/2 aspect-video md:aspect-auto bg-navy-950 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={promo.imageUrl}
                    alt={promo.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6 md:w-1/2 flex flex-col justify-between space-y-3">
                  <div>
                    {promo.discountPercent && (
                      <span className="inline-block px-2.5 py-0.5 bg-red-600 text-white font-bold text-xs rounded-md mb-2">
                        {promo.discountPercent}% OFF
                      </span>
                    )}
                    <h3 className="font-extrabold text-base text-navy-900 leading-snug">
                      {promo.title}
                    </h3>
                    {promo.subtitle && (
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        {promo.subtitle}
                      </p>
                    )}
                    {promo.couponCode && (
                      <div className="mt-3 p-2 bg-slate-50 rounded-lg border border-dashed border-slate-300 text-xs">
                        <span className="text-slate-500">Promo Code: </span>
                        <span className="font-mono font-bold text-brand-600">{promo.couponCode}</span>
                      </div>
                    )}
                  </div>

                  <Link
                    href={promo.ctaLink || '/products'}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 hover:text-brand-700 transition"
                  >
                    <span>{promo.ctaText || 'Shop Offer'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Discounted Products Grid */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-navy-900 flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-500" />
          <span>Discounted Products on Sale</span>
        </h2>

        {discountedProducts.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-xs text-slate-500">
            Check back soon for upcoming holiday and seasonal promotional deals.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {discountedProducts.map((p) => (
              <ProductCard key={p.id} product={p as any} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
