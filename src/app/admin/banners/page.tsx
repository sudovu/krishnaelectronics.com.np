'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  Trash2, 
  ShieldCheck, 
  AlertCircle,
  Plus,
  Eye,
  ExternalLink
} from 'lucide-react';
import { BannerData } from '@/types';

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<BannerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchBanners = () => {
    setLoading(true);
    fetch('/api/banners?all=true')
      .then((res) => res.json())
      .then((data) => {
        setBanners(data.banners || []);
        setLoading(false);
      })
      .catch((err) => {
        setError('Failed to fetch banners.');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const handleApprove = async (id: string) => {
    setMessage(null);
    setError(null);
    try {
      const res = await fetch(`/api/banners/${id}/approve`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to approve banner');
      setMessage('Banner approved and published live on website!');
      fetchBanners();
    } catch (err: any) {
      setError(err.message || 'Error approving banner.');
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete banner "${title}"?`)) return;
    setMessage(null);
    setError(null);
    try {
      const res = await fetch(`/api/banners/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete banner');
      setMessage('Banner deleted.');
      fetchBanners();
    } catch (err: any) {
      setError(err.message || 'Error deleting banner.');
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-navy-900 tracking-tight">
            Banners &amp; Promotional Campaigns
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage homepage sliders, special discount campaigns, and AI-assisted graphics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/ai-banner-studio"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-navy-900 hover:bg-navy-800 text-cyan-accent border border-navy-700 rounded-xl text-xs font-bold transition shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Banner Studio</span>
          </Link>
        </div>
      </div>

      {message && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Banners Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-2 text-center py-12 text-xs text-slate-400">
            Loading promotional banners...
          </div>
        ) : banners.length === 0 ? (
          <div className="col-span-2 bg-white rounded-2xl border border-slate-200 p-12 text-center text-xs text-slate-400 space-y-3">
            <p>No banners configured yet.</p>
            <Link
              href="/admin/ai-banner-studio"
              className="inline-block px-4 py-2 bg-brand-500 text-white rounded-lg font-bold"
            >
              Generate First Banner with AI Studio
            </Link>
          </div>
        ) : (
          banners.map((b) => (
            <div
              key={b.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between"
            >
              <div>
                <div className="relative aspect-[16/9] w-full bg-navy-950 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={b.imageUrl} alt={b.title} className="w-full h-full object-cover" />
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                    <span className="px-2 py-0.5 rounded bg-navy-950/80 backdrop-blur-sm text-cyan-accent text-[10px] font-bold uppercase tracking-wider">
                      {b.position}
                    </span>
                    {b.isAiGenerated && (
                      <span className="px-2 py-0.5 rounded bg-brand-500 text-white text-[10px] font-black uppercase">
                        AI Generated
                      </span>
                    )}
                  </div>

                  <div className="absolute top-3 right-3">
                    {b.isApproved ? (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-600 text-white text-[10px] font-bold shadow-md flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>LIVE</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full bg-amber-500 text-white text-[10px] font-bold shadow-md flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>DRAFT / PENDING APPROVAL</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-5 space-y-2 text-xs">
                  {b.badgeText && (
                    <span className="font-bold text-brand-600 uppercase tracking-wide text-[10px]">
                      {b.badgeText}
                    </span>
                  )}
                  <h3 className="font-extrabold text-sm text-navy-900 leading-snug">
                    {b.title}
                  </h3>
                  {b.subtitle && (
                    <p className="text-slate-500 text-xs leading-relaxed line-clamp-2">
                      {b.subtitle}
                    </p>
                  )}
                  {b.discountPercent && (
                    <div className="text-[11px] font-bold text-red-600">
                      Promotion: {b.discountPercent}% Discount
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <div>
                  {!b.isApproved ? (
                    <button
                      onClick={() => handleApprove(b.id)}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-sm uppercase tracking-wider"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Approve &amp; Publish</span>
                    </button>
                  ) : (
                    <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approved by {b.approvedBy || 'Admin'}</span>
                    </span>
                  )}
                </div>

                <button
                  onClick={() => handleDelete(b.id, b.title)}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                  title="Delete Banner"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
