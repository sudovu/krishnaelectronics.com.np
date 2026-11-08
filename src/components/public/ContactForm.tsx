'use client';

import React, { useState } from 'react';
import { Send, CheckCircle2, AlertCircle, MessageSquare } from 'lucide-react';

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
  const [whatsappUrl, setWhatsappUrl] = useState<string | null>(null);
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

      if (data.whatsappUrl) {
        setWhatsappUrl(data.whatsappUrl);
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
      <div className="bg-emerald-50 border border-emerald-200 p-8 rounded-xl text-center space-y-4">
        <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
        <h3 className="font-bold text-lg text-emerald-900">Inquiry Sent Successfully!</h3>
        <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
          Thank you for reaching out to Krishna Electronics Order &amp; Suppliers. Your message has been logged and email notifications have been dispatched.
        </p>

        {whatsappUrl && (
          <div className="pt-2">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#25D366] hover:bg-[#20ba59] text-white rounded-xl font-extrabold text-xs shadow-lg transition transform hover:scale-[1.02]"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Open WhatsApp with This Inquiry &rarr;</span>
            </a>
            <p className="text-[10px] text-slate-400 mt-1.5">
              Click above to chat directly with our Surkhet technicians on WhatsApp with this inquiry attached.
            </p>
          </div>
        )}

        <div>
          <button
            onClick={() => {
              setSuccess(false);
              setWhatsappUrl(null);
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
            className="mt-2 px-4 py-2 bg-navy-900 text-white rounded-lg text-xs font-semibold hover:bg-brand-600 transition"
          >
            Send Another Message
          </button>
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
            placeholder="e.g. Sunil Thapa"
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:bg-white focus:border-brand-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-slate-700 font-semibold mb-1">
            Phone / Mobile Number *
          </label>
          <input
            type="tel"
            required
            value={formData.customerPhone}
            onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
            placeholder="e.g. 9848XXXXXX"
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:bg-white focus:border-brand-500 outline-none font-mono"
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
            placeholder="e.g. sunil@example.com"
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:bg-white focus:border-brand-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-slate-700 font-semibold mb-1">
            Location / Address in Karnali
          </label>
          <input
            type="text"
            value={formData.customerAddress}
            onChange={(e) => setFormData({ ...formData, customerAddress: e.target.value })}
            placeholder="e.g. Birendranagar-12, Surkhet"
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
            <option value="PRODUCT_INQUIRY">Product Pricing / Availability</option>
            <option value="SERVICE_REQUEST">Laptop / Electronics Repair</option>
            <option value="AMC_REQUEST">Annual Maintenance Contract (AMC)</option>
            <option value="DIRECT_ORDER">Direct Purchase Order</option>
          </select>
        </div>

        <div>
          <label className="block text-slate-700 font-semibold mb-1">
            Preferred Response Method
          </label>
          <select
            value={formData.preferredContact}
            onChange={(e) => setFormData({ ...formData, preferredContact: e.target.value as any })}
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
        <span>{loading ? 'Submitting...' : 'Submit Inquiry'}</span>
      </button>
    </form>
  );
}
