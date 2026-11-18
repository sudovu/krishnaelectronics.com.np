import React from 'react';
import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import ServiceBookingForm from '@/components/public/ServiceBookingForm';
import { 
  Wrench, 
  ShieldCheck, 
  Clock, 
  MapPin, 
  Cpu, 
  CheckCircle2, 
  PhoneCall, 
  Headphones 
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Book a Repair & Technical Service | Krishna Electronics Surkhet',
  description: 'Book certified laptop repair, motherboard chip-level micro-soldering, CCTV maintenance, printer repair, and network diagnostics in Birendranagar, Surkhet. Fast turnaround with genuine parts and warranty.',
  keywords: [
    'laptop repair surkhet',
    'computer service birendranagar',
    'cctv maintenance karnali',
    'printer repair surkhet',
    'chip-level repairing surkhet',
    'krishna electronics lab'
  ],
};

export const revalidate = 60;

export default async function BookRepairPage() {
  const services = await prisma.service.findMany({
    select: {
      id: true,
      title: true,
    },
    orderBy: {
      title: 'asc',
    },
  }).catch(() => []);

  return (
    <div className="min-h-screen bg-navy-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-10">
        {/* Hero Section */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-cyan-accent text-xs font-bold tracking-wide uppercase">
            <Cpu className="w-3.5 h-3.5" />
            <span>Certified Diagnostic &amp; Repair Laboratory</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Book a Professional Repair or Service
          </h1>

          <p className="text-sm text-slate-400 max-w-2xl mx-auto leading-relaxed">
            From motherboard chip-level repair to CCTV camera alignment and router troubleshooting.
            Schedule your device diagnostic with Krishna Electronics in Birendranagar, Surkhet.
          </p>
        </div>

        {/* Feature Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-navy-900 border border-navy-800 p-4 rounded-xl text-center space-y-1">
            <Wrench className="w-5 h-5 text-cyan-accent mx-auto" />
            <h4 className="font-bold text-white">Chip-Level Lab</h4>
            <p className="text-[11px] text-slate-400">Micro-soldering &amp; board repair</p>
          </div>

          <div className="bg-navy-900 border border-navy-800 p-4 rounded-xl text-center space-y-1">
            <ShieldCheck className="w-5 h-5 text-emerald-400 mx-auto" />
            <h4 className="font-bold text-white">Genuine Parts</h4>
            <p className="text-[11px] text-slate-400">Tested OEM components</p>
          </div>

          <div className="bg-navy-900 border border-navy-800 p-4 rounded-xl text-center space-y-1">
            <Clock className="w-5 h-5 text-amber-400 mx-auto" />
            <h4 className="font-bold text-white">Fast Turnaround</h4>
            <p className="text-[11px] text-slate-400">Same-day diagnostic options</p>
          </div>

          <div className="bg-navy-900 border border-navy-800 p-4 rounded-xl text-center space-y-1">
            <MapPin className="w-5 h-5 text-rose-400 mx-auto" />
            <h4 className="font-bold text-white">Surkhet Valley</h4>
            <p className="text-[11px] text-slate-400">Birendranagar store drop-off</p>
          </div>
        </div>

        {/* Main Booking Form */}
        <ServiceBookingForm availableServices={services} />

        {/* Repair Workflow Guarantee */}
        <div className="bg-navy-900/60 border border-navy-800 p-6 rounded-2xl text-xs text-slate-400 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-brand-500" />
            <span>Our 4-Step Repair Commitment</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-1">
            <div className="space-y-1 border-l-2 border-brand-500 pl-3">
              <span className="font-bold text-white block">1. Registration</span>
              <p className="text-[11px]">Submit your booking here. You receive a unique KE-XXXX reference instantly.</p>
            </div>

            <div className="space-y-1 border-l-2 border-cyan-accent pl-3">
              <span className="font-bold text-white block">2. In-Lab Diagnostic</span>
              <p className="text-[11px]">Bring your device to our Birendranagar center or coordinate pickup with our technicians.</p>
            </div>

            <div className="space-y-1 border-l-2 border-emerald-400 pl-3">
              <span className="font-bold text-white block">3. Transparent Quote</span>
              <p className="text-[11px]">We explain the component faults and quote parts cost before any work begins.</p>
            </div>

            <div className="space-y-1 border-l-2 border-amber-400 pl-3">
              <span className="font-bold text-white block">4. Quality Test &amp; Handover</span>
              <p className="text-[11px]">Stress-tested under load with warranty coverage on all replaced hardware.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
