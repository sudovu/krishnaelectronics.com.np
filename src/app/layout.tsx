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
    image: 'https://krishnaelectronics.com.np/logo.jpg',
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

  const primaryColor = profile.primaryColor || '#0066FF';
  const secondaryColor = profile.secondaryColor || '#0052cc';
  const accentColor = profile.accentColor || '#00F0FF';
  const darkSurface = profile.darkSurface || '#0B132B';
  const lightSurface = profile.lightSurface || '#F8FAFC';
  const fontFamily = profile.fontFamily || 'Inter';

  const fontUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(
    fontFamily
  )}:wght@300;400;500;600;700;800;900&display=swap`;

  const dynamicCss = `
    :root {
      --brand-primary: ${primaryColor};
      --brand-secondary: ${secondaryColor};
      --brand-accent: ${accentColor};
      --surface-dark: ${darkSurface};
      --surface-dark-alt: ${darkSurface}dd;
      --surface-light: ${lightSurface};
      --font-custom: '${fontFamily}';
    }
  `;

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href={fontUrl} />
        <style dangerouslySetInnerHTML={{ __html: dynamicCss }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaJsonLd) }}
        />
      </head>
      <body className="min-h-screen flex flex-col text-slate-900 font-sans" style={{ backgroundColor: lightSurface }}>
        <Header settings={profile} />
        <main className="flex-1">{children}</main>
        <Footer settings={profile} />
      </body>
    </html>
  );
}
