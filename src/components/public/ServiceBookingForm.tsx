'use client';

import React, { useState, useRef } from 'react';
import { 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Upload, 
  X, 
  FileText, 
  Image as ImageIcon,
  Calendar,
  Phone,
  MessageSquare,
  Mail,
  ShieldCheck,
  Wrench
} from 'lucide-react';

interface ServiceBookingFormProps {
  serviceId?: string;
  serviceTitle?: string;
  availableServices?: Array<{ id: string; title: string }>;
}

interface AttachmentFile {
  file: File;
  previewUrl?: string;
  isImage: boolean;
  sizeFormatted: string;
}

const DEVICE_CATEGORIES = [
  'Laptop Computer',
  'Desktop PC / Workstation',
  'Smartphone / Tablet',
  'CCTV Security & DVR/NVR',
  'Networking, Switch & Router',
  'LaserJet Printer / Copier',
  'Smart Home & IoT Device',
  'Other Electronic Equipment'
];

const POPULAR_BRANDS = [
  'Dell',
  'HP',
  'Lenovo',
  'Asus',
  'Acer',
  'Apple',
  'Canon',
  'Hikvision',
  'Dahua',
  'MikroTik',
  'TP-Link',
  'Sonoff',
  'Samsung',
  'Brother',
  'Epson',
  'Other Brand'
];

export default function ServiceBookingForm({ 
  serviceId, 
  serviceTitle,
  availableServices = []
}: ServiceBookingFormProps) {
  const [selectedServiceId, setSelectedServiceId] = useState(serviceId || '');
  const [selectedServiceTitle, setSelectedServiceTitle] = useState(serviceTitle || '');

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [deviceCategory, setDeviceCategory] = useState(DEVICE_CATEGORIES[0]);
  const [deviceBrand, setDeviceBrand] = useState('Dell');
  const [deviceModel, setDeviceModel] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredContact, setPreferredContact] = useState<'PHONE' | 'WHATSAPP' | 'EMAIL'>('PHONE');
  const [message, setMessage] = useState('');
  const [websiteHp, setWebsiteHp] = useState('');

  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reference, setReference] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    if (attachments.length + files.length > 5) {
      setFileError('You can attach a maximum of 5 files in total.');
      return;
    }

    const newAttachments: AttachmentFile[] = [];
    for (const f of files) {
      if (f.size > 10 * 1024 * 1024) {
        setFileError(`File "${f.name}" exceeds the 10 MB limit.`);
        return;
      }

      const ext = f.name.toLowerCase().slice(f.name.lastIndexOf('.'));
      const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];
      if (!allowed.includes(ext)) {
        setFileError(`File "${f.name}" is not supported. Only JPG, PNG, WEBP, and PDF files are allowed.`);
        return;
      }

      const isImage = f.type.startsWith('image/') || ext !== '.pdf';
      const sizeMb = (f.size / (1024 * 1024)).toFixed(1);

      newAttachments.push({
        file: f,
        previewUrl: isImage ? URL.createObjectURL(f) : undefined,
        isImage,
        sizeFormatted: `${sizeMb} MB`,
      });
    }

    setAttachments((prev) => [...prev, ...newAttachments]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => {
      const target = prev[index];
      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim()) {
      setError('Please provide your name and phone number.');
      return;
    }
    if (!message.trim()) {
      setError('Please describe the issue or problem with your device.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('customerName', customerName.trim());
      formData.append('customerPhone', customerPhone.trim());
      if (customerEmail.trim()) formData.append('customerEmail', customerEmail.trim());
      if (customerAddress.trim()) formData.append('customerAddress', customerAddress.trim());
      
      formData.append('category', 'REPAIR');
      formData.append('type', 'SERVICE_REQUEST');
      
      const currentTitle = selectedServiceTitle || 'General Technical Repair';
      formData.append('subject', `Repair Booking: ${currentTitle} (${deviceCategory})`);
      formData.append('message', message.trim());
      
      if (selectedServiceId) formData.append('serviceId', selectedServiceId);
      formData.append('deviceCategory', deviceCategory);
      formData.append('deviceBrand', deviceBrand);
      if (deviceModel.trim()) formData.append('deviceModel', deviceModel.trim());
      if (preferredDate) formData.append('preferredDate', preferredDate);
      formData.append('preferredContact', preferredContact);
      formData.append('website_hp', websiteHp);

      // Append files
      attachments.forEach((att) => {
        formData.append('attachments', att.file);
      });

      const res = await fetch('/api/inquiries', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit service booking.');
      }

      setReference(data.reference || 'RECEIVED');
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    attachments.forEach((att) => {
      if (att.previewUrl) URL.revokeObjectURL(att.previewUrl);
    });
    setAttachments([]);
    setCustomerName('');
    setCustomerPhone('');
    setCustomerEmail('');
    setCustomerAddress('');
    setMessage('');
    setDeviceModel('');
    setPreferredDate('');
    setReference(null);
    setError(null);
    setFileError(null);
  };

  if (reference) {
    return (
      <div className="bg-emerald-950/40 border border-emerald-800 p-8 rounded-2xl text-center space-y-5 animate-fade-in">
        <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/40 rounded-full flex items-center justify-center mx-auto text-emerald-400">
          <CheckCircle2 className="w-9 h-9" />
        </div>
        
        <div className="space-y-2">
          <h3 className="text-xl font-black text-white tracking-tight">
            Repair Booking Registered Successfully!
          </h3>
          <p className="text-xs text-slate-300 max-w-lg mx-auto leading-relaxed">
            Thank you for choosing Krishna Electronics. Your repair booking has been securely saved and dispatched directly to our certified engineering lab in Birendranagar, Surkhet.
          </p>
        </div>

        <div className="p-4 bg-navy-900 border border-navy-700 rounded-xl max-w-sm mx-auto shadow-inner">
          <span className="text-[10px] text-cyan-accent font-bold block uppercase tracking-wider">
            Booking Tracking Reference
          </span>
          <span className="text-xl font-black font-mono text-white tracking-wider mt-0.5 block">
            {reference}
          </span>
          <span className="text-[11px] text-slate-400 block mt-1">
            Keep this reference for repair status tracking and pickup at our store.
          </span>
        </div>

        <div className="text-xs text-slate-300 space-y-1">
          <p>
            Our technician will contact you via <strong>{preferredContact}</strong> ({customerPhone}) to confirm drop-off or pickup.
          </p>
          <p className="text-slate-400 text-[11px]">
            Lab Address: Birendranagar, Surkhet | Tel: 083-522006
          </p>
        </div>

        <div className="pt-2">
          <button
            onClick={handleReset}
            className="px-6 py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl text-xs transition shadow-md shadow-brand-500/20"
          >
            Book Another Device / New Service
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-navy-900/90 border border-navy-800 p-6 sm:p-8 rounded-2xl shadow-xl space-y-6">
      <div className="border-b border-navy-800 pb-4">
        <div className="flex items-center gap-2 text-cyan-accent">
          <Wrench className="w-5 h-5" />
          <h3 className="font-extrabold text-white text-lg tracking-tight">
            Book a Professional Repair or Service
          </h3>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Complete the form below. Our certified lab engineers in Surkhet will review your symptoms, diagnose components, and contact you directly.
        </p>
      </div>

      {error && (
        <div className="p-3.5 bg-red-950/80 border border-red-800 text-red-300 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Honeypot field */}
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

      {/* Service Type Selector if available */}
      {availableServices.length > 0 && !serviceId && (
        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1.5">
            Service Required
          </label>
          <select
            value={selectedServiceId}
            onChange={(e) => {
              setSelectedServiceId(e.target.value);
              const found = availableServices.find(s => s.id === e.target.value);
              setSelectedServiceTitle(found?.title || '');
            }}
            className="w-full px-3.5 py-2.5 bg-navy-950 border border-navy-700 rounded-xl text-xs text-white focus:border-brand-500 outline-none"
          >
            <option value="">-- Select Technical Service --</option>
            {availableServices.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Device Specification */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1.5">
            Device Category <span className="text-red-400">*</span>
          </label>
          <select
            value={deviceCategory}
            onChange={(e) => setDeviceCategory(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-navy-950 border border-navy-700 rounded-xl text-xs text-white focus:border-brand-500 outline-none"
          >
            {DEVICE_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1.5">
            Brand / Manufacturer
          </label>
          <select
            value={deviceBrand}
            onChange={(e) => setDeviceBrand(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-navy-950 border border-navy-700 rounded-xl text-xs text-white focus:border-brand-500 outline-none"
          >
            {POPULAR_BRANDS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1.5">
            Model Name / Number (Optional)
          </label>
          <input
            type="text"
            value={deviceModel}
            onChange={(e) => setDeviceModel(e.target.value)}
            placeholder="e.g. Inspiron 15 3520"
            className="w-full px-3.5 py-2.5 bg-navy-950 border border-navy-700 rounded-xl text-xs text-white placeholder-slate-500 focus:border-brand-500 outline-none"
          />
        </div>
      </div>

      {/* Problem Description */}
      <div>
        <label className="block text-xs font-bold text-slate-300 mb-1.5">
          Fault Description &amp; Symptoms <span className="text-red-400">*</span>
        </label>
        <textarea
          required
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Please describe the issue in detail: e.g. laptop not powering on, no display, liquid spill, blue screen, router port dead, paper jam, CCTV camera offline..."
          className="w-full px-3.5 py-2.5 bg-navy-950 border border-navy-700 rounded-xl text-xs text-white placeholder-slate-500 focus:border-brand-500 outline-none resize-none"
        />
      </div>

      {/* Multi-File Attachment Section */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <Upload className="w-3.5 h-3.5 text-cyan-accent" />
            <span>Attach Photos or Documents (Optional)</span>
          </label>
          <span className="text-[10px] text-slate-400">
            {attachments.length} / 5 files (Max 10MB each)
          </span>
        </div>

        {fileError && (
          <p className="text-[11px] text-red-400 mb-2">{fileError}</p>
        )}

        {/* Attachment Previews */}
        {attachments.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mb-3">
            {attachments.map((att, idx) => (
              <div 
                key={idx} 
                className="relative bg-navy-950 border border-navy-700 rounded-xl p-2 flex flex-col items-center justify-center text-center group"
              >
                <button
                  type="button"
                  onClick={() => removeAttachment(idx)}
                  className="absolute -top-1.5 -right-1.5 bg-red-600 hover:bg-red-700 text-white p-1 rounded-full shadow-md transition"
                  title="Remove attachment"
                >
                  <X className="w-3 h-3" />
                </button>

                {att.isImage && att.previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={att.previewUrl}
                    alt={att.file.name}
                    className="w-14 h-14 object-cover rounded-lg mb-1 border border-navy-800"
                  />
                ) : (
                  <div className="w-14 h-14 bg-navy-900 rounded-lg flex items-center justify-center mb-1 text-cyan-accent">
                    <FileText className="w-6 h-6" />
                  </div>
                )}
                
                <span className="text-[10px] text-slate-300 font-medium truncate w-full px-1">
                  {att.file.name}
                </span>
                <span className="text-[9px] text-slate-500">
                  {att.sizeFormatted}
                </span>
              </div>
            ))}
          </div>
        )}

        {attachments.length < 5 && (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-navy-700 hover:border-brand-500 bg-navy-950/50 hover:bg-navy-950 rounded-xl p-4 text-center cursor-pointer transition"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              multiple
              accept=".jpg,.jpeg,.png,.webp,.pdf"
              className="hidden"
            />
            <div className="flex flex-col items-center justify-center gap-1">
              <Upload className="w-5 h-5 text-slate-400" />
              <span className="text-xs font-semibold text-slate-300">
                Click to attach error photos, invoice, or diagnostics
              </span>
              <span className="text-[10px] text-slate-500">
                Supports JPG, PNG, WEBP, or PDF up to 10MB
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Customer Contact & Preferred Date */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-navy-800">
        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1.5">
            Your Full Name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            required
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="e.g. Bikram Gautam"
            className="w-full px-3.5 py-2.5 bg-navy-950 border border-navy-700 rounded-xl text-xs text-white placeholder-slate-500 focus:border-brand-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1.5">
            Phone / Mobile Number <span className="text-red-400">*</span>
          </label>
          <input
            type="tel"
            required
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            placeholder="e.g. 98580XXXXX"
            className="w-full px-3.5 py-2.5 bg-navy-950 border border-navy-700 rounded-xl text-xs text-white placeholder-slate-500 focus:border-brand-500 outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1.5">
            Email Address (Optional)
          </label>
          <input
            type="email"
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            placeholder="name@example.com"
            className="w-full px-3.5 py-2.5 bg-navy-950 border border-navy-700 rounded-xl text-xs text-white placeholder-slate-500 focus:border-brand-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1.5">
            Surkhet Address / Location
          </label>
          <input
            type="text"
            value={customerAddress}
            onChange={(e) => setCustomerAddress(e.target.value)}
            placeholder="e.g. Itram, Birendranagar"
            className="w-full px-3.5 py-2.5 bg-navy-950 border border-navy-700 rounded-xl text-xs text-white placeholder-slate-500 focus:border-brand-500 outline-none"
          />
        </div>
      </div>

      {/* Preferred Date & Preferred Contact */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-cyan-accent" />
            <span>Preferred Drop-off / Inspection Date</span>
          </label>
          <input
            type="date"
            value={preferredDate}
            onChange={(e) => setPreferredDate(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-navy-950 border border-navy-700 rounded-xl text-xs text-white focus:border-brand-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1.5">
            Preferred Contact Method
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setPreferredContact('PHONE')}
              className={`py-2 px-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1 transition ${
                preferredContact === 'PHONE'
                  ? 'border-brand-500 bg-brand-500/20 text-brand-300'
                  : 'border-navy-700 text-slate-400 hover:bg-navy-950'
              }`}
            >
              <Phone className="w-3 h-3" />
              <span>Call</span>
            </button>

            <button
              type="button"
              onClick={() => setPreferredContact('WHATSAPP')}
              className={`py-2 px-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1 transition ${
                preferredContact === 'WHATSAPP'
                  ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                  : 'border-navy-700 text-slate-400 hover:bg-navy-950'
              }`}
            >
              <MessageSquare className="w-3 h-3" />
              <span>WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={() => setPreferredContact('EMAIL')}
              className={`py-2 px-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1 transition ${
                preferredContact === 'EMAIL'
                  ? 'border-cyan-500 bg-cyan-500/20 text-cyan-300'
                  : 'border-navy-700 text-slate-400 hover:bg-navy-950'
              }`}
            >
              <Mail className="w-3 h-3" />
              <span>Email</span>
            </button>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-extrabold rounded-xl transition shadow-lg shadow-brand-500/25 flex items-center justify-center gap-2 text-xs tracking-wide uppercase"
      >
        <Send className="w-4 h-4" />
        <span>{loading ? 'Submitting Service Booking...' : 'Submit Repair Booking on Website'}</span>
      </button>

      <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 pt-1">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
        <span>Logged directly in Krishna Electronics Lab system. Certified technicians in Surkhet.</span>
      </div>
    </form>
  );
}
