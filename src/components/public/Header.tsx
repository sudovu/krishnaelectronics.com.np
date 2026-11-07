'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Phone, 
  MapPin, 
  Clock, 
  Search, 
  Wrench, 
  ShieldCheck, 
  Cpu, 
  Wifi, 
  Laptop, 
  Menu, 
  X, 
  ChevronDown, 
  MessageSquare,
  Lock,
  Mail
} from 'lucide-react';
import { SiteSettingsData, HomeConfigData } from '@/types';

interface HeaderProps {
  settings?: SiteSettingsData | null;
}

export default function Header({ settings }: HeaderProps) {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [servicesDropdown, setServicesDropdown] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  let homeConfig: HomeConfigData = {};
  if (settings?.homeConfig) {
    try {
      homeConfig = typeof settings.homeConfig === 'string'
        ? JSON.parse(settings.homeConfig)
        : settings.homeConfig;
    } catch (_) {
      homeConfig = {};
    }
  }

  const showTopBar = homeConfig.showTopNotificationBar !== false;
  const topNotificationCustom = homeConfig.topNotificationText?.trim();
  const showTopContactLinks = homeConfig.showTopContactLinks !== false;
  const showTopPortalLink = homeConfig.showTopPortalLink !== false;

  const showHeaderHeading = homeConfig.showHeaderHeading !== false;
  const rawHeading = homeConfig.headerHeadingText !== undefined
    ? homeConfig.headerHeadingText
    : (settings?.siteName ?? 'Krishna Electronics Order & Suppliers');
  const displayHeading = showHeaderHeading ? rawHeading.trim() : '';

  const showHeaderTagline = homeConfig.showHeaderTagline !== false;
  const rawTagline = homeConfig.headerTaglineText !== undefined
    ? homeConfig.headerTaglineText
    : (settings?.siteTagline ?? 'PREMIUM ELECTRONICS, IOT SOLUTIONS & PROFESSIONAL TECHNICAL SERVICES IN SURKHET');
  const displayTagline = showHeaderTagline ? rawTagline.trim() : '';

  const hasBrandText = Boolean(displayHeading || displayTagline);

  const showContactBtn = homeConfig.showContactButton !== false;
  const contactBtnLabel = homeConfig.contactButtonLabel?.trim() || 'Contact Store';

  const showBookRepairBtn = homeConfig.showBookRepairButton !== false;
  const bookRepairBtnLabel = homeConfig.bookRepairButtonLabel?.trim() || 'Book Repair';

  const showNavbarBadge = homeConfig.showNavbarBadge !== false;
  const navbarBadgeLabel = homeConfig.navbarBadgeText?.trim() || 'Official Surkhet Store';

  const rawLocation = settings?.locationAddress || 'Birendranagar, Surkhet';
  const businessLocation = (rawLocation.includes('Birendranagar-12') || rawLocation === 'Birendranagar, Surkhet, Nepal')
    ? 'Birendranagar, Surkhet'
    : rawLocation;
  const businessHours = settings?.businessHours || 'Sun - Fri: 9:30 AM - 6:30 PM';
  const phone = settings?.contactPhone || '';
  const whatsapp = settings?.contactWhatsapp || '';
  const email = settings?.contactEmail || '';

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm border-b border-slate-200">
      {/* Top Notification & Utility Bar */}
      {showTopBar && (
        <div className="bg-navy-950 text-slate-300 text-xs py-2 px-4 border-b border-navy-800">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
            <div className="flex items-center gap-4 flex-wrap justify-center sm:justify-start">
              {topNotificationCustom ? (
                <span className="flex items-center gap-1.5 text-cyan-accent font-medium">
                  {topNotificationCustom}
                </span>
              ) : (
                <>
                  <span className="flex items-center gap-1.5 text-cyan-accent font-medium">
                    <MapPin className="w-3.5 h-3.5 text-brand-400" />
                    {businessLocation}
                  </span>
                  {phone && (
                    <a href={`tel:${phone}`} className="flex items-center gap-1 text-slate-200 hover:text-white transition font-medium border-l border-navy-800 pl-3">
                      <Phone className="w-3 h-3 text-brand-400" />
                      <span>{phone}</span>
                    </a>
                  )}
                  {email && (
                    <a href={`mailto:${email}`} className="hidden sm:flex items-center gap-1 text-slate-200 hover:text-white transition font-medium border-l border-navy-800 pl-3">
                      <Mail className="w-3 h-3 text-brand-400" />
                      <span>{email}</span>
                    </a>
                  )}
                </>
              )}
            </div>

            <div className="flex items-center gap-4 text-xs">
              {showTopContactLinks && (
                <>
                  {whatsapp && (
                    <a 
                      href={`https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 hover:text-green-400 transition"
                    >
                      <MessageSquare className="w-3 h-3 text-green-400" />
                      <span>WhatsApp Inquiry</span>
                    </a>
                  )}
                </>
              )}
              {showTopPortalLink && (
                <Link 
                  href="/admin/login" 
                  className="flex items-center gap-1 text-slate-400 hover:text-slate-200 border-l border-navy-800 pl-3 transition"
                  title="Staff Portal"
                >
                  <Lock className="w-3 h-3 text-slate-400" />
                  <span>Portal</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      
      {/* Special Occasion / Festive Greeting Rollable Ribbon */}
      {homeConfig.showOccasionBanner && Boolean(homeConfig.occasionBannerText?.trim()) && (
        <div className="bg-gradient-to-r from-amber-600 via-rose-600 to-amber-600 text-white py-2 px-4 shadow-sm text-xs font-semibold overflow-hidden border-b border-amber-700/50">
          <div className="max-w-7xl mx-auto flex items-center gap-3">
            <span className="shrink-0 bg-white/20 backdrop-blur-sm px-2.5 py-0.5 rounded-full text-[10px] tracking-wider uppercase font-bold text-amber-100 border border-white/30 flex items-center gap-1">
              <span>🎉</span>
              <span>{homeConfig.occasionBannerBadge?.trim() || 'Festive Greeting'}</span>
            </span>
            <div className="flex-1 overflow-hidden relative">
              {homeConfig.occasionBannerRollable !== false ? (
                <div className="animate-rollable-ticker py-0.5">
                  <span className="mr-12 flex items-center gap-2">
                    {homeConfig.occasionBannerText}
                  </span>
                  <span className="mr-12 flex items-center gap-2">
                    {homeConfig.occasionBannerText}
                  </span>
                </div>
              ) : (
                <div className="truncate text-center">
                  {homeConfig.occasionBannerText}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Branding & Search Navigation */}
      <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Logo & Brand Identity */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-2 border-brand-500 shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform bg-white p-1 flex-shrink-0 flex items-center justify-center ring-2 ring-brand-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={settings?.logoUrl || '/images/logo.png'}
                alt={`${displayHeading || 'Store'} Logo`}
                className="w-full h-full object-contain"
                width={128}
                height={128}
                loading="eager"
                decoding="async"
              />
            </div>
            {hasBrandText && (
              <div>
                {displayHeading && (
                  <div className="font-extrabold text-xl sm:text-2xl text-navy-900 tracking-tight leading-tight group-hover:text-brand-600 transition">
                    {displayHeading}
                  </div>
                )}
                {displayTagline && (
                  <p className="text-xs sm:text-sm font-semibold text-slate-700 tracking-wider uppercase mt-0.5">
                    {displayTagline}
                  </p>
                )}
              </div>
            )}
          </Link>

          {/* Desktop Search Bar */}
          <form onSubmit={handleSearch} className="hidden lg:flex flex-1 max-w-md mx-6">
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search routers, laptops, CCTV cameras, IoT sensors..."
                className="w-full pl-10 pr-24 py-2 text-sm bg-slate-50 border border-slate-300 rounded-full focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition outline-none"
              />
              <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-600" />
              <button
                type="submit"
                className="absolute right-1 top-1 bottom-1 px-4 bg-navy-900 hover:bg-brand-600 text-white text-xs font-semibold rounded-full transition"
              >
                Search
              </button>
            </div>
          </form>

          {/* Action CTAs */}
          <div className="hidden sm:flex items-center gap-3">
            {showContactBtn && (
              <Link
                href="/contact"
                className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition shadow-sm"
              >
                <Phone className="w-4 h-4 text-slate-500" />
                <span>{contactBtnLabel}</span>
              </Link>
            )}
            {showBookRepairBtn && (
              <Link
                href="/services"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-sm font-medium transition shadow-md shadow-brand-500/25"
              >
                <Wrench className="w-4 h-4 text-white" />
                <span>{bookRepairBtnLabel}</span>
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="sm:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Search input */}
        <form onSubmit={handleSearch} className="lg:hidden mt-3">
          <div className="relative w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products or services..."
              className="w-full pl-9 pr-20 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:border-brand-500 outline-none"
            />
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-600" />
            <button
              type="submit"
              className="absolute right-1 top-1 bottom-1 px-3 bg-brand-500 text-white text-xs font-medium rounded-md"
            >
              Search
            </button>
          </div>
        </form>
      </div>

      {/* Primary Navigation Links */}
      <nav className="bg-navy-900 text-white hidden sm:block">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Link 
              href="/" 
              className="px-3 py-2.5 text-xs font-semibold text-white hover:text-cyan-accent transition tracking-wide"
            >
              HOME
            </Link>

            <Link 
              href="/products" 
              className="px-3 py-2.5 text-xs font-semibold text-slate-200 hover:text-cyan-accent transition tracking-wide"
            >
              PRODUCTS &amp; MARKETPLACE
            </Link>

            {/* Services Dropdown */}
            <div 
              className="relative"
              onMouseEnter={() => setServicesDropdown(true)}
              onMouseLeave={() => setServicesDropdown(false)}
            >
              <Link 
                href="/services" 
                className="px-3 py-2.5 text-xs font-semibold text-slate-200 hover:text-cyan-accent transition tracking-wide flex items-center gap-1"
              >
                <span>SERVICES &amp; AMC</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </Link>

              {servicesDropdown && (
                <div className="absolute top-full left-0 w-72 bg-white text-navy-900 shadow-xl rounded-b-lg border border-slate-200 py-2 z-50">
                  <Link 
                    href="/services/computer-laptop-repair" 
                    className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium hover:bg-slate-50 text-slate-700 hover:text-brand-600"
                  >
                    <Laptop className="w-4 h-4 text-brand-500" />
                    <span>Computer &amp; Laptop Repair</span>
                  </Link>
                  <Link 
                    href="/services/networking-installation-maintenance" 
                    className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium hover:bg-slate-50 text-slate-700 hover:text-brand-600"
                  >
                    <Wifi className="w-4 h-4 text-brand-500" />
                    <span>Networking &amp; Structured Cabling</span>
                  </Link>
                  <Link 
                    href="/services/cctv-surveillance-installation" 
                    className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium hover:bg-slate-50 text-slate-700 hover:text-brand-600"
                  >
                    <ShieldCheck className="w-4 h-4 text-brand-500" />
                    <span>CCTV &amp; Surveillance Systems</span>
                  </Link>
                  <Link 
                    href="/services/iot-smart-device-solutions" 
                    className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium hover:bg-slate-50 text-slate-700 hover:text-brand-600"
                  >
                    <Cpu className="w-4 h-4 text-brand-500" />
                    <span>IoT &amp; Smart Home Automation</span>
                  </Link>
                  <Link 
                    href="/services/maintenance-contracts-technical-support" 
                    className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium hover:bg-slate-50 text-slate-700 hover:text-brand-600"
                  >
                    <Wrench className="w-4 h-4 text-brand-500" />
                    <span>Annual Maintenance Contracts (AMC)</span>
                  </Link>
                  <div className="border-t border-slate-100 mt-1 pt-1">
                    <Link 
                      href="/services" 
                      className="block px-4 py-2 text-xs font-bold text-brand-600 hover:underline"
                    >
                      View All 7 Technical Services &rarr;
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <Link 
              href="/offers" 
              className="px-3 py-2.5 text-xs font-semibold text-cyan-accent hover:text-white transition tracking-wide flex items-center gap-1"
            >
              <span>SPECIAL OFFERS</span>
              <span className="w-2 h-2 rounded-full bg-cyan-accent animate-pulse"></span>
            </Link>

            <Link 
              href="/about" 
              className="px-3 py-2.5 text-xs font-semibold text-slate-200 hover:text-cyan-accent transition tracking-wide"
            >
              ABOUT US
            </Link>

            <Link 
              href="/contact" 
              className="px-3 py-2.5 text-xs font-semibold text-slate-200 hover:text-cyan-accent transition tracking-wide"
            >
              CONTACT &amp; STORE
            </Link>

            <Link 
              href="/faqs" 
              className="px-3 py-2.5 text-xs font-semibold text-slate-200 hover:text-cyan-accent transition tracking-wide"
            >
              FAQS
            </Link>
          </div>

          {showNavbarBadge && (
            <div className="text-xs text-slate-300 flex items-center gap-2 font-mono">
              <span className="text-cyan-accent">●</span> {navbarBadgeLabel}
            </div>
          )}
        </div>
      </nav>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="sm:hidden bg-white border-b border-slate-200 px-4 py-3 space-y-2">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-semibold text-navy-900 hover:text-brand-600"
          >
            Home
          </Link>
          <Link
            href="/products"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-semibold text-navy-900 hover:text-brand-600"
          >
            Products Marketplace
          </Link>
          <Link
            href="/services"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-semibold text-navy-900 hover:text-brand-600"
          >
            Services &amp; Maintenance (AMC)
          </Link>
          <Link
            href="/offers"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-semibold text-brand-600 hover:text-brand-700"
          >
            Special Offers
          </Link>
          <Link
            href="/about"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-semibold text-navy-900 hover:text-brand-600"
          >
            About Krishna Electronics
          </Link>
          <Link
            href="/contact"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-semibold text-navy-900 hover:text-brand-600"
          >
            Contact &amp; Store Location
          </Link>
          <Link
            href="/faqs"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-semibold text-navy-900 hover:text-brand-600"
          >
            FAQs
          </Link>
          <div className="pt-2 border-t border-slate-100 flex gap-2">
            <Link
              href="/contact"
              onClick={() => setMobileMenuOpen(false)}
              className="flex-1 text-center py-2 bg-slate-100 rounded-lg text-xs font-semibold text-slate-700"
            >
              Contact Us
            </Link>
            <Link
              href="/admin/login"
              onClick={() => setMobileMenuOpen(false)}
              className="flex-1 text-center py-2 bg-navy-900 text-white rounded-lg text-xs font-semibold"
            >
              Admin Portal
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
