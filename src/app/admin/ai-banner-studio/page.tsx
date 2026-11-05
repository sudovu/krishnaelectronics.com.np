'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Sparkles, 
  Eye, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  ShieldCheck, 
  Smartphone, 
  Monitor, 
  Save, 
  RefreshCw,
  Layers,
  Check
} from 'lucide-react';

interface BannerOption {
  id: string;
  title: string;
  subtitle: string;
  badgeText: string;
  ctaText: string;
  ctaLink: string;
  imageUrl: string;
  palette: string;
  discountPercent: number | null;
  couponCode: string | null;
  aiPromptUsed: string;
  aiStyle: string;
}

export default function AiBannerStudioPage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState('High-performance Wi-Fi 6 routers and smart CCTV security camera systems with electric blue lighting');
  const [style, setStyle] = useState('cyber-clean');
  const [productName, setProductName] = useState('TP-Link Wi-Fi 6 & Hikvision ColorVu');
  const [placement, setPlacement] = useState<'HERO_SLIDER' | 'PROMO_GRID' | 'OFFER_BANNER'>('HERO_SLIDER');
  const [discountPercent, setDiscountPercent] = useState('15');

  const [generating, setGenerating] = useState(false);
  const [options, setOptions] = useState<BannerOption[]>([]);
  const [selectedOption, setSelectedOption] = useState<BannerOption | null>(null);

  // Editable copy fields for the chosen option
  const [editableTitle, setEditableTitle] = useState('');
  const [editableSubtitle, setEditableSubtitle] = useState('');
  const [editableBadge, setEditableBadge] = useState('');
  const [editableCtaText, setEditableCtaText] = useState('Explore Catalog');
  const [editableCtaLink, setEditableCtaLink] = useState('/products');
  const [previewViewport, setPreviewViewport] = useState<'desktop' | 'mobile'>('desktop');

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch('/api/ai/generate-banner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          style,
          productName,
          targetPlacement: placement,
          discountPercent: discountPercent ? parseInt(discountPercent, 10) : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate banners');

      setOptions(data.options || []);
      if (data.options?.[0]) {
        selectOption(data.options[0]);
      }
    } catch (err: any) {
      setError(err.message || 'Generation failed. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const selectOption = (opt: BannerOption) => {
    setSelectedOption(opt);
    setEditableTitle(opt.title);
    setEditableSubtitle(opt.subtitle);
    setEditableBadge(opt.badgeText);
    setEditableCtaText(opt.ctaText);
    setEditableCtaLink(opt.ctaLink);
  };

  const handleSaveBanner = async (shouldApproveAndPublish: boolean) => {
    if (!selectedOption) return;
    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      // 1. Create banner draft first
      const createRes = await fetch('/api/banners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editableTitle,
          subtitle: editableSubtitle,
          badgeText: editableBadge,
          ctaText: editableCtaText,
          ctaLink: editableCtaLink,
          position: placement,
          imageUrl: selectedOption.imageUrl,
          discountPercent: selectedOption.discountPercent,
          couponCode: selectedOption.couponCode,
          isAiGenerated: true,
          aiPrompt: prompt,
          aiStyle: style,
        }),
      });

      const createData = await createRes.json();
      if (!createRes.ok) throw new Error(createData.error || 'Failed to save banner');

      const createdBanner = createData.banner;

      // 2. If user chose Approve & Publish immediately
      if (shouldApproveAndPublish) {
        const approveRes = await fetch(`/api/banners/${createdBanner.id}/approve`, {
          method: 'POST',
        });
        const approveData = await approveRes.json();
        if (!approveRes.ok) throw new Error(approveData.error || 'Failed to approve banner');

        setMessage('Banner successfully approved and published live on the homepage!');
      } else {
        setMessage('Banner saved as draft in promotional inventory. You can review and publish later.');
      }

      setTimeout(() => {
        router.push('/admin/banners');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Error processing banner action.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 text-brand-600 text-xs font-bold uppercase tracking-wider mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI-Assisted Promotional Studio</span>
        </div>
        <h1 className="text-2xl font-extrabold text-navy-900 tracking-tight">
          Create AI-Assisted Graphics &amp; Banners
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Generate promotional visual concepts, customize live text/pricing, preview on actual homepage layouts, and require explicit approval before publishing.
        </p>
      </div>

      {message && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Studio Grid: Generation Form (Left) + Options & Live Mockup (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: AI Parameters Form */}
        <div className="lg:col-span-5 space-y-6">
          <form onSubmit={handleGenerate} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 text-xs">
            <h2 className="text-sm font-bold text-navy-900 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-500" />
              <span>1. Image &amp; Campaign Brief</span>
            </h2>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Visual Prompt / Scene Description *
              </label>
              <textarea
                rows={3}
                required
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. Modern electronics workshop with motherboards, oscilloscope, clean blue lighting..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:border-brand-500 outline-none leading-relaxed"
              ></textarea>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Product or Campaign Theme
              </label>
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="e.g. Wi-Fi 6 Routers &amp; CCTV Packages"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:border-brand-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Visual Style
                </label>
                <select
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:border-brand-500 outline-none"
                >
                  <option value="cyber-clean">Cyber Clean (Electric Blue)</option>
                  <option value="dark-navy-neon">Dark Navy Neon</option>
                  <option value="modern-tech-lab">Modern Tech Lab</option>
                  <option value="minimal-commercial">Minimal Commercial</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Placement Slot
                </label>
                <select
                  value={placement}
                  onChange={(e) => setPlacement(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:border-brand-500 outline-none"
                >
                  <option value="HERO_SLIDER">Homepage Hero Slider (16:9)</option>
                  <option value="PROMO_GRID">Category Header Banner</option>
                  <option value="OFFER_BANNER">Offer Strip Banner</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Discount % (Optional)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(e.target.value)}
                  placeholder="15"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:border-brand-500 outline-none font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Color Accent
                </label>
                <div className="h-9 px-3 bg-slate-50 border border-slate-300 rounded-lg flex items-center gap-2 text-slate-600 font-mono text-[11px]">
                  <span className="w-3 h-3 rounded-full bg-blue-600"></span>
                  <span className="w-3 h-3 rounded-full bg-cyan-400"></span>
                  <span className="w-3 h-3 rounded-full bg-slate-900"></span>
                  <span>Brand Navy/Cyan</span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={generating}
              className="w-full py-3 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-bold rounded-xl transition shadow-lg shadow-brand-500/25 flex items-center justify-center gap-2 tracking-wide uppercase"
            >
              <Sparkles className="w-4 h-4" />
              <span>{generating ? 'Generating 3 Concepts...' : 'Generate Creative Options'}</span>
            </button>
          </form>

          {/* Generated Creative Candidates */}
          {options.length > 0 && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 text-xs">
              <h3 className="font-bold text-sm text-navy-900 uppercase tracking-wider pb-2 border-b border-slate-100">
                2. Review &amp; Select Concept ({options.length})
              </h3>

              <div className="space-y-3">
                {options.map((opt) => {
                  const isSelected = selectedOption?.id === opt.id;
                  return (
                    <div
                      key={opt.id}
                      onClick={() => selectOption(opt)}
                      className={`p-3 rounded-xl border cursor-pointer transition flex items-center gap-3 ${
                        isSelected
                          ? 'border-brand-500 bg-brand-50/50 ring-2 ring-brand-100'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="w-16 h-12 rounded-lg bg-slate-900 overflow-hidden shrink-0 border border-slate-300">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={opt.imageUrl} alt={opt.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 truncate">
                        <div className="font-bold text-navy-900 truncate">{opt.title}</div>
                        <div className="text-[11px] text-slate-500 truncate">{opt.palette}</div>
                      </div>
                      {isSelected && (
                        <div className="w-6 h-6 rounded-full bg-brand-500 text-white flex items-center justify-center shrink-0">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Copy Customization & Live Mockup Preview */}
        <div className="lg:col-span-7 space-y-6">
          {selectedOption ? (
            <div className="space-y-6">
              {/* Copy Editor */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 text-xs">
                <h3 className="font-bold text-sm text-navy-900 uppercase tracking-wider pb-2 border-b border-slate-100">
                  3. Customize Editable Website Text &amp; CTAs
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Badge Pill Text
                    </label>
                    <input
                      type="text"
                      value={editableBadge}
                      onChange={(e) => setEditableBadge(e.target.value)}
                      placeholder="e.g. Surkhet Tech Festival"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:border-brand-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Button CTA Label
                    </label>
                    <input
                      type="text"
                      value={editableCtaText}
                      onChange={(e) => setEditableCtaText(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:border-brand-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Banner Headline *
                  </label>
                  <input
                    type="text"
                    required
                    value={editableTitle}
                    onChange={(e) => setEditableTitle(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-bold focus:bg-white focus:border-brand-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Subtitle Description
                  </label>
                  <textarea
                    rows={2}
                    value={editableSubtitle}
                    onChange={(e) => setEditableSubtitle(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:border-brand-500 outline-none"
                  ></textarea>
                </div>
              </div>

              {/* Live Preview Box */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-brand-500" />
                    <h3 className="font-bold text-sm text-navy-900">
                      4. Live Homepage Preview Mockup
                    </h3>
                  </div>

                  <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setPreviewViewport('desktop')}
                      className={`flex items-center gap-1 px-3 py-1 rounded-md transition ${
                        previewViewport === 'desktop' ? 'bg-white text-navy-900 shadow-sm' : 'text-slate-500'
                      }`}
                    >
                      <Monitor className="w-3.5 h-3.5" />
                      <span>Desktop</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewViewport('mobile')}
                      className={`flex items-center gap-1 px-3 py-1 rounded-md transition ${
                        previewViewport === 'mobile' ? 'bg-white text-navy-900 shadow-sm' : 'text-slate-500'
                      }`}
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>Mobile</span>
                    </button>
                  </div>
                </div>

                {/* Actual Website Hero Render Mockup */}
                <div className="bg-slate-900 p-4 rounded-xl flex justify-center overflow-hidden">
                  <div
                    className={`bg-navy-950 text-white rounded-xl border border-navy-800 p-6 relative overflow-hidden transition-all duration-300 ${
                      previewViewport === 'mobile' ? 'w-[360px]' : 'w-full'
                    }`}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                      <div className={`${previewViewport === 'mobile' ? 'col-span-1' : 'md:col-span-7'} space-y-3`}>
                        {editableBadge && (
                          <span className="inline-block px-2.5 py-0.5 rounded-full bg-brand-500/20 text-cyan-accent text-[10px] font-bold uppercase tracking-wider border border-brand-500/30">
                            {editableBadge}
                          </span>
                        )}
                        <h4 className="font-extrabold text-base sm:text-lg text-white leading-tight">
                          {editableTitle}
                        </h4>
                        <p className="text-slate-300 text-xs leading-relaxed line-clamp-2">
                          {editableSubtitle}
                        </p>
                        <div className="pt-1 flex items-center gap-2">
                          <span className="px-3 py-1 bg-brand-500 text-white rounded-md text-xs font-bold shadow-sm">
                            {editableCtaText} &rarr;
                          </span>
                          {selectedOption.discountPercent && (
                            <span className="text-[11px] font-bold text-cyan-accent">
                              {selectedOption.discountPercent}% OFF
                            </span>
                          )}
                        </div>
                      </div>

                      <div className={`${previewViewport === 'mobile' ? 'col-span-1' : 'md:col-span-5'}`}>
                        <div className="aspect-[4/3] rounded-lg overflow-hidden border border-navy-700 bg-navy-900">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={selectedOption.imageUrl}
                            alt={editableTitle}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Approval & Action Buttons */}
                <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                  <span className="text-slate-500 italic">
                    AI content is isolated until approved by the administrator.
                  </span>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => handleSaveBanner(false)}
                      className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition flex items-center justify-center gap-1.5"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Save as Draft</span>
                    </button>

                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => handleSaveBanner(true)}
                      className="flex-1 sm:flex-none px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition shadow-md flex items-center justify-center gap-1.5 uppercase tracking-wider"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Approve &amp; Publish Live</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-xs text-slate-400 space-y-3">
              <Sparkles className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="font-bold text-navy-900 text-sm">No Banner Concept Generated Yet</h3>
              <p className="max-w-sm mx-auto text-slate-500">
                Fill in the brief on the left and click &ldquo;Generate Creative Options&rdquo; to begin creating customized promotional assets.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
