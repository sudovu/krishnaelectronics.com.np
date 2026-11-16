'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ChevronLeft, 
  ChevronRight, 
  ArrowRight, 
  ShieldCheck, 
  Zap, 
  Award, 
  Wrench,
  MapPin,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { BannerData } from '@/types';
import FormattedText from '@/components/common/FormattedText';

interface HeroSliderProps {
  banners: BannerData[];
}

export default function HeroSlider({ banners }: HeroSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Fallback banners based on verified authentic services & products
  const defaultBanners = [
    {
      id: 'default-1',
      title: 'Premium Electronics & Enterprise Networking in Surkhet',
      subtitle: 'Authorized Wi-Fi 6 routers, gigabit managed switches, Hikvision CCTV systems, and certified IT hardware solutions across Karnali Province.',
      badgeText: 'Official Hardware Hub • Surkhet',
      ctaText: 'Explore Hardware Catalog',
      ctaLink: '/products',
      imageUrl: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=1600&q=80',
      discountPercent: 15,
    },
    {
      id: 'default-2',
      title: 'Precision Chip-Level Laptop & Motherboard Repair Lab',
      subtitle: 'Advanced micro-soldering, liquid spill diagnostics, original display replacement, clean OS tuning, and corporate Annual Maintenance Contracts (AMC).',
      badgeText: 'Certified Diagnostic Lab • Birendranagar',
      ctaText: 'Book Service Inspection',
      ctaLink: '/services/computer-laptop-repair',
      imageUrl: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=1600&q=80',
      discountPercent: null,
    },
    {
      id: 'default-3',
      title: 'Smart IoT Automation & Facility Power Telemetry',
      subtitle: 'Intelligent water tank controllers, smart circuit breakers, Sonoff Wi-Fi power metering relays, and remote environmental monitoring.',
      badgeText: 'Smart IoT Solutions • Karnali',
      ctaText: 'Discover IoT Systems',
      ctaLink: '/services/iot-smart-device-solutions',
      imageUrl: 'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=1600&q=80',
      discountPercent: null,
    },
  ];

  const sliderBanners = (banners && banners.length > 0)
    ? banners.filter((b) => b.position === 'HERO_SLIDER' || !b.position)
    : [];

  const activeBanners = sliderBanners.length > 0 ? sliderBanners : defaultBanners;

  useEffect(() => {
    if (activeBanners.length <= 1 || isPaused) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
    }, 6500);
    return () => clearInterval(interval);
  }, [activeBanners.length, isPaused]);

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + activeBanners.length) % activeBanners.length);
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
  };

  const safeIndex = currentIndex < activeBanners.length ? currentIndex : 0;
  const current = activeBanners[safeIndex] || defaultBanners[0];

  return (
    <section 
      className="relative bg-gradient-to-b from-[#060B18] via-[#0B132B] to-[#0A1128] text-white overflow-hidden border-b border-navy-800"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Subtle Background Circuit Mesh & Ambient Glow */}
      <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#0066FF_1px,transparent_1px)] [background-size:28px_28px]"></div>
      <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-brand-600/15 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute top-1/2 -right-40 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 py-12 md:py-16 lg:py-20 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Hero Left Content Column */}
          <div className="lg:col-span-7 space-y-6">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-500/15 border border-brand-500/30 text-cyan-accent text-xs font-semibold uppercase tracking-wider backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-cyan-accent animate-ping"></span>
              <FormattedText text={current.badgeText || 'Krishna Electronics Order & Suppliers'} />
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-[1.15]">
              <FormattedText text={current.title} />
            </h1>

            {/* Subtitle */}
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-xl font-normal">
              <FormattedText text={current.subtitle} />
            </p>

            {/* CTAs and Active Offer Pill */}
            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <Link
                href={current.ctaLink || '/products'}
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 shadow-lg shadow-brand-500/30 hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>{current.ctaText || 'Explore Catalog'}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href="/services"
                className="inline-flex items-center gap-2 px-5 py-3.5 bg-navy-800/90 hover:bg-navy-700/90 text-slate-200 border border-slate-700/80 rounded-xl font-semibold text-xs tracking-wide transition-all backdrop-blur-sm"
              >
                <Wrench className="w-4 h-4 text-cyan-accent" />
                <span>Lab Repairs &amp; AMC</span>
              </Link>

              {current.discountPercent && (
                <div className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-500/15 border border-rose-500/30 rounded-xl text-rose-300 text-xs font-bold">
                  <Zap className="w-3.5 h-3.5 text-yellow-400" />
                  <span>Up to {current.discountPercent}% Off Promo</span>
                </div>
              )}
            </div>

            {/* Store Guarantee Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6 border-t border-navy-800/80">
              <div className="flex items-center gap-2.5 text-xs text-slate-300">
                <div className="w-7 h-7 rounded-lg bg-brand-500/20 text-cyan-accent flex items-center justify-center shrink-0 border border-brand-500/30">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-white">100% Genuine Brands</div>
                  <div className="text-[11px] text-slate-400">TP-Link, Dell, Hikvision</div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 text-xs text-slate-300">
                <div className="w-7 h-7 rounded-lg bg-brand-500/20 text-cyan-accent flex items-center justify-center shrink-0 border border-brand-500/30">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-white">Chip-Level Lab</div>
                  <div className="text-[11px] text-slate-400">Micro-soldering in Surkhet</div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 text-xs text-slate-300">
                <div className="w-7 h-7 rounded-lg bg-brand-500/20 text-cyan-accent flex items-center justify-center shrink-0 border border-brand-500/30">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-white">Valley Dispatch</div>
                  <div className="text-[11px] text-slate-400">Fast Karnali delivery</div>
                </div>
              </div>
            </div>
          </div>

          {/* Hero Right Visual Column */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-3xl overflow-hidden border border-slate-700/60 shadow-2xl bg-navy-900 group">
              {/* Product Visual */}
              <div className="aspect-[4/3] w-full overflow-hidden bg-gradient-to-tr from-navy-950 via-slate-900 to-navy-900 relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={current.imageUrl}
                  alt={current.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="eager"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-transparent to-transparent opacity-80 pointer-events-none"></div>
              </div>

              {/* Floating Verified Store Status Card */}
              <div className="absolute bottom-4 left-4 right-4 bg-navy-950/90 backdrop-blur-md p-3.5 rounded-2xl border border-slate-700/80 text-xs flex items-center justify-between shadow-xl">
                <div>
                  <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-cyan-accent" />
                    <span>Store Facility</span>
                  </div>
                  <div className="font-bold text-white text-xs mt-0.5">Birendranagar, Surkhet</div>
                </div>

                <div className="text-right border-l border-slate-800 pl-4">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Currency</div>
                  <div className="font-extrabold text-cyan-accent font-mono text-sm">NPR (रु)</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Slide Indicators and Navigation Controls */}
        {activeBanners.length > 1 && (
          <div className="flex items-center justify-between mt-8 pt-4 border-t border-navy-800/80">
            {/* Progress indicators */}
            <div className="flex items-center gap-2">
              {activeBanners.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    idx === safeIndex ? 'w-10 bg-gradient-to-r from-brand-500 to-cyan-accent' : 'w-2.5 bg-navy-800 hover:bg-navy-700'
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>

            {/* Prev/Next arrows */}
            <div className="flex items-center gap-2">
              <button
                onClick={prevSlide}
                className="p-2 rounded-xl bg-navy-900/90 border border-navy-700 hover:bg-navy-800 text-slate-300 hover:text-white transition shadow-sm"
                aria-label="Previous slide"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={nextSlide}
                className="p-2 rounded-xl bg-navy-900/90 border border-navy-700 hover:bg-navy-800 text-slate-300 hover:text-white transition shadow-sm"
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
