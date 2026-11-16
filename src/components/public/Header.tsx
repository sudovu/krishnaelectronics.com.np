'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  Printer,
  Menu, 
  X, 
  ChevronDown, 
  MessageSquare,
  Lock,
  Mail,
  Grid,
  Zap,
  ArrowRight,
  ExternalLink,
  Tag,
  CheckCircle2,
  SlidersHorizontal,
  ChevronRight
} from 'lucide-react';
import { SiteSettingsData, HomeConfigData } from '@/types';
import { formatNPR } from '@/lib/formatters';

interface HeaderProps {
  settings?: SiteSettingsData | null;
}

interface SearchSuggestion {
  id: string;
  title: string;
  slug: string;
  categoryName?: string;
  regularPrice: number;
  offerPrice?: number | null;
  primaryImage?: string;
}

const POPULAR_SEARCHES = [
  'Wi-Fi 6 Router',
  'Dell Laptop',
  'Hikvision ColorVu',
  'Sonoff Smart Relay',
  'HP 12A Toner',
  'Cat6 Structured Cabling',
];

const QUICK_CATEGORIES = [
  { name: 'Networking & Wi-Fi', slug: 'networking-and-connectivity', icon: Wifi, count: 'Routers & Switches' },
  { name: 'CCTV & Security', slug: 'surveillance-and-security', icon: ShieldCheck, count: 'ColorVu Cameras' },
  { name: 'Laptops & Computers', slug: 'computing-and-it-hardware', icon: Laptop, count: 'Business Laptops' },
  { name: 'IoT Smart Automation', slug: 'smart-electronics-and-iot', icon: Cpu, count: 'Relays & Telemetry' },
  { name: 'Printers & Toners', slug: 'printers-and-toners', icon: Printer, count: 'Genuine Cartridges' },
  { name: 'Extensions & Power', slug: 'electrical-and-power-accessories', icon: Zap, count: 'Micro Extension Cords' },
];

export default function Header({ settings }: HeaderProps) {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileCategoryOpen, setMobileCategoryOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<SearchSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [categoriesDropdown, setCategoriesDropdown] = useState(false);
  const [servicesDropdown, setServicesDropdown] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Close search suggestions on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Live search suggestions debounce
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q || q.length < 2) {
      setSearchSuggestions([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const handler = setTimeout(async () => {
      try {
        const res = await fetch(`/api/products?q=${encodeURIComponent(q)}&take=5`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.products)) {
            setSearchSuggestions(
              data.products.map((p: any) => ({
                id: p.id || p.slug,
                title: p.title,
                slug: p.slug,
                categoryName: p.category?.name,
                regularPrice: p.regularPrice,
                offerPrice: p.offerPrice,
                primaryImage: p.primaryImage,
              }))
            );
          }
        }
      } catch {
        setSearchSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    }, 220);

    return () => clearTimeout(handler);
  }, [searchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsSearchFocused(false);
      router.push(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSelectSuggestion = (slug: string) => {
    setIsSearchFocused(false);
    setSearchQuery('');
    router.push(`/products/${slug}`);
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

  // Preserve all 18 homeConfig header/banner keys
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
  const phone = settings?.contactPhone || '083-522006';
  const whatsapp = settings?.contactWhatsapp || '9858083951';
  const email = settings?.contactEmail || 'admin@krishnaelectronics.com.np';

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-sm transition-all duration-200">
      {/* 1. Top Utility & Notification Bar */}
      {showTopBar && (
        <div className="bg-[#0B132B] text-slate-300 text-xs py-2 px-4 border-b border-slate-800">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
            <div className="flex items-center gap-4 flex-wrap justify-center sm:justify-start">
              {topNotificationCustom ? (
                <span className="flex items-center gap-1.5 text-cyan-accent font-semibold tracking-wide">
                  <span className="w-2 h-2 rounded-full bg-cyan-accent animate-pulse"></span>
                  {topNotificationCustom}
                </span>
              ) : (
                <>
                  <span className="flex items-center gap-1.5 text-cyan-accent font-medium">
                    <MapPin className="w-3.5 h-3.5 text-brand-400 shrink-0" />
                    <span>{businessLocation}</span>
                  </span>
                  {phone && (
                    <a 
                      href={`tel:${phone}`} 
                      className="flex items-center gap-1 text-slate-300 hover:text-white transition font-medium border-l border-slate-700 pl-3"
                    >
                      <Phone className="w-3 h-3 text-brand-400 shrink-0" />
                      <span>{phone}</span>
                    </a>
                  )}
                  {email && (
                    <a 
                      href={`mailto:${email}`} 
                      className="hidden sm:flex items-center gap-1 text-slate-300 hover:text-white transition font-medium border-l border-slate-700 pl-3"
                    >
                      <Mail className="w-3 h-3 text-brand-400 shrink-0" />
                      <span>{email}</span>
                    </a>
                  )}
                  <span className="hidden lg:flex items-center gap-1 text-slate-400 border-l border-slate-700 pl-3 text-[11px]">
                    <Clock className="w-3 h-3 text-brand-400 shrink-0" />
                    <span>{businessHours}</span>
                  </span>
                </>
              )}
            </div>

            <div className="flex items-center gap-3 text-xs">
              {showTopContactLinks && (
                <>
                  {whatsapp && (
                    <a 
                      href={`https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 transition font-medium"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>WhatsApp Direct</span>
                    </a>
                  )}
                </>
              )}
              {showTopPortalLink && (
                <Link 
                  href="/admin/login" 
                  className="flex items-center gap-1 text-slate-400 hover:text-slate-200 border-l border-slate-700 pl-3 transition text-[11px]"
                  title="Staff Portal"
                >
                  <Lock className="w-3 h-3 text-slate-400" />
                  <span>Staff Portal</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. Festive / Seasonal Greeting Ribbon */}
      {homeConfig.showOccasionBanner && Boolean(homeConfig.occasionBannerText?.trim()) && (
        <div className="bg-gradient-to-r from-amber-600 via-rose-600 to-amber-600 text-white py-1.5 px-4 shadow-sm text-xs font-semibold overflow-hidden border-b border-amber-700/50">
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

      {/* 3. Main Brand & Search Header */}
      <div className="max-w-7xl mx-auto px-4 py-3 sm:py-3.5">
        <div className="flex items-center justify-between gap-4 lg:gap-8">
          {/* Logo & Brand Emblem */}
          <Link href="/" className="flex items-center gap-3 group shrink-0">
            <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl overflow-hidden bg-gradient-to-br from-white to-slate-100 p-1 border border-slate-200 shadow-md group-hover:shadow-lg group-hover:border-brand-500 transition-all duration-300 flex items-center justify-center ring-2 ring-brand-500/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={settings?.logoUrl || '/images/logo.png'}
                alt={`${displayHeading || 'Krishna Electronics'} Logo`}
                className="w-full h-full object-contain"
                width={56}
                height={56}
                loading="eager"
                decoding="async"
              />
            </div>
            {hasBrandText && (
              <div className="hidden xs:block">
                {displayHeading && (
                  <div className="font-extrabold text-base sm:text-lg lg:text-xl text-navy-900 tracking-tight leading-tight group-hover:text-brand-600 transition-colors">
                    {displayHeading}
                  </div>
                )}
                {displayTagline && (
                  <div className="text-[10px] sm:text-[11px] font-semibold text-slate-500 tracking-wider uppercase mt-0.5 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-500"></span>
                    <span className="truncate max-w-[280px] sm:max-w-none">{displayTagline}</span>
                  </div>
                )}
              </div>
            )}
          </Link>

          {/* Interactive Search Bar with Live Suggestions (Desktop) */}
          <div ref={searchContainerRef} className="hidden md:block flex-1 max-w-xl relative">
            <form onSubmit={handleSearch}>
              <div className="relative w-full">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  placeholder="Search Wi-Fi 6 routers, laptops, CCTV cameras, toners..."
                  className="w-full pl-10 pr-24 py-2.5 text-xs sm:text-sm bg-slate-50/80 hover:bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all outline-none text-slate-800 placeholder:text-slate-400"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-20 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full"
                    title="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="submit"
                  className="absolute right-1.5 top-1.5 bottom-1.5 px-4 bg-navy-900 hover:bg-brand-600 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
                >
                  <span>Search</span>
                </button>
              </div>
            </form>

            {/* Live Autocomplete / Suggestions Flyout */}
            {isSearchFocused && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200/90 py-3 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                {isSearching ? (
                  <div className="py-6 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></span>
                    <span>Searching products...</span>
                  </div>
                ) : searchSuggestions.length > 0 ? (
                  <div className="space-y-1">
                    <div className="px-4 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                      <span>Matching Products</span>
                      <span className="font-normal lowercase">Press enter to see all</span>
                    </div>
                    {searchSuggestions.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelectSuggestion(item.slug)}
                        className="w-full px-4 py-2 text-left hover:bg-slate-50 flex items-center justify-between gap-3 transition group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-lg bg-slate-100 overflow-hidden shrink-0 border border-slate-200 flex items-center justify-center">
                            {item.primaryImage ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={item.primaryImage} alt={item.title} className="w-full h-full object-cover" />
                            ) : (
                              <Search className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-navy-900 group-hover:text-brand-600 transition truncate">
                              {item.title}
                            </div>
                            {item.categoryName && (
                              <div className="text-[10px] text-slate-400 truncate">
                                {item.categoryName}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-xs font-bold text-navy-900 font-mono">
                            {formatNPR(item.offerPrice || item.regularPrice)}
                          </div>
                          {item.offerPrice && (
                            <div className="text-[10px] text-slate-400 line-through font-mono">
                              {formatNPR(item.regularPrice)}
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                    <div className="border-t border-slate-100 pt-2 px-4 mt-2">
                      <button
                        type="button"
                        onClick={handleSearch}
                        className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
                      >
                        <span>View all results for &quot;{searchQuery}&quot;</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : searchQuery.trim().length >= 2 ? (
                  <div className="px-4 py-6 text-center">
                    <p className="text-xs text-slate-600 font-medium">No direct matches for &quot;{searchQuery}&quot;</p>
                    <p className="text-[11px] text-slate-400 mt-1">Try searching by category, brand (e.g. TP-Link, Dell, Hikvision), or SKU.</p>
                  </div>
                ) : (
                  <div className="px-4 py-2 space-y-4">
                    {/* Trending Searches */}
                    <div>
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Zap className="w-3 h-3 text-amber-500" />
                        <span>Popular Searches</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {POPULAR_SEARCHES.map((term) => (
                          <button
                            key={term}
                            type="button"
                            onClick={() => {
                              setSearchQuery(term);
                              router.push(`/products?q=${encodeURIComponent(term)}`);
                              setIsSearchFocused(false);
                            }}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-brand-50 hover:text-brand-600 rounded-lg text-xs text-slate-600 transition"
                          >
                            {term}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Quick Category Jump */}
                    <div className="border-t border-slate-100 pt-3">
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                        Browse by Category
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {QUICK_CATEGORIES.slice(0, 4).map((cat) => {
                          const Icon = cat.icon;
                          return (
                            <Link
                              key={cat.slug}
                              href={`/products?category=${cat.slug}`}
                              onClick={() => setIsSearchFocused(false)}
                              className="flex items-center gap-2 p-2 rounded-xl hover:bg-slate-50 transition group"
                            >
                              <div className="w-7 h-7 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
                                <Icon className="w-3.5 h-3.5" />
                              </div>
                              <div className="min-w-0">
                                <div className="text-xs font-semibold text-navy-900 group-hover:text-brand-600 transition truncate">
                                  {cat.name}
                                </div>
                                <div className="text-[10px] text-slate-400 truncate">
                                  {cat.count}
                                </div>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action CTAs & Quick Buttons */}
          <div className="flex items-center gap-2.5">
            {showContactBtn && (
              <Link
                href="/contact"
                className="hidden xl:inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
              >
                <Phone className="w-3.5 h-3.5 text-slate-500" />
                <span>{contactBtnLabel}</span>
              </Link>
            )}

            {showBookRepairBtn && (
              <Link
                href="/services"
                className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-brand-500/20 hover:shadow-lg hover:shadow-brand-500/30"
              >
                <Wrench className="w-3.5 h-3.5 text-white" />
                <span>{bookRepairBtnLabel}</span>
              </Link>
            )}

            {whatsapp && (
              <a
                href={`https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent('Hello Krishna Electronics, I would like to inquire about your products and services.')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-sm"
                title="Chat with Store on WhatsApp"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Inquire</span>
              </a>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2.5 rounded-xl text-slate-700 hover:bg-slate-100 transition border border-slate-200"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Search input */}
        <form onSubmit={handleSearch} className="md:hidden mt-2.5">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products or services..."
              className="w-full pl-10 pr-20 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-brand-500 outline-none"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1.5 bottom-1.5 px-3 bg-brand-500 text-white text-xs font-semibold rounded-lg"
            >
              Search
            </button>
          </div>
        </form>
      </div>

      {/* 4. Primary Navigation Bar */}
      <nav className="bg-navy-950 text-white border-t border-navy-800 hidden md:block">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-1">
            {/* Mega Categories Dropdown */}
            <div 
              className="relative"
              onMouseEnter={() => setCategoriesDropdown(true)}
              onMouseLeave={() => setCategoriesDropdown(false)}
            >
              <button
                type="button"
                className="px-4 py-3 text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 transition-colors flex items-center gap-2 uppercase tracking-wide"
              >
                <Grid className="w-4 h-4 text-white" />
                <span>All Categories</span>
                <ChevronDown className="w-3.5 h-3.5 text-white/80" />
              </button>

              {categoriesDropdown && (
                <div className="absolute top-full left-0 w-80 bg-white text-navy-900 shadow-2xl rounded-b-2xl border border-slate-200 p-2 z-50">
                  <div className="p-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    Product Categories
                  </div>
                  <div className="space-y-1 mt-1">
                    {QUICK_CATEGORIES.map((cat) => {
                      const Icon = cat.icon;
                      return (
                        <Link
                          key={cat.slug}
                          href={`/products?category=${cat.slug}`}
                          onClick={() => setCategoriesDropdown(false)}
                          className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 text-slate-700 hover:text-brand-600 transition group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center shrink-0 group-hover:bg-brand-100 transition">
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-bold text-navy-900 group-hover:text-brand-600 transition">
                              {cat.name}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {cat.count}
                            </div>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-brand-600 transition" />
                        </Link>
                      );
                    })}
                  </div>
                  <div className="border-t border-slate-100 pt-2 px-2 mt-2">
                    <Link
                      href="/products"
                      onClick={() => setCategoriesDropdown(false)}
                      className="block text-center py-2 bg-slate-50 hover:bg-brand-50 text-brand-600 rounded-xl text-xs font-bold transition"
                    >
                      View Full Marketplace Catalog &rarr;
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <Link 
              href="/" 
              className="px-3.5 py-3 text-xs font-semibold text-slate-200 hover:text-cyan-accent transition tracking-wide"
            >
              HOME
            </Link>

            <Link 
              href="/products" 
              className="px-3.5 py-3 text-xs font-semibold text-slate-200 hover:text-cyan-accent transition tracking-wide"
            >
              PRODUCTS &amp; HARDWARE
            </Link>

            {/* Services Dropdown */}
            <div 
              className="relative"
              onMouseEnter={() => setServicesDropdown(true)}
              onMouseLeave={() => setServicesDropdown(false)}
            >
              <Link 
                href="/services" 
                className="px-3.5 py-3 text-xs font-semibold text-slate-200 hover:text-cyan-accent transition tracking-wide flex items-center gap-1"
              >
                <span>SERVICES &amp; LAB</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </Link>

              {servicesDropdown && (
                <div className="absolute top-full left-0 w-80 bg-white text-navy-900 shadow-2xl rounded-b-2xl border border-slate-200 p-2 z-50">
                  <div className="p-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    Certified Technical Services
                  </div>
                  <div className="space-y-1 mt-1">
                    <Link 
                      href="/services/computer-laptop-repair" 
                      onClick={() => setServicesDropdown(false)}
                      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 text-slate-700 hover:text-brand-600 transition"
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-brand-600 flex items-center justify-center shrink-0">
                        <Laptop className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-navy-900">Chip-Level Laptop Repair</div>
                        <div className="text-[10px] text-slate-400">Motherboard diagnostics &amp; screen replacement</div>
                      </div>
                    </Link>
                    <Link 
                      href="/services/networking-installation-maintenance" 
                      onClick={() => setServicesDropdown(false)}
                      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 text-slate-700 hover:text-brand-600 transition"
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-brand-600 flex items-center justify-center shrink-0">
                        <Wifi className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-navy-900">Networking &amp; Structured Cabling</div>
                        <div className="text-[10px] text-slate-400">Optical fiber &amp; enterprise Wi-Fi 6 setup</div>
                      </div>
                    </Link>
                    <Link 
                      href="/services/cctv-surveillance-installation" 
                      onClick={() => setServicesDropdown(false)}
                      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 text-slate-700 hover:text-brand-600 transition"
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-brand-600 flex items-center justify-center shrink-0">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-navy-900">CCTV Surveillance Systems</div>
                        <div className="text-[10px] text-slate-400">Hikvision ColorVu IP camera deployments</div>
                      </div>
                    </Link>
                    <Link 
                      href="/services/iot-smart-device-solutions" 
                      onClick={() => setServicesDropdown(false)}
                      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 text-slate-700 hover:text-brand-600 transition"
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-brand-600 flex items-center justify-center shrink-0">
                        <Cpu className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-navy-900">IoT &amp; Smart Home Automation</div>
                        <div className="text-[10px] text-slate-400">Tank controllers, Sonoff relays &amp; telemetry</div>
                      </div>
                    </Link>
                    <Link 
                      href="/services/maintenance-contracts-technical-support" 
                      onClick={() => setServicesDropdown(false)}
                      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 text-slate-700 hover:text-brand-600 transition"
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-brand-600 flex items-center justify-center shrink-0">
                        <Wrench className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-navy-900">Annual Maintenance Contracts (AMC)</div>
                        <div className="text-[10px] text-slate-400">Guaranteed response SLA for institutions</div>
                      </div>
                    </Link>
                  </div>
                  <div className="border-t border-slate-100 pt-2 px-2 mt-2">
                    <Link 
                      href="/services" 
                      onClick={() => setServicesDropdown(false)}
                      className="block text-center py-2 bg-slate-50 hover:bg-brand-50 text-brand-600 rounded-xl text-xs font-bold transition"
                    >
                      View All 7 Technical Services &rarr;
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <Link 
              href="/offers" 
              className="px-3.5 py-3 text-xs font-semibold text-cyan-accent hover:text-white transition tracking-wide flex items-center gap-1.5"
            >
              <span>SPECIAL OFFERS</span>
              <span className="w-2 h-2 rounded-full bg-cyan-accent animate-pulse"></span>
            </Link>

            <Link 
              href="/about" 
              className="px-3.5 py-3 text-xs font-semibold text-slate-200 hover:text-cyan-accent transition tracking-wide"
            >
              ABOUT US
            </Link>

            <Link 
              href="/contact" 
              className="px-3.5 py-3 text-xs font-semibold text-slate-200 hover:text-cyan-accent transition tracking-wide"
            >
              CONTACT &amp; STORE
            </Link>

            <Link 
              href="/faqs" 
              className="px-3.5 py-3 text-xs font-semibold text-slate-200 hover:text-cyan-accent transition tracking-wide"
            >
              FAQS
            </Link>
          </div>

          {showNavbarBadge && (
            <div className="text-xs text-slate-300 flex items-center gap-2 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>{navbarBadgeLabel}</span>
            </div>
          )}
        </div>
      </nav>

      {/* 5. Mobile Navigation Slide-Over Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-navy-950/70 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer Content */}
          <div className="relative ml-auto w-full max-w-sm bg-white h-full shadow-2xl flex flex-col z-10 overflow-y-auto">
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg overflow-hidden bg-white p-0.5 border border-slate-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={settings?.logoUrl || '/images/logo.png'} alt="Logo" className="w-full h-full object-contain" />
                </div>
                <div>
                  <div className="text-xs font-extrabold text-navy-900 leading-tight">Krishna Electronics</div>
                  <div className="text-[10px] text-slate-500 font-medium">Order &amp; Suppliers • Surkhet</div>
                </div>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Navigation Links */}
            <div className="p-4 space-y-1 flex-1">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2.5 rounded-xl text-sm font-semibold text-navy-900 hover:bg-slate-100"
              >
                Home
              </Link>
              <Link
                href="/products"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2.5 rounded-xl text-sm font-semibold text-navy-900 hover:bg-slate-100"
              >
                Products &amp; Hardware Marketplace
              </Link>

              {/* Mobile Category Accordion */}
              <div>
                <button
                  type="button"
                  onClick={() => setMobileCategoryOpen(!mobileCategoryOpen)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold text-navy-900 hover:bg-slate-100 text-left"
                >
                  <span>Product Categories</span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${mobileCategoryOpen ? 'rotate-180' : ''}`} />
                </button>
                {mobileCategoryOpen && (
                  <div className="pl-4 pr-2 py-1 space-y-1 bg-slate-50 rounded-xl my-1 border border-slate-100">
                    {QUICK_CATEGORIES.map((cat) => (
                      <Link
                        key={cat.slug}
                        href={`/products?category=${cat.slug}`}
                        onClick={() => setMobileMenuOpen(false)}
                        className="block py-2 text-xs font-medium text-slate-700 hover:text-brand-600"
                      >
                        {cat.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <Link
                href="/services"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2.5 rounded-xl text-sm font-semibold text-navy-900 hover:bg-slate-100"
              >
                Services &amp; Repair Lab
              </Link>

              <Link
                href="/offers"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold text-brand-600 hover:bg-brand-50"
              >
                <span>Special Offers</span>
                <span className="px-2 py-0.5 text-[10px] bg-red-100 text-red-600 font-bold rounded-full">PROMO</span>
              </Link>

              <Link
                href="/about"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2.5 rounded-xl text-sm font-semibold text-navy-900 hover:bg-slate-100"
              >
                About Krishna Electronics
              </Link>

              <Link
                href="/contact"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2.5 rounded-xl text-sm font-semibold text-navy-900 hover:bg-slate-100"
              >
                Contact &amp; Store Location
              </Link>

              <Link
                href="/faqs"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2.5 rounded-xl text-sm font-semibold text-navy-900 hover:bg-slate-100"
              >
                Frequently Asked Questions
              </Link>

              {/* Direct Store Actions */}
              <div className="pt-4 mt-4 border-t border-slate-100 space-y-2">
                {whatsapp && (
                  <a
                    href={`https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-sm"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>WhatsApp Inquiry Desk</span>
                  </a>
                )}
                {phone && (
                  <a
                    href={`tel:${phone}`}
                    className="flex items-center justify-center gap-2 w-full py-2.5 bg-navy-900 text-white rounded-xl text-xs font-bold"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Call Store: {phone}</span>
                  </a>
                )}
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 text-xs text-slate-500">
              <div className="flex items-center gap-1.5 font-medium text-slate-700 mb-1">
                <MapPin className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                <span>{businessLocation}</span>
              </div>
              <div className="text-[11px] text-slate-400">
                {businessHours}
              </div>
              <div className="mt-3 pt-2 border-t border-slate-200/80 flex items-center justify-between">
                <Link
                  href="/admin/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-[11px] font-semibold text-slate-500 hover:text-navy-900 flex items-center gap-1"
                >
                  <Lock className="w-3 h-3" />
                  <span>Admin / Staff Login</span>
                </Link>
                <span className="text-[11px] font-mono text-slate-400">NPR (रु)</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
