'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Upload, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  Package,
  Sparkles,
  Search
} from 'lucide-react';
import { generateProductSeo } from '@/lib/seo/product-seo';

export default function NewProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conflictInfo, setConflictInfo] = useState<{ id: string; title: string; sku: string } | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    sku: '',
    categoryId: '',
    brandId: '',
    regularPrice: '',
    offerPrice: '',
    stockQuantity: '10',
    stockStatus: 'IN_STOCK',
    shortDescription: '',
    fullDescription: '',
    warranty: '1 Year Warranty',
    primaryImage: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=800&q=80',
    isFeatured: false,
    isPopular: false,
    isNewArrival: true,
    isDeal: false,
    status: 'PUBLISHED', // Default to PUBLISHED so newly added products are immediately live on the storefront
    metaTitle: '',
    metaDescription: '',
    seoKeywords: '',
  });


  const handleAutoOptimizeSeo = () => {
    const selectedBrand = brands.find((b) => b.id === formData.brandId)?.name || '';
    const selectedCat = categories.find((c) => c.id === formData.categoryId)?.name || '';
    const regPrice = parseFloat(formData.regularPrice);
    const offPrice = parseFloat(formData.offerPrice);

    const seo = generateProductSeo({
      title: formData.title,
      brandName: selectedBrand,
      categoryName: selectedCat,
      regularPrice: isNaN(regPrice) ? null : regPrice,
      offerPrice: isNaN(offPrice) ? null : offPrice,
      specifications: specs,
      warranty: formData.warranty,
      shortDescription: formData.shortDescription,
    });

    setFormData((prev: any) => ({
      ...prev,
      metaTitle: seo.metaTitle,
      metaDescription: seo.metaDescription,
      seoKeywords: seo.seoKeywords,
    }));
  };

  const [specs, setSpecs] = useState<Array<{ name: string; value: string }>>([
    { name: 'Model / Version', value: '' },
    { name: 'Power Input', value: '220V AC / 50Hz' },
  ]);

  useEffect(() => {
    // Load categories & brands
    Promise.all([
      fetch('/api/categories').then((r) => r.json()),
      fetch('/api/brands').then((r) => r.json()),
    ]).then(([catData, brandData]) => {
      setCategories(catData.categories || []);
      setBrands(brandData.brands || []);
      if (catData.categories?.[0]) {
        setFormData((prev) => ({ ...prev, categoryId: catData.categories[0].id }));
      }
      if (brandData.brands?.[0]) {
        setFormData((prev) => ({ ...prev, brandId: brandData.brands[0].id }));
      }
    });
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const body = new FormData();
    body.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to upload image');
      setFormData((prev) => ({ ...prev, primaryImage: data.url }));
    } catch (err: any) {
      alert(err.message || 'Error uploading file');
    } finally {
      setUploading(false);
    }
  };

  const handleAddSpec = () => {
    setSpecs([...specs, { name: '', value: '' }]);
  };

  const handleRemoveSpec = (index: number) => {
    setSpecs(specs.filter((_, i) => i !== index));
  };

  const handleSpecChange = (index: number, field: 'name' | 'value', val: string) => {
    const updated = [...specs];
    updated[index][field] = val;
    setSpecs(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.sku || !formData.regularPrice || !formData.categoryId) {
      setError('Please fill out all required fields marked with *');
      return;
    }

    setLoading(true);
    setError(null);
    setConflictInfo(null);

    try {
      const payload = {
        ...formData,
        regularPrice: parseFloat(formData.regularPrice),
        offerPrice: formData.offerPrice ? parseFloat(formData.offerPrice) : null,
        stockQuantity: parseInt(formData.stockQuantity, 10) || 0,
        specifications: JSON.stringify(specs.filter((s) => s.name.trim() !== '')),
      };

      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.conflictingProduct) {
          setConflictInfo(data.conflictingProduct);
        }
        throw new Error(data.error || 'Failed to create product');
      }

      router.push('/admin/products');
    } catch (err: any) {
      setError(err.message || 'Error creating product.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/products"
            className="p-2 bg-white rounded-lg border border-slate-200 hover:bg-slate-50 transition"
          >
            <ArrowLeft className="w-4 h-4 text-slate-600" />
          </Link>
          <div>
            <h1 className="text-xl font-extrabold text-navy-900 tracking-tight">
              Create New Product
            </h1>
            <p className="text-xs text-slate-500">
              Add catalog inventory for Krishna Electronics &amp; Order Suppliers
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold">{error}</span>
            {conflictInfo && (
              <p className="text-slate-600 mt-1">
                Tip: You can{' '}
                <Link
                  href={`/admin/products/${conflictInfo.id}/edit`}
                  className="font-bold text-brand-600 underline hover:text-brand-700"
                  target="_blank"
                >
                  open &quot;{conflictInfo.title}&quot; (SKU: {conflictInfo.sku})
                </Link>{' '}
                in another tab to change its SKU first, or assign a different unique SKU.
              </p>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 text-xs">
        {/* Basic Info */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-navy-900 uppercase tracking-wider pb-2 border-b border-slate-100">
            Basic Identification
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Product Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. TP-Link Archer AX73 AX5400 Wi-Fi 6 Router"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:border-brand-500 outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                SKU (Stock Keeping Unit) *
              </label>
              <input
                type="text"
                required
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                placeholder="e.g. 1, 101, or TPL-AX73-GIG"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:border-brand-500 outline-none font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Category *
              </label>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:border-brand-500 outline-none"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Brand
              </label>
              <select
                value={formData.brandId}
                onChange={(e) => setFormData({ ...formData, brandId: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:border-brand-500 outline-none"
              >
                <option value="">No specific brand</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Pricing & Stock */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-navy-900 uppercase tracking-wider pb-2 border-b border-slate-100">
            Pricing in Nepalese Rupees (NPR / रु) &amp; Inventory
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Regular Price (रु) *
              </label>
              <input
                type="number"
                required
                min="0"
                step="any"
                value={formData.regularPrice}
                onChange={(e) => setFormData({ ...formData, regularPrice: e.target.value })}
                placeholder="17500"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:border-brand-500 outline-none font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Offer / Discounted Price (रु)
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={formData.offerPrice}
                onChange={(e) => setFormData({ ...formData, offerPrice: e.target.value })}
                placeholder="15800"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:border-brand-500 outline-none font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Stock Quantity *
              </label>
              <input
                type="number"
                required
                min="0"
                value={formData.stockQuantity}
                onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
                placeholder="10"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:border-brand-500 outline-none font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Stock Availability Label
              </label>
              <select
                value={formData.stockStatus}
                onChange={(e) => setFormData({ ...formData, stockStatus: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:border-brand-500 outline-none"
              >
                <option value="IN_STOCK">In Stock</option>
                <option value="LOW_STOCK">Low Stock</option>
                <option value="OUT_OF_STOCK">Out of Stock</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Warranty Coverage
              </label>
              <input
                type="text"
                value={formData.warranty}
                onChange={(e) => setFormData({ ...formData, warranty: e.target.value })}
                placeholder="e.g. 1 Year Official Brand Warranty"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:border-brand-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Media */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-navy-900 uppercase tracking-wider pb-2 border-b border-slate-100">
            Product Media
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Primary Image URL *
              </label>
              <input
                type="url"
                required
                value={formData.primaryImage}
                onChange={(e) => setFormData({ ...formData, primaryImage: e.target.value })}
                placeholder="https://..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:border-brand-500 outline-none"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Or upload a local image file below:
              </p>
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100"
                />
                {uploading && <span className="text-[11px] text-brand-600 animate-pulse">Uploading...</span>}
              </div>
            </div>

            <div className="flex justify-center">
              <div className="w-32 h-32 rounded-xl bg-slate-50 border border-slate-200 overflow-hidden flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={formData.primaryImage}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Descriptions & Specs */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-navy-900 uppercase tracking-wider pb-2 border-b border-slate-100">
            Descriptions &amp; Specifications
          </h2>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Short Description (Card snippet) *
            </label>
            <input
              type="text"
              required
              value={formData.shortDescription}
              onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
              placeholder="e.g. Ultra-fast Wi-Fi 6 router offering 5400 Mbps bandwidth, 6 high-gain antennas..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:border-brand-500 outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Full Detailed Description *
            </label>
            <textarea
              required
              rows={4}
              value={formData.fullDescription}
              onChange={(e) => setFormData({ ...formData, fullDescription: e.target.value })}
              placeholder="Detailed product features, use cases, ports, and packaging contents..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:border-brand-500 outline-none"
            ></textarea>
          </div>

          {/* Specifications Key-Value rows */}
          <div className="pt-2 border-t border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-700">
                Technical Specifications Table
              </label>
              <button
                type="button"
                onClick={handleAddSpec}
                className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-700"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Spec Row</span>
              </button>
            </div>

            {specs.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Spec Name (e.g. RAM)"
                  value={item.name}
                  onChange={(e) => handleSpecChange(idx, 'name', e.target.value)}
                  className="w-1/3 px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-xs focus:bg-white focus:border-brand-500 outline-none"
                />
                <input
                  type="text"
                  placeholder="Value (e.g. 16 GB DDR4)"
                  value={item.value}
                  onChange={(e) => handleSpecChange(idx, 'value', e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-xs focus:bg-white focus:border-brand-500 outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveSpec(idx)}
                  className="p-1.5 text-slate-400 hover:text-red-600 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* SEO & Search Keywords Optimizer */}
        <div className="bg-white p-6 rounded-2xl border-2 border-brand-500/20 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
            <div>
              <h2 className="text-sm font-extrabold text-navy-900 uppercase tracking-wider flex items-center gap-2">
                <Search className="w-4 h-4 text-brand-500" />
                <span>🚀 Search Engine Optimization (SEO) &amp; Keyword Engine</span>
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Automatically optimized for Google, Bing, and internal search indexing across Surkhet &amp; Nepal.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAutoOptimizeSeo}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-brand-500 to-cyan-500 text-white rounded-lg text-xs font-bold shadow-sm hover:opacity-90 transition shrink-0 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
              <span>✨ Auto-Generate / Refresh SEO</span>
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                SEO Meta Title
              </label>
              <input
                type="text"
                value={formData.metaTitle || ''}
                onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                placeholder="Auto-generated if left blank (e.g. Title | Price in Surkhet Nepal | Krishna Electronics)"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-semibold focus:bg-white focus:border-brand-500 outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                SEO Meta Description
              </label>
              <textarea
                rows={2}
                value={formData.metaDescription || ''}
                onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                placeholder="High-converting summary displayed in Google search results with warranty & store location."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:border-brand-500 outline-none"
              ></textarea>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Broad Search Keywords (Comma-separated)
              </label>
              <textarea
                rows={3}
                value={formData.seoKeywords || ''}
                onChange={(e) => setFormData({ ...formData, seoKeywords: e.target.value })}
                placeholder="e.g. router, wifi 6, tp-link nepal, buy in surkhet, birendranagar electronics, price in npr, best price, genuine warranty"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-xs font-mono focus:bg-white focus:border-brand-500 outline-none"
              ></textarea>
              <p className="text-[11px] text-slate-400 mt-1">
                Wide keyword tags used by search crawlers and website search bar. Click &ldquo;Auto-Generate / Refresh SEO&rdquo; above to generate 30+ keywords based on title, brand, category, and specs.
              </p>
            </div>

            {formData.seoKeywords && (
              <div className="pt-2">
                <span className="text-[11px] font-bold text-slate-600 block mb-1.5">
                  Active Keyword Cloud ({formData.seoKeywords.split(',').filter(Boolean).length} tags):
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  {formData.seoKeywords
                    .split(',')
                    .map((k: string) => k.trim())
                    .filter(Boolean)
                    .map((k: string, i: number) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 bg-white border border-slate-200 rounded-md text-[10px] font-medium text-slate-700 shadow-2xs"
                      >
                        {k}
                      </span>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Visibility & Flags */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-navy-900 uppercase tracking-wider pb-2 border-b border-slate-100">
            Publishing Status &amp; Highlights
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isFeatured}
                onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                className="rounded text-brand-600"
              />
              <span className="font-semibold text-slate-700">Featured Item</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isNewArrival}
                onChange={(e) => setFormData({ ...formData, isNewArrival: e.target.checked })}
                className="rounded text-brand-600"
              />
              <span className="font-semibold text-slate-700">New Arrival</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isPopular}
                onChange={(e) => setFormData({ ...formData, isPopular: e.target.checked })}
                className="rounded text-brand-600"
              />
              <span className="font-semibold text-slate-700">Popular</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isDeal}
                onChange={(e) => setFormData({ ...formData, isDeal: e.target.checked })}
                className="rounded text-brand-600"
              />
              <span className="font-semibold text-slate-700">Special Deal</span>
            </label>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <label className="block font-semibold text-slate-700 mb-1">
              Initial State
            </label>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="PUBLISHED"
                  checked={formData.status === 'PUBLISHED'}
                  onChange={() => setFormData({ ...formData, status: 'PUBLISHED' })}
                  className="text-brand-600"
                />
                <span className="font-bold text-emerald-700">Publish Immediately to Live Website (Recommended)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="DRAFT"
                  checked={formData.status === 'DRAFT'}
                  onChange={() => setFormData({ ...formData, status: 'DRAFT' })}
                  className="text-brand-600"
                />
                <span className="font-bold text-amber-700">Save as Draft (Private review)</span>
              </label>
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href="/admin/products"
            className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl transition"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={loading}
            className="px-8 py-2.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-bold rounded-xl transition shadow-md shadow-brand-500/25 flex items-center gap-2 uppercase tracking-wider"
          >
            <Package className="w-4 h-4" />
            <span>{loading ? 'Saving...' : formData.status === 'DRAFT' ? 'Save Draft Product' : 'Save & Publish Product'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
