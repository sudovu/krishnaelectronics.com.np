'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Package, 
  Wrench, 
  Sparkles, 
  Image as ImageIcon, 
  MessageSquare, 
  Settings, 
  Users, 
  History, 
  LogOut, 
  ExternalLink, 
  Menu, 
  X, 
  Cpu, 
  Shield 
} from 'lucide-react';
import { AdminSessionUser } from '@/types';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<AdminSessionUser | null>(null);
  const [siteName, setSiteName] = useState<string>('KRISHNA CMS');
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
    { name: 'Technical Services', href: '/admin/services', icon: Wrench },
    { name: 'Banners & Promotions', href: '/admin/banners', icon: ImageIcon },
    { name: 'AI Banner Studio', href: '/admin/ai-banner-studio', icon: Sparkles, badge: 'AI' },
    { name: 'Inquiries & Orders', href: '/admin/inquiries', icon: MessageSquare },
    { name: 'Website Settings', href: '/admin/settings', icon: Settings },
    { name: 'User Management', href: '/admin/users', icon: Users, superAdminOnly: true },
    { name: 'Audit Logs', href: '/admin/audit-logs', icon: History },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row">
      {/* Mobile Top Header */}
      <div className="md:hidden bg-navy-950 text-white p-4 flex items-center justify-between border-b border-navy-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center text-white">
            <Cpu className="w-5 h-5 text-cyan-accent" />
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
          <div className="p-6 border-b border-navy-800 hidden md:flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-navy-800 flex items-center justify-center text-white shadow-md">
              <Cpu className="w-5 h-5 text-cyan-accent" />
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
      <main className="flex-1 overflow-x-hidden min-h-screen">
        {children}
      </main>
    </div>
  );
}
