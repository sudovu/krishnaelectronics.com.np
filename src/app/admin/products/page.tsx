'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Package, 
  Plus, 
  Search, 
  CheckCircle2, 
  Clock, 
  Trash2, 
  Edit3, 
  Eye, 
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Check,
  Rocket
} from 'lucide-react';
import { ProductData } from '@/types';
import { formatNPR } from '@/lib/formatters';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [previewProduct, setPreviewProduct] = useState<ProductData | null>(null);
  const [previewViewport, setPreviewViewport] = useState<'desktop' | 'mobile'>('desktop');
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchProducts = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.append('q', search);
    if (statusFilter) params.append('status', statusFilter);

    fetch(`/api/products?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setProducts(data.products || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchProducts();
  }, [statusFilter]);

  const handlePublish = async (id: string) => {
    setActionMessage(null);
    setActionError(null);
    try {
      const res = await fetch(`/api/products/${id}/publish`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to publish product');
      }
      setActionMessage('Product validated and published successfully!');
      fetchProducts();
    } catch (err: any) {
      setActionError(err.message || 'Validation failed before publication.');
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to permanently delete "${title}"?`)) return;
    setActionMessage(null);
    setActionError(null);

    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete product');
      }
      setActionMessage('Product deleted successfully.');
      fetchProducts();
    } catch (err: any) {
      setActionError(err.message || 'Failed to delete product.');
    }
  };

  const draftCount = products.filter((p) => p.status === 'DRAFT').length;

  const handlePublishAllDrafts = async () => {
    if (!confirm(`Publish all ${draftCount} draft products immediately to the live website?`)) return;
    setActionMessage(null);
    setActionError(null);
    try {
      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publishProducts: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to publish products');
      setActionMessage(`All ${draftCount} draft products are now live on website!`);
      fetchProducts();
    } catch (err: any) {
      setActionError(err.message || 'Error publishing draft products.');
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-navy-900 tracking-tight">
            Products &amp; Inventory Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage catalog items, prices in NPR, stock status, and publishing lifecycle.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {draftCount > 0 && (
            <button
              onClick={handlePublishAllDrafts}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-emerald-600/20"
            >
              <Rocket className="w-4 h-4" />
              <span>Publish All Drafts ({draftCount})</span>
            </button>
          )}
          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold transition shadow-md shadow-brand-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
          </Link>
        </div>
      </div>

      {/* Action Messages */}
      {actionMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{actionMessage}</span>
        </div>
      )}
      {actionError && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setStatusFilter('')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
              statusFilter === '' ? 'bg-navy-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Items
          </button>
          <button
            onClick={() => setStatusFilter('PUBLISHED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
              statusFilter === 'PUBLISHED' ? 'bg-navy-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Published
          </button>
          <button
            onClick={() => setStatusFilter('DRAFT')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
              statusFilter === 'DRAFT' ? 'bg-navy-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Drafts
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchProducts();
          }}
          className="relative w-full sm:w-72"
        >
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, SKU..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:border-brand-500 outline-none"
          />
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
        </form>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-4">Item</th>
                <th className="py-3.5 px-4">SKU / Brand</th>
                <th className="py-3.5 px-4">Price (NPR)</th>
                <th className="py-3.5 px-4">Stock</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Views</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    Loading product catalog...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    No products found. Add a new product or adjust filters.
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={p.primaryImage} alt={p.title} className="w-full h-full object-cover" />
                        </div>
                        <div className="max-w-xs">
                          <div className="font-bold text-navy-900 truncate">{p.title}</div>
                          <div className="text-[11px] text-slate-500 truncate">{p.category?.name || 'General'}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-mono text-slate-700 font-semibold">{p.sku}</div>
                      <div className="text-[11px] text-slate-500">{p.brand?.name || 'Authorized'}</div>
                    </td>

                    <td className="py-3 px-4 font-mono">
                      <div className="font-bold text-navy-900">
                        {formatNPR(p.offerPrice || p.regularPrice)}
                      </div>
                      {p.offerPrice && (
                        <div className="text-[10px] text-slate-400 line-through">
                          {formatNPR(p.regularPrice)}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <span className={`font-mono font-bold ${p.stockQuantity <= 3 ? 'text-amber-600' : 'text-slate-700'}`}>
                        {p.stockQuantity}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      {p.status === 'PUBLISHED' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>PUBLISHED</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold text-[10px]">
                          <Clock className="w-3 h-3" />
                          <span>DRAFT</span>
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-600">
                      {p.viewsCount}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Preview button */}
                        <button
                          onClick={() => setPreviewProduct(p)}
                          className="p-1.5 text-slate-500 hover:text-navy-900 hover:bg-slate-100 rounded-lg transition"
                          title="Preview Product"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Publish Draft */}
                        {p.status === 'DRAFT' && (
                          <button
                            onClick={() => handlePublish(p.id)}
                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold transition"
                            title="Validate & Publish"
                          >
                            Publish
                          </button>
                        )}

                        {/* Edit */}
                        <Link
                          href={`/admin/products/${p.id}/edit`}
                          className="p-1.5 text-slate-500 hover:text-brand-600 hover:bg-slate-100 rounded-lg transition"
                          title="Edit Product"
                        >
                          <Edit3 className="w-4 h-4" />
                        </Link>

                        {/* Delete */}
                        <button
                          onClick={() => handleDelete(p.id, p.title)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Delete Product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Restricted Preview Modal */}
      {previewProduct && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
            {/* Modal Top Bar */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <span className="font-bold text-xs text-navy-900 uppercase tracking-wider">
                  Admin Preview Mode:
                </span>
                <span className="px-2 py-0.5 rounded bg-brand-100 text-brand-700 text-xs font-mono font-bold">
                  {previewProduct.sku}
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  previewProduct.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {previewProduct.status}
                </span>
              </div>

              {/* Viewport Switcher */}
              <div className="flex items-center gap-2">
                <div className="flex bg-slate-200 p-0.5 rounded-lg text-xs font-semibold">
                  <button
                    onClick={() => setPreviewViewport('desktop')}
                    className={`px-2.5 py-1 rounded-md transition ${previewViewport === 'desktop' ? 'bg-white shadow-sm text-navy-900' : 'text-slate-600'}`}
                  >
                    Desktop
                  </button>
                  <button
                    onClick={() => setPreviewViewport('mobile')}
                    className={`px-2.5 py-1 rounded-md transition ${previewViewport === 'mobile' ? 'bg-white shadow-sm text-navy-900' : 'text-slate-600'}`}
                  >
                    Mobile
                  </button>
                </div>

                <button
                  onClick={() => setPreviewProduct(null)}
                  className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold transition ml-2"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Preview Body */}
            <div className="p-6 flex-1 bg-slate-100 flex justify-center">
              <div className={`bg-white rounded-xl border border-slate-200 p-6 shadow-sm ${
                previewViewport === 'mobile' ? 'w-[375px]' : 'w-full'
              }`}>
                <div className="aspect-square w-full rounded-lg overflow-hidden bg-slate-50 mb-4 border border-slate-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={previewProduct.primaryImage} alt={previewProduct.title} className="w-full h-full object-cover" />
                </div>
                <div className="space-y-2 text-xs">
                  <span className="text-brand-600 font-bold uppercase">{previewProduct.brand?.name || 'Brand'}</span>
                  <h3 className="text-lg font-bold text-navy-900 leading-snug">{previewProduct.title}</h3>
                  <div className="text-xl font-bold text-navy-900 font-mono">
                    {formatNPR(previewProduct.offerPrice || previewProduct.regularPrice)}
                  </div>
                  <p className="text-slate-600 leading-relaxed pt-2 border-t border-slate-100">
                    {previewProduct.shortDescription}
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between rounded-b-2xl">
              <span className="text-xs text-slate-500">
                Live URL will be: <code>/products/{previewProduct.slug}</code>
              </span>
              {previewProduct.status === 'DRAFT' && (
                <button
                  onClick={() => {
                    handlePublish(previewProduct.id);
                    setPreviewProduct(null);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition"
                >
                  Approve &amp; Publish Now
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
