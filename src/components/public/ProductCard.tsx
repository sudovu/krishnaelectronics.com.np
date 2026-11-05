import React from 'react';
import Link from 'next/link';
import { Tag, ShieldCheck, CheckCircle2, AlertTriangle, ArrowRight, MessageSquare } from 'lucide-react';
import { ProductData } from '@/types';
import { formatNPR } from '@/lib/formatters';

interface ProductCardProps {
  product: ProductData;
  onInquire?: (product: ProductData) => void;
}

export default function ProductCard({ product, onInquire }: ProductCardProps) {
  const isDiscounted = product.offerPrice && product.offerPrice < product.regularPrice;
  const currentPrice = isDiscounted ? product.offerPrice : product.regularPrice;

  return (
    <div className="group bg-white rounded-xl border border-slate-200 hover:border-brand-500/40 hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden relative">
      {/* Discount / Label Badges */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1">
        {product.discountPercent && product.discountPercent > 0 ? (
          <span className="px-2 py-0.5 bg-red-600 text-white text-[11px] font-bold rounded-md shadow-sm">
            {product.discountPercent}% OFF
          </span>
        ) : null}

        {product.isNewArrival && (
          <span className="px-2 py-0.5 bg-navy-900 text-cyan-accent text-[10px] font-bold rounded-md shadow-sm">
            NEW ARRIVAL
          </span>
        )}

        {product.isFeatured && (
          <span className="px-2 py-0.5 bg-brand-600 text-white text-[10px] font-bold rounded-md shadow-sm">
            FEATURED
          </span>
        )}
      </div>

      {/* Product Image */}
      <Link href={`/products/${product.slug}`} className="relative aspect-square w-full bg-slate-50 overflow-hidden block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.primaryImage || 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=600&q=80'}
          alt={product.title}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
      </Link>

      {/* Card Details */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Brand & Stock Row */}
          <div className="flex items-center justify-between text-xs mb-1.5 gap-2">
            <span className="font-semibold text-brand-600 uppercase tracking-wider text-[11px]">
              {product.brand?.name || 'Authorized'}
            </span>

            {product.stockStatus === 'IN_STOCK' ? (
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                <CheckCircle2 className="w-3 h-3" />
                <span>In Stock ({product.stockQuantity})</span>
              </span>
            ) : product.stockStatus === 'LOW_STOCK' ? (
              <span className="inline-flex items-center gap-1 text-[11px] text-amber-600 font-medium">
                <AlertTriangle className="w-3 h-3" />
                <span>Low Stock</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] text-rose-500 font-medium">
                Out of Stock
              </span>
            )}
          </div>

          {/* Product Title */}
          <Link href={`/products/${product.slug}`} className="block">
            <h3 className="font-semibold text-navy-900 group-hover:text-brand-600 transition text-sm leading-snug line-clamp-2">
              {product.title}
            </h3>
          </Link>

          {/* Short Description */}
          <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
            {product.shortDescription}
          </p>

          {/* Warranty tag */}
          {product.warranty && (
            <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-2">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-600" />
              <span>{product.warranty}</span>
            </div>
          )}
        </div>

        {/* Pricing & Actions */}
        <div className="pt-3 mt-3 border-t border-slate-100">
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-lg font-bold text-navy-900 font-mono">
              {formatNPR(currentPrice)}
            </span>
            {isDiscounted && (
              <span className="text-xs text-slate-400 line-through font-mono">
                {formatNPR(product.regularPrice)}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Link
              href={`/products/${product.slug}`}
              className="inline-flex items-center justify-center gap-1 px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              <span>Details</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <button
              onClick={() => onInquire ? onInquire(product) : window.location.href = `/contact?inquiry=${encodeURIComponent(product.title)}`}
              type="button"
              className="inline-flex items-center justify-center gap-1 px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-xs font-semibold transition shadow-sm"
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
