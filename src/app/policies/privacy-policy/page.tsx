import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | Krishna Electronics Surkhet',
  description: 'Privacy policy for Krishna Electronics & Order Suppliers website and inquiry platform.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-navy-900 tracking-tight">
          Privacy Policy
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Effective date: 2026 &bull; Krishna Electronics &amp; Order Suppliers
        </p>
      </div>

      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6 text-xs text-slate-600 leading-relaxed">
        <p>
          Krishna Electronics &amp; Order Suppliers (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;) respects your privacy and is committed to protecting the personal information you share with us through our website at <code>https://krishnaelectronics.com.np</code>.
        </p>

        <h2 className="text-sm font-bold text-navy-900">1. Information We Collect</h2>
        <p>
          We only collect personal information that you intentionally submit to us, including your full name, phone number, email address, physical location, and service/product requirements submitted through our contact or quotation inquiry forms.
        </p>

        <h2 className="text-sm font-bold text-navy-900">2. How We Use Your Information</h2>
        <p>
          The information collected is used solely to respond to your product inquiries, provide accurate pricing quotations, coordinate equipment delivery across Surkhet or Karnali Province, and confirm repair diagnosis. We never sell, rent, or distribute your personal data to external advertisers.
        </p>

        <h2 className="text-sm font-bold text-navy-900">3. Data Security &amp; Storage</h2>
        <p>
          Our web platform implements industry-standard encryption, SSL (HTTPS), secure database access controls, and rate limiting to prevent unauthorized data access or interception.
        </p>

        <h2 className="text-sm font-bold text-navy-900">4. Contacting Our Data Controller</h2>
        <p>
          If you have any questions regarding your personal details or wish to have your inquiry record removed from our systems, please contact our physical store at Birendranagar-6, Buddhapath, Surkhet, Nepal.
        </p>
      </div>
    </div>
  );
}
