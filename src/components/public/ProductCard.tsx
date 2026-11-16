'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, CheckCircle2, AlertTriangle, ArrowRight, MessageSquare, Zap } from 'lucide-react';
import { ProductData } from '@/types';
import { formatNPR } from '@/lib/formatters';

interface ProductCardProps {
  product: ProductData;
  onInquire?: (product: ProductData) => void;
}

export default function ProductCard({ product, onInquire }: ProductCardProps) {
  const isDiscounted = Boolean(product.offerPrice && product.offerPrice < product.regularPrice);
  const currentPrice = isDiscounted ? (product.offerPrice as number) : product.regularPrice;
  const savings = isDiscounted ? product.regularPrice - (product.offerPrice as number) : 0;

  const whatsappMessage = encodeURIComponent(
    `Hello Krishna Electronics, I would like to inquire about: ${product.title} (SKU: ${product.sku || 'N/A'}) listed for NPR ${currentPrice}. Please confirm availability and delivery to Surkhet.`
  );

  const handleInquireClick = (e: React.MouseEvent) => {
    if (onInquire) {
      e.preventDefault();
      onInquire(product);
    } else {
      // Default to WhatsApp inquiry if no handler provided
      e.preventDefault();
      window.open(`https://wa.me/9779858083951?text=${whatsappMessage}`, '_blank');
    }
  };

  return (
    <div className="group bg-white rounded-2xl border border-slate-200/90 hover:border-brand-500/50 shadow-sm hover:shadow-xl hover:shadow-brand-500/5 transition-all duration-300 flex flex-col overflow-hidden relative">
      {/* Top Badges (Discount, Featured, New Arrival) */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1 items-start">
        {isDiscounted && product.discountPercent && product.discountPercent > 0 ? (
          <span className="px-2.5 py-1 bg-red-600 text-white text-[10px] font-extrabold uppercase tracking-wider rounded-lg shadow-sm">
            {product.discountPercent}% OFF
          </span>
        ) : null}

        {product.isFeatured && (
          <span className="px-2.5 py-0.5 bg-brand-600 text-white text-[10px] font-bold rounded-md shadow-sm">
            FEATURED
          </span>
        )}

        {product.isNewArrival && (
          <span className="px-2.5 py-0.5 bg-navy-950 text-cyan-accent text-[10px] font-bold rounded-md shadow-sm">
            NEW
          </span>
        )}
      </div>

      {/* Stock Status Chip (Top-Right) */}
      <div className="absolute top-3 right-3 z-10">
        {product.stockStatus === 'IN_STOCK' ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/95 backdrop-blur-md border border-emerald-200 text-emerald-700 text-[10px] font-semibold rounded-lg shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>In Stock</span>
          </span>
        ) : product.stockStatus === 'LOW_STOCK' ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/95 backdrop-blur-md border border-amber-200 text-amber-700 text-[10px] font-semibold rounded-lg shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            <span>Low Stock</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/95 backdrop-blur-md border border-slate-200 text-slate-500 text-[10px] font-semibold rounded-lg shadow-sm">
            <span>Out of Stock</span>
          </span>
        )}
      </div>

      {/* Product Image Canvas */}
      <Link 
        href={`/products/${product.slug}`} 
        className="relative aspect-square w-full bg-gradient-to-b from-slate-50/90 to-white overflow-hidden block border-b border-slate-100"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.primaryImage || 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=600&q=80'}
          alt={product.title}
          className="w-full h-full object-contain p-6 group-hover:scale-105 transition-transform duration-500 ease-out"
          loading="lazy"
        />
      </Link>

      {/* Product Card Details */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Brand Tag & SKU */}
          <div className="flex items-center justify-between text-[11px] mb-1.5 gap-2">
            <span className="font-bold text-brand-600 uppercase tracking-wider truncate">
              {product.brand?.name || 'Authorized Hardware'}
            </span>
            {product.sku && (
              <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 shrink-0">
                SKU: {product.sku}
              </span>
            )}
          </div>

          {/* Product Title */}
          <Link href={`/products/${product.slug}`} className="block">
            <h3 className="font-bold text-navy-900 group-hover:text-brand-600 transition-colors text-sm sm:text-[15px] leading-snug line-clamp-2 min-h-[40px]">
              {product.title}
            </h3>
          </Link>

          {/* Short Description Snippet */}
          {product.shortDescription && (
            <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
              {product.shortDescription}
            </p>
          )}

          {/* Warranty & Guarantee tag */}
          {product.warranty && (
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-2 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
              <span className="truncate">{product.warranty}</span>
            </div>
          )}
        </div>

        {/* Pricing Block & Actions */}
        <div className="pt-3.5 mt-3.5 border-t border-slate-100">
          <div className="flex items-baseline justify-between gap-2 mb-3">
            <div>
              <div className="text-lg sm:text-xl font-extrabold text-navy-900 font-mono tracking-tight leading-none">
                {formatNPR(currentPrice)}
              </div>
              {isDiscounted && (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-slate-400 line-through font-mono">
                    {formatNPR(product.regularPrice)}
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-100">
                    Save {formatNPR(savings)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <Link
              href={`/products/${product.slug}`}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-sm"
            >
              <span>Details</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </Link>

            <button
              onClick={handleInquireClick}
              type="button"
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-sm"
              title="Inquire via WhatsApp"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Inquire</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
