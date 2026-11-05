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
  MessageSquare 
} from 'lucide-react';
import { SiteSettingsData } from '@/types';

interface FooterProps {
  settings?: SiteSettingsData | null;
}

export default function Footer({ settings }: FooterProps) {
  const currentYear = new Date().getFullYear();
  const address = settings?.locationAddress || 'Birendranagar-12, Surkhet, Nepal';
  const hours = settings?.businessHours || 'Sunday – Friday: 9:30 AM – 6:30 PM | Saturday: Closed (On-call emergency service available)';
  const phone = settings?.contactPhone || '';
  const email = settings?.contactEmail || '';
  const whatsapp = settings?.contactWhatsapp || '';
  const deliveryInfo = settings?.deliveryInfo || 'Prompt local delivery across Surkhet Valley and scheduled dispatch throughout Karnali Province.';
  const paymentMethods = settings?.paymentMethods || 'Cash on Delivery, Bank Transfer, Fonepay / QR, eSewa, Khalti';

  return (
    <footer className="bg-navy-950 text-slate-300 border-t border-navy-800">
      {/* Value Proposition Strip */}
      <div className="border-b border-navy-800 bg-navy-900/60 py-6">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-brand-500/10 text-brand-400 flex items-center justify-center shrink-0 border border-brand-500/20">
              <ShieldCheck className="w-5 h-5 text-cyan-accent" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Official Warranties</h4>
              <p className="text-xs text-slate-400">Genuine products with official brand &amp; lab warranty</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-brand-500/10 text-brand-400 flex items-center justify-center shrink-0 border border-brand-500/20">
              <Truck className="w-5 h-5 text-cyan-accent" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Surkhet &amp; Karnali Logistics</h4>
              <p className="text-xs text-slate-400">Valley dispatch &amp; courier across provinces</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-brand-500/10 text-brand-400 flex items-center justify-center shrink-0 border border-brand-500/20">
              <Cpu className="w-5 h-5 text-cyan-accent" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Chip-Level Repair Lab</h4>
              <p className="text-xs text-slate-400">Motherboard, display, and power diagnostics</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-brand-500/10 text-brand-400 flex items-center justify-center shrink-0 border border-brand-500/20">
              <CreditCard className="w-5 h-5 text-cyan-accent" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Transparent Pricing</h4>
              <p className="text-xs text-slate-400">All prices in NPR (रु) with clear quotation</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-white p-0.5 border-2 border-brand-500 shadow-md shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/logo.jpg"
                  alt="Krishna Electronics Order & Suppliers Logo"
                  className="w-full h-full object-contain"
                  width={48}
                  height={48}
                  loading="lazy"
                />
              </div>
              <div>
                <div className="font-bold text-base text-white tracking-wide">
                  KRISHNA ELECTRONICS
                </div>
                <div className="text-xs text-cyan-accent font-medium">
                  Order &amp; Suppliers &bull; Surkhet, Nepal
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              Your premier electronics, networking, and technical service partner in Karnali Province. We provide certified IT hardware, CCTV surveillance, IoT automation, chip-level laptop repairs, and Annual Maintenance Contracts (AMC) for institutions.
            </p>

            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-2 text-slate-300">
                <MapPin className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
                <span>{address}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Clock className="w-4 h-4 text-brand-400 shrink-0" />
                <span>{hours}</span>
              </div>
              {phone ? (
                <div className="flex items-center gap-2 text-slate-300">
                  <Phone className="w-4 h-4 text-brand-400 shrink-0" />
                  <a href={`tel:${phone}`} className="hover:text-white transition">{phone}</a>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-slate-500 italic text-[11px]">
                  <Phone className="w-4 h-4 shrink-0 text-slate-600" />
                  <span>Phone inquiries: Visit store or configure in Admin</span>
                </div>
              )}
              {email ? (
                <div className="flex items-center gap-2 text-slate-300">
                  <Mail className="w-4 h-4 text-brand-400 shrink-0" />
                  <a href={`mailto:${email}`} className="hover:text-white transition">{email}</a>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-slate-500 italic text-[11px]">
                  <Mail className="w-4 h-4 shrink-0 text-slate-600" />
                  <span>Email inquiries: Configure in Admin settings</span>
                </div>
              )}
              {whatsapp && (
                <div className="flex items-center gap-2 text-green-400">
                  <MessageSquare className="w-4 h-4 shrink-0" />
                  <a 
                    href={`https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="hover:underline font-medium"
                  >
                    Chat on WhatsApp ({whatsapp})
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Technical Services */}
          <div>
            <h4 className="text-xs font-bold text-white tracking-wider uppercase mb-4 border-b border-navy-800 pb-2">
              Technical Services
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/services/computer-laptop-repair" className="hover:text-cyan-accent transition">
                  Laptop &amp; PC Motherboard Repair
                </Link>
              </li>
              <li>
                <Link href="/services/networking-installation-maintenance" className="hover:text-cyan-accent transition">
                  Structured Cat6/Fiber Cabling
                </Link>
              </li>
              <li>
                <Link href="/services/router-switch-wifi-solutions" className="hover:text-cyan-accent transition">
                  Wi-Fi 6 &amp; MikroTik Bandwidth Setup
                </Link>
              </li>
              <li>
                <Link href="/services/cctv-surveillance-installation" className="hover:text-cyan-accent transition">
                  CCTV &amp; Surveillance Systems
                </Link>
              </li>
              <li>
                <Link href="/services/iot-smart-device-solutions" className="hover:text-cyan-accent transition">
                  IoT Smart Home &amp; Automation
                </Link>
              </li>
              <li>
                <Link href="/services/electronics-repair-troubleshooting" className="hover:text-cyan-accent transition">
                  Inverter &amp; Board Troubleshooting
                </Link>
              </li>
              <li>
                <Link href="/services/maintenance-contracts-technical-support" className="hover:text-cyan-accent transition font-semibold text-brand-300">
                  Annual Maintenance Contracts (AMC)
                </Link>
              </li>
            </ul>
          </div>

          {/* Product Categories */}
          <div>
            <h4 className="text-xs font-bold text-white tracking-wider uppercase mb-4 border-b border-navy-800 pb-2">
              Product Categories
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/products?category=networking-and-connectivity" className="hover:text-cyan-accent transition">
                  Networking &amp; Routers
                </Link>
              </li>
              <li>
                <Link href="/products?category=cctv-and-surveillance" className="hover:text-cyan-accent transition">
                  CCTV Cameras &amp; NVRs
                </Link>
              </li>
              <li>
                <Link href="/products?category=laptops-and-computers" className="hover:text-cyan-accent transition">
                  Business Laptops &amp; Desktops
                </Link>
              </li>
              <li>
                <Link href="/products?category=iot-and-smart-devices" className="hover:text-cyan-accent transition">
                  IoT Relays &amp; Smart Switches
                </Link>
              </li>
              <li>
                <Link href="/products?category=electronics-and-troubleshooting" className="hover:text-cyan-accent transition">
                  Electronics Lab &amp; Tools
                </Link>
              </li>
              <li>
                <Link href="/products?category=office-and-order-supplies" className="hover:text-cyan-accent transition">
                  Office &amp; Order Supplies
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal, Support & Policies */}
          <div>
            <h4 className="text-xs font-bold text-white tracking-wider uppercase mb-4 border-b border-navy-800 pb-2">
              Support &amp; Policies
            </h4>
            <ul className="space-y-2 text-xs">
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
                  Store Map &amp; Quotation Request
                </Link>
              </li>
              <li className="pt-2">
                <Link 
                  href="/admin/login" 
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-navy-900 hover:bg-navy-800 text-slate-300 rounded border border-navy-700 hover:text-white transition text-xs"
                >
                  <Lock className="w-3 h-3 text-cyan-accent" />
                  <span>Admin Panel Login</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Payment & Logistics details */}
        <div className="mt-8 pt-6 border-t border-navy-900 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div>
            <span className="font-semibold text-slate-300">Accepted Payment Methods:</span> {paymentMethods}
          </div>
          <div>
            <span className="font-semibold text-slate-300">Delivery Coverage:</span> {deliveryInfo}
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="bg-navy-950 py-4 px-4 border-t border-navy-900 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>
            &copy; {currentYear} Krishna Electronics Order &amp; Suppliers. All rights reserved. Birendranagar-12, Surkhet, Nepal.
          </p>
          <p className="flex items-center gap-1 text-[11px]">
            <span>Official Domain:</span>
            <a href="https://krishnaelectronics.com.np" className="text-cyan-accent hover:underline font-mono">
              krishnaelectronics.com.np
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
