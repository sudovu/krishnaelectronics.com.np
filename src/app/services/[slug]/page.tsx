import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { formatNPR } from '@/lib/formatters';
import { 
  CheckCircle2, 
  Wrench, 
  MapPin, 
  ShieldCheck, 
  Clock, 
  ArrowLeft, 
  Send 
} from 'lucide-react';
import type { Metadata } from 'next';
import ServiceBookingForm from '@/components/public/ServiceBookingForm';

export const revalidate = 60;

interface ServiceDetailPageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: ServiceDetailPageProps): Promise<Metadata> {
  const service = await prisma.service.findUnique({
    where: { slug: params.slug },
  });

  if (!service) {
    return { title: 'Service Not Found | Krishna Electronics' };
  }

  const siteUrl = 'https://krishnaelectronics.com.np';
  const imgUrl = service.imageUrl || `${siteUrl}/images/logo.jpg`;

  return {
    title: `${service.title} | Krishna Electronics Surkhet`,
    description: service.shortDescription,
    openGraph: {
      title: `${service.title} | Krishna Electronics`,
      description: service.shortDescription,
      url: `${siteUrl}/services/${service.slug}`,
      images: [
        {
          url: imgUrl,
          width: 800,
          height: 600,
          alt: service.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: service.title,
      description: service.shortDescription,
      images: [imgUrl],
    },
  };
}

export default async function ServiceDetailPage({ params }: ServiceDetailPageProps) {
  const service = await prisma.service.findUnique({
    where: { slug: params.slug },
  });

  if (!service || !service.isActive) {
    notFound();
  }

  // Other services for navigation
  const otherServices = await prisma.service.findMany({
    where: {
      id: { not: service.id },
      isActive: true,
    },
    take: 5,
  }).catch(() => []);

  let features: string[] = [];
  try {
    features = JSON.parse(service.features || '[]');
  } catch {
    features = [];
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500 mb-6">
        <Link href="/" className="hover:text-brand-600">Home</Link>
        <span>/</span>
        <Link href="/services" className="hover:text-brand-600">Services</Link>
        <span>/</span>
        <span className="text-slate-800 font-semibold">{service.title}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Content Column */}
        <div className="lg:col-span-8 space-y-8">
          {/* Header Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 text-brand-600 text-xs font-bold uppercase tracking-wider">
              <Wrench className="w-3.5 h-3.5" />
              <span>Certified Technical Division</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-navy-900 tracking-tight leading-tight">
              {service.title}
            </h1>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              {service.shortDescription}
            </p>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <span className="text-slate-500 font-medium">Estimated Pricing: </span>
                {service.startingPrice ? (
                  <span className="text-base font-bold text-navy-900 font-mono ml-1">
                    Starts from {formatNPR(service.startingPrice)}
                  </span>
                ) : (
                  <span className="text-sm font-bold text-navy-900 ml-1">
                    {service.pricingNote}
                  </span>
                )}
              </div>
              <div className="text-slate-500">
                Location: <span className="font-semibold text-slate-700">Surkhet Facility / On-Site</span>
              </div>
            </div>
          </div>

          {/* Full Detailed Breakdown */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-navy-900 pb-2 border-b border-slate-100">
              Scope of Work &amp; Technical Capabilities
            </h2>

            <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
              {service.fullDescription}
            </div>

            {features.length > 0 && (
              <div className="pt-4 border-t border-slate-100">
                <h3 className="text-sm font-bold text-navy-900 mb-3 uppercase tracking-wide text-xs">
                  Key Service Highlights &amp; Inclusions:
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {features.map((f, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-800">
                      <CheckCircle2 className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Service Inquiry Form */}
          <div className="bg-navy-950 text-white rounded-2xl p-6 sm:p-8 border border-navy-800 shadow-xl space-y-6">
            <div>
              <div className="inline-flex items-center gap-1.5 text-cyan-accent text-xs font-bold uppercase tracking-wider mb-1">
                <Send className="w-3.5 h-3.5" />
                <span>Instant Consultation Request</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold tracking-tight">
                Request Service or Site Inspection
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                Leave your details and device / network issue. Our senior technician will contact you to confirm timing or diagnosis.
              </p>
            </div>

            <ServiceBookingForm serviceId={service.id} serviceTitle={service.title} />
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-navy-900 pb-2 border-b border-slate-100">
              Other Technical Services
            </h3>
            <div className="space-y-2">
              {otherServices.map((os) => (
                <Link
                  key={os.id}
                  href={`/services/${os.slug}`}
                  className="block p-2.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-brand-50 hover:text-brand-600 transition"
                >
                  {os.title}
                </Link>
              ))}
            </div>
            <div className="pt-2 border-t border-slate-100">
              <Link href="/services" className="text-xs font-bold text-brand-600 hover:underline">
                &larr; Back to all services
              </Link>
            </div>
          </div>

          <div className="bg-navy-900 text-white rounded-2xl p-6 border border-navy-800 shadow-sm space-y-3 text-xs">
            <h4 className="font-bold text-sm text-cyan-accent">Surkhet Workshop</h4>
            <div className="flex items-start gap-2 text-slate-300">
              <MapPin className="w-4 h-4 text-cyan-accent shrink-0 mt-0.5" />
              <span>Birendranagar, Surkhet</span>
            </div>
            <div className="flex items-start gap-2 text-slate-300">
              <Clock className="w-4 h-4 text-cyan-accent shrink-0 mt-0.5" />
              <span>Sun - Fri: 9:30 AM - 6:30 PM</span>
            </div>
            <div className="flex items-start gap-2 text-slate-300">
              <ShieldCheck className="w-4 h-4 text-cyan-accent shrink-0 mt-0.5" />
              <span>Free preliminary diagnostic on bench repairs</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
