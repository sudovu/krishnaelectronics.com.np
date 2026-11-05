'use client';

import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  CreditCard, 
  Truck, 
  Globe 
} from 'lucide-react';
import { SiteSettingsData } from '@/types';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SiteSettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => {
        setSettings(data.settings);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to fetch settings');
        setLoading(false);
      });
  }, []);

  const handleChange = (field: keyof SiteSettingsData, value: any) => {
    if (!settings) return;
    setSettings({ ...settings, [field]: value });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update settings');

      setMessage('Website operational settings updated successfully!');
    } catch (err: any) {
      setError(err.message || 'Error updating settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-xs text-slate-500">
        Loading site settings...
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-navy-900 tracking-tight">
          Website Settings &amp; Business Profile
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Configure official contact information, location details, opening hours, currencies, and SEO parameters.
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

      {settings && (
        <form onSubmit={handleSave} className="space-y-6 text-xs">
          {/* Business Identity */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-navy-900 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
              <Globe className="w-4 h-4 text-brand-500" />
              <span>Business Identity &amp; Branding</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Business Name *
                </label>
                <input
                  type="text"
                  required
                  value={settings.siteName}
                  onChange={(e) => handleChange('siteName', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:border-brand-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tagline / Motto
                </label>
                <input
                  type="text"
                  value={settings.siteTagline}
                  onChange={(e) => handleChange('siteTagline', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:border-brand-500 outline-none"
                />
              </div>
            </div>

            {/* Official Logo Path / URL */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Official Business Logo URL or Path
              </label>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-white p-0.5 border-2 border-brand-500 shrink-0 shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={settings.logoUrl || '/images/logo.jpg'}
                    alt="Logo preview"
                    className="w-full h-full object-contain"
                  />
                </div>
                <input
                  type="text"
                  value={settings.logoUrl || '/images/logo.jpg'}
                  onChange={(e) => handleChange('logoUrl', e.target.value)}
                  placeholder="/images/logo.jpg"
                  className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:border-brand-500 outline-none font-mono text-xs"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Active store logo displayed across Header, Footer, and Admin panel.
              </p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Storefront Overview Description
              </label>
              <textarea
                rows={2}
                value={settings.siteDescription}
                onChange={(e) => handleChange('siteDescription', e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:border-brand-500 outline-none"
              ></textarea>
            </div>
          </div>

          {/* Location & Contact Channels */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-navy-900 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-brand-500" />
              <span>Location, Hours &amp; Customer Channels</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Store Physical Address *
                </label>
                <input
                  type="text"
                  required
                  value={settings.locationAddress}
                  onChange={(e) => handleChange('locationAddress', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:border-brand-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Business &amp; Laboratory Hours
                </label>
                <input
                  type="text"
                  value={settings.businessHours}
                  onChange={(e) => handleChange('businessHours', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:border-brand-500 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Store Phone Number
                </label>
                <input
                  type="text"
                  value={settings.contactPhone}
                  onChange={(e) => handleChange('contactPhone', e.target.value)}
                  placeholder="e.g. 087-XXXXXX / 98XXXXXXXX"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:border-brand-500 outline-none font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Inquiry Email
                </label>
                <input
                  type="email"
                  value={settings.contactEmail}
                  onChange={(e) => handleChange('contactEmail', e.target.value)}
                  placeholder="contact@krishnaelectronics.com.np"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:border-brand-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  WhatsApp Contact Number
                </label>
                <input
                  type="text"
                  value={settings.contactWhatsapp}
                  onChange={(e) => handleChange('contactWhatsapp', e.target.value)}
                  placeholder="98XXXXXXXX"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:border-brand-500 outline-none font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Google Maps Embed URL
              </label>
              <input
                type="text"
                value={settings.googleMapsEmbedUrl}
                onChange={(e) => handleChange('googleMapsEmbedUrl', e.target.value)}
                placeholder="https://www.google.com/maps/embed?pb=..."
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:border-brand-500 outline-none font-mono text-[11px]"
              />
            </div>
          </div>

          {/* Currency, Payment & Logistics */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-navy-900 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-brand-500" />
              <span>Currency, Payment &amp; Logistics</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Currency Code &amp; Symbol
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={settings.currencyCode}
                    onChange={(e) => handleChange('currencyCode', e.target.value)}
                    className="w-1/2 px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono"
                  />
                  <input
                    type="text"
                    value={settings.currencySymbol}
                    onChange={(e) => handleChange('currencySymbol', e.target.value)}
                    className="w-1/2 px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Maintenance Mode
                </label>
                <div className="pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.maintenanceMode}
                      onChange={(e) => handleChange('maintenanceMode', e.target.checked)}
                      className="rounded text-brand-600"
                    />
                    <span className="font-semibold text-slate-700">
                      Enable Maintenance Mode (Show &ldquo;Under Scheduled Maintenance&rdquo; to visitors)
                    </span>
                  </label>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Accepted Payment Methods Text
                </label>
                <input
                  type="text"
                  value={settings.paymentMethods}
                  onChange={(e) => handleChange('paymentMethods', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:border-brand-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Delivery Coverage Note
                </label>
                <input
                  type="text"
                  value={settings.deliveryInfo}
                  onChange={(e) => handleChange('deliveryInfo', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:border-brand-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-8 py-3 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-bold rounded-xl transition shadow-md shadow-brand-500/25 flex items-center gap-2 uppercase tracking-wider"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Updating Settings...' : 'Save Settings'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
