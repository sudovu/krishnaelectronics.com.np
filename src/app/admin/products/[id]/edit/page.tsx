'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Save, 
  Trash2, 
  Plus, 
  AlertCircle,
  Sparkles,
  Search
} from 'lucide-react';
import { generateProductSeo } from '@/lib/seo/product-seo';

export default function EditProductPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conflictInfo, setConflictInfo] = useState<{ id: string; title: string; sku: string } | null>(null);
  const [initialSku, setInitialSku] = useState<string>('');

  const [formData, setFormData] = useState<any>({
    title: '',
    sku: '',
    categoryId: '',
    brandId: '',
    regularPrice: '',
    offerPrice: '',
    stockQuantity: '0',
    stockStatus: 'IN_STOCK',
    shortDescription: '',
    fullDescription: '',
    warranty: '',
    primaryImage: '',
    isFeatured: false,
    isPopular: false,
    isNewArrival: false,
    isDeal: false,
    status: 'DRAFT',
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

  const [specs, setSpecs] = useState<Array<{ name: string; value: string }>>([]);

  useEffect(() => {
    Promise.all([
      fetch('/api/categories').then((r) => r.json()),
      fetch('/api/brands').then((r) => r.json()),
      fetch(`/api/products/${params.id}`).then((r) => r.json()),
    ]).then(([catData, brandData, prodData]) => {
      setCategories(catData.categories || []);
      setBrands(brandData.brands || []);

      if (prodData.product) {
        const p = prodData.product;
        setInitialSku(p.sku || '');
        setFormData({
          title: p.title || '',
          sku: p.sku || '',
          categoryId: p.categoryId || '',
          brandId: p.brandId || '',
          regularPrice: p.regularPrice ? p.regularPrice.toString() : '',
          offerPrice: p.offerPrice ? p.offerPrice.toString() : '',
          stockQuantity: p.stockQuantity ? p.stockQuantity.toString() : '0',
          stockStatus: p.stockStatus || 'IN_STOCK',
          shortDescription: p.shortDescription || '',
          fullDescription: p.fullDescription || '',
          warranty: p.warranty || '',
          primaryImage: p.primaryImage || '',
          isFeatured: Boolean(p.isFeatured),
          isPopular: Boolean(p.isPopular),
          isNewArrival: Boolean(p.isNewArrival),
          isDeal: Boolean(p.isDeal),
          status: p.status || 'DRAFT',
          metaTitle: p.metaTitle || '',
          metaDescription: p.metaDescription || '',
          seoKeywords: p.seoKeywords || '',
        });

        try {
          setSpecs(JSON.parse(p.specifications || '[]'));
        } catch {
          setSpecs([]);
        }
      }
      setLoading(false);
    }).catch((err) => {
      setError('Failed to load product data.');
      setLoading(false);
    });
  }, [params.id]);

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
    setSaving(true);
    setError(null);
    setConflictInfo(null);

    try {
      const payload = {
        ...formData,
        sku: formData.sku.trim().toUpperCase(),
        regularPrice: parseFloat(formData.regularPrice),
        offerPrice: formData.offerPrice ? parseFloat(formData.offerPrice) : null,
        stockQuantity: parseInt(formData.stockQuantity, 10) || 0,
        specifications: JSON.stringify(specs.filter((s) => s.name.trim() !== '')),
      };

      const res = await fetch(`/api/products/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.conflictingProduct) {
          setConflictInfo(data.conflictingProduct);
        }
        throw new Error(data.error || 'Failed to update product');
      }

      router.push('/admin/products');
    } catch (err: any) {
      setError(err.message || 'Error updating product.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-xs text-slate-500">
        Loading product details...
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-5xl mx-auto">
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
              Edit Product: {formData.title || 'Untitled'}
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-slate-500 font-mono">
                Current SKU: <span className="font-bold text-navy-900">{initialSku || 'None'}</span>
              </span>
              {formData.sku && formData.sku.trim().toUpperCase() !== initialSku && (
                <span className="text-xs text-brand-600 font-mono font-medium">
                  → Changing to: <span className="font-bold">{formData.sku.trim().toUpperCase()}</span>
                </span>
              )}
            </div>
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
                in another tab to change its SKU, or assign another unique SKU to this product.
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
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:border-brand-500 outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                SKU *
              </label>
              <input
                type="text"
                required
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                placeholder="e.g. 1, 10, or TPL-AX73-GIG"
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
                value={formData.brandId || ''}
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
            Pricing (NPR / रु) &amp; Stock
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
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:border-brand-500 outline-none font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Offer Price (रु)
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={formData.offerPrice}
                onChange={(e) => setFormData({ ...formData, offerPrice: e.target.value })}
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
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:border-brand-500 outline-none font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Stock Status
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
                Warranty
              </label>
              <input
                type="text"
                value={formData.warranty}
                onChange={(e) => setFormData({ ...formData, warranty: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:border-brand-500 outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Publish Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:border-brand-500 outline-none font-bold text-brand-600"
              >
                <option value="DRAFT">DRAFT (Hidden)</option>
                <option value="PUBLISHED">PUBLISHED (Live)</option>
                <option value="ARCHIVED">ARCHIVED</option>
              </select>
            </div>
          </div>
        </div>

        {/* Media */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-navy-900 uppercase tracking-wider pb-2 border-b border-slate-100">
            Image URL
          </h2>
          <div>
            <input
              type="url"
              required
              value={formData.primaryImage}
              onChange={(e) => setFormData({ ...formData, primaryImage: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:border-brand-500 outline-none"
            />
          </div>
        </div>

        {/* Description & Specs */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-navy-900 uppercase tracking-wider pb-2 border-b border-slate-100">
            Descriptions
          </h2>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Short Description *
            </label>
            <input
              type="text"
              required
              value={formData.shortDescription}
              onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:border-brand-500 outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Full Description *
            </label>
            <textarea
              required
              rows={4}
              value={formData.fullDescription}
              onChange={(e) => setFormData({ ...formData, fullDescription: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:border-brand-500 outline-none"
            ></textarea>
          </div>

          {/* Specs */}
          <div className="pt-2 border-t border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-700">Specifications Table</label>
              <button
                type="button"
                onClick={handleAddSpec}
                className="inline-flex items-center gap-1 text-xs font-bold text-brand-600"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Spec</span>
              </button>
            </div>

            {specs.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Spec Name"
                  value={item.name}
                  onChange={(e) => handleSpecChange(idx, 'name', e.target.value)}
                  className="w-1/3 px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-xs focus:bg-white focus:border-brand-500 outline-none"
                />
                <input
                  type="text"
                  placeholder="Value"
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

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href="/admin/products"
            className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl transition"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={saving}
            className="px-8 py-2.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-bold rounded-xl transition shadow-md shadow-brand-500/25 flex items-center gap-2 uppercase tracking-wider"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Updating...' : 'Save Product Changes'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
