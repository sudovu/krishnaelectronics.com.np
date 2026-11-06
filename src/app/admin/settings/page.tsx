'use client';

import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  CreditCard, 
  Truck, 
  Globe,
  Palette,
  Type,
  Sparkles,
  Eye,
  Home,
  Layers,
  Zap,
  Wrench,
  Award,
  Share2,
  Search,
  RotateCcw,
  Check,
  ShieldCheck,
  Smartphone,
  Sliders,
  LayoutTemplate
} from 'lucide-react';
import { SiteSettingsData, HomeConfigData } from '@/types';

const THEME_PRESETS = [
  {
    name: 'Electric Blue (Default)',
    primaryColor: '#0066FF',
    secondaryColor: '#0052cc',
    accentColor: '#00F0FF',
    darkSurface: '#0B132B',
    lightSurface: '#F8FAFC',
    fontFamily: 'Inter',
  },
  {
    name: 'Emerald Tech',
    primaryColor: '#059669',
    secondaryColor: '#047857',
    accentColor: '#10B981',
    darkSurface: '#062C24',
    lightSurface: '#F0FDF4',
    fontFamily: 'Plus Jakarta Sans',
  },
  {
    name: 'Royal Indigo',
    primaryColor: '#6366F1',
    secondaryColor: '#4F46E5',
    accentColor: '#A855F7',
    darkSurface: '#0F172A',
    lightSurface: '#F8FAFC',
    fontFamily: 'Outfit',
  },
  {
    name: 'Crimson Tech',
    primaryColor: '#DC2626',
    secondaryColor: '#B91C1C',
    accentColor: '#F87171',
    darkSurface: '#1A0B0E',
    lightSurface: '#FFF5F5',
    fontFamily: 'Poppins',
  },
  {
    name: 'Amber Gold',
    primaryColor: '#D97706',
    secondaryColor: '#B45309',
    accentColor: '#FBBF24',
    darkSurface: '#1A160E',
    lightSurface: '#FFFBEB',
    fontFamily: 'Montserrat',
  },
  {
    name: 'Cyber Midnight',
    primaryColor: '#2563EB',
    secondaryColor: '#1D4ED8',
    accentColor: '#38BDF8',
    darkSurface: '#020617',
    lightSurface: '#0B132B',
    fontFamily: 'Inter',
  },
];

const AVAILABLE_FONTS = [
  { name: 'Inter', desc: 'Modern, clean, balanced typography (Default)' },
  { name: 'Poppins', desc: 'Geometric, stylish, high-impact headings' },
  { name: 'Outfit', desc: 'Trendy, sleek, ultra-modern tech' },
  { name: 'Plus Jakarta Sans', desc: 'Contemporary crisp enterprise feel' },
  { name: 'Roboto', desc: 'Classic, universal, structured readability' },
  { name: 'Montserrat', desc: 'Bold, elegant, architectural presence' },
  { name: 'Open Sans', desc: 'Neutral, warm, highly legible' },
];

const DEFAULT_HOME_CONFIG: HomeConfigData = {
  // Top Header & Heading Customization
  showHeaderHeading: true,
  headerHeadingText: 'Krishna Electronics Order & Suppliers',
  showHeaderTagline: true,
  headerTaglineText: 'PREMIUM ELECTRONICS, IOT SOLUTIONS & PROFESSIONAL TECHNICAL SERVICES IN SURKHET',
  showTopNotificationBar: true,
  topNotificationText: '',
  showTopContactLinks: true,
  showTopPortalLink: true,
  showContactButton: true,
  contactButtonLabel: 'Contact Store',
  showBookRepairButton: true,
  bookRepairButtonLabel: 'Book Repair',
  showNavbarBadge: true,
  navbarBadgeText: 'Official Surkhet Store',
  // Category Section
  categoryBadge: 'Explore Department Catalogs',
  categoryTitle: 'Product Categories',
  categorySubtitle: 'Select a specialized category for commercial equipment, networking, and smart electronics.',
  // Featured Section
  featuredBadge: 'Verified Top Recommendations',
  featuredTitle: 'Featured Electronics & Hardware',
  featuredSubtitle: 'Top-selling routers, surveillance cameras, laptops, and IoT devices in Surkhet.',
  // Mid Showcase Section
  showcaseBadge: 'Next-Gen Smart Living',
  showcaseTitle: 'Transform Your Home & Facility with IoT Automation',
  showcaseSubtitle: 'We supply and commission automated water tank controllers, smart circuit breakers, Sonoff/Tuya Wi-Fi relays, and environmental telemetry sensors across Karnali Province. Control everything from your smartphone.',
  showcaseCtaText: 'Explore IoT Solutions',
  showcaseCtaLink: '/services/iot-smart-device-solutions',
  showcaseCtaSecondaryText: 'Request Smart Site Survey',
  showcaseCtaSecondaryLink: '/contact',
  showcaseFeature1Title: 'Mobile App',
  showcaseFeature1Desc: 'Remote control of lights, pumps & AC from anywhere',
  showcaseFeature2Title: 'Energy Saving',
  showcaseFeature2Desc: 'Real-time kWh telemetry & automated cut-off schedules',
  showcaseFeature3Title: 'Tank Automation',
  showcaseFeature3Desc: 'Automatic water pump on/off with dry-run protection',
  showcaseFeature4Title: 'Professional Lab',
  showcaseFeature4Desc: 'Tested and calibrated for local 220V grid stability',
  // Services Section
  servicesBadge: 'Certified Laboratory & On-Site Support',
  servicesTitle: 'Repair, Installation & Maintenance Services',
  servicesSubtitle: 'From chip-level laptop motherboard diagnostics to enterprise optical fiber cabling and corporate Annual Maintenance Contracts (AMC).',
  // Why Choose Us Section
  whyTitle: 'Why Customers Rely on Us',
  whySubtitle: 'Serving Birendranagar and Karnali Province with genuine hardware, transparent pricing, and deep technical mastery.',
  whyCard1Title: '100% Genuine Brands',
  whyCard1Desc: 'Authorized TP-Link, MikroTik, Hikvision, Dell, HP, and Sonoff equipment with genuine manufacturer warranties.',
  whyCard2Title: 'Chip-Level Repair Lab',
  whyCard2Desc: 'Advanced micro-soldering, motherboard component tracing, clean OS flashing, and diagnostic instruments under one roof.',
  whyCard3Title: 'Enterprise AMC Contracts',
  whyCard3Desc: 'Guaranteed response SLA, routine preventative maintenance, and on-call engineer dispatch for institutions.',
  whyCard4Title: 'Local Store & Lab',
  whyCard4Desc: 'Walk into our physical facility in Surkhet for direct consultation, live testing, and handover.',
  // Store Location & Visit Section
  locationBadge: 'Visit Our Local Facility',
  locationTitle: 'Krishna Electronics Order & Suppliers',
  locationSubtitle: 'Whether you need a quick laptop diagnostic, a custom CCTV quote for your property, or bulk office IT equipment, our doors are open.',
};

type SettingsTab = 'all' | 'header' | 'homepage' | 'theme' | 'identity' | 'contact' | 'seo' | 'store';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SiteSettingsData | null>(null);
  const [homeConfig, setHomeConfig] = useState<HomeConfigData>(DEFAULT_HOME_CONFIG);
  const [activeTab, setActiveTab] = useState<SettingsTab>('all');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => {
        if (data.settings) {
          setSettings(data.settings);
          if (data.settings.homeConfig) {
            try {
              const parsed = typeof data.settings.homeConfig === 'string'
                ? JSON.parse(data.settings.homeConfig)
                : data.settings.homeConfig;
              setHomeConfig({ ...DEFAULT_HOME_CONFIG, ...parsed });
            } catch (_) {
              setHomeConfig(DEFAULT_HOME_CONFIG);
            }
          } else {
            setHomeConfig(DEFAULT_HOME_CONFIG);
          }
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to fetch settings');
        setLoading(false);
      });
  }, []);

  const handleChange = (field: keyof SiteSettingsData, value: any) => {
    if (!settings) return;
    setSettings({ ...settings, [field]: value });
  };

  const handleHomeConfigChange = (field: keyof HomeConfigData, value: any) => {
    setHomeConfig((prev) => ({ ...prev, [field]: value }));
  };

  const resetHomeConfigToDefaults = () => {
    if (confirm('Reset all homepage sections, badges, headlines, and trust cards to system defaults?')) {
      setHomeConfig({ ...DEFAULT_HOME_CONFIG });
      setMessage('Homepage text reset to defaults. Click "Save Settings" below to commit changes.');
    }
  };

  const applyPreset = (preset: typeof THEME_PRESETS[0]) => {
    if (!settings) return;
    setSettings({
      ...settings,
      primaryColor: preset.primaryColor,
      secondaryColor: preset.secondaryColor,
      accentColor: preset.accentColor,
      darkSurface: preset.darkSurface,
      lightSurface: preset.lightSurface,
      fontFamily: preset.fontFamily,
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      const payload = {
        ...settings,
        homeConfig: JSON.stringify(homeConfig),
      };

      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      let data = null;
      const text = await res.text();
      if (text) {
        try {
          data = JSON.parse(text);
        } catch (_) {}
      }

      if (!res.ok) {
        const errorMsg =
          (data && data.error) ||
          (text && text.length < 300 ? text : null) ||
          `Server returned error ${res.status} (${res.statusText || 'Request failed'})`;
        throw new Error(errorMsg);
      }

      setMessage('Website operational settings, homepage copy, and branding updated successfully!');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setError(err.message || 'Error updating settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-xs text-slate-500">
        Loading site settings...
      </div>
    );
  }

  const primaryCol = settings?.primaryColor || '#0066FF';
  const secondaryCol = settings?.secondaryColor || '#0052cc';
  const accentCol = settings?.accentColor || '#00F0FF';
  const darkSurf = settings?.darkSurface || '#0B132B';
  const lightSurf = settings?.lightSurface || '#F8FAFC';
  const fontFam = settings?.fontFamily || 'Inter';

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-navy-900 tracking-tight flex items-center gap-2">
            <Settings className="w-6 h-6 text-brand-500" />
            <span>Website Settings &amp; Section Customizer</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Customize homepage section headlines, visual design, fonts, brand colors, contact channels, and SEO.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="self-start sm:self-auto px-5 py-2.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl transition shadow-md shadow-brand-500/25 flex items-center gap-2 uppercase tracking-wider shrink-0"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save Settings'}</span>
        </button>
      </div>

      {message && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 shadow-sm">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span className="font-medium">{message}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl flex items-center gap-2 shadow-sm">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* Tab Filter Navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200 text-xs">
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`px-3.5 py-2 rounded-lg font-bold transition shrink-0 ${
            activeTab === 'all'
              ? 'bg-navy-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          View All
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('header')}
          className={`px-3.5 py-2 rounded-lg font-bold transition flex items-center gap-1.5 shrink-0 ${
            activeTab === 'header'
              ? 'bg-brand-500 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>🏷️ Header &amp; Headings</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('homepage')}
          className={`px-3.5 py-2 rounded-lg font-bold transition flex items-center gap-1.5 shrink-0 ${
            activeTab === 'homepage'
              ? 'bg-brand-500 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Home className="w-3.5 h-3.5" />
          <span>🏠 Homepage Customizer</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('theme')}
          className={`px-3.5 py-2 rounded-lg font-bold transition flex items-center gap-1.5 shrink-0 ${
            activeTab === 'theme'
              ? 'bg-brand-500 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Palette className="w-3.5 h-3.5" />
          <span>Visual Theme &amp; Fonts</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('identity')}
          className={`px-3.5 py-2 rounded-lg font-bold transition flex items-center gap-1.5 shrink-0 ${
            activeTab === 'identity'
              ? 'bg-brand-500 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>Business Profile</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('contact')}
          className={`px-3.5 py-2 rounded-lg font-bold transition flex items-center gap-1.5 shrink-0 ${
            activeTab === 'contact'
              ? 'bg-brand-500 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>Location &amp; Channels</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('seo')}
          className={`px-3.5 py-2 rounded-lg font-bold transition flex items-center gap-1.5 shrink-0 ${
            activeTab === 'seo'
              ? 'bg-brand-500 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Social &amp; SEO</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('store')}
          className={`px-3.5 py-2 rounded-lg font-bold transition flex items-center gap-1.5 shrink-0 ${
            activeTab === 'store'
              ? 'bg-brand-500 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>Currency &amp; Store</span>
        </button>
      </div>

      {settings && (
        <form onSubmit={handleSave} className="space-y-6 text-xs">
          
          {/* ======================================================== */}
          {/* TAB: TOP HEADER & HEADING CONTROLS                       */}
          {/* ======================================================== */}
          {(activeTab === 'all' || activeTab === 'header' || activeTab === 'identity') && (
            <div className="bg-white p-6 rounded-2xl border-2 border-brand-500/30 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                <div>
                  <h2 className="text-sm font-extrabold text-navy-900 uppercase tracking-wider flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-brand-500" />
                    <span>🏷️ Top Header, Headings &amp; Banner Customizer</span>
                  </h2>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Change or completely remove the store heading, subheading/tagline, top notification bar, buttons, and badges.
                  </p>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full uppercase tracking-wider">
                  Live Changeable &amp; Removable
                </span>
              </div>

              {/* Live Mini Header Preview */}
              <div className="p-4 bg-slate-100 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                  <span className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5 text-brand-500" /> Live Header Preview (Real-Time)
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">Shows how your header will appear to visitors</span>
                </div>
                
                {/* Mock Browser Header */}
                <div className="bg-white rounded-lg border border-slate-300 shadow-sm overflow-hidden text-xs">
                  {/* Top Bar Preview */}
                  {homeConfig.showTopNotificationBar !== false ? (
                    <div className="bg-navy-950 text-slate-300 px-3 py-1.5 flex justify-between items-center text-[10px]">
                      <span className="text-cyan-accent flex items-center gap-1 truncate">
                        <MapPin className="w-3 h-3 text-brand-400 shrink-0" />
                        {homeConfig.topNotificationText?.trim() || settings.locationAddress || 'Birendranagar-12, Surkhet, Nepal'}
                      </span>
                      <div className="flex items-center gap-2 text-slate-400">
                        {homeConfig.showTopContactLinks !== false && <span>{settings.contactPhone || 'Phone'}</span>}
                        {homeConfig.showTopPortalLink !== false && <span className="border-l border-navy-800 pl-2">Portal</span>}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-200 text-slate-500 px-3 py-1 text-[10px] italic text-center border-b border-dashed border-slate-300">
                      Top Announcement Bar is Hidden / Removed
                    </div>
                  )}

                  {/* Main Header Preview */}
                  <div className="p-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-white border border-brand-500 overflow-hidden p-0.5 shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={settings.logoUrl || '/images/logo.jpg'} alt="Logo" className="w-full h-full object-contain" />
                      </div>
                      {(homeConfig.showHeaderHeading !== false || homeConfig.showHeaderTagline !== false) ? (
                        <div>
                          {homeConfig.showHeaderHeading !== false && (
                            <div className="font-extrabold text-navy-900 text-xs sm:text-sm leading-tight">
                              {homeConfig.headerHeadingText !== undefined ? homeConfig.headerHeadingText : (settings.siteName || 'Krishna Electronics Order & Suppliers')}
                            </div>
                          )}
                          {homeConfig.showHeaderTagline !== false && (
                            <div className="text-[9px] font-medium text-slate-600 uppercase tracking-wider">
                              {homeConfig.headerTaglineText !== undefined ? homeConfig.headerTaglineText : (settings.siteTagline || 'Order & Suppliers • Surkhet')}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">(Logo only - heading &amp; tagline removed)</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {homeConfig.showContactButton !== false && (
                        <span className="px-2.5 py-1 border border-slate-300 rounded text-[10px] text-slate-700 font-medium">
                          {homeConfig.contactButtonLabel || 'Contact Store'}
                        </span>
                      )}
                      {homeConfig.showBookRepairButton !== false && (
                        <span className="px-2.5 py-1 bg-brand-500 text-white rounded text-[10px] font-medium">
                          {homeConfig.bookRepairButtonLabel || 'Book Repair'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Navbar Badge Preview */}
                  {homeConfig.showNavbarBadge !== false && (
                    <div className="bg-navy-900 text-white px-3 py-1 text-[10px] flex justify-end font-mono">
                      <span className="text-cyan-accent mr-1">●</span> {homeConfig.navbarBadgeText || 'Official Surkhet Store'}
                    </div>
                  )}
                </div>
              </div>

              {/* 1. Main Heading Configuration */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="showHeaderHeading"
                      checked={homeConfig.showHeaderHeading !== false}
                      onChange={(e) => handleHomeConfigChange('showHeaderHeading', e.target.checked)}
                      className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300 cursor-pointer"
                    />
                    <label htmlFor="showHeaderHeading" className="font-bold text-navy-900 text-xs cursor-pointer">
                      Show Store Name / Main Heading next to Logo
                    </label>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    {homeConfig.showHeaderHeading !== false ? '✅ Heading is visible' : '🚫 Heading is completely hidden (Logo-only mode)'}
                  </span>
                </div>

                {homeConfig.showHeaderHeading !== false && (
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Header Heading Text
                    </label>
                    <input
                      type="text"
                      value={homeConfig.headerHeadingText !== undefined ? homeConfig.headerHeadingText : (settings.siteName || '')}
                      onChange={(e) => {
                        handleHomeConfigChange('headerHeadingText', e.target.value);
                        handleChange('siteName', e.target.value);
                      }}
                      placeholder="e.g. Krishna Electronics Order & Suppliers"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-extrabold focus:border-brand-500 outline-none"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Appears as the primary large brand title in the sticky top header on every page.
                    </p>
                  </div>
                )}
              </div>

              {/* 2. Subheading / Tagline Configuration */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="showHeaderTagline"
                      checked={homeConfig.showHeaderTagline !== false}
                      onChange={(e) => handleHomeConfigChange('showHeaderTagline', e.target.checked)}
                      className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300 cursor-pointer"
                    />
                    <label htmlFor="showHeaderTagline" className="font-bold text-navy-900 text-xs cursor-pointer">
                      Show Subheading / Tagline under Heading
                    </label>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    {homeConfig.showHeaderTagline !== false ? '✅ Tagline is visible' : '🚫 Tagline is completely hidden'}
                  </span>
                </div>

                {homeConfig.showHeaderTagline !== false && (
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Header Subheading / Tagline Text
                    </label>
                    <input
                      type="text"
                      value={homeConfig.headerTaglineText !== undefined ? homeConfig.headerTaglineText : (settings.siteTagline || '')}
                      onChange={(e) => {
                        handleHomeConfigChange('headerTaglineText', e.target.value);
                        handleChange('siteTagline', e.target.value);
                      }}
                      placeholder="e.g. PREMIUM ELECTRONICS, IOT SOLUTIONS & PROFESSIONAL TECHNICAL SERVICES IN SURKHET"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-medium focus:border-brand-500 outline-none"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Small uppercase slogan right beneath the store name. Leave empty or uncheck above to hide.
                    </p>
                  </div>
                )}
              </div>

              {/* 3. Top Announcement & Utility Bar Configuration */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="showTopNotificationBar"
                      checked={homeConfig.showTopNotificationBar !== false}
                      onChange={(e) => handleHomeConfigChange('showTopNotificationBar', e.target.checked)}
                      className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300 cursor-pointer"
                    />
                    <label htmlFor="showTopNotificationBar" className="font-bold text-navy-900 text-xs cursor-pointer">
                      Show Top Notification &amp; Utility Bar (Dark Top Bar)
                    </label>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    {homeConfig.showTopNotificationBar !== false ? '✅ Top bar visible' : '🚫 Top bar hidden'}
                  </span>
                </div>

                {homeConfig.showTopNotificationBar !== false && (
                  <div className="space-y-3 pt-2">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Custom Announcement Text (Optional)
                      </label>
                      <input
                        type="text"
                        value={homeConfig.topNotificationText || ''}
                        onChange={(e) => handleHomeConfigChange('topNotificationText', e.target.value)}
                        placeholder="Leave blank to show store address &amp; opening hours, or type a custom announcement"
                        className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:border-brand-500 outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={homeConfig.showTopContactLinks !== false}
                          onChange={(e) => handleHomeConfigChange('showTopContactLinks', e.target.checked)}
                          className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300"
                        />
                        <span>Show Phone &amp; WhatsApp Links</span>
                      </label>

                      <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={homeConfig.showTopPortalLink !== false}
                          onChange={(e) => handleHomeConfigChange('showTopPortalLink', e.target.checked)}
                          className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300"
                        />
                        <span>Show Admin Portal Quick Link</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* 4. Action Buttons & Navbar Badge */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Contact Button */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="showContactButton"
                      checked={homeConfig.showContactButton !== false}
                      onChange={(e) => handleHomeConfigChange('showContactButton', e.target.checked)}
                      className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300"
                    />
                    <label htmlFor="showContactButton" className="font-bold text-navy-900 text-xs cursor-pointer">
                      Show Contact Button
                    </label>
                  </div>
                  {homeConfig.showContactButton !== false && (
                    <input
                      type="text"
                      value={homeConfig.contactButtonLabel !== undefined ? homeConfig.contactButtonLabel : 'Contact Store'}
                      onChange={(e) => handleHomeConfigChange('contactButtonLabel', e.target.value)}
                      placeholder="Contact Store"
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:border-brand-500 outline-none"
                    />
                  )}
                </div>

                {/* Book Repair Button */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="showBookRepairButton"
                      checked={homeConfig.showBookRepairButton !== false}
                      onChange={(e) => handleHomeConfigChange('showBookRepairButton', e.target.checked)}
                      className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300"
                    />
                    <label htmlFor="showBookRepairButton" className="font-bold text-navy-900 text-xs cursor-pointer">
                      Show Book Repair Button
                    </label>
                  </div>
                  {homeConfig.showBookRepairButton !== false && (
                    <input
                      type="text"
                      value={homeConfig.bookRepairButtonLabel !== undefined ? homeConfig.bookRepairButtonLabel : 'Book Repair'}
                      onChange={(e) => handleHomeConfigChange('bookRepairButtonLabel', e.target.value)}
                      placeholder="Book Repair"
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:border-brand-500 outline-none"
                    />
                  )}
                </div>

                {/* Navbar Store Badge */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="showNavbarBadge"
                      checked={homeConfig.showNavbarBadge !== false}
                      onChange={(e) => handleHomeConfigChange('showNavbarBadge', e.target.checked)}
                      className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300"
                    />
                    <label htmlFor="showNavbarBadge" className="font-bold text-navy-900 text-xs cursor-pointer">
                      Show Navbar Store Badge
                    </label>
                  </div>
                  {homeConfig.showNavbarBadge !== false && (
                    <input
                      type="text"
                      value={homeConfig.navbarBadgeText !== undefined ? homeConfig.navbarBadgeText : 'Official Surkhet Store'}
                      onChange={(e) => handleHomeConfigChange('navbarBadgeText', e.target.value)}
                      placeholder="Official Surkhet Store"
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:border-brand-500 outline-none"
                    />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB: HOMEPAGE CUSTOMIZER (All 6 Homepage Sections)        */}
          {/* ======================================================== */}
          {(activeTab === 'all' || activeTab === 'homepage') && (
            <div className="bg-white p-6 rounded-2xl border-2 border-brand-500/20 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                <div>
                  <h2 className="text-sm font-extrabold text-navy-900 uppercase tracking-wider flex items-center gap-2">
                    <Home className="w-4 h-4 text-brand-500" />
                    <span>🏠 Homepage Sections, Copy &amp; Customizer</span>
                  </h2>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    100% of the homepage headlines, subtitles, badges, IoT highlights, and trust cards are customizable here.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={resetHomeConfigToDefaults}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restore Defaults</span>
                </button>
              </div>

              {/* 1. Category Section */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-navy-900 text-xs flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-brand-500" />
                    1. Product Categories Section
                  </span>
                  <span className="text-[10px] text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                    Categories &amp; icons managed in /admin/categories
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Badge Pill</label>
                    <input
                      type="text"
                      value={homeConfig.categoryBadge || ''}
                      onChange={(e) => handleHomeConfigChange('categoryBadge', e.target.value)}
                      placeholder="Explore Department Catalogs"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:border-brand-500 outline-none"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">Section Main Heading</label>
                    <input
                      type="text"
                      value={homeConfig.categoryTitle || ''}
                      onChange={(e) => handleHomeConfigChange('categoryTitle', e.target.value)}
                      placeholder="Product Categories"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-bold focus:border-brand-500 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Section Subtitle / Explanatory Copy</label>
                  <input
                    type="text"
                    value={homeConfig.categorySubtitle || ''}
                    onChange={(e) => handleHomeConfigChange('categorySubtitle', e.target.value)}
                    placeholder="Select a specialized category for commercial equipment, networking, and smart electronics."
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:border-brand-500 outline-none"
                  />
                </div>
              </div>

              {/* 2. Featured Products Section */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-navy-900 text-xs flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-cyan-600" />
                    2. Featured Products Showcase Section
                  </span>
                  <span className="text-[10px] text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                    Mark items as &quot;Featured&quot; in /admin/products
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Badge Pill</label>
                    <input
                      type="text"
                      value={homeConfig.featuredBadge || ''}
                      onChange={(e) => handleHomeConfigChange('featuredBadge', e.target.value)}
                      placeholder="Verified Top Recommendations"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:border-brand-500 outline-none"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">Section Main Heading</label>
                    <input
                      type="text"
                      value={homeConfig.featuredTitle || ''}
                      onChange={(e) => handleHomeConfigChange('featuredTitle', e.target.value)}
                      placeholder="Featured Electronics & Hardware"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-bold focus:border-brand-500 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Section Subtitle</label>
                  <input
                    type="text"
                    value={homeConfig.featuredSubtitle || ''}
                    onChange={(e) => handleHomeConfigChange('featuredSubtitle', e.target.value)}
                    placeholder="Top-selling routers, surveillance cameras, laptops, and IoT devices in Surkhet."
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:border-brand-500 outline-none"
                  />
                </div>
              </div>

              {/* 3. Mid-Page IoT / Showcase Banner */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-navy-900 text-xs flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    3. Mid-Page Smart Showcase Banner
                  </span>
                  <span className="text-[10px] text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                    If a promo banner is published in /admin/banners, it displays here
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Showcase Badge</label>
                    <input
                      type="text"
                      value={homeConfig.showcaseBadge || ''}
                      onChange={(e) => handleHomeConfigChange('showcaseBadge', e.target.value)}
                      placeholder="Next-Gen Smart Living"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:border-brand-500 outline-none"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">Showcase Headline</label>
                    <input
                      type="text"
                      value={homeConfig.showcaseTitle || ''}
                      onChange={(e) => handleHomeConfigChange('showcaseTitle', e.target.value)}
                      placeholder="Transform Your Home & Facility with IoT Automation"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-bold focus:border-brand-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Showcase Narrative / Description</label>
                  <textarea
                    rows={2}
                    value={homeConfig.showcaseSubtitle || ''}
                    onChange={(e) => handleHomeConfigChange('showcaseSubtitle', e.target.value)}
                    placeholder="We supply and commission automated water tank controllers, smart circuit breakers, Sonoff/Tuya Wi-Fi relays, and environmental telemetry sensors across Karnali Province..."
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:border-brand-500 outline-none leading-relaxed"
                  />
                </div>

                {/* CTAs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Primary CTA Label</label>
                    <input
                      type="text"
                      value={homeConfig.showcaseCtaText || ''}
                      onChange={(e) => handleHomeConfigChange('showcaseCtaText', e.target.value)}
                      placeholder="Explore IoT Solutions"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:border-brand-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Primary CTA URL</label>
                    <input
                      type="text"
                      value={homeConfig.showcaseCtaLink || ''}
                      onChange={(e) => handleHomeConfigChange('showcaseCtaLink', e.target.value)}
                      placeholder="/services/iot-smart-device-solutions"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono text-[11px] focus:border-brand-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Secondary CTA Label</label>
                    <input
                      type="text"
                      value={homeConfig.showcaseCtaSecondaryText || ''}
                      onChange={(e) => handleHomeConfigChange('showcaseCtaSecondaryText', e.target.value)}
                      placeholder="Request Smart Site Survey"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:border-brand-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Secondary CTA URL</label>
                    <input
                      type="text"
                      value={homeConfig.showcaseCtaSecondaryLink || ''}
                      onChange={(e) => handleHomeConfigChange('showcaseCtaSecondaryLink', e.target.value)}
                      placeholder="/contact"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono text-[11px] focus:border-brand-500 outline-none"
                    />
                  </div>
                </div>

                {/* 4 Feature Highlight Cards */}
                <div className="pt-2 border-t border-slate-200">
                  <span className="block font-bold text-slate-700 mb-2">4 Feature Highlight Cards (Right Column)</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Card 1 */}
                    <div className="p-2.5 bg-white rounded-lg border border-slate-200 space-y-1.5">
                      <input
                        type="text"
                        value={homeConfig.showcaseFeature1Title || ''}
                        onChange={(e) => handleHomeConfigChange('showcaseFeature1Title', e.target.value)}
                        placeholder="Feature 1 Title (e.g. Mobile App)"
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded text-slate-900 font-bold focus:bg-white outline-none"
                      />
                      <input
                        type="text"
                        value={homeConfig.showcaseFeature1Desc || ''}
                        onChange={(e) => handleHomeConfigChange('showcaseFeature1Desc', e.target.value)}
                        placeholder="Feature 1 Description"
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded text-slate-700 focus:bg-white outline-none"
                      />
                    </div>
                    {/* Card 2 */}
                    <div className="p-2.5 bg-white rounded-lg border border-slate-200 space-y-1.5">
                      <input
                        type="text"
                        value={homeConfig.showcaseFeature2Title || ''}
                        onChange={(e) => handleHomeConfigChange('showcaseFeature2Title', e.target.value)}
                        placeholder="Feature 2 Title (e.g. Energy Saving)"
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded text-slate-900 font-bold focus:bg-white outline-none"
                      />
                      <input
                        type="text"
                        value={homeConfig.showcaseFeature2Desc || ''}
                        onChange={(e) => handleHomeConfigChange('showcaseFeature2Desc', e.target.value)}
                        placeholder="Feature 2 Description"
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded text-slate-700 focus:bg-white outline-none"
                      />
                    </div>
                    {/* Card 3 */}
                    <div className="p-2.5 bg-white rounded-lg border border-slate-200 space-y-1.5">
                      <input
                        type="text"
                        value={homeConfig.showcaseFeature3Title || ''}
                        onChange={(e) => handleHomeConfigChange('showcaseFeature3Title', e.target.value)}
                        placeholder="Feature 3 Title (e.g. Tank Automation)"
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded text-slate-900 font-bold focus:bg-white outline-none"
                      />
                      <input
                        type="text"
                        value={homeConfig.showcaseFeature3Desc || ''}
                        onChange={(e) => handleHomeConfigChange('showcaseFeature3Desc', e.target.value)}
                        placeholder="Feature 3 Description"
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded text-slate-700 focus:bg-white outline-none"
                      />
                    </div>
                    {/* Card 4 */}
                    <div className="p-2.5 bg-white rounded-lg border border-slate-200 space-y-1.5">
                      <input
                        type="text"
                        value={homeConfig.showcaseFeature4Title || ''}
                        onChange={(e) => handleHomeConfigChange('showcaseFeature4Title', e.target.value)}
                        placeholder="Feature 4 Title (e.g. Professional Lab)"
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded text-slate-900 font-bold focus:bg-white outline-none"
                      />
                      <input
                        type="text"
                        value={homeConfig.showcaseFeature4Desc || ''}
                        onChange={(e) => handleHomeConfigChange('showcaseFeature4Desc', e.target.value)}
                        placeholder="Feature 4 Description"
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded text-slate-700 focus:bg-white outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. Why Customers Rely on Us Section */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-navy-900 text-xs flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-emerald-600" />
                    4. Why Choose Us / Trust Badges Section
                  </span>
                  <span className="text-[10px] text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                    4 trust assurance cards
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Section Main Title</label>
                    <input
                      type="text"
                      value={homeConfig.whyTitle || ''}
                      onChange={(e) => handleHomeConfigChange('whyTitle', e.target.value)}
                      placeholder="Why Customers Rely on Us"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-bold focus:border-brand-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Section Subtitle</label>
                    <input
                      type="text"
                      value={homeConfig.whySubtitle || ''}
                      onChange={(e) => handleHomeConfigChange('whySubtitle', e.target.value)}
                      placeholder="Serving Birendranagar and Karnali Province..."
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:border-brand-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
                  {/* Card 1 */}
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200 space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-500 block">Trust Card 1</span>
                    <input
                      type="text"
                      value={homeConfig.whyCard1Title || ''}
                      onChange={(e) => handleHomeConfigChange('whyCard1Title', e.target.value)}
                      placeholder="Card 1 Title"
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded text-slate-900 font-bold focus:bg-white outline-none"
                    />
                    <textarea
                      rows={2}
                      value={homeConfig.whyCard1Desc || ''}
                      onChange={(e) => handleHomeConfigChange('whyCard1Desc', e.target.value)}
                      placeholder="Card 1 Description"
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded text-slate-700 focus:bg-white outline-none text-[11px]"
                    />
                  </div>

                  {/* Card 2 */}
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200 space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-500 block">Trust Card 2</span>
                    <input
                      type="text"
                      value={homeConfig.whyCard2Title || ''}
                      onChange={(e) => handleHomeConfigChange('whyCard2Title', e.target.value)}
                      placeholder="Card 2 Title"
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded text-slate-900 font-bold focus:bg-white outline-none"
                    />
                    <textarea
                      rows={2}
                      value={homeConfig.whyCard2Desc || ''}
                      onChange={(e) => handleHomeConfigChange('whyCard2Desc', e.target.value)}
                      placeholder="Card 2 Description"
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded text-slate-700 focus:bg-white outline-none text-[11px]"
                    />
                  </div>

                  {/* Card 3 */}
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200 space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-500 block">Trust Card 3</span>
                    <input
                      type="text"
                      value={homeConfig.whyCard3Title || ''}
                      onChange={(e) => handleHomeConfigChange('whyCard3Title', e.target.value)}
                      placeholder="Card 3 Title"
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded text-slate-900 font-bold focus:bg-white outline-none"
                    />
                    <textarea
                      rows={2}
                      value={homeConfig.whyCard3Desc || ''}
                      onChange={(e) => handleHomeConfigChange('whyCard3Desc', e.target.value)}
                      placeholder="Card 3 Description"
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded text-slate-700 focus:bg-white outline-none text-[11px]"
                    />
                  </div>

                  {/* Card 4 */}
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200 space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-500 block">Trust Card 4</span>
                    <input
                      type="text"
                      value={homeConfig.whyCard4Title || ''}
                      onChange={(e) => handleHomeConfigChange('whyCard4Title', e.target.value)}
                      placeholder="Card 4 Title"
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded text-slate-900 font-bold focus:bg-white outline-none"
                    />
                    <textarea
                      rows={2}
                      value={homeConfig.whyCard4Desc || ''}
                      onChange={(e) => handleHomeConfigChange('whyCard4Desc', e.target.value)}
                      placeholder="Card 4 Description"
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded text-slate-700 focus:bg-white outline-none text-[11px]"
                    />
                  </div>
                </div>
              </div>

              {/* 5. Services Section */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-navy-900 text-xs flex items-center gap-1.5">
                    <Wrench className="w-4 h-4 text-brand-500" />
                    5. Technical Services Showcase Section
                  </span>
                  <span className="text-[10px] text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                    Individual services, pricing &amp; scopes managed in /admin/services
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Badge Pill</label>
                    <input
                      type="text"
                      value={homeConfig.servicesBadge || ''}
                      onChange={(e) => handleHomeConfigChange('servicesBadge', e.target.value)}
                      placeholder="Certified Laboratory & On-Site Support"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:border-brand-500 outline-none"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">Section Main Heading</label>
                    <input
                      type="text"
                      value={homeConfig.servicesTitle || ''}
                      onChange={(e) => handleHomeConfigChange('servicesTitle', e.target.value)}
                      placeholder="Repair, Installation & Maintenance Services"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-bold focus:border-brand-500 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Section Subtitle</label>
                  <input
                    type="text"
                    value={homeConfig.servicesSubtitle || ''}
                    onChange={(e) => handleHomeConfigChange('servicesSubtitle', e.target.value)}
                    placeholder="From chip-level laptop motherboard diagnostics to enterprise optical fiber cabling..."
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:border-brand-500 outline-none"
                  />
                </div>
              </div>

              {/* 6. Local Store Visit Section */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-navy-900 text-xs flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-cyan-600" />
                    6. Local Store &amp; Facility Visit Section
                  </span>
                  <span className="text-[10px] text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                    Location, hours &amp; currency sync automatically
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Badge Pill</label>
                    <input
                      type="text"
                      value={homeConfig.locationBadge || ''}
                      onChange={(e) => handleHomeConfigChange('locationBadge', e.target.value)}
                      placeholder="Visit Our Local Facility"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:border-brand-500 outline-none"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">Section Main Heading</label>
                    <input
                      type="text"
                      value={homeConfig.locationTitle || ''}
                      onChange={(e) => handleHomeConfigChange('locationTitle', e.target.value)}
                      placeholder="Krishna Electronics Order & Suppliers"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-bold focus:border-brand-500 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Section Subtitle / Welcome Text</label>
                  <input
                    type="text"
                    value={homeConfig.locationSubtitle || ''}
                    onChange={(e) => handleHomeConfigChange('locationSubtitle', e.target.value)}
                    placeholder="Whether you need a quick laptop diagnostic, a custom CCTV quote for your property, or bulk office IT equipment, our doors are open."
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:border-brand-500 outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB: VISUAL DESIGN, FONTS & BRAND COLORS                 */}
          {/* ======================================================== */}
          {(activeTab === 'all' || activeTab === 'theme') && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h2 className="text-sm font-bold text-navy-900 uppercase tracking-wider flex items-center gap-2">
                  <Palette className="w-4 h-4 text-brand-500" />
                  <span>Visual Design, Fonts &amp; Background Colors</span>
                </h2>
                <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Instant Customization
                </span>
              </div>

              {/* 1-Click Color Presets */}
              <div>
                <label className="block font-semibold text-slate-700 mb-2">
                  Quick Preset Themes
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                  {THEME_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => applyPreset(preset)}
                      className="p-2.5 rounded-xl border border-slate-200 hover:border-brand-500 transition text-left bg-slate-50 hover:bg-white group"
                    >
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <span
                          className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm border border-black/10"
                          style={{ backgroundColor: preset.primaryColor }}
                        />
                        <span
                          className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm border border-black/10"
                          style={{ backgroundColor: preset.darkSurface }}
                        />
                        <span
                          className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm border border-black/10"
                          style={{ backgroundColor: preset.accentColor }}
                        />
                      </div>
                      <div className="font-bold text-[11px] text-slate-800 truncate group-hover:text-brand-600">
                        {preset.name}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {preset.fontFamily}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Typography Selector */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Type className="w-3.5 h-3.5 text-brand-500" />
                    Website Font Family
                  </label>
                  <select
                    value={settings.fontFamily || 'Inter'}
                    onChange={(e) => handleChange('fontFamily', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:border-brand-500 outline-none font-medium"
                  >
                    {AVAILABLE_FONTS.map((f) => (
                      <option key={f.name} value={f.name}>
                        {f.name} — {f.desc}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Loaded dynamically via Google Fonts across every public page and storefront.
                  </p>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Active Font Preview
                  </label>
                  <div 
                    className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                    style={{ fontFamily: fontFam }}
                  >
                    <div className="font-bold text-sm">Krishna Electronics Order &amp; Suppliers</div>
                    <div className="text-[11px] text-slate-500">
                      The quick brown fox jumps over the lazy dog. ०१२३४५६७८९ रु ५०,०००/-
                    </div>
                  </div>
                </div>
              </div>

              {/* Color Palette Pickers */}
              <div>
                <label className="block font-semibold text-slate-700 mb-2">
                  Brand &amp; Surface Colors
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  {/* Primary Color */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-700 block">Primary Color</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={primaryCol}
                        onChange={(e) => handleChange('primaryColor', e.target.value)}
                        className="w-8 h-8 rounded border border-slate-300 cursor-pointer p-0 bg-transparent"
                      />
                      <input
                        type="text"
                        value={primaryCol}
                        onChange={(e) => handleChange('primaryColor', e.target.value)}
                        className="flex-1 px-2 py-1 bg-white border border-slate-200 rounded font-mono text-[11px] uppercase text-slate-800"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 block">Buttons, brand accents, badges</span>
                  </div>

                  {/* Secondary Color */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-700 block">Secondary Color</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={secondaryCol}
                        onChange={(e) => handleChange('secondaryColor', e.target.value)}
                        className="w-8 h-8 rounded border border-slate-300 cursor-pointer p-0 bg-transparent"
                      />
                      <input
                        type="text"
                        value={secondaryCol}
                        onChange={(e) => handleChange('secondaryColor', e.target.value)}
                        className="flex-1 px-2 py-1 bg-white border border-slate-200 rounded font-mono text-[11px] uppercase text-slate-800"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 block">Button hover states, sub-elements</span>
                  </div>

                  {/* Accent Color */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-700 block">Accent / Highlight</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={accentCol}
                        onChange={(e) => handleChange('accentColor', e.target.value)}
                        className="w-8 h-8 rounded border border-slate-300 cursor-pointer p-0 bg-transparent"
                      />
                      <input
                        type="text"
                        value={accentCol}
                        onChange={(e) => handleChange('accentColor', e.target.value)}
                        className="flex-1 px-2 py-1 bg-white border border-slate-200 rounded font-mono text-[11px] uppercase text-slate-800"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 block">Glow highlights, offer badges</span>
                  </div>

                  {/* Dark Surface Background */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-700 block">Dark Background</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={darkSurf}
                        onChange={(e) => handleChange('darkSurface', e.target.value)}
                        className="w-8 h-8 rounded border border-slate-300 cursor-pointer p-0 bg-transparent"
                      />
                      <input
                        type="text"
                        value={darkSurf}
                        onChange={(e) => handleChange('darkSurface', e.target.value)}
                        className="flex-1 px-2 py-1 bg-white border border-slate-200 rounded font-mono text-[11px] uppercase text-slate-800"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 block">Navbar, footer &amp; dark sections</span>
                  </div>

                  {/* Light Surface Background */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-700 block">Light / Page Canvas</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={lightSurf}
                        onChange={(e) => handleChange('lightSurface', e.target.value)}
                        className="w-8 h-8 rounded border border-slate-300 cursor-pointer p-0 bg-transparent"
                      />
                      <input
                        type="text"
                        value={lightSurf}
                        onChange={(e) => handleChange('lightSurface', e.target.value)}
                        className="flex-1 px-2 py-1 bg-white border border-slate-200 rounded font-mono text-[11px] uppercase text-slate-800"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 block">Public page body canvas</span>
                  </div>
                </div>
              </div>

              {/* Live Interactive Preview Card */}
              <div>
                <label className="block font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-brand-500" />
                  Live Theme Preview
                </label>
                <div 
                  className="p-4 rounded-xl border border-slate-200 transition-all shadow-inner"
                  style={{ backgroundColor: lightSurf, fontFamily: fontFam }}
                >
                  {/* Navbar mini preview */}
                  <div 
                    className="px-4 py-2.5 rounded-lg flex items-center justify-between text-white shadow-sm mb-3"
                    style={{ backgroundColor: darkSurf }}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full overflow-hidden bg-white p-0.5">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={settings.logoUrl || '/images/logo.jpg'} alt="Logo" className="w-full h-full object-contain" />
                      </div>
                      <span className="font-bold text-xs tracking-tight">{settings.siteName || 'Krishna Electronics'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px]">
                      <span className="text-white/70">Laptops</span>
                      <span className="font-bold underline" style={{ color: accentCol }}>Services</span>
                      <span 
                        className="px-2 py-0.5 rounded text-[10px] font-bold text-white shadow-sm"
                        style={{ backgroundColor: primaryCol }}
                      >
                        Login
                      </span>
                    </div>
                  </div>

                  {/* Content preview */}
                  <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span 
                          className="px-2 py-0.5 rounded-full text-[10px] font-bold text-slate-900 shadow-sm"
                          style={{ backgroundColor: accentCol }}
                        >
                          OFFER • 15% OFF
                        </span>
                        <span className="text-[10px] text-slate-400">Surkhet Delivery Available</span>
                      </div>
                      <h3 className="font-extrabold text-sm text-slate-900">
                        Smart CCTV &amp; Computer Repair in Surkhet
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Sample preview demonstrating custom font ({fontFam}) and customized palette.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        className="px-3.5 py-1.5 rounded-lg text-white font-bold text-xs shadow-sm transition"
                        style={{ backgroundColor: primaryCol }}
                      >
                        Primary Button
                      </button>
                      <button
                        type="button"
                        className="px-3 py-1.5 rounded-lg font-bold text-xs border transition"
                        style={{ borderColor: primaryCol, color: primaryCol }}
                      >
                        Outline
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB: BUSINESS IDENTITY & BRANDING                        */}
          {/* ======================================================== */}
          {(activeTab === 'all' || activeTab === 'identity') && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-navy-900 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
                <Globe className="w-4 h-4 text-brand-500" />
                <span>Business Identity &amp; Branding</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Business Name
                  </label>
                  <input
                    type="text"
                    value={settings.siteName}
                    onChange={(e) => {
                      handleChange('siteName', e.target.value);
                      handleHomeConfigChange('headerHeadingText', e.target.value);
                    }}
                    placeholder="e.g. Krishna Electronics Order & Suppliers"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:border-brand-500 outline-none"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Can also be customized or hidden in the Header &amp; Headings tab.</p>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Tagline / Motto
                  </label>
                  <input
                    type="text"
                    value={settings.siteTagline}
                    onChange={(e) => {
                      handleChange('siteTagline', e.target.value);
                      handleHomeConfigChange('headerTaglineText', e.target.value);
                    }}
                    placeholder="e.g. PREMIUM ELECTRONICS, IOT SOLUTIONS & PROFESSIONAL TECHNICAL SERVICES IN SURKHET"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:border-brand-500 outline-none"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Leave empty to remove tagline from header and footer.</p>
                </div>
              </div>

              {/* Official Logo Path / URL */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Official Business Logo URL or Path
                </label>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-white p-0.5 border-2 border-brand-500 shrink-0 shadow-sm">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={settings.logoUrl || '/images/logo.jpg'}
                      alt="Logo preview"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <input
                    type="text"
                    value={settings.logoUrl || '/images/logo.jpg'}
                    onChange={(e) => handleChange('logoUrl', e.target.value)}
                    placeholder="/images/logo.jpg"
                    className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:border-brand-500 outline-none font-mono text-xs"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Active store logo displayed across Header, Footer, and Admin panel.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Storefront Overview Description
                </label>
                <textarea
                  rows={2}
                  value={settings.siteDescription}
                  onChange={(e) => handleChange('siteDescription', e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:border-brand-500 outline-none"
                />
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB: LOCATION, HOURS & CUSTOMER CHANNELS                 */}
          {/* ======================================================== */}
          {(activeTab === 'all' || activeTab === 'contact') && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-navy-900 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-brand-500" />
                <span>Location, Hours &amp; Customer Channels</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Store Physical Address *
                  </label>
                  <input
                    type="text"
                    required
                    value={settings.locationAddress}
                    onChange={(e) => handleChange('locationAddress', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:border-brand-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Business &amp; Laboratory Hours
                  </label>
                  <input
                    type="text"
                    value={settings.businessHours}
                    onChange={(e) => handleChange('businessHours', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:border-brand-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Store Phone Number
                  </label>
                  <input
                    type="text"
                    value={settings.contactPhone}
                    onChange={(e) => handleChange('contactPhone', e.target.value)}
                    placeholder="e.g. 087-XXXXXX / 98XXXXXXXX"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:border-brand-500 outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Inquiry Email
                  </label>
                  <input
                    type="email"
                    value={settings.contactEmail}
                    onChange={(e) => handleChange('contactEmail', e.target.value)}
                    placeholder="contact@krishnaelectronics.com.np"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:border-brand-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    WhatsApp Contact Number
                  </label>
                  <input
                    type="text"
                    value={settings.contactWhatsapp}
                    onChange={(e) => handleChange('contactWhatsapp', e.target.value)}
                    placeholder="98XXXXXXXX"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:border-brand-500 outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Google Maps Embed URL
                </label>
                <input
                  type="text"
                  value={settings.googleMapsEmbedUrl}
                  onChange={(e) => handleChange('googleMapsEmbedUrl', e.target.value)}
                  placeholder="https://www.google.com/maps/embed?pb=..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:border-brand-500 outline-none font-mono text-[11px]"
                />
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB: SOCIAL MEDIA LINKS & SEO META                       */}
          {/* ======================================================== */}
          {(activeTab === 'all' || activeTab === 'seo') && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-navy-900 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
                <Share2 className="w-4 h-4 text-brand-500" />
                <span>Social Media Links &amp; Search Engine Meta (SEO)</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Facebook Page URL
                  </label>
                  <input
                    type="text"
                    value={settings.socialFacebook || ''}
                    onChange={(e) => handleChange('socialFacebook', e.target.value)}
                    placeholder="https://facebook.com/..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:border-brand-500 outline-none font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Instagram Profile URL
                  </label>
                  <input
                    type="text"
                    value={settings.socialInstagram || ''}
                    onChange={(e) => handleChange('socialInstagram', e.target.value)}
                    placeholder="https://instagram.com/..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:border-brand-500 outline-none font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    LinkedIn Organization URL
                  </label>
                  <input
                    type="text"
                    value={settings.socialLinkedin || ''}
                    onChange={(e) => handleChange('socialLinkedin', e.target.value)}
                    placeholder="https://linkedin.com/company/..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:border-brand-500 outline-none font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    YouTube Channel URL
                  </label>
                  <input
                    type="text"
                    value={settings.socialYoutube || ''}
                    onChange={(e) => handleChange('socialYoutube', e.target.value)}
                    placeholder="https://youtube.com/@..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:border-brand-500 outline-none font-mono text-xs"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-3">
                <span className="font-bold text-slate-700 text-xs block">Search Engine Optimization (SEO)</span>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Default Meta Title
                  </label>
                  <input
                    type="text"
                    value={settings.metaTitle || ''}
                    onChange={(e) => handleChange('metaTitle', e.target.value)}
                    placeholder="Krishna Electronics Order & Suppliers | Birendranagar, Surkhet"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:border-brand-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Default Meta Description
                  </label>
                  <textarea
                    rows={2}
                    value={settings.metaDescription || ''}
                    onChange={(e) => handleChange('metaDescription', e.target.value)}
                    placeholder="Authorized IT equipment supplier, fiber optic networking, CCTV surveillance..."
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:border-brand-500 outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB: CURRENCY, TAX & LOGISTICS OPERATIONS                */}
          {/* ======================================================== */}
          {(activeTab === 'all' || activeTab === 'store') && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-navy-900 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-brand-500" />
                <span>Currency, Tax &amp; Logistics Operations</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Currency Code
                  </label>
                  <input
                    type="text"
                    value={settings.currencyCode}
                    onChange={(e) => handleChange('currencyCode', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Currency Symbol
                  </label>
                  <input
                    type="text"
                    value={settings.currencySymbol}
                    onChange={(e) => handleChange('currencySymbol', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    VAT / Tax Rate (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={settings.taxRatePercent !== undefined ? settings.taxRatePercent : 13.0}
                    onChange={(e) => handleChange('taxRatePercent', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.maintenanceMode}
                    onChange={(e) => handleChange('maintenanceMode', e.target.checked)}
                    className="rounded text-brand-600 w-4 h-4 cursor-pointer"
                  />
                  <div>
                    <span className="font-bold text-slate-800 text-xs">
                      Enable Maintenance Mode
                    </span>
                    <span className="block text-[11px] text-slate-500">
                      When enabled, public visitors see an &ldquo;Under Scheduled Maintenance&rdquo; notice while admins retain full access.
                    </span>
                  </div>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Accepted Payment Methods Text
                  </label>
                  <input
                    type="text"
                    value={settings.paymentMethods}
                    onChange={(e) => handleChange('paymentMethods', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:border-brand-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Delivery Coverage Note
                  </label>
                  <input
                    type="text"
                    value={settings.deliveryInfo}
                    onChange={(e) => handleChange('deliveryInfo', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:border-brand-500 outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Bottom Save Bar */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>All changes are cached, validated, and logged to the security audit trail.</span>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="px-8 py-3 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-extrabold rounded-xl transition shadow-lg shadow-brand-500/25 flex items-center gap-2 uppercase tracking-wider text-xs"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Updating Settings...' : 'Save Settings'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
