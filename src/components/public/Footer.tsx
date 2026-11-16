import React from 'react';
import Link from 'next/link';
import { 
  Cpu, 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  ShieldCheck, 
  Truck, 
  CreditCard, 
  Lock, 
  MessageSquare,
  Wrench,
  Wifi,
  Laptop,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { SiteSettingsData } from '@/types';

interface FooterProps {
  settings?: SiteSettingsData | null;
}

export default function Footer({ settings }: FooterProps) {
  const currentYear = new Date().getFullYear();
  const rawAddress = settings?.locationAddress || 'Birendranagar, Surkhet';
  const address = (rawAddress.includes('Birendranagar-12') || rawAddress === 'Birendranagar, Surkhet, Nepal')
    ? 'Birendranagar, Surkhet'
    : rawAddress;
  const hours = settings?.businessHours || 'Sunday – Friday: 9:30 AM – 6:30 PM | Saturday: Closed (On-call emergency services available)';
  const phone = settings?.contactPhone || '083-522006';
  const email = settings?.contactEmail || 'admin@krishnaelectronics.com.np';
  const whatsapp = settings?.contactWhatsapp || '9858083951';
  const deliveryInfo = settings?.deliveryInfo || 'Prompt local delivery across Surkhet Valley and scheduled dispatch throughout Karnali Province.';
  const paymentMethods = settings?.paymentMethods || 'Cash on Delivery, Bank Transfer, Fonepay / QR, eSewa, Khalti';

  return (
    <footer className="bg-[#060B18] text-slate-300 border-t border-slate-800">
      {/* 1. Value Proposition Strip */}
      <div className="border-b border-slate-800/80 bg-[#0B132B]/70 py-6">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 text-cyan-accent flex items-center justify-center shrink-0 border border-brand-500/20">
              <ShieldCheck className="w-5 h-5 text-cyan-accent" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Official Warranties</h4>
              <p className="text-xs text-slate-400 mt-0.5">Authorized brands &amp; genuine parts</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 text-cyan-accent flex items-center justify-center shrink-0 border border-brand-500/20">
              <Truck className="w-5 h-5 text-cyan-accent" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Surkhet &amp; Karnali Logistics</h4>
              <p className="text-xs text-slate-400 mt-0.5">Valley delivery &amp; provincial dispatch</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 text-cyan-accent flex items-center justify-center shrink-0 border border-brand-500/20">
              <Wrench className="w-5 h-5 text-cyan-accent" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Chip-Level Repair Lab</h4>
              <p className="text-xs text-slate-400 mt-0.5">Motherboard &amp; hardware micro-soldering</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 text-cyan-accent flex items-center justify-center shrink-0 border border-brand-500/20">
              <CreditCard className="w-5 h-5 text-cyan-accent" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Transparent Pricing</h4>
              <p className="text-xs text-slate-400 mt-0.5">All prices in NPR (रु) with clear quotation</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Footer Navigation Grid */}
      <div className="max-w-7xl mx-auto px-4 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-10">
          {/* Brand & Store Facility Summary */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl overflow-hidden bg-white p-1 border border-brand-500 shadow-md shrink-0 flex items-center justify-center ring-2 ring-brand-500/20">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={settings?.logoUrl || '/images/logo.png'}
                  alt={`${settings?.siteName || 'Krishna Electronics'} Logo`}
                  className="w-full h-full object-contain"
                  width={48}
                  height={48}
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <div>
                <div className="font-extrabold text-base text-white tracking-wide">
                  {settings?.siteName || 'KRISHNA ELECTRONICS'}
                </div>
                {Boolean(settings?.siteTagline?.trim()) && (
                  <div className="text-[11px] text-cyan-accent font-semibold tracking-wider uppercase">
                    {settings?.siteTagline}
                  </div>
                )}
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              {settings?.siteDescription || 'Your premier electronics, networking, and technical service partner in Karnali Province. We provide certified IT hardware, CCTV surveillance, IoT automation, chip-level laptop repairs, and Annual Maintenance Contracts (AMC) for institutions.'}
            </p>

            <div className="space-y-2.5 text-xs pt-1">
              <div className="flex items-start gap-2.5 text-slate-300">
                <MapPin className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
                <span>{address}</span>
              </div>
              <div className="flex items-start gap-2.5 text-slate-200 bg-[#0B132B] p-3 rounded-xl border border-slate-800">
                <Clock className="w-4 h-4 text-cyan-accent shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-white text-[11px] uppercase tracking-wider block">Store Opening &amp; Service Hours</span>
                  <p className="text-slate-400 text-xs leading-relaxed mt-0.5">{hours}</p>
                </div>
              </div>
              {phone && (
                <div className="flex items-center gap-2.5 text-slate-300">
                  <Phone className="w-4 h-4 text-brand-400 shrink-0" />
                  <a href={`tel:${phone}`} className="hover:text-white transition font-mono">{phone}</a>
                </div>
              )}
              {email && (
                <div className="flex items-center gap-2.5 text-slate-300">
                  <Mail className="w-4 h-4 text-brand-400 shrink-0" />
                  <a href={`mailto:${email}`} className="hover:text-white transition">{email}</a>
                </div>
              )}
              {whatsapp && (
                <div className="flex items-center gap-2.5 text-emerald-400">
                  <MessageSquare className="w-4 h-4 shrink-0" />
                  <a 
                    href={`https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="hover:underline font-bold"
                  >
                    Direct WhatsApp Desk ({whatsapp})
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Technical Services */}
          <div>
            <h4 className="text-xs font-bold text-white tracking-wider uppercase mb-4 border-b border-slate-800 pb-2">
              Technical Services
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>
                <Link href="/services/computer-laptop-repair" className="hover:text-cyan-accent transition">
                  Laptop Motherboard Micro-Repair
                </Link>
              </li>
              <li>
                <Link href="/services/networking-installation-maintenance" className="hover:text-cyan-accent transition">
                  Structured Cat6 / Optical Fiber
                </Link>
              </li>
              <li>
                <Link href="/services/cctv-surveillance-installation" className="hover:text-cyan-accent transition">
                  Hikvision CCTV Surveillance
                </Link>
              </li>
              <li>
                <Link href="/services/iot-smart-device-solutions" className="hover:text-cyan-accent transition">
                  IoT Smart Automation &amp; Relays
                </Link>
              </li>
              <li>
                <Link href="/services/maintenance-contracts-technical-support" className="hover:text-cyan-accent transition font-semibold text-brand-300">
                  Annual Maintenance Contracts (AMC)
                </Link>
              </li>
              <li className="pt-1">
                <Link href="/services" className="text-brand-400 hover:text-brand-300 font-bold">
                  View All 7 Services &rarr;
                </Link>
              </li>
            </ul>
          </div>

          {/* Verified Categories */}
          <div>
            <h4 className="text-xs font-bold text-white tracking-wider uppercase mb-4 border-b border-slate-800 pb-2">
              Product Categories
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>
                <Link href="/products?category=networking-and-connectivity" className="hover:text-cyan-accent transition">
                  Wi-Fi 6 Routers &amp; Switches
                </Link>
              </li>
              <li>
                <Link href="/products?category=surveillance-and-security" className="hover:text-cyan-accent transition">
                  CCTV Cameras &amp; NVRs
                </Link>
              </li>
              <li>
                <Link href="/products?category=computing-and-it-hardware" className="hover:text-cyan-accent transition">
                  Business Laptops &amp; PCs
                </Link>
              </li>
              <li>
                <Link href="/products?category=smart-electronics-and-iot" className="hover:text-cyan-accent transition">
                  IoT Relays &amp; Smart Switches
                </Link>
              </li>
              <li>
                <Link href="/products?category=printers-and-toners" className="hover:text-cyan-accent transition">
                  LaserJet Toners &amp; Cartridges
                </Link>
              </li>
              <li>
                <Link href="/products?category=electrical-and-power-accessories" className="hover:text-cyan-accent transition">
                  Extension Cords &amp; Power
                </Link>
              </li>
            </ul>
          </div>

          {/* Support & Policies */}
          <div>
            <h4 className="text-xs font-bold text-white tracking-wider uppercase mb-4 border-b border-slate-800 pb-2">
              Support &amp; Policies
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>
                <Link href="/faqs" className="hover:text-cyan-accent transition">
                  Frequently Asked Questions
                </Link>
              </li>
              <li>
                <Link href="/policies/warranty-and-returns" className="hover:text-cyan-accent transition">
                  Warranty &amp; Return Policy
                </Link>
              </li>
              <li>
                <Link href="/policies/privacy-policy" className="hover:text-cyan-accent transition">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/policies/terms" className="hover:text-cyan-accent transition">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-cyan-accent transition">
                  Store Directions &amp; Inquiry
                </Link>
              </li>
              <li className="pt-2">
                <Link 
                  href="/admin/login" 
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0B132B] hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-700 hover:text-white transition text-xs font-medium"
                >
                  <Lock className="w-3 h-3 text-cyan-accent" />
                  <span>Admin Panel Login</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Payment & Logistics Strip */}
        <div className="mt-10 pt-6 border-t border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div>
            <span className="font-bold text-slate-200">Accepted Payment Methods:</span> {paymentMethods}
          </div>
          <div>
            <span className="font-bold text-slate-200">Delivery Coverage:</span> {deliveryInfo}
          </div>
        </div>
      </div>

      {/* 3. Bottom Copyright Bar */}
      <div className="bg-[#040810] py-4 px-4 border-t border-slate-900 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>
            &copy; {currentYear} Krishna Electronics Order &amp; Suppliers. All rights reserved. Birendranagar, Surkhet, Nepal.
          </p>
          <p className="flex items-center gap-1 text-[11px]">
            <span>Official Storefront:</span>
            <a href="https://krishnaelectronics.com.np" className="text-cyan-accent hover:underline font-mono">
              krishnaelectronics.com.np
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
