'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Package, 
  FolderTree,
  Wrench, 
  Sparkles, 
  Image as ImageIcon, 
  MessageSquare, 
  HelpCircle,
  Settings, 
  Users, 
  History, 
  LogOut, 
  ExternalLink, 
  Menu, 
  X, 
  Cpu, 
  Shield,
  Eye,
  Send,
  Monitor,
  Tablet,
  Smartphone,
  RotateCw,
  CheckCircle2
} from 'lucide-react';
import { AdminSessionUser } from '@/types';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<AdminSessionUser | null>(null);
  const [siteName, setSiteName] = useState<string>('KRISHNA CMS');
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Test Changes / Live Preview State
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [previewPath, setPreviewPath] = useState('/');
  const [previewKey, setPreviewKey] = useState(0);

  // Publish to Website State
  const [publishing, setPublishing] = useState(false);
  const [publishToast, setPublishToast] = useState<{ message: string; timestamp: string } | null>(null);

  const handlePublishLive = async () => {
    if (!confirm('Are you ready to publish all approved changes to the live website?')) return;
    setPublishing(true);
    try {
      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publishBanners: true, publishProducts: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to publish');

      setPublishToast({
        message: data.message || 'Changes published successfully to the live website!',
        timestamp: new Date().toLocaleTimeString(),
      });
      // Force preview reload if open
      setPreviewKey((prev) => prev + 1);
      setTimeout(() => setPublishToast(null), 6000);
    } catch (err: any) {
      alert(`Publishing error: ${err.message}`);
    } finally {
      setPublishing(false);
    }
  };

  useEffect(() => {
    // If on login page, do not require auth wrapper
    if (pathname === '/admin/login') {
      setLoading(false);
      return;
    }

    Promise.all([
      fetch('/api/auth/me').then((res) => (res.ok ? res.json() : null)),
      fetch('/api/settings').then((res) => (res.ok ? res.json() : null)),
    ])
      .then(([authData, settingsData]) => {
        if (settingsData?.settings?.siteName) {
          setSiteName(settingsData.settings.siteName);
        }
        if (authData?.authenticated) {
          setCurrentUser(authData.user);
        } else if (pathname !== '/admin/login') {
          router.push('/admin/login');
        }
      })
      .catch(() => {
        if (pathname !== '/admin/login') router.push('/admin/login');
      })
      .finally(() => setLoading(false));
  }, [pathname, router]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-navy-950 text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-400">Verifying administrator credentials...</p>
        </div>
      </div>
    );
  }

  const navLinks = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Products & Inventory', href: '/admin/products', icon: Package },
    { name: 'Categories & Brands', href: '/admin/categories', icon: FolderTree },
    { name: 'Technical Services', href: '/admin/services', icon: Wrench },
    { name: 'Banners & Promotions', href: '/admin/banners', icon: ImageIcon },
    { name: 'AI Banner Studio', href: '/admin/ai-banner-studio', icon: Sparkles, badge: 'AI' },
    { name: 'Inquiries & Orders', href: '/admin/inquiries', icon: MessageSquare },
    { name: 'FAQs & Content', href: '/admin/faqs', icon: HelpCircle },
    { name: 'Website Settings', href: '/admin/settings', icon: Settings },
    { name: 'User Management', href: '/admin/users', icon: Users, superAdminOnly: true },
    { name: 'Audit Logs', href: '/admin/audit-logs', icon: History },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row">
      {/* Mobile Top Header */}
      <div className="md:hidden bg-navy-950 text-white p-4 flex items-center justify-between border-b border-navy-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full overflow-hidden bg-white p-0.5 border border-brand-500 shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/logo.png" alt="Logo" className="w-full h-full object-contain" width={48} height={48} />
          </div>
          <span className="font-bold text-sm tracking-tight truncate max-w-[200px]">{siteName}</span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-1.5 rounded-lg bg-navy-900 text-slate-300"
          aria-label="Toggle admin menu"
        >
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`${
          sidebarOpen ? 'block' : 'hidden'
        } md:block w-full md:w-64 bg-navy-950 text-slate-300 flex flex-col justify-between shrink-0 border-r border-navy-800 z-40`}
      >
        <div>
          {/* Logo Brand Header */}
          <div className="p-5 border-b border-navy-800 hidden md:flex items-center gap-3">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-white p-0.5 border-2 border-brand-500 shadow-md shrink-0 ring-1 ring-brand-200/50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/logo.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="font-extrabold text-xs text-white tracking-tight truncate max-w-[150px]" title={siteName}>
                {siteName}
              </div>
              <div className="text-[10px] text-cyan-accent font-medium">
                Business CMS Portal
              </div>
            </div>
          </div>

          {/* Current User Card */}
          {currentUser && (
            <div className="p-4 mx-3 my-3 bg-navy-900 rounded-xl border border-navy-800 text-xs">
              <div className="font-bold text-white truncate">{currentUser.name}</div>
              <div className="text-slate-400 text-[11px] truncate">{currentUser.email}</div>
              <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-brand-500/20 text-cyan-accent text-[10px] font-bold uppercase tracking-wider">
                <Shield className="w-3 h-3" />
                <span>{currentUser.role}</span>
              </div>
            </div>
          )}

          {/* Nav Items */}
          <nav className="px-3 py-2 space-y-1">
            {navLinks.map((link) => {
              if (link.superAdminOnly && currentUser?.role !== 'SUPER_ADMIN') {
                return null;
              }
              const isActive = pathname === link.href || (link.href !== '/admin' && pathname.startsWith(link.href));
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                    isActive
                      ? 'bg-brand-500 text-white shadow-md shadow-brand-500/25'
                      : 'text-slate-400 hover:text-white hover:bg-navy-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{link.name}</span>
                  </div>
                  {link.badge && (
                    <span className="px-1.5 py-0.5 bg-cyan-accent text-navy-950 rounded text-[10px] font-black uppercase">
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-navy-800 space-y-2">
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-navy-900 transition"
          >
            <ExternalLink className="w-4 h-4 text-cyan-accent" />
            <span>View Live Website</span>
          </Link>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-rose-400 hover:bg-rose-950/40 transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Admin Content Viewport */}
      <main className="flex-1 overflow-x-hidden min-h-screen flex flex-col">
        {/* Universal Top Action Header (Test Changes & Publish to Website) */}
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-6 py-3 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-bold text-navy-900 tracking-tight">
                {siteName}
              </span>
              <span className="text-slate-300">|</span>
              <span className="text-xs text-slate-500 font-medium">
                Admin Control &amp; Publishing Center
              </span>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Test & Preview Button */}
              <button
                type="button"
                onClick={() => setPreviewOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition border border-slate-300 shadow-2xs"
                title="Preview changes in responsive device viewports before publishing"
              >
                <Eye className="w-3.5 h-3.5 text-brand-600" />
                <span>Test Changes</span>
              </button>

              {/* Publish to Website Button */}
              <button
                type="button"
                onClick={handlePublishLive}
                disabled={publishing}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-lg text-xs font-bold transition shadow-sm disabled:opacity-50"
              >
                {publishing ? (
                  <>
                    <RotateCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Publishing...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Publish to Website</span>
                  </>
                )}
              </button>

              {/* Direct Live Link */}
              <Link
                href="/"
                target="_blank"
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
                title="Open live website in new tab"
              >
                <ExternalLink className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Published Notification Toast */}
          {publishToast && (
            <div className="mt-2 p-2.5 bg-emerald-50 border border-emerald-300 rounded-lg flex items-center justify-between text-xs text-emerald-800 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold">{publishToast.message}</span>
                <span className="text-[10px] text-emerald-600 font-mono">({publishToast.timestamp})</span>
              </div>
              <a
                href="/"
                target="_blank"
                className="text-xs font-bold text-emerald-700 underline hover:text-emerald-900 ml-4"
              >
                View Live ↗
              </a>
            </div>
          )}
        </header>

        {/* Viewport Content */}
        <div className="flex-1">
          {children}
        </div>

        {/* --- Test Changes Responsive Preview Modal --- */}
        {previewOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col">
            {/* Preview Toolbar */}
            <div className="bg-navy-950 text-white px-4 py-3 flex items-center justify-between border-b border-navy-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 font-bold text-sm">
                  <Eye className="w-4 h-4 text-cyan-accent" />
                  <span>Interactive Live Preview &amp; Testing</span>
                </div>

                {/* Route Switcher Dropdown */}
                <select
                  value={previewPath}
                  onChange={(e) => setPreviewPath(e.target.value)}
                  className="bg-navy-900 border border-navy-700 text-xs text-white rounded-lg px-2.5 py-1 outline-none"
                >
                  <option value="/">Homepage (/)</option>
                  <option value="/products">Products Catalog (/products)</option>
                  <option value="/services">Technical Services (/services)</option>
                  <option value="/about">About Us (/about)</option>
                  <option value="/contact">Contact &amp; Location (/contact)</option>
                  <option value="/faqs">FAQs (/faqs)</option>
                  <option value="/offers">Special Offers (/offers)</option>
                </select>

                {/* Reload Preview */}
                <button
                  onClick={() => setPreviewKey((prev) => prev + 1)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-navy-900 transition"
                  title="Reload Preview"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Viewport Width Controls */}
              <div className="flex items-center gap-1 bg-navy-900 p-1 rounded-xl border border-navy-800">
                <button
                  onClick={() => setPreviewDevice('desktop')}
                  className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold transition ${
                    previewDevice === 'desktop'
                      ? 'bg-brand-500 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Desktop</span>
                </button>

                <button
                  onClick={() => setPreviewDevice('tablet')}
                  className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold transition ${
                    previewDevice === 'tablet'
                      ? 'bg-brand-500 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Tablet className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Tablet (768px)</span>
                </button>

                <button
                  onClick={() => setPreviewDevice('mobile')}
                  className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold transition ${
                    previewDevice === 'mobile'
                      ? 'bg-brand-500 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Mobile (375px)</span>
                </button>
              </div>

              {/* Right Action Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePublishLive}
                  disabled={publishing}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                >
                  <Send className="w-3 h-3" />
                  <span>Publish Live Now</span>
                </button>
                <button
                  onClick={() => setPreviewOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-navy-900 transition"
                  title="Close Preview"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Preview Frame Container */}
            <div className="flex-1 bg-slate-900 overflow-auto flex items-center justify-center p-4">
              <div
                className={`bg-white rounded-xl shadow-2xl overflow-hidden transition-all duration-300 border border-slate-700 h-full flex flex-col ${
                  previewDevice === 'desktop'
                    ? 'w-full max-w-7xl'
                    : previewDevice === 'tablet'
                    ? 'w-[768px]'
                    : 'w-[375px]'
                }`}
              >
                {/* Browser-like address bar */}
                <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex items-center gap-2 shrink-0">
                  <div className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block"></span>
                  </div>
                  <div className="flex-1 bg-white px-3 py-1 rounded text-[11px] text-slate-500 font-mono truncate border border-slate-200">
                    https://krishnaelectronics.com.np{previewPath}
                  </div>
                </div>

                {/* Live Storefront Iframe */}
                <iframe
                  key={`${previewPath}-${previewKey}`}
                  src={previewPath}
                  title="Live Storefront Preview"
                  className="w-full flex-1 border-none bg-white"
                />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
