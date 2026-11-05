import React from 'react';
import Link from 'next/link';
import { ShieldCheck, RotateCcw, AlertTriangle } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Warranty & Return Policy | Krishna Electronics Surkhet',
  description: 'Official manufacturer warranty procedures and return policies for products purchased at Krishna Electronics & Order Suppliers, Surkhet.',
};

export default function WarrantyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 text-brand-600 text-xs font-bold uppercase tracking-wider mb-2">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Customer Confidence</span>
        </div>
        <h1 className="text-3xl font-extrabold text-navy-900 tracking-tight">
          Warranty &amp; Return Policy
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Last revised: 2026 &bull; Krishna Electronics &amp; Order Suppliers, Surkhet, Nepal
        </p>
      </div>

      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6 text-sm text-slate-700 leading-relaxed">
        <section className="space-y-3">
          <h2 className="text-base font-bold text-navy-900">1. Official Hardware Warranties</h2>
          <p className="text-xs text-slate-600">
            All brand-new laptops, networking hardware (TP-Link, MikroTik), security cameras (Hikvision, Dahua), and power backups sold by Krishna Electronics carry official manufacturer warranties ranging from 6 months to 2 years, depending on the product category. The warranty period is explicitly stated on your purchase invoice.
          </p>
        </section>

        <section className="space-y-3 border-t border-slate-100 pt-4">
          <h2 className="text-base font-bold text-navy-900">2. Service &amp; Laboratory Repair Warranties</h2>
          <p className="text-xs text-slate-600">
            Chip-level motherboard repairs, display panel replacements, and power supply repairs performed in our Buddhapath laboratory include a dedicated 30 to 90-day service warranty covering the specific component or circuit serviced.
          </p>
        </section>

        <section className="space-y-3 border-t border-slate-100 pt-4">
          <h2 className="text-base font-bold text-navy-900">3. Warranty Inclusions &amp; Exclusions</h2>
          <div className="text-xs text-slate-600 space-y-2">
            <p><strong>What is covered:</strong> Manufacturing defects, internal electronic hardware component failures under standard operating conditions.</p>
            <p><strong>What is NOT covered:</strong> Physical damage (drops, cracked panels), water or liquid intrusion, insect infestation, electrical surge or lightning strikes, tampering or unauthorized opening by third parties, and software/virus-related corruptions.</p>
          </div>
        </section>

        <section className="space-y-3 border-t border-slate-100 pt-4">
          <h2 className="text-base font-bold text-navy-900">4. Return &amp; Exchange Procedure</h2>
          <p className="text-xs text-slate-600">
            If a brand-new boxed product is found to have an out-of-the-box manufacturing fault (Dead on Arrival / DOA), it can be returned for testing and replacement within 7 calendar days from the date of invoice. The item must be returned with all original packaging, manuals, accessories, and the tax invoice.
          </p>
        </section>

        <section className="space-y-3 border-t border-slate-100 pt-4">
          <h2 className="text-base font-bold text-navy-900">5. Claiming Warranty in Surkhet</h2>
          <p className="text-xs text-slate-600">
            To claim warranty, simply bring the device with its purchase bill to our store at <strong>Birendranagar-6, Buddhapath, Surkhet</strong>. Our technical support desk will log the unit, conduct preliminary testing, and coordinate replacement or factory servicing without requiring you to handle complex courier arrangements yourself.
          </p>
        </section>
      </div>
    </div>
  );
}
