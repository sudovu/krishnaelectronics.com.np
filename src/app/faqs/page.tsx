import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { HelpCircle, ArrowRight, MessageSquare } from 'lucide-react';
import type { Metadata } from 'next';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Frequently Asked Questions (FAQs) | Krishna Electronics Surkhet',
  description: 'Find answers to common questions about electronics warranties, laptop repairs, network installations, delivery across Karnali, and payment methods.',
};

export default async function FAQsPage() {
  const faqs = await prisma.fAQ.findMany({
    where: { isActive: true },
    orderBy: { orderIndex: 'asc' },
  }).catch(() => []);

  type FAQItem = (typeof faqs)[number];
  const groupedFaqs: Record<string, FAQItem[]> = {};
  faqs.forEach((faq) => {
    const cat = faq.category || 'General';
    if (!groupedFaqs[cat]) groupedFaqs[cat] = [];
    groupedFaqs[cat].push(faq);
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-12">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 text-brand-600 text-xs font-bold uppercase tracking-wider">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Support &amp; Answers</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-navy-900 tracking-tight">
          Frequently Asked Questions
        </h1>
        <p className="text-sm text-slate-500 max-w-xl mx-auto">
          Common queries regarding hardware warranties, repair estimates, local Valley delivery, and store operations in Surkhet.
        </p>
      </div>

      {/* FAQs Sections */}
      <div className="space-y-8">
        {Object.entries(groupedFaqs).map(([category, items]) => (
          <div key={category} className="space-y-4">
            <h2 className="text-lg font-bold text-navy-900 border-b border-slate-200 pb-2">
              {category}
            </h2>
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
                  <h3 className="font-bold text-sm text-navy-900 flex items-start gap-2">
                    <span className="text-brand-500 font-mono">Q.</span>
                    <span>{item.question}</span>
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed pl-5">
                    {item.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Still have questions CTA */}
      <div className="bg-navy-950 text-white rounded-2xl p-8 text-center border border-navy-800 space-y-4">
        <h3 className="text-xl font-bold">Have a specific question not covered here?</h3>
        <p className="text-xs text-slate-300 max-w-md mx-auto">
          Our technical team in Birendranagar-12 is ready to help you with personalized device guidance, network topologies, or price quotations.
        </p>
        <div className="pt-2 flex justify-center gap-3">
          <Link
            href="/contact"
            className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition"
          >
            Contact Store Desk
          </Link>
        </div>
      </div>
    </div>
  );
}
