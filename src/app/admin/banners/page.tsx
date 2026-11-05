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
  Edit,
  Play,
  Pause,
  Rocket,
  X,
  Save,
  Check,
  ExternalLink
} from 'lucide-react';
import { BannerData } from '@/types';
import FormattedText from '@/components/common/FormattedText';

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<BannerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Edit Campaign Modal State
  const [editingBanner, setEditingBanner] = useState<BannerData | null>(null);
  const [editSaving, setEditSaving] = useState(false);

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

  const handleToggleRun = async (banner: BannerData) => {
    setMessage(null);
    setError(null);
    const shouldRun = !banner.isApproved;

    try {
      if (shouldRun) {
        // Run campaign
        const res = await fetch(`/api/banners/${banner.id}/approve`, { method: 'POST' });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to run campaign');
        setMessage(`Campaign "${banner.title}" is now running live on website!`);
      } else {
        // Pause campaign
        const res = await fetch(`/api/banners/${banner.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...banner,
            isApproved: false,
            status: 'DRAFT',
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to pause campaign');
        setMessage(`Campaign "${banner.title}" paused and moved to drafts.`);
      }
      fetchBanners();
    } catch (err: any) {
      setError(err.message || 'Error toggling campaign state.');
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete campaign "${title}"?`)) return;
    setMessage(null);
    setError(null);
    try {
      const res = await fetch(`/api/banners/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete campaign');
      setMessage('Campaign deleted.');
      fetchBanners();
    } catch (err: any) {
      setError(err.message || 'Error deleting campaign.');
    }
  };

  const openEditModal = (b: BannerData) => {
    setEditingBanner({ ...b });
  };

  const closeEditModal = () => {
    setEditingBanner(null);
  };

  const applyEditFormat = (field: 'title' | 'subtitle' | 'badgeText', tag: 'b' | 'i' | 'u') => {
    if (!editingBanner) return;
    const currentVal = editingBanner[field] || '';
    const el = document.getElementById(`edit-field-${field}`) as HTMLInputElement | HTMLTextAreaElement | null;
    
    if (el && el.selectionStart !== undefined && el.selectionEnd !== undefined && el.selectionStart !== el.selectionEnd) {
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const selected = currentVal.substring(start, end);
      const replaced = `<${tag}>${selected}</${tag}>`;
      const newVal = currentVal.substring(0, start) + replaced + currentVal.substring(end);
      setEditingBanner({ ...editingBanner, [field]: newVal });
    } else {
      const newVal = currentVal + `<${tag}>Text</${tag}>`;
      setEditingBanner({ ...editingBanner, [field]: newVal });
    }
  };

  const handleSaveEditedBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBanner) return;
    setEditSaving(true);
    setMessage(null);
    setError(null);

    try {
      const res = await fetch(`/api/banners/${editingBanner.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editingBanner.title,
          subtitle: editingBanner.subtitle,
          badgeText: editingBanner.badgeText,
          ctaText: editingBanner.ctaText,
          ctaLink: editingBanner.ctaLink,
          position: editingBanner.position,
          imageUrl: editingBanner.imageUrl,
          discountPercent: editingBanner.discountPercent,
          couponCode: editingBanner.couponCode,
          isApproved: editingBanner.isApproved,
          status: editingBanner.isApproved ? 'PUBLISHED' : 'DRAFT',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update campaign');

      setMessage(`Campaign "${editingBanner.title}" updated successfully!`);
      closeEditModal();
      fetchBanners();
    } catch (err: any) {
      setError(err.message || 'Error updating campaign.');
    } finally {
      setEditSaving(false);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-navy-900 tracking-tight">
            Promotional Campaigns &amp; Banners
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Run, pause, edit, and create homepage hero sliders, promotion banners, and seasonal offers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/ai-banner-studio"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold transition shadow-md shadow-brand-500/25"
          >
            <Sparkles className="w-4 h-4" />
            <span>Create New Campaign (AI Studio)</span>
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
            Loading promotional campaigns...
          </div>
        ) : banners.length === 0 ? (
          <div className="col-span-2 bg-white rounded-2xl border border-slate-200 p-12 text-center text-xs text-slate-400 space-y-3">
            <p>No promotional campaigns configured yet.</p>
            <Link
              href="/admin/ai-banner-studio"
              className="inline-block px-4 py-2 bg-brand-500 text-white rounded-lg font-bold"
            >
              Launch First Campaign with AI Studio
            </Link>
          </div>
        ) : (
          banners.map((b) => (
            <div
              key={b.id}
              className={`bg-white rounded-2xl border shadow-sm overflow-hidden flex flex-col justify-between transition ${
                b.isApproved ? 'border-emerald-300 ring-1 ring-emerald-200' : 'border-slate-200'
              }`}
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
                        AI Studio
                      </span>
                    )}
                  </div>

                  <div className="absolute top-3 right-3">
                    {b.isApproved ? (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-600 text-white text-[10px] font-black shadow-md flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                        <span>RUNNING (LIVE)</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full bg-amber-500 text-white text-[10px] font-bold shadow-md flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>PAUSED (DRAFT)</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-5 space-y-2 text-xs">
                  {b.badgeText && (
                    <div className="font-bold text-brand-600 uppercase tracking-wide text-[10px]">
                      <FormattedText text={b.badgeText} />
                    </div>
                  )}
                  <h3 className="font-extrabold text-sm text-navy-900 leading-snug">
                    <FormattedText text={b.title} />
                  </h3>
                  {b.subtitle && (
                    <div className="text-slate-500 text-xs leading-relaxed line-clamp-2">
                      <FormattedText text={b.subtitle} />
                    </div>
                  )}
                  <div className="flex items-center gap-2 pt-1">
                    {b.discountPercent && (
                      <span className="px-2 py-0.5 rounded bg-red-50 text-red-700 font-bold text-[10px] border border-red-200">
                        {b.discountPercent}% OFF
                      </span>
                    )}
                    <span className="text-[11px] text-slate-400">
                      CTA: <span className="font-semibold text-slate-600">{b.ctaText || 'Learn More'}</span> ({b.ctaLink})
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons: Run/Pause Campaign, Edit Campaign, Delete */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleRun(b)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm ${
                      b.isApproved
                        ? 'bg-amber-100 hover:bg-amber-200 text-amber-900'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    }`}
                  >
                    {b.isApproved ? (
                      <>
                        <Pause className="w-3.5 h-3.5" />
                        <span>Pause Campaign</span>
                      </>
                    ) : (
                      <>
                        <Rocket className="w-3.5 h-3.5" />
                        <span>Run Campaign Live</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => openEditModal(b)}
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold transition flex items-center gap-1"
                  >
                    <Edit className="w-3.5 h-3.5 text-brand-500" />
                    <span>Edit Campaign</span>
                  </button>
                </div>

                <button
                  onClick={() => handleDelete(b.id, b.title)}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                  title="Delete Campaign"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit Campaign Modal */}
      {editingBanner && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Edit className="w-4 h-4 text-brand-500" />
                <h3 className="font-extrabold text-navy-900 text-sm">
                  Edit Promotional Campaign
                </h3>
              </div>
              <button
                type="button"
                onClick={closeEditModal}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditedBanner} className="p-6 space-y-4 text-xs">
              {/* Headline with B, I, U toolbar */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700">Campaign Headline *</label>
                  <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded border border-slate-200">
                    <button
                      type="button"
                      onClick={() => applyEditFormat('title', 'b')}
                      className="px-1.5 py-0.5 rounded text-[11px] font-black hover:bg-white text-slate-700 transition"
                      title="Bold"
                    >
                      B
                    </button>
                    <button
                      type="button"
                      onClick={() => applyEditFormat('title', 'i')}
                      className="px-1.5 py-0.5 rounded text-[11px] italic font-serif hover:bg-white text-slate-700 transition"
                      title="Italic"
                    >
                      I
                    </button>
                    <button
                      type="button"
                      onClick={() => applyEditFormat('title', 'u')}
                      className="px-1.5 py-0.5 rounded text-[11px] underline hover:bg-white text-slate-700 transition"
                      title="Underline"
                    >
                      U
                    </button>
                  </div>
                </div>
                <input
                  id="edit-field-title"
                  type="text"
                  required
                  value={editingBanner.title}
                  onChange={(e) => setEditingBanner({ ...editingBanner, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-bold focus:bg-white focus:border-brand-500 outline-none"
                />
              </div>

              {/* Subtitle with B, I, U toolbar */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700">Subtitle Description</label>
                  <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded border border-slate-200">
                    <button
                      type="button"
                      onClick={() => applyEditFormat('subtitle', 'b')}
                      className="px-1.5 py-0.5 rounded text-[11px] font-black hover:bg-white text-slate-700 transition"
                      title="Bold"
                    >
                      B
                    </button>
                    <button
                      type="button"
                      onClick={() => applyEditFormat('subtitle', 'i')}
                      className="px-1.5 py-0.5 rounded text-[11px] italic font-serif hover:bg-white text-slate-700 transition"
                      title="Italic"
                    >
                      I
                    </button>
                    <button
                      type="button"
                      onClick={() => applyEditFormat('subtitle', 'u')}
                      className="px-1.5 py-0.5 rounded text-[11px] underline hover:bg-white text-slate-700 transition"
                      title="Underline"
                    >
                      U
                    </button>
                  </div>
                </div>
                <textarea
                  id="edit-field-subtitle"
                  rows={2}
                  value={editingBanner.subtitle || ''}
                  onChange={(e) => setEditingBanner({ ...editingBanner, subtitle: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:border-brand-500 outline-none"
                />
              </div>

              {/* Badge & CTA */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-700">Badge Pill Text</label>
                    <div className="flex items-center gap-0.5 bg-slate-100 p-0.5 rounded">
                      <button
                        type="button"
                        onClick={() => applyEditFormat('badgeText', 'b')}
                        className="px-1 text-[10px] font-black hover:bg-white"
                      >
                        B
                      </button>
                      <button
                        type="button"
                        onClick={() => applyEditFormat('badgeText', 'u')}
                        className="px-1 text-[10px] underline hover:bg-white"
                      >
                        U
                      </button>
                    </div>
                  </div>
                  <input
                    id="edit-field-badgeText"
                    type="text"
                    value={editingBanner.badgeText || ''}
                    onChange={(e) => setEditingBanner({ ...editingBanner, badgeText: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Button CTA Label</label>
                  <input
                    type="text"
                    value={editingBanner.ctaText || ''}
                    onChange={(e) => setEditingBanner({ ...editingBanner, ctaText: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Button CTA Link</label>
                  <input
                    type="text"
                    value={editingBanner.ctaLink || ''}
                    onChange={(e) => setEditingBanner({ ...editingBanner, ctaLink: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono text-[11px]"
                  />
                </div>
              </div>

              {/* Image URL & Placement & Discount */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Image URL</label>
                  <input
                    type="text"
                    required
                    value={editingBanner.imageUrl}
                    onChange={(e) => setEditingBanner({ ...editingBanner, imageUrl: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono text-[11px]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Discount %</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={editingBanner.discountPercent ?? ''}
                    onChange={(e) =>
                      setEditingBanner({
                        ...editingBanner,
                        discountPercent: e.target.value ? parseInt(e.target.value, 10) : null,
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono"
                  />
                </div>
              </div>

              {/* Placement Slot & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Placement Slot</label>
                  <select
                    value={editingBanner.position}
                    onChange={(e) => setEditingBanner({ ...editingBanner, position: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  >
                    <option value="HERO_SLIDER">Homepage Hero Slider (16:9)</option>
                    <option value="PROMO_GRID">Category Header Banner</option>
                    <option value="OFFER_BANNER">Offer Strip Banner</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Campaign Status</label>
                  <div className="pt-1.5">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingBanner.isApproved}
                        onChange={(e) => setEditingBanner({ ...editingBanner, isApproved: e.target.checked })}
                        className="rounded text-brand-600 w-4 h-4"
                      />
                      <span className="font-bold text-slate-800">
                        {editingBanner.isApproved ? '🚀 RUNNING (LIVE on Website)' : '⏸️ PAUSED (Draft only)'}
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Live Preview Inside Modal */}
              <div className="p-3 bg-navy-950 text-white rounded-xl space-y-1.5 border border-navy-800">
                <span className="text-[10px] text-cyan-accent uppercase tracking-wider font-bold block">
                  Live Preview:
                </span>
                <h4 className="font-bold text-sm text-white">
                  <FormattedText text={editingBanner.title} />
                </h4>
                {editingBanner.subtitle && (
                  <p className="text-slate-300 text-xs line-clamp-2">
                    <FormattedText text={editingBanner.subtitle} />
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={editSaving}
                  className="px-6 py-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-bold rounded-lg transition shadow-md flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>{editSaving ? 'Saving...' : 'Save Campaign Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
