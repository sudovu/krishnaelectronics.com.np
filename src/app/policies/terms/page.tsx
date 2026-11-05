import React from 'react';
import type { Metadata } from 'next';
import { getMergedBusinessProfile } from '@/platform/engine/tenant-loader';

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const profile = await getMergedBusinessProfile();
  return {
    title: `Terms of Service | ${profile.siteName}`,
    description: `Terms and conditions governing the use of ${profile.siteName} website and commercial quotes.`,
  };
}

export default async function TermsPage() {
  const profile = await getMergedBusinessProfile();

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-navy-900 tracking-tight">
          Terms &amp; Conditions
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Effective date: 2026 &bull; {profile.siteName}
        </p>
      </div>

      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6 text-xs text-slate-600 leading-relaxed">
        <h2 className="text-sm font-bold text-navy-900">1. Acceptance of Terms</h2>
        <p>
          By accessing this website, submitting inquiry forms, or engaging {profile.siteName} for repairs, hardware procurement, or network cabling, you agree to be bound by these terms.
        </p>

        <h2 className="text-sm font-bold text-navy-900">2. Pricing, Currencies &amp; Quotations</h2>
        <p>
          All prices displayed or quoted on this website are denominated in {profile.currencyCode} ({profile.currencySymbol}) and include applicable taxes unless specified otherwise in written commercial proposals. Prices and promotional discounts are subject to stock availability and supplier cost adjustments.
        </p>

        <h2 className="text-sm font-bold text-navy-900">3. Repair Estimates &amp; Bench Diagnostics</h2>
        <p>
          Preliminary diagnostics are conducted free of charge. In the event that a chip-level motherboard or component repair requires replacement ICs or proprietary boards, we provide a quotation for client approval prior to performing invasive rework.
        </p>

        <h2 className="text-sm font-bold text-navy-900">4. Intellectual Property</h2>
        <p>
          All trademarks, logos, and brand names (e.g. TP-Link, MikroTik, Hikvision, Dell, HP) referenced on this platform remain the property of their respective manufacturers and are utilized herein solely to denote product compatibility and authorized distribution.
        </p>

        <h2 className="text-sm font-bold text-navy-900">5. Governing Law &amp; Jurisdiction</h2>
        <p>
          Any disputes arising from transactions or service agreements shall be governed exclusively by the laws of Nepal and fall under the legal jurisdiction of the Surkhet District Court.
        </p>
      </div>
    </div>
  );
}
