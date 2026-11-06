'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  X, 
  Sparkles, 
  ArrowRight, 
  Tag, 
  Copy, 
  Check, 
  Flame 
} from 'lucide-react';
import { BannerData } from '@/types';
import FormattedText from '@/components/common/FormattedText';

interface CampaignPopupProps {
  banners: BannerData[];
}

export default function CampaignPopup({ banners }: CampaignPopupProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeBanner, setActiveBanner] = useState<BannerData | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!banners || banners.length === 0) return;

    // 1. Prioritize explicit POPUP_MODAL banners
    let chosen = banners.find((b) => b.isApproved && b.position === 'POPUP_MODAL');

    // 2. Otherwise use the primary live campaign
    if (!chosen) {
      chosen = banners.find((b) => b.isApproved && (b.status === 'PUBLISHED' || b.status === undefined));
    }

    if (!chosen) return;

    setActiveBanner(chosen);

    // Check if dismissed in this session
    const storageKey = `dismissed_campaign_${chosen.id}`;
    const wasDismissed = typeof window !== 'undefined' ? sessionStorage.getItem(storageKey) : null;
    const isForcePreview = typeof window !== 'undefined' && window.location.search.includes('popup=1');

    if (!wasDismissed || isForcePreview) {
      // Smooth delayed popup on landing
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [banners]);

  const handleClose = () => {
    if (activeBanner) {
      try {
        sessionStorage.setItem(`dismissed_campaign_${activeBanner.id}`, 'true');
      } catch (e) {
        // ignore
      }
    }
    setIsOpen(false);
  };

  const handleCopyCode = (code: string) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isOpen || !activeBanner) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/75 backdrop-blur-md transition-opacity duration-300"
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-lg bg-navy-900 border border-brand-500/40 rounded-3xl shadow-2xl shadow-brand-500/30 overflow-hidden text-white transform transition-transform duration-300 scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-3.5 right-3.5 z-20 w-8 h-8 rounded-full bg-navy-950/80 hover:bg-navy-950 text-white/80 hover:text-white border border-white/10 flex items-center justify-center transition shadow-lg"
          aria-label="Close Campaign Popup"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Campaign Visual Header */}
        <div className="relative aspect-[16/9] w-full bg-navy-950 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={activeBanner.imageUrl || 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=1200&q=80'}
            alt={activeBanner.title || 'Special Promotion'}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-navy-900 via-navy-900/30 to-transparent"></div>

          {/* Discount Pill Sticker */}
          {activeBanner.discountPercent && (
            <div className="absolute top-3.5 left-3.5 px-3 py-1 rounded-full bg-red-600 text-white text-xs font-black tracking-wider uppercase shadow-lg flex items-center gap-1.5 animate-bounce">
              <Flame className="w-3.5 h-3.5" />
              <span>{activeBanner.discountPercent}% SPECIAL DISCOUNT</span>
            </div>
          )}
        </div>

        {/* Campaign Details & Content */}
        <div className="p-6 md:p-7 space-y-4 -mt-6 relative z-10">
          {/* Badge */}
          {activeBanner.badgeText && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/20 border border-brand-500/40 text-cyan-accent text-[11px] font-bold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-accent animate-ping"></span>
              <FormattedText text={activeBanner.badgeText} />
            </div>
          )}

          {/* Headline */}
          <h2 className="text-xl sm:text-2xl font-black text-white leading-snug tracking-tight">
            <FormattedText text={activeBanner.title} />
          </h2>

          {/* Subtitle Description */}
          {activeBanner.subtitle && (
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              <FormattedText text={activeBanner.subtitle} />
            </p>
          )}

          {/* Coupon Code Strip (if available) */}
          {activeBanner.couponCode && (
            <div className="p-3 bg-navy-950/80 border border-brand-500/30 rounded-xl flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs">
                <Tag className="w-3.5 h-3.5 text-cyan-accent shrink-0" />
                <span className="text-slate-400">Coupon:</span>
                <span className="font-mono font-bold text-cyan-accent tracking-wider uppercase">
                  {activeBanner.couponCode}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleCopyCode(activeBanner.couponCode!)}
                className="px-2.5 py-1 bg-brand-500/20 hover:bg-brand-500/30 text-cyan-accent text-[11px] font-bold rounded-lg transition flex items-center gap-1"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <Link
              href={activeBanner.ctaLink || '/products'}
              onClick={handleClose}
              className="w-full sm:flex-1 py-3 px-5 bg-brand-500 hover:bg-brand-600 text-white font-extrabold rounded-xl transition shadow-lg shadow-brand-500/30 flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
            >
              <span>{activeBanner.ctaText || 'Explore Campaign'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <button
              type="button"
              onClick={handleClose}
              className="w-full sm:w-auto py-2.5 px-4 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 text-xs font-semibold rounded-xl transition"
            >
              Continue to Store &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
