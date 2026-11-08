'use client';

import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Phone, 
  Mail, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  Save, 
  AlertCircle,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { InquiryData } from '@/types';
import { formatDate } from '@/lib/formatters';

export default function AdminInquiriesPage() {
  const [inquiries, setInquiries] = useState<InquiryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);

  const fetchInquiries = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.append('status', statusFilter);
    if (typeFilter) params.append('type', typeFilter);

    fetch(`/api/inquiries?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        setInquiries(data.inquiries || []);
        const nMap: Record<string, string> = {};
        (data.inquiries || []).forEach((inq: any) => {
          nMap[inq.id] = inq.adminNotes || '';
        });
        setNotes(nMap);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchInquiries();
  }, [statusFilter, typeFilter]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/inquiries/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, adminNotes: notes[id] }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      setMessage(`Inquiry marked as ${newStatus}`);
      fetchInquiries();
    } catch (err: any) {
      alert('Error updating status');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSaveNotes = async (id: string) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/inquiries/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminNotes: notes[id] }),
      });
      if (!res.ok) throw new Error('Failed to save notes');
      setMessage('Internal notes updated');
    } catch (err: any) {
      alert('Error saving notes');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-navy-900 tracking-tight">
          Customer Inquiries &amp; Order Requests
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Review quotation submissions, chip-level repair booking requests, and commercial inquiries.
        </p>
      </div>

      {message && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{message}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="font-bold text-slate-700">Status:</span>
          {['', 'NEW', 'CONTACTED', 'IN_PROGRESS', 'RESOLVED', 'CANCELLED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                statusFilter === st ? 'bg-navy-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === '' ? 'All' : st}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="font-bold text-slate-700">Type:</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 outline-none"
          >
            <option value="">All Inquiry Types</option>
            <option value="GENERAL_INQUIRY">General Inquiries</option>
            <option value="PRODUCT_INQUIRY">Product Pricing</option>
            <option value="SERVICE_REQUEST">Repair / Diagnostics</option>
            <option value="AMC_REQUEST">Corporate AMC</option>
            <option value="DIRECT_ORDER">Direct Purchase Order</option>
          </select>
        </div>
      </div>

      {/* Inquiries Stream */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white p-12 text-center text-xs text-slate-400 rounded-2xl border border-slate-200">
            Loading customer inquiries...
          </div>
        ) : inquiries.length === 0 ? (
          <div className="bg-white p-12 text-center text-xs text-slate-400 rounded-2xl border border-slate-200">
            No customer inquiries found for this filter.
          </div>
        ) : (
          inquiries.map((inq) => {
            const cleanPhone = inq.customerPhone.replace(/[^0-9]/g, '');
            const formattedPhone = cleanPhone.length === 10 ? `977${cleanPhone}` : cleanPhone;
            const waGreeting = encodeURIComponent(
              `Namaste ${inq.customerName}, this is Krishna Electronics Order & Suppliers (Surkhet) following up on your ${inq.type.replace(/_/g, ' ').toLowerCase()}: "${inq.subject}". How can we assist you today?`
            );

            return (
              <div
                key={inq.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4 text-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-bold text-sm text-navy-900">{inq.customerName}</span>
                    <span className="px-2 py-0.5 rounded bg-brand-50 text-brand-700 font-bold text-[10px] uppercase">
                      {inq.type.replace('_', ' ')}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {formatDate(inq.createdAt)}
                    </span>
                  </div>

                  {/* Status Dropdown */}
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 font-medium">Status:</span>
                    <select
                      value={inq.status}
                      disabled={updatingId === inq.id}
                      onChange={(e) => handleStatusChange(inq.id, e.target.value)}
                      className={`px-3 py-1 rounded-lg font-bold text-xs outline-none ${
                        inq.status === 'NEW'
                          ? 'bg-purple-100 text-purple-800'
                          : inq.status === 'RESOLVED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      <option value="NEW">NEW</option>
                      <option value="CONTACTED">CONTACTED</option>
                      <option value="IN_PROGRESS">IN PROGRESS</option>
                      <option value="RESOLVED">RESOLVED</option>
                      <option value="CANCELLED">CANCELLED</option>
                    </select>
                  </div>
                </div>

                {/* Customer Contact Badges */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-brand-500 shrink-0" />
                    <a href={`tel:${inq.customerPhone}`} className="font-mono font-bold text-navy-900 hover:underline">
                      {inq.customerPhone}
                    </a>
                  </div>

                  {inq.customerEmail && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-brand-500 shrink-0" />
                      <a href={`mailto:${inq.customerEmail}`} className="hover:underline truncate">
                        {inq.customerEmail}
                      </a>
                    </div>
                  )}

                  {inq.customerAddress && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-brand-500 shrink-0" />
                      <span className="truncate">{inq.customerAddress}</span>
                    </div>
                  )}
                </div>

                {/* Subject & Message */}
                <div className="space-y-1">
                  <h4 className="font-bold text-navy-900 text-xs">
                    Subject: {inq.subject}
                  </h4>
                  <p className="text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-100 whitespace-pre-line">
                    {inq.message}
                  </p>
                </div>

                {/* Internal Notes & Quick Action Buttons */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center pt-2">
                  <div className="md:col-span-8 flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Technician / Admin Internal Notes (e.g., Called customer, quoted रु 14,000)..."
                      value={notes[inq.id] || ''}
                      onChange={(e) => setNotes({ ...notes, [inq.id]: e.target.value })}
                      className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-xs outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveNotes(inq.id)}
                      className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg transition"
                    >
                      Save
                    </button>
                  </div>

                  <div className="md:col-span-4 flex items-center justify-end gap-2 flex-wrap">
                    <a
                      href={`https://wa.me/${formattedPhone}?text=${waGreeting}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-[#25D366] hover:bg-[#20ba59] text-white rounded-lg font-bold flex items-center gap-1.5 shadow-sm"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>WhatsApp Response</span>
                    </a>
                    {inq.customerEmail && (
                      <a
                        href={`mailto:${inq.customerEmail}?subject=${encodeURIComponent(`Re: ${inq.subject} - Krishna Electronics`)}`}
                        className="px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-white rounded-lg font-bold flex items-center gap-1.5 shadow-sm"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span>Email</span>
                      </a>
                    )}
                    <a
                      href={`tel:${inq.customerPhone}`}
                      className="px-3 py-1.5 bg-navy-900 hover:bg-navy-800 text-white rounded-lg font-bold flex items-center gap-1.5 shadow-sm"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Call</span>
                    </a>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
