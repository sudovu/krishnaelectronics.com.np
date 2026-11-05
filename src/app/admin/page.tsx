'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Package, 
  MessageSquare, 
  Eye, 
  AlertTriangle, 
  Sparkles, 
  TrendingUp, 
  History, 
  Layers, 
  ArrowRight,
  ShieldCheck,
  Info
} from 'lucide-react';
import { formatNPR, formatDate } from '@/lib/formatters';

export default function AdminDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analytics')
      .then((res) => res.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs text-slate-500">Loading business analytics...</span>
        </div>
      </div>
    );
  }

  const metrics = data?.metrics || {};
  const products = metrics.products || {};
  const inquiries = metrics.inquiries || {};

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Top Welcome Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-navy-900 tracking-tight">
            Administrator Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Krishna Electronics &amp; Order Suppliers &bull; Buddhapath, Surkhet
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/products/new"
            className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-xs font-bold transition shadow-sm"
          >
            + Add New Product
          </Link>
          <Link
            href="/admin/ai-banner-studio"
            className="px-4 py-2 bg-navy-900 hover:bg-navy-800 text-cyan-accent border border-navy-700 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Banner Studio</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Products KPI */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Products</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Package className="w-5 h-5 text-brand-500" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-navy-900 font-mono">
              {products.total || 0}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
              <span className="text-emerald-600 font-bold">{products.published || 0} Published</span>
              <span>&bull;</span>
              <span className="text-amber-600 font-bold">{products.drafts || 0} Drafts</span>
            </div>
          </div>
        </div>

        {/* Inquiries KPI */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Inquiries &amp; Orders</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-purple-500" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-navy-900 font-mono">
              {inquiries.total || 0}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
              <span className="text-purple-600 font-bold">{inquiries.new || 0} Action Required</span>
              <span>&bull;</span>
              <span className="text-slate-400">{inquiries.resolved || 0} Resolved</span>
            </div>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Stock Alerts</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-navy-900 font-mono">
              {metrics.lowStockCount || 0}
            </div>
            <div className="text-[11px] text-amber-700 mt-1 font-medium">
              Items needing inventory restocking
            </div>
          </div>
        </div>

        {/* Active Promotions */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Campaigns</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-emerald-500" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-navy-900 font-mono">
              {metrics.activePromotionsCount || 0}
            </div>
            <div className="text-[11px] text-emerald-700 mt-1 font-medium">
              Live homepage banners &amp; offers
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Transparency & Real Data Notice */}
      <div className="bg-blue-50/70 border border-blue-200 p-4 rounded-xl flex items-start gap-3 text-xs text-blue-900">
        <Info className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold">Real Analytics Transparency Notice</p>
          <p className="text-slate-600 leading-relaxed">
            {data?.externalAnalytics?.message} All figures below represent authentic database records (actual views, inventory quantities, and inquiries logged).
          </p>
        </div>
      </div>

      {/* Two Column Grid: Most Viewed Products + Low Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Most Viewed Products */}
        <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-brand-500" />
              <h3 className="font-bold text-sm text-navy-900">Most Viewed Products</h3>
            </div>
            <Link href="/admin/products" className="text-xs font-bold text-brand-600 hover:underline">
              View All
            </Link>
          </div>

          <div className="space-y-3">
            {data?.mostViewedProducts?.map((item: any) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs"
              >
                <div className="truncate max-w-[260px]">
                  <div className="font-bold text-navy-900 truncate">{item.title}</div>
                  <div className="text-slate-500 text-[11px] font-mono mt-0.5">
                    {formatNPR(item.offerPrice || item.regularPrice)} &bull; {item.stockQuantity} in stock
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-mono font-bold text-navy-900">{item.viewsCount}</div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Views</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h3 className="font-bold text-sm text-navy-900">Low Stock &amp; Inventory Alerts</h3>
            </div>
            <span className="text-xs text-slate-500 font-mono">
              {data?.lowStockProducts?.length || 0} items
            </span>
          </div>

          <div className="space-y-3">
            {data?.lowStockProducts?.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400">
                All catalog items have healthy inventory levels.
              </div>
            ) : (
              data?.lowStockProducts?.map((item: any) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-amber-50/50 border border-amber-200 text-xs"
                >
                  <div className="truncate max-w-[260px]">
                    <div className="font-bold text-navy-900 truncate">{item.title}</div>
                    <div className="text-slate-500 text-[11px] font-mono mt-0.5">SKU: {item.sku}</div>
                  </div>
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-bold text-[11px] font-mono">
                    {item.stockQuantity} remaining
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Two Column Grid: Category Breakdown + Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Categories Breakdown */}
        <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Layers className="w-4 h-4 text-brand-500" />
            <h3 className="font-bold text-sm text-navy-900">Category Catalog Distribution</h3>
          </div>

          <div className="space-y-2">
            {data?.categoriesWithCount?.map((cat: any) => (
              <div key={cat.id} className="flex items-center justify-between py-2 border-b border-slate-100 text-xs">
                <span className="font-medium text-slate-700">{cat.name}</span>
                <span className="font-bold text-navy-900 font-mono px-2 py-0.5 bg-slate-100 rounded">
                  {cat._count.products} products
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Admin Audit Logs */}
        <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-brand-500" />
              <h3 className="font-bold text-sm text-navy-900">Recent Admin Activities</h3>
            </div>
            <Link href="/admin/audit-logs" className="text-xs font-bold text-brand-600 hover:underline">
              Full Audit History
            </Link>
          </div>

          <div className="space-y-2.5">
            {data?.recentAuditLogs?.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400">
                No recent activity logged.
              </div>
            ) : (
              data?.recentAuditLogs?.map((log: any) => (
                <div key={log.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-navy-900">{log.action}</span>
                    <span className="text-[10px] text-slate-400">{formatDate(log.createdAt)}</span>
                  </div>
                  <p className="text-slate-600 text-[11px] truncate">{log.details}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
