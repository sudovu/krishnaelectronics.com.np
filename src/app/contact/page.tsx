import React from 'react';
import { prisma } from '@/lib/prisma';
import ContactForm from '@/components/public/ContactForm';
import { MapPin, Phone, Mail, Clock, MessageSquare, ShieldCheck, Zap } from 'lucide-react';
import type { Metadata } from 'next';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Contact Store & Service Center | Krishna Electronics Surkhet',
  description: 'Visit Krishna Electronics Order & Suppliers at Birendranagar-12, Surkhet. Call 083-522006, WhatsApp, or request an instant diagnostic or quotation online.',
  keywords: [
    'contact krishna electronics',
    'krishna electronics phone number',
    'krishna electronics location surkhet',
    'birendranagar 12 electronics shop',
    'computer repair contact surkhet',
    'whatsapp krishna electronics surkhet',
  ],
};

interface ContactPageProps {
  searchParams: {
    inquiry?: string;
    sku?: string;
    service?: string;
    type?: string;
  };
}

export default async function ContactPage({ searchParams }: ContactPageProps) {
  const settings = await prisma.setting.findUnique({
    where: { id: 'site-settings' },
  }).catch(() => null);

  const address = settings?.locationAddress || 'Birendranagar-12, Surkhet, Nepal';
  const hours = settings?.businessHours || 'Sunday – Friday: 9:30 AM – 6:30 PM | Saturday: Closed (On-call emergency services available)';
  const phone = settings?.contactPhone || '';
  const email = settings?.contactEmail || '';
  const whatsapp = settings?.contactWhatsapp || '';
  const googleMapsUrl = settings?.googleMapsEmbedUrl || '';

  const initialSubject = searchParams.inquiry 
    ? `Product Inquiry: ${searchParams.inquiry}${searchParams.sku ? ` (SKU: ${searchParams.sku})` : ''}`
    : searchParams.service 
    ? `Service Inquiry: ${searchParams.service}`
    : '';

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 space-y-12">
      {/* Header Banner */}
      <div className="bg-navy-950 text-white rounded-2xl p-8 md:p-12 border border-navy-800 shadow-xl">
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/20 text-cyan-accent text-xs font-bold uppercase tracking-wider border border-brand-500/30">
            <MapPin className="w-3.5 h-3.5" />
            <span>Store Location &amp; Technical Desk</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Contact Krishna Electronics Order &amp; Suppliers
          </h1>

          <p className="text-slate-300 text-sm leading-relaxed">
            Have questions about equipment availability, computer motherboard diagnostics, or corporate structured cabling? We welcome visits to our Birendranagar-12 store and respond promptly to all online inquiries.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Contact Information Column */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-navy-900 pb-2 border-b border-slate-100">
              Store &amp; Workshop Information
            </h2>

            <div className="space-y-4 text-xs">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4 text-brand-500" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800">Physical Store Address</h4>
                  <p className="text-slate-600 mt-0.5 leading-relaxed">{address}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4 text-brand-500" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800">Business Hours</h4>
                  <p className="text-slate-600 mt-0.5 leading-relaxed">{hours}</p>
                </div>
              </div>

              {phone ? (
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
                    <Phone className="w-4 h-4 text-brand-500" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800">Phone Hotline</h4>
                    <a href={`tel:${phone}`} className="text-brand-600 font-mono font-bold hover:underline block mt-0.5">
                      {phone}
                    </a>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3 text-slate-400">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-600">Telephone / Mobile</h4>
                    <p className="text-[11px] text-slate-400 italic">Configurable in Admin Panel settings</p>
                  </div>
                </div>
              )}

              {email ? (
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4 text-brand-500" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800">Email Address</h4>
                    <a href={`mailto:${email}`} className="text-brand-600 hover:underline block mt-0.5">
                      {email}
                    </a>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3 text-slate-400">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-600">Email Inquiries</h4>
                    <p className="text-[11px] text-slate-400 italic">Configurable in Admin Panel settings</p>
                  </div>
                </div>
              )}

              {whatsapp && (
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800">WhatsApp Instant Chat</h4>
                    <a 
                      href={`https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-emerald-600 font-semibold hover:underline block mt-0.5"
                    >
                      Chat on WhatsApp ({whatsapp})
                    </a>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 space-y-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Authorized electronics warranties honored</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-brand-500" />
                <span>Valley deliveries dispatched daily from Birendranagar-12</span>
              </div>
            </div>
          </div>

          {/* Location Map Box */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-100 font-bold text-xs text-navy-900 uppercase tracking-wider">
              Surkhet Store Location Map
            </div>
            {googleMapsUrl ? (
              <iframe
                src={googleMapsUrl}
                width="100%"
                height="240"
                style={{ border: 0 }}
                allowFullScreen={false}
                loading="lazy"
                title="Google Maps Location"
              ></iframe>
            ) : (
              <div className="h-60 bg-slate-100 flex flex-col items-center justify-center p-6 text-center text-xs text-slate-500">
                <MapPin className="w-8 h-8 text-brand-500 mb-2" />
                <div className="font-bold text-navy-900 text-sm">Birendranagar-12, Surkhet, Nepal</div>
                <p className="text-slate-400 mt-1">
                  Near Birendranagar-12 center. Google Maps embed URL can be configured from the Admin Panel settings.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Contact Form Column */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
            <div>
              <h2 className="text-xl font-bold text-navy-900">
                Send an Inquiry or Quotation Request
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Fill in the details below. All inquiries are saved to our administrative management dashboard and attended to by our local technical staff.
              </p>
            </div>

            <ContactForm 
              initialSubject={initialSubject} 
              initialType={searchParams.type || 'GENERAL_INQUIRY'} 
            />
          </div>
        </div>
      </div>
    </div>
  );
}
