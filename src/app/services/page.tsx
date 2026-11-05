import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { 
  Laptop, 
  Wifi, 
  ShieldAlert, 
  ShieldCheck, 
  Cpu, 
  Wrench, 
  Network, 
  CheckCircle2, 
  ArrowRight, 
  Phone,
  MessageSquare
} from 'lucide-react';
import { formatNPR } from '@/lib/formatters';
import type { Metadata } from 'next';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Technical Services, Repairs & AMC | Krishna Electronics Surkhet',
  description: 'Certified chip-level laptop repairs, structured network cabling, Wi-Fi 6 solutions, CCTV surveillance systems, IoT smart devices, and Annual Maintenance Contracts (AMC) in Surkhet.',
};

export default async function ServicesPage() {
  const services = await prisma.service.findMany({
    where: { isActive: true },
    orderBy: { orderIndex: 'asc' },
  }).catch(() => []);

  const getServiceIcon = (iconName: string) => {
    switch (iconName) {
      case 'Laptop': return <Laptop className="w-8 h-8 text-cyan-accent" />;
      case 'Network': return <Network className="w-8 h-8 text-cyan-accent" />;
      case 'Wifi': return <Wifi className="w-8 h-8 text-cyan-accent" />;
      case 'Video':
      case 'ShieldAlert': return <ShieldAlert className="w-8 h-8 text-cyan-accent" />;
      case 'Cpu': return <Cpu className="w-8 h-8 text-cyan-accent" />;
      case 'ShieldCheck': return <ShieldCheck className="w-8 h-8 text-cyan-accent" />;
      default: return <Wrench className="w-8 h-8 text-cyan-accent" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 space-y-16">
      {/* Services Header Banner */}
      <div className="bg-navy-950 text-white rounded-2xl p-8 md:p-12 border border-navy-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-3xl relative z-10 space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/20 text-cyan-accent text-xs font-bold uppercase tracking-wider border border-brand-500/30">
            <Wrench className="w-3.5 h-3.5" />
            <span>Surkhet Technical Support &amp; Engineering</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
            Specialized IT, Repair &amp; Electronic Services
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Our qualified engineers and certified bench technicians provide chip-level diagnostics, turn-key structured cabling, CCTV security, IoT automation, and enterprise Annual Maintenance Contracts across Birendranagar and Karnali Province.
          </p>

          <div className="pt-2 flex flex-wrap gap-4">
            <Link
              href="/contact?type=SERVICE_REQUEST"
              className="px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-lg font-bold text-xs uppercase tracking-wider transition shadow-md"
            >
              Book Service Diagnostic
            </Link>
            <Link
              href="/contact?type=AMC_REQUEST"
              className="px-6 py-3 bg-navy-800 hover:bg-navy-700 text-slate-200 rounded-lg font-semibold text-xs border border-navy-700 transition"
            >
              Request Corporate AMC Quote
            </Link>
          </div>
        </div>
      </div>

      {/* Services List Grid */}
      <div className="space-y-8">
        <div className="text-center max-w-xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
            Our 7 Specialized Service Divisions
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Choose your required service division to read full technical specs or request an estimate.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((svc) => {
            let features: string[] = [];
            try {
              features = JSON.parse(svc.features || '[]');
            } catch {
              features = [];
            }

            return (
              <div
                key={svc.id}
                className="bg-white rounded-2xl border border-slate-200 hover:border-brand-500/50 hover:shadow-xl transition-all p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="w-14 h-14 rounded-xl bg-navy-950 flex items-center justify-center mb-5 border border-navy-800">
                    {getServiceIcon(svc.icon)}
                  </div>

                  <h3 className="font-extrabold text-lg text-navy-900 mb-2 leading-snug">
                    {svc.title}
                  </h3>

                  <p className="text-xs text-slate-600 leading-relaxed mb-4">
                    {svc.shortDescription}
                  </p>

                  {features.length > 0 && (
                    <div className="space-y-1.5 mb-5 pt-3 border-t border-slate-100">
                      {features.slice(0, 3).map((feat, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                          <CheckCircle2 className="w-3.5 h-3.5 text-brand-500 shrink-0 mt-0.5" />
                          <span className="line-clamp-1">{feat}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs mb-4">
                    <span className="text-slate-500 font-medium">Pricing Guide: </span>
                    {svc.startingPrice ? (
                      <span className="font-bold text-brand-600 font-mono">
                        From {formatNPR(svc.startingPrice)}
                      </span>
                    ) : (
                      <span className="font-bold text-brand-600">{svc.pricingNote}</span>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <Link
                    href={`/services/${svc.slug}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-navy-900 hover:text-brand-600 transition"
                  >
                    <span>Full Details</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>

                  <Link
                    href={`/contact?service=${encodeURIComponent(svc.title)}`}
                    className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-xs font-semibold transition shadow-sm"
                  >
                    Request Quote
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* AMC Highlight Section */}
      <div className="bg-gradient-to-r from-navy-900 to-navy-950 rounded-2xl p-8 md:p-12 text-white border border-navy-800">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-8 space-y-4">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-accent uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" />
              <span>For Schools, Hospitals, Banks &amp; Commercial Offices</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Annual Maintenance Contracts (AMC)
            </h3>
            <p className="text-slate-300 text-sm leading-relaxed max-w-2xl">
              Downtime costs revenue. With a Krishna Electronics AMC agreement, our technicians perform proactive monthly preventive servicing, network health audits, data backups, and deliver priority on-site response within 2-4 hours anywhere in Surkhet Valley.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
              <div className="bg-navy-800/80 p-3 rounded-lg border border-navy-700">
                <div className="font-bold text-cyan-accent mb-0.5">2-4 Hr Response</div>
                <div className="text-slate-400">Rapid local emergency technician dispatch</div>
              </div>
              <div className="bg-navy-800/80 p-3 rounded-lg border border-navy-700">
                <div className="font-bold text-cyan-accent mb-0.5">Monthly Checkups</div>
                <div className="text-slate-400">Dust cleaning, thermal paste &amp; network audit</div>
              </div>
              <div className="bg-navy-800/80 p-3 rounded-lg border border-navy-700">
                <div className="font-bold text-cyan-accent mb-0.5">Discounted Spares</div>
                <div className="text-slate-400">Special discounted rates on replacement parts</div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 bg-navy-900 p-6 rounded-xl border border-navy-700 text-center space-y-4">
            <div className="text-xs uppercase font-bold text-slate-400 tracking-wider">
              Corporate Consultation
            </div>
            <div className="text-xl font-bold text-white">
              Get an AMC Proposal
            </div>
            <p className="text-xs text-slate-300">
              Schedule an engineer visit to inspect your existing workstations, routers, and surveillance system.
            </p>
            <Link
              href="/contact?type=AMC_REQUEST"
              className="block w-full py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-lg font-bold text-xs uppercase tracking-wider transition shadow-md"
            >
              Request Free Site Audit
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
