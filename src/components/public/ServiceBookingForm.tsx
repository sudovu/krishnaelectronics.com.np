'use client';

import React, { useState } from 'react';
import { Send, CheckCircle2, AlertCircle, MessageSquare } from 'lucide-react';

interface ServiceBookingFormProps {
  serviceId: string;
  serviceTitle: string;
}

export default function ServiceBookingForm({ serviceId, serviceTitle }: ServiceBookingFormProps) {
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    customerAddress: '',
    preferredContact: 'PHONE',
    message: '',
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [whatsappUrl, setWhatsappUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerName.trim() || !formData.customerPhone.trim()) {
      setError('Please provide your name and phone number.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          type: 'SERVICE_REQUEST',
          subject: `Service Request: ${serviceTitle}`,
          serviceId: serviceId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit service inquiry.');
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
      <div className="bg-emerald-950/60 border border-emerald-800 p-6 rounded-xl text-center space-y-4">
        <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
        <h4 className="font-bold text-base text-white">Service Booking Request Received!</h4>
        <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
          Thank you for choosing Krishna Electronics. Our certified laboratory team in Surkhet has logged your booking for &ldquo;{serviceTitle}&rdquo; and email notifications have been dispatched.
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
              <span>Send Booking to WhatsApp Directly &rarr;</span>
            </a>
            <p className="text-[10px] text-slate-400 mt-1.5">
              Click to initiate priority conversation with our Surkhet repair laboratory on WhatsApp.
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
                preferredContact: 'PHONE',
                message: '',
              });
            }}
            className="mt-2 px-4 py-2 bg-navy-800 hover:bg-navy-700 text-white rounded-lg text-xs font-semibold border border-navy-700 transition"
          >
            Submit Another Request
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-xs">
      {error && (
        <div className="p-3 bg-red-950/60 border border-red-800 text-red-300 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-slate-300 font-semibold mb-1">
            Your Full Name *
          </label>
          <input
            type="text"
            required
            value={formData.customerName}
            onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
            placeholder="e.g. Ramesh Shrestha"
            className="w-full px-3.5 py-2.5 bg-navy-900 border border-navy-700 rounded-lg text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-slate-300 font-semibold mb-1">
            Phone Number (Mobile) *
          </label>
          <input
            type="tel"
            required
            value={formData.customerPhone}
            onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
            placeholder="e.g. 98XXXXXXXX"
            className="w-full px-3.5 py-2.5 bg-navy-900 border border-navy-700 rounded-lg text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none font-mono"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-slate-300 font-semibold mb-1">
            Email Address (Optional)
          </label>
          <input
            type="email"
            value={formData.customerEmail}
            onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
            placeholder="e.g. name@example.com"
            className="w-full px-3.5 py-2.5 bg-navy-900 border border-navy-700 rounded-lg text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-slate-300 font-semibold mb-1">
            Location in Surkhet / Karnali
          </label>
          <input
            type="text"
            value={formData.customerAddress}
            onChange={(e) => setFormData({ ...formData, customerAddress: e.target.value })}
            placeholder="e.g. Birendranagar-4, Main Market"
            className="w-full px-3.5 py-2.5 bg-navy-900 border border-navy-700 rounded-lg text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label className="block text-slate-300 font-semibold mb-1">
          Issue Description / Requirements
        </label>
        <textarea
          rows={3}
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          placeholder="Please describe device model, symptoms (e.g., no display, power tripping), or network scale required..."
          className="w-full px-3.5 py-2.5 bg-navy-900 border border-navy-700 rounded-lg text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none"
        ></textarea>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full sm:w-auto px-6 py-3 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-bold rounded-lg uppercase tracking-wider transition shadow-md flex items-center justify-center gap-2"
      >
        <Send className="w-4 h-4" />
        <span>{loading ? 'Submitting...' : 'Submit Service Request'}</span>
      </button>
    </form>
  );
}
