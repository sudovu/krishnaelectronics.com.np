'use client';

import React, { useState } from 'react';
import { X, Send, CheckCircle2, AlertCircle, ShoppingBag, ShieldCheck, Phone, MessageSquare, Mail } from 'lucide-react';
import { ProductData } from '@/types';
import { formatNPR } from '@/lib/formatters';

interface ProductEnquiryModalProps {
  product: ProductData | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ProductEnquiryModal({ product, isOpen, onClose }: ProductEnquiryModalProps) {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [preferredContact, setPreferredContact] = useState<'PHONE' | 'WHATSAPP' | 'EMAIL'>('PHONE');
  const [message, setMessage] = useState('');
  const [websiteHp, setWebsiteHp] = useState(''); // Honeypot field

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reference, setReference] = useState<string | null>(null);

  if (!isOpen || !product) return null;

  const currentPrice = product.offerPrice && product.offerPrice < product.regularPrice 
    ? product.offerPrice 
    : product.regularPrice;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim()) {
      setError('Please provide your name and phone number.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim() || undefined,
        customerAddress: customerAddress.trim() || undefined,
        category: 'PRODUCT',
        type: 'PRODUCT_INQUIRY',
        subject: `Product Enquiry: ${product.title} (SKU: ${product.sku})`,
        message: message.trim() || `Customer inquired about ${product.title} (SKU: ${product.sku}) priced at NPR ${currentPrice}.`,
        productId: product.id,
        preferredContact,
        productDetails: JSON.stringify({
          id: product.id,
          title: product.title,
          sku: product.sku,
          price: currentPrice,
          image: product.primaryImage,
        }),
        website_hp: websiteHp,
      };

      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit enquiry.');
      }

      setReference(data.reference || 'RECEIVED');
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setReference(null);
    setCustomerName('');
    setCustomerPhone('');
    setCustomerEmail('');
    setCustomerAddress('');
    setMessage('');
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-navy-900 px-6 py-4 flex items-center justify-between text-white border-b border-navy-800">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-cyan-accent" />
            <h3 className="font-bold text-base tracking-tight">On-Site Product Enquiry</h3>
          </div>
          <button
            onClick={handleReset}
            className="text-slate-400 hover:text-white transition p-1 rounded-lg hover:bg-navy-800"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Product Snapshot */}
          <div className="flex gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200 items-center">
            {product.primaryImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.primaryImage}
                alt={product.title}
                className="w-16 h-16 object-cover rounded-lg bg-white border border-slate-200 shrink-0"
              />
            ) : (
              <div className="w-16 h-16 rounded-lg bg-slate-200 flex items-center justify-center shrink-0">
                <ShoppingBag className="w-6 h-6 text-slate-400" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-mono uppercase bg-brand-50 text-brand-700 px-2 py-0.5 rounded font-bold">
                SKU: {product.sku}
              </span>
              <h4 className="font-bold text-navy-900 text-sm truncate mt-1">
                {product.title}
              </h4>
              <p className="text-xs font-mono font-extrabold text-brand-600 mt-0.5">
                {formatNPR(currentPrice)}
              </p>
            </div>
          </div>

          {reference ? (
            /* Success State */
            <div className="text-center py-6 space-y-4">
              <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="text-lg font-black text-navy-900">Enquiry Received Successfully!</h4>
                <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                  Thank you! Our sales team at Krishna Electronics in Surkhet has logged your enquiry and email notification has been dispatched to our staff.
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl max-w-xs mx-auto">
                <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">
                  Tracking Reference ID
                </span>
                <span className="text-base font-black font-mono text-brand-600 tracking-wider">
                  {reference}
                </span>
              </div>

              <p className="text-xs text-slate-500">
                We will contact you via <strong>{preferredContact}</strong> shortly during business hours.
              </p>

              <button
                onClick={handleReset}
                className="w-full py-2.5 bg-navy-900 hover:bg-navy-800 text-white font-bold rounded-xl text-xs transition"
              >
                Close Window
              </button>
            </div>
          ) : (
            /* Form State */
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{error}</span>
                </div>
              )}

              {/* Honeypot field (hidden from real users) */}
              <input
                type="text"
                name="website_hp"
                value={websiteHp}
                onChange={(e) => setWebsiteHp(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
                className="hidden"
                style={{ display: 'none' }}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Your Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Ramesh Thapa"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-navy-900 focus:border-brand-500 focus:bg-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Phone / Mobile <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="e.g. 98580XXXXX"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-navy-900 focus:border-brand-500 focus:bg-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email Address (Optional)
                  </label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="ramesh@example.com"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-navy-900 focus:border-brand-500 focus:bg-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Delivery Location / Address
                  </label>
                  <input
                    type="text"
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    placeholder="e.g. Birendranagar-6, Surkhet"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-navy-900 focus:border-brand-500 focus:bg-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Preferred Contact Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPreferredContact('PHONE')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                      preferredContact === 'PHONE'
                        ? 'border-brand-500 bg-brand-50 text-brand-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Phone Call</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPreferredContact('WHATSAPP')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                      preferredContact === 'WHATSAPP'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPreferredContact('EMAIL')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                      preferredContact === 'EMAIL'
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
                  Questions / Specific Requirements
                </label>
                <textarea
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ask about warranty, compatibility, delivery times, or bulk orders..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-navy-900 focus:border-brand-500 focus:bg-white outline-none resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-extrabold rounded-xl transition shadow-lg shadow-brand-500/25 flex items-center justify-center gap-2 text-xs tracking-wide uppercase"
              >
                <Send className="w-4 h-4" />
                <span>{loading ? 'Submitting Enquiry...' : 'Submit Enquiry on Website'}</span>
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Submitted directly to Krishna Electronics store team. No app required.</span>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
