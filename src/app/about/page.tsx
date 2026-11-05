import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Cpu, ShieldCheck, Wrench, MapPin, CheckCircle2, ArrowRight } from 'lucide-react';
import type { Metadata } from 'next';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'About Krishna Electronics Order & Suppliers | Surkhet, Nepal',
  description: 'Learn about Krishna Electronics Order & Suppliers in Birendranagar-12, Surkhet. Our mission, technical laboratory, authorized equipment, and commitment to Karnali Province.',
};

export default async function AboutPage() {
  const settings = await prisma.setting.findUnique({
    where: { id: 'site-settings' },
  }).catch(() => null);

  const siteName = settings?.siteName || 'Krishna Electronics Order & Suppliers';
  const location = settings?.locationAddress || 'Birendranagar-12, Surkhet, Nepal';
  const siteDescription = settings?.siteDescription || 'Headquartered in Surkhet, we are dedicated to bridging the technological divide in Western Nepal through genuine computing hardware, enterprise network infrastructure, intelligent IoT devices, and specialized chip-level electronics repair.';

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 space-y-16">
      {/* Header Banner */}
      <div className="bg-navy-950 text-white rounded-2xl p-8 md:p-12 border border-navy-800 shadow-xl relative overflow-hidden">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/20 text-cyan-accent text-xs font-bold uppercase tracking-wider border border-brand-500/30">
            <Cpu className="w-3.5 h-3.5" />
            <span>Serving Karnali Province Since Inception</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
            {siteName}
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            {siteDescription}
          </p>
        </div>
      </div>

      {/* Core Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold">
            <ShieldCheck className="w-6 h-6 text-brand-500" />
          </div>
          <h2 className="text-lg font-bold text-navy-900">Genuine Hardware Integrity</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            We partner with official distributors to bring authorized laptops, routers, CCTV surveillance equipment, and IoT relays with genuine manufacturer warranty coverage to Surkhet.
          </p>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="w-12 h-12 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center font-bold">
            <Wrench className="w-6 h-6 text-cyan-600" />
          </div>
          <h2 className="text-lg font-bold text-navy-900">Chip-Level Engineering Lab</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Unlike standard retail outlets, our in-house laboratory houses digital oscilloscopes, BGA micro-soldering stations, and power test benches to diagnose and repair damaged motherboards locally.
          </p>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <MapPin className="w-6 h-6 text-indigo-600" />
          </div>
          <h2 className="text-lg font-bold text-navy-900">Regional Commitment</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            From Surkhet Valley to Dailekh, Jajarkot, Jumla, and Kalikot, we deploy reliable on-site networking, security cameras, and provide corporate Annual Maintenance Contracts for schools, banks, and offices.
          </p>
        </div>
      </div>

      {/* Facilities & Lab */}
      <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-10 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <div className="lg:col-span-7 space-y-4">
          <h2 className="text-2xl font-extrabold text-navy-900">
            Our Physical Facility in {location}
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Located conveniently in {location}, our center features a customer demonstration zone where clients can test Wi-Fi 6 mesh routers, view live CCTV night-vision clarity, and see smart IoT automation switches in action before purchase.
          </p>
          <div className="space-y-2 pt-2 text-xs text-slate-700">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Full warranty and after-sales service claim processing</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Free preliminary diagnosis on laptop and desktop repairs</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Commercial bulk order quotation for government &amp; private enterprises</span>
            </div>
          </div>
          <div className="pt-2">
            <Link
              href="/contact"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-navy-900 hover:bg-brand-600 text-white rounded-lg text-xs font-bold transition shadow-sm"
            >
              <span>Visit or Contact Store</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        <div className="lg:col-span-5 bg-slate-50 p-6 rounded-xl border border-slate-200 space-y-3 text-xs">
          <div className="font-bold text-navy-900 uppercase tracking-wider text-[11px]">
            Store &amp; Laboratory Address
          </div>
          <p className="text-slate-700 font-semibold text-sm">
            {location}
          </p>
          <div className="pt-2 border-t border-slate-200 text-slate-500">
            Official Website: <a href="https://krishnaelectronics.com.np" className="text-brand-600 underline font-mono">krishnaelectronics.com.np</a>
          </div>
          <div className="text-slate-500">
            All prices quoted in Nepalese Rupees (NPR / रु).
          </div>
        </div>
      </div>
    </div>
  );
}
