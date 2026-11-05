import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/public/Header';
import Footer from '@/components/public/Footer';
import { getMergedBusinessProfile } from '@/platform/engine/tenant-loader';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const profile = await getMergedBusinessProfile();

  const title = profile.metaTitle || `${profile.siteName} | ${profile.locationAddress}`;
  const description = profile.metaDescription || profile.siteDescription;

  return {
    title: {
      default: title,
      template: `%s | ${profile.siteName}`,
    },
    description: description,
    metadataBase: new URL('https://krishnaelectronics.com.np'),
    openGraph: {
      title: title,
      description: description,
      url: 'https://krishnaelectronics.com.np',
      siteName: profile.siteName,
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
  const profile = await getMergedBusinessProfile();

  const schemaJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ElectronicsStore',
    name: profile.siteName,
    image: 'https://krishnaelectronics.com.np/logo.png',
    '@id': 'https://krishnaelectronics.com.np',
    url: 'https://krishnaelectronics.com.np',
    priceRange: profile.currencyCode,
    address: {
      '@type': 'PostalAddress',
      streetAddress: profile.locationAddress,
      addressLocality: 'Surkhet',
      addressRegion: 'Karnali Province',
      addressCountry: 'NP',
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
        <Header settings={profile} />
        <main className="flex-1">{children}</main>
        <Footer settings={profile} />
      </body>
    </html>
  );
}
