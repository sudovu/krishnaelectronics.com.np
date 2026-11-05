'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, ArrowRight, Shield, Zap, Award, Wrench } from 'lucide-react';
import { BannerData } from '@/types';
import FormattedText from '@/components/common/FormattedText';

interface HeroSliderProps {
  banners: BannerData[];
}

export default function HeroSlider({ banners }: HeroSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Fallback banner if none in DB
  const defaultBanners = [
    {
      id: 'default-1',
      title: 'Smart Tech & Enterprise Networking in Surkhet',
      subtitle: 'Official Wi-Fi 6 Routers, Gigabit Switches, IoT Controllers, and Certified IT Infrastructure Solutions.',
      badgeText: 'Official Tech Hub • Surkhet',
      ctaText: 'Explore Marketplace',
      ctaLink: '/products',
      imageUrl: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=1600&q=80',
      discountPercent: 15,
    },
    {
      id: 'default-2',
      title: 'Precision Chip-Level Laptop & PC Repair Lab',
      subtitle: 'Motherboard micro-soldering, liquid damage recovery, broken screen replacement & clean OS tuning.',
      badgeText: 'Diagnostic Lab • Birendranagar-12',
      ctaText: 'Book Service Inspection',
      ctaLink: '/services/computer-laptop-repair',
      imageUrl: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=1600&q=80',
      discountPercent: null,
    },
  ];

  const activeBanners = banners && banners.length > 0 ? banners : defaultBanners;

  useEffect(() => {
    if (activeBanners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [activeBanners.length]);

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + activeBanners.length) % activeBanners.length);
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
  };

  const current = activeBanners[currentIndex];

  return (
    <section className="relative bg-navy-950 text-white overflow-hidden border-b border-navy-800">
      {/* Background Graphic Accents */}
      <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#0066FF_1px,transparent_1px)] [background-size:24px_24px]"></div>
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-brand-500/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-cyan-accent/15 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 py-12 md:py-16 lg:py-20 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Slide Text Content */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 border border-brand-500/40 text-cyan-accent text-xs font-semibold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-cyan-accent animate-ping"></span>
              <FormattedText text={current.badgeText || 'Krishna Electronics Order & Suppliers'} />
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
              <FormattedText text={current.title} />
            </h1>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-xl">
              <FormattedText text={current.subtitle} />
            </p>

            {/* CTAs & Discount info */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                href={current.ctaLink || '/products'}
                className="inline-flex items-center gap-2 px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-lg font-bold text-sm transition shadow-lg shadow-brand-500/30 hover:scale-[1.02]"
              >
                <span>{current.ctaText || 'Explore Catalog'}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href="/services"
                className="inline-flex items-center gap-2 px-5 py-3 bg-navy-800 hover:bg-navy-700 text-slate-200 border border-navy-700 rounded-lg font-semibold text-sm transition"
              >
                <Wrench className="w-4 h-4 text-cyan-accent" />
                <span>Repair &amp; AMC Services</span>
              </Link>

              {current.discountPercent && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-accent text-xs font-bold">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  <span>Up to {current.discountPercent}% Off Active Promo</span>
                </div>
              )}
            </div>

            {/* Credibility Badges */}
            <div className="grid grid-cols-3 gap-3 pt-6 border-t border-navy-800/80">
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <Shield className="w-4 h-4 text-cyan-accent shrink-0" />
                <span>Authorized Hardware</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <Award className="w-4 h-4 text-cyan-accent shrink-0" />
                <span>Certified Lab Techs</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <Zap className="w-4 h-4 text-cyan-accent shrink-0" />
                <span>Fast Valley Delivery</span>
              </div>
            </div>
          </div>

          {/* Slide Visual Hero Graphic */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-2xl overflow-hidden border border-navy-700 shadow-2xl bg-navy-900 group">
              <div className="aspect-[4/3] w-full overflow-hidden bg-navy-950">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={current.imageUrl}
                  alt={current.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>

              {/* Glowing Overlay border */}
              <div className="absolute inset-0 border-2 border-brand-500/20 rounded-2xl pointer-events-none"></div>

              {/* Floating Status Pill */}
              <div className="absolute bottom-4 left-4 right-4 bg-navy-950/85 backdrop-blur-md p-3 rounded-xl border border-navy-700 text-xs flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Location</div>
                  <div className="font-semibold text-white">Birendranagar-12, Surkhet</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Default Currency</div>
                  <div className="font-semibold text-cyan-accent font-mono">NPR (रु)</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Slider Controls */}
        {activeBanners.length > 1 && (
          <div className="flex items-center justify-between mt-8 pt-4 border-t border-navy-800">
            <div className="flex items-center gap-2">
              {activeBanners.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-2 rounded-full transition-all ${
                    idx === currentIndex ? 'w-8 bg-cyan-accent' : 'w-2 bg-navy-700 hover:bg-navy-600'
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={prevSlide}
                className="p-2 rounded-lg bg-navy-900 border border-navy-800 hover:bg-navy-800 text-slate-300 hover:text-white transition"
                aria-label="Previous slide"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={nextSlide}
                className="p-2 rounded-lg bg-navy-900 border border-navy-800 hover:bg-navy-800 text-slate-300 hover:text-white transition"
                aria-label="Next slide"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
