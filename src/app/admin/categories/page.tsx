'use client';

import React, { useState, useEffect } from 'react';
import { 
  FolderTree, 
  Plus, 
  Trash2, 
  Edit3, 
  Tag, 
  Check, 
  X, 
  AlertCircle, 
  Layers, 
  CheckCircle2, 
  ExternalLink,
  Laptop,
  Wifi,
  Video,
  Cpu,
  Wrench,
  Package,
  Sparkles
} from 'lucide-react';

interface Subcategory {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  orderIndex: number;
  isActive: boolean;
  subcategories: Subcategory[];
  _count?: { products: number };
}

interface Brand {
  id: string;
  name: string;
  slug: string;
  isPopular: boolean;
  websiteUrl?: string;
  _count?: { products: number };
}

export default function CategoriesPage() {
  const [activeTab, setActiveTab] = useState<'categories' | 'brands'>('categories');
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Category Modal State
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    icon: 'FolderTree',
    orderIndex: 0,
    isActive: true,
  });

  // Subcategory inline state
  const [newSubcategoryName, setNewSubcategoryName] = useState<Record<string, string>>({});

  // Brand Modal State
  const [brandModalOpen, setBrandModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [brandForm, setBrandForm] = useState({
    name: '',
    isPopular: false,
    websiteUrl: '',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [catRes, brandRes] = await Promise.all([
        fetch('/api/categories'),
        fetch('/api/brands'),
      ]);
      const catData = await catRes.json();
      const brandData = await brandRes.json();
      setCategories(catData.categories || []);
      setBrands(brandData.brands || []);
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Failed to load categories and brands.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showStatus = (type: 'success' | 'error', text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 5000);
  };

  // --- Category Handlers ---
  const handleOpenCreateCategory = () => {
    setEditingCategory(null);
    setCategoryForm({
      name: '',
      description: '',
      icon: 'FolderTree',
      orderIndex: categories.length + 1,
      isActive: true,
    });
    setCategoryModalOpen(true);
  };

  const handleOpenEditCategory = (cat: Category) => {
    setEditingCategory(cat);
    setCategoryForm({
      name: cat.name,
      description: cat.description || '',
      icon: cat.icon || 'FolderTree',
      orderIndex: cat.orderIndex,
      isActive: cat.isActive,
    });
    setCategoryModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.name.trim()) return;

    try {
      const url = editingCategory ? `/api/categories/${editingCategory.id}` : '/api/categories';
      const method = editingCategory ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryForm),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save category');

      showStatus('success', editingCategory ? 'Category updated successfully!' : 'Category created successfully!');
      setCategoryModalOpen(false);
      fetchData();
    } catch (err: any) {
      showStatus('error', err.message);
    }
  };

  const handleDeleteCategory = async (cat: Category) => {
    if (!confirm(`Are you sure you want to delete category "${cat.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/categories/${cat.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete category');

      showStatus('success', `Category "${cat.name}" deleted.`);
      fetchData();
    } catch (err: any) {
      showStatus('error', err.message);
    }
  };

  // --- Subcategory Handlers ---
  const handleAddSubcategory = async (categoryId: string) => {
    const name = newSubcategoryName[categoryId]?.trim();
    if (!name) return;

    try {
      const res = await fetch('/api/subcategories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, categoryId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add subcategory');

      setNewSubcategoryName({ ...newSubcategoryName, [categoryId]: '' });
      showStatus('success', `Subcategory "${name}" added.`);
      fetchData();
    } catch (err: any) {
      showStatus('error', err.message);
    }
  };

  const handleDeleteSubcategory = async (id: string, name: string) => {
    if (!confirm(`Remove subcategory "${name}"?`)) return;

    try {
      const res = await fetch(`/api/subcategories?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete subcategory');

      showStatus('success', `Subcategory "${name}" removed.`);
      fetchData();
    } catch (err: any) {
      showStatus('error', err.message);
    }
  };

  // --- Brand Handlers ---
  const handleOpenCreateBrand = () => {
    setEditingBrand(null);
    setBrandForm({ name: '', isPopular: false, websiteUrl: '' });
    setBrandModalOpen(true);
  };

  const handleOpenEditBrand = (brand: Brand) => {
    setEditingBrand(brand);
    setBrandForm({
      name: brand.name,
      isPopular: brand.isPopular,
      websiteUrl: brand.websiteUrl || '',
    });
    setBrandModalOpen(true);
  };

  const handleSaveBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandForm.name.trim()) return;

    try {
      const url = editingBrand ? `/api/brands/${editingBrand.id}` : '/api/brands';
      const method = editingBrand ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(brandForm),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save brand');

      showStatus('success', editingBrand ? 'Brand updated!' : 'Brand added successfully!');
      setBrandModalOpen(false);
      fetchData();
    } catch (err: any) {
      showStatus('error', err.message);
    }
  };

  const handleDeleteBrand = async (brand: Brand) => {
    if (!confirm(`Delete brand "${brand.name}"?`)) return;

    try {
      const res = await fetch(`/api/brands/${brand.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete brand');

      showStatus('success', `Brand "${brand.name}" deleted.`);
      fetchData();
    } catch (err: any) {
      showStatus('error', err.message);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-navy-900 tracking-tight flex items-center gap-2">
            <FolderTree className="w-7 h-7 text-brand-500" />
            <span>Categories &amp; Brands Management</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Organize catalog structure, create subcategories, and manage authorized hardware brands.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {activeTab === 'categories' ? (
            <button
              onClick={handleOpenCreateCategory}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold transition shadow-md shadow-brand-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add New Category</span>
            </button>
          ) : (
            <button
              onClick={handleOpenCreateBrand}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold transition shadow-md shadow-brand-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Brand</span>
            </button>
          )}
        </div>
      </div>

      {/* Status Notifications */}
      {statusMessage && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center gap-2.5 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          )}
          <span className="font-semibold">{statusMessage.text}</span>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200 gap-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('categories')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition ${
            activeTab === 'categories'
              ? 'border-brand-500 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <FolderTree className="w-4 h-4" />
          <span>Product Categories ({categories.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('brands')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition ${
            activeTab === 'brands'
              ? 'border-brand-500 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>Authorized Brands ({brands.length})</span>
        </button>
      </div>

      {/* Loading Skeleton */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs">
          Loading catalog structure...
        </div>
      ) : activeTab === 'categories' ? (
        /* Categories List */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition space-y-4"
            >
              {/* Card Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold">
                    <Layers className="w-5 h-5 text-brand-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-navy-900 flex items-center gap-2">
                      {cat.name}
                      {!cat.isActive && (
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-semibold">
                          Inactive
                        </span>
                      )}
                    </h3>
                    <p className="text-[11px] text-slate-400 font-mono">
                      /products?category={cat.slug}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenEditCategory(cat)}
                    className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition"
                    title="Edit Category"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(cat)}
                    className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition"
                    title="Delete Category"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {cat.description && (
                <p className="text-xs text-slate-600 leading-relaxed">
                  {cat.description}
                </p>
              )}

              {/* Subcategories Section */}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                  <span>Subcategories ({cat.subcategories.length})</span>
                  <span className="text-[11px] font-normal text-slate-400">
                    {cat._count?.products || 0} products in category
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {cat.subcategories.map((sub) => (
                    <span
                      key={sub.id}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium"
                    >
                      <span>{sub.name}</span>
                      <button
                        onClick={() => handleDeleteSubcategory(sub.id, sub.name)}
                        className="text-slate-400 hover:text-red-500 transition"
                        title="Remove Subcategory"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  {cat.subcategories.length === 0 && (
                    <span className="text-xs text-slate-400 italic">No subcategories yet.</span>
                  )}
                </div>

                {/* Add Subcategory Inline Input */}
                <div className="pt-2 flex items-center gap-2">
                  <input
                    type="text"
                    value={newSubcategoryName[cat.id] || ''}
                    onChange={(e) =>
                      setNewSubcategoryName({ ...newSubcategoryName, [cat.id]: e.target.value })
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSubcategory(cat.id);
                      }
                    }}
                    placeholder="+ New subcategory name..."
                    className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-brand-500 focus:bg-white"
                  />
                  <button
                    onClick={() => handleAddSubcategory(cat.id)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold transition"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Brands List */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {brands.map((brand) => (
            <div
              key={brand.id}
              className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow transition flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-start justify-between gap-1">
                  <h4 className="font-bold text-sm text-navy-900">{brand.name}</h4>
                  {brand.isPopular && (
                    <span className="px-1.5 py-0.5 rounded bg-brand-50 text-brand-600 text-[9px] font-bold uppercase">
                      Popular
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                  /brand={brand.slug}
                </p>
                <div className="text-[11px] text-slate-500 mt-2">
                  {brand._count?.products || 0} products listed
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-xs">
                <button
                  onClick={() => handleOpenEditBrand(brand)}
                  className="text-slate-500 hover:text-brand-600 text-xs font-semibold"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteBrand(brand)}
                  className="text-red-500 hover:text-red-700 p-1"
                  title="Delete Brand"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- Category Modal --- */}
      {categoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-navy-900">
                {editingCategory ? 'Edit Category' : 'Create New Category'}
              </h3>
              <button
                onClick={() => setCategoryModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  placeholder="e.g. Smart IoT &amp; Automation"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:bg-white focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  placeholder="Brief summary of products in this category..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:bg-white focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Display Order Index
                  </label>
                  <input
                    type="number"
                    value={categoryForm.orderIndex}
                    onChange={(e) =>
                      setCategoryForm({ ...categoryForm, orderIndex: parseInt(e.target.value, 10) || 0 })
                    }
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:bg-white focus:border-brand-500"
                  />
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={categoryForm.isActive}
                      onChange={(e) =>
                        setCategoryForm({ ...categoryForm, isActive: e.target.checked })
                      }
                      className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4"
                    />
                    <span>Active in Storefront</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCategoryModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-bold transition shadow-md shadow-brand-500/20"
                >
                  {editingCategory ? 'Update Category' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Brand Modal --- */}
      {brandModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-navy-900">
                {editingBrand ? 'Edit Brand' : 'Add New Hardware Brand'}
              </h3>
              <button
                onClick={() => setBrandModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBrand} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Brand Name *
                </label>
                <input
                  type="text"
                  required
                  value={brandForm.name}
                  onChange={(e) => setBrandForm({ ...brandForm, name: e.target.value })}
                  placeholder="e.g. Cisco, Sonoff, Acer"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:bg-white focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Official Website URL
                </label>
                <input
                  type="url"
                  value={brandForm.websiteUrl}
                  onChange={(e) => setBrandForm({ ...brandForm, websiteUrl: e.target.value })}
                  placeholder="https://brand.com"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:bg-white focus:border-brand-500"
                />
              </div>

              <div className="flex items-center pt-2">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={brandForm.isPopular}
                    onChange={(e) => setBrandForm({ ...brandForm, isPopular: e.target.checked })}
                    className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4"
                  />
                  <span>Feature in Homepage Brands Showcase</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setBrandModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-bold transition shadow-md shadow-brand-500/20"
                >
                  {editingBrand ? 'Save Changes' : 'Add Brand'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
