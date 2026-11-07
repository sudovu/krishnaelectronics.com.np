'use client';

import React, { useState } from 'react';
import { Send, CheckCircle2, AlertCircle } from 'lucide-react';

interface ContactFormProps {
  initialSubject?: string;
  initialType?: string;
}

export default function ContactForm({ initialSubject = '', initialType = 'GENERAL_INQUIRY' }: ContactFormProps) {
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    customerAddress: '',
    type: initialType,
    subject: initialSubject,
    message: '',
    preferredContact: 'PHONE',
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerName.trim() || !formData.customerPhone.trim() || !formData.message.trim()) {
      setError('Please provide your name, phone number, and a brief message.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit inquiry.');
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 p-8 rounded-xl text-center space-y-3">
        <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
        <h3 className="font-bold text-lg text-emerald-900">Inquiry Received Successfully!</h3>
        <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
          Thank you for reaching out to Krishna Electronics Order &amp; Suppliers. We have recorded your inquiry and automatically notified our desk via email &amp; WhatsApp. A technical specialist will contact you shortly.
        </p>
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => {
              setSuccess(false);
              setFormData({
                customerName: '',
                customerPhone: '',
                customerEmail: '',
                customerAddress: '',
                type: 'GENERAL_INQUIRY',
                subject: '',
                message: '',
                preferredContact: 'PHONE',
              });
            }}
            className="px-4 py-2 bg-navy-900 text-white rounded-lg text-xs font-semibold hover:bg-brand-600 transition"
          >
            Send Another Message
          </button>
          <a
            href="https://wa.me/9779858083951"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition"
          >
            Need Urgent Help? Chat on WhatsApp
          </a>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-xs">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-slate-700 font-semibold mb-1">
            Full Name *
          </label>
          <input
            type="text"
            required
            value={formData.customerName}
            onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
            placeholder="e.g. Ramesh Shrestha"
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:bg-white focus:border-brand-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-slate-700 font-semibold mb-1">
            Mobile / Phone Number *
          </label>
          <input
            type="tel"
            required
            value={formData.customerPhone}
            onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
            placeholder="e.g. 98XXXXXXXX"
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:bg-white focus:border-brand-500 outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-slate-700 font-semibold mb-1">
            Email Address (Optional)
          </label>
          <input
            type="email"
            value={formData.customerEmail}
            onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
            placeholder="e.g. name@example.com"
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:bg-white focus:border-brand-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-slate-700 font-semibold mb-1">
            Address / Organization (Optional)
          </label>
          <input
            type="text"
            value={formData.customerAddress}
            onChange={(e) => setFormData({ ...formData, customerAddress: e.target.value })}
            placeholder="e.g. Birendranagar, Surkhet"
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:bg-white focus:border-brand-500 outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-slate-700 font-semibold mb-1">
            Inquiry Category
          </label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:border-brand-500 outline-none"
          >
            <option value="GENERAL_INQUIRY">General Inquiry</option>
            <option value="PRODUCT_INQUIRY">Product Pricing &amp; Availability</option>
            <option value="SERVICE_REQUEST">Repair &amp; Technical Support</option>
            <option value="AMC_REQUEST">Annual Maintenance Contract (AMC)</option>
            <option value="DIRECT_ORDER">Direct Bulk Order / Quotation</option>
          </select>
        </div>

        <div>
          <label className="block text-slate-700 font-semibold mb-1">
            Preferred Follow-up Channel
          </label>
          <select
            value={formData.preferredContact}
            onChange={(e) => setFormData({ ...formData, preferredContact: e.target.value })}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:border-brand-500 outline-none"
          >
            <option value="PHONE">Phone Call</option>
            <option value="WHATSAPP">WhatsApp Message</option>
            <option value="EMAIL">Email</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-slate-700 font-semibold mb-1">
          Subject / Device Model
        </label>
        <input
          type="text"
          value={formData.subject}
          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
          placeholder="e.g. Quotation for 8x Hikvision IP Cameras & NVR"
          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:bg-white focus:border-brand-500 outline-none"
        />
      </div>

      <div>
        <label className="block text-slate-700 font-semibold mb-1">
          Message &amp; Detailed Requirements *
        </label>
        <textarea
          required
          rows={4}
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          placeholder="Please describe your requirements, questions, or issues..."
          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:bg-white focus:border-brand-500 outline-none"
        ></textarea>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full sm:w-auto px-8 py-3 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-bold rounded-lg uppercase tracking-wider transition shadow-md flex items-center justify-center gap-2"
      >
        <Send className="w-4 h-4" />
        <span>{loading ? 'Submitting & Dispatching...' : 'Submit Inquiry'}</span>
      </button>
    </form>
  );
}
