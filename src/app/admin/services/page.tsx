'use client';

import React, { useState, useEffect } from 'react';
import { 
  Wrench, 
  CheckCircle2, 
  Edit3, 
  Save, 
  AlertCircle,
  Plus,
  Trash2
} from 'lucide-react';
import { ServiceData } from '@/types';
import { formatNPR } from '@/lib/formatters';

export default function AdminServicesPage() {
  const [services, setServices] = useState<ServiceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingService, setEditingService] = useState<ServiceData | null>(null);
  const [editFeatures, setEditFeatures] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchServices = () => {
    setLoading(true);
    fetch('/api/services')
      .then((r) => r.json())
      .then((data) => {
        setServices(data.services || []);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const openEdit = (svc: ServiceData) => {
    setEditingService(svc);
    try {
      setEditFeatures(JSON.parse(svc.features || '[]'));
    } catch {
      setEditFeatures([]);
    }
  };

  const handleFeatureChange = (idx: number, val: string) => {
    const updated = [...editFeatures];
    updated[idx] = val;
    setEditFeatures(updated);
  };

  const handleAddFeature = () => {
    setEditFeatures([...editFeatures, '']);
  };

  const handleRemoveFeature = (idx: number) => {
    setEditFeatures(editFeatures.filter((_, i) => i !== idx));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService) return;
    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      const payload = {
        ...editingService,
        features: editFeatures.filter((f) => f.trim() !== ''),
      };

      const res = await fetch(`/api/services/${editingService.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update service');

      setMessage('Service updated successfully!');
      setEditingService(null);
      fetchServices();
    } catch (err: any) {
      setError(err.message || 'Error updating service.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-navy-900 tracking-tight">
          Technical Services &amp; AMC Management
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage descriptions, pricing notes, feature checklists, and availability for all 7 service divisions.
        </p>
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-3 text-center py-12 text-xs text-slate-400">
            Loading services...
          </div>
        ) : (
          services.map((svc) => (
            <div
              key={svc.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold">
                    <Wrench className="w-5 h-5 text-brand-500" />
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    svc.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {svc.isActive ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </div>

                <h3 className="font-extrabold text-base text-navy-900 leading-snug">
                  {svc.title}
                </h3>

                <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                  {svc.shortDescription}
                </p>

                <div className="p-2.5 bg-slate-50 rounded-lg text-xs font-mono font-bold text-brand-600">
                  {svc.startingPrice ? `Starts from ${formatNPR(svc.startingPrice)}` : svc.pricingNote}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 mt-4 flex justify-end">
                <button
                  onClick={() => openEdit(svc)}
                  className="px-3 py-1.5 bg-navy-900 hover:bg-brand-600 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Service</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit Service Modal */}
      {editingService && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4 shadow-2xl">
            <h2 className="text-lg font-bold text-navy-900 border-b border-slate-100 pb-2">
              Edit Service: {editingService.title}
            </h2>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Service Title</label>
                <input
                  type="text"
                  required
                  value={editingService.title}
                  onChange={(e) => setEditingService({ ...editingService, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Short Description</label>
                <textarea
                  rows={2}
                  value={editingService.shortDescription}
                  onChange={(e) => setEditingService({ ...editingService, shortDescription: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 outline-none"
                ></textarea>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Description</label>
                <textarea
                  rows={4}
                  value={editingService.fullDescription}
                  onChange={(e) => setEditingService({ ...editingService, fullDescription: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 outline-none"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Starting Price (रु)</label>
                  <input
                    type="number"
                    value={editingService.startingPrice || ''}
                    onChange={(e) => setEditingService({ ...editingService, startingPrice: e.target.value ? parseFloat(e.target.value) : null })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Pricing Guide Note</label>
                  <input
                    type="text"
                    value={editingService.pricingNote}
                    onChange={(e) => setEditingService({ ...editingService, pricingNote: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 outline-none"
                  />
                </div>
              </div>

              {/* Features Editor */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-700">Features Checklist</label>
                  <button
                    type="button"
                    onClick={handleAddFeature}
                    className="text-xs font-bold text-brand-600 flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Item</span>
                  </button>
                </div>
                {editFeatures.map((feat, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={feat}
                      onChange={(e) => handleFeatureChange(idx, e.target.value)}
                      className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveFeature(idx)}
                      className="p-1.5 text-slate-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingService(null)}
                  className="px-4 py-2 bg-slate-200 rounded-lg font-bold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg font-bold flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
