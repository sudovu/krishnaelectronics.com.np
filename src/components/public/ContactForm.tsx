'use client';

import React, { useState } from 'react';
import { Send, CheckCircle2, AlertCircle, Phone, MessageSquare, Mail, ShieldCheck } from 'lucide-react';

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
    category: 'GENERAL',
    type: initialType,
    subject: initialSubject,
    message: '',
    preferredContact: 'PHONE',
    website_hp: '',
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [reference, setReference] = useState<string | null>(null);
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

      setReference(data.reference || 'RECEIVED');
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 p-8 rounded-2xl text-center space-y-4 animate-fade-in">
        <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h3 className="font-extrabold text-xl text-emerald-950">Inquiry Received Successfully!</h3>
        <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
          Thank you for reaching out to Krishna Electronics Order &amp; Suppliers. Your message has been logged and email notifications have been dispatched to our staff in Surkhet.
        </p>

        {reference && (
          <div className="p-3 bg-white border border-emerald-200 rounded-xl max-w-xs mx-auto shadow-sm">
            <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">
              Your Tracking Reference
            </span>
            <span className="text-base font-black font-mono text-emerald-700 tracking-wider">
              {reference}
            </span>
          </div>
        )}

        <p className="text-xs text-slate-500">
          Our team will contact you via <strong>{formData.preferredContact}</strong> ({formData.customerPhone}) shortly.
        </p>

        <div className="pt-2">
          <button
            onClick={() => {
              setSuccess(false);
              setReference(null);
              setFormData({
                customerName: '',
                customerPhone: '',
                customerEmail: '',
                customerAddress: '',
                category: 'GENERAL',
                type: 'GENERAL_INQUIRY',
                subject: '',
                message: '',
                preferredContact: 'PHONE',
                website_hp: '',
              });
            }}
            className="px-6 py-2.5 bg-navy-900 hover:bg-navy-800 text-white font-bold rounded-xl text-xs transition"
          >
            Send Another Message
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white border border-slate-200 p-6 sm:p-8 rounded-2xl shadow-sm">
      <div className="border-b border-slate-100 pb-3 mb-2">
        <h3 className="font-extrabold text-navy-900 text-lg">Send Us an Enquiry</h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Submit your question or order request directly on our website.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Honeypot field */}
      <input
        type="text"
        name="website_hp"
        value={formData.website_hp}
        onChange={(e) => setFormData({ ...formData, website_hp: e.target.value })}
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        style={{ display: 'none' }}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Your Full Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.customerName}
            onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
            placeholder="e.g. Shyam Sharma"
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-navy-900 focus:bg-white focus:border-brand-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Phone / Mobile Number <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            required
            value={formData.customerPhone}
            onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
            placeholder="e.g. 98XXXXXXXX"
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-navy-900 focus:bg-white focus:border-brand-500 outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Email Address (Optional)
          </label>
          <input
            type="email"
            value={formData.customerEmail}
            onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
            placeholder="shyam@example.com"
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-navy-900 focus:bg-white focus:border-brand-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Location / Address in Surkhet
          </label>
          <input
            type="text"
            value={formData.customerAddress}
            onChange={(e) => setFormData({ ...formData, customerAddress: e.target.value })}
            placeholder="e.g. Mangalgadhi, Surkhet"
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-navy-900 focus:bg-white focus:border-brand-500 outline-none"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">
          Subject
        </label>
        <input
          type="text"
          value={formData.subject}
          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
          placeholder="e.g. Product availability, CCTV quotation, AMC inquiry..."
          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-navy-900 focus:bg-white focus:border-brand-500 outline-none"
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">
          Preferred Contact Method
        </label>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setFormData({ ...formData, preferredContact: 'PHONE' })}
            className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
              formData.preferredContact === 'PHONE'
                ? 'border-brand-500 bg-brand-50 text-brand-700'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Phone</span>
          </button>

          <button
            type="button"
            onClick={() => setFormData({ ...formData, preferredContact: 'WHATSAPP' })}
            className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
              formData.preferredContact === 'WHATSAPP'
                ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={() => setFormData({ ...formData, preferredContact: 'EMAIL' })}
            className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
              formData.preferredContact === 'EMAIL'
                ? 'border-cyan-500 bg-cyan-50 text-cyan-700'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Email</span>
          </button>
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">
          Message <span className="text-red-500">*</span>
        </label>
        <textarea
          required
          rows={4}
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          placeholder="How can Krishna Electronics assist you? Please share your question or requirements..."
          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-navy-900 focus:bg-white focus:border-brand-500 outline-none resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-extrabold rounded-xl transition shadow-lg shadow-brand-500/25 flex items-center justify-center gap-2 text-xs tracking-wide uppercase"
      >
        <Send className="w-4 h-4" />
        <span>{loading ? 'Submitting Message...' : 'Submit Message on Website'}</span>
      </button>

      <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 pt-1">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
        <span>Direct submission. Our team in Birendranagar, Surkhet responds promptly.</span>
      </div>
    </form>
  );
}
