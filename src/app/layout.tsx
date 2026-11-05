import type { Metadata } from 'next';
import './globals.css';
import { prisma } from '@/lib/prisma';
import Header from '@/components/public/Header';
import Footer from '@/components/public/Footer';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await prisma.setting.findUnique({
    where: { id: 'site-settings' },
  }).catch(() => null);

  const title = settings?.metaTitle || 'Krishna Electronics & Order Suppliers | Surkhet, Nepal';
  const description =
    settings?.metaDescription ||
    'Trusted electronics retail, IoT smart home solutions, enterprise networking, CCTV surveillance & chip-level laptop repair laboratory in Birendranagar-6, Buddhapath, Surkhet, Nepal.';

  return {
    title: {
      default: title,
      template: `%s | Krishna Electronics`,
    },
    description: description,
    metadataBase: new URL('https://krishnaelectronics.com.np'),
    openGraph: {
      title: title,
      description: description,
      url: 'https://krishnaelectronics.com.np',
      siteName: 'Krishna Electronics & Order Suppliers',
      locale: 'en_NP',
      type: 'website',
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await prisma.setting.findUnique({
    where: { id: 'site-settings' },
  }).catch(() => null);

  const schemaJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ElectronicsStore',
    name: 'Krishna Electronics & Order Suppliers',
    image: 'https://krishnaelectronics.com.np/logo.png',
    '@id': 'https://krishnaelectronics.com.np',
    url: 'https://krishnaelectronics.com.np',
    priceRange: 'NPR',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Buddhapath, Birendranagar-6',
      addressLocality: 'Surkhet',
      addressRegion: 'Karnali Province',
      addressCountry: 'NP',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 28.5983,
      longitude: 81.6339,
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '09:30',
        closes: '18:30',
      },
    ],
  };

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaJsonLd) }}
        />
      </head>
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
        <Header settings={settings as any} />
        <main className="flex-1">{children}</main>
        <Footer settings={settings as any} />
      </body>
    </html>
  );
}
