import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/public/Header';
import Footer from '@/components/public/Footer';
import { getMergedBusinessProfile } from '@/platform/engine/tenant-loader';

export const revalidate = 60;

const SEO_KEYWORDS = [
  // Primary Brand & Name Variations
  'Krishna Electronics',
  'Krishna Electronics Surkhet',
  'Krishna Electronics Order & Suppliers',
  'Krishna Electronics Order and Suppliers',
  'Krishna Electronics Birendranagar',
  'krishnaelectronics.com.np',
  'Krishna Electronics Nepal',
  // Devanagari / Nepali Brand & Search Terms
  'कृष्ण इलेक्ट्रोनिक्स',
  'कृष्ण इलेक्ट्रोनिक्स सुर्खेत',
  'कृष्ण इलेक्ट्रोनिक्स अर्डर एण्ड सप्लायर्स',
  'इलेक्ट्रोनिक्स पसल सुर्खेत',
  'कम्प्युटर पसल सुर्खेत',
  'ल्यापटप मर्मत सुर्खेत',
  'कम्प्युटर मर्मत वीरेन्द्रनगर',
  'सिसिटिभी क्यामेरा सुर्खेत',
  // Local Geo Searches (Surkhet & Karnali Province)
  'electronics shop in surkhet',
  'best electronics store surkhet',
  'electronics store near me surkhet',
  'computer shop in surkhet',
  'computer shop birendranagar',
  'laptop shop in surkhet',
  'karnali province electronics supplier',
  'electronics store birendranagar',
  'electronics order suppliers surkhet',
  // Technical Services & Repair Lab
  'laptop repair in surkhet',
  'computer repair service surkhet',
  'chip level motherboard repair surkhet',
  'desktop repair birendranagar',
  'laptop screen replacement surkhet',
  'laptop battery replacement surkhet',
  'cctv camera installation surkhet',
  'cctv surveillance service karnali',
  'hikvision cctv installation surkhet',
  'cat6 fiber structured cabling surkhet',
  'enterprise networking surkhet',
  'router switch wifi solutions surkhet',
  'mikrotik router setup nepal',
  'wi-fi 6 router installation surkhet',
  'amc computer maintenance contract surkhet',
  'annual maintenance contract karnali province',
  'inverter ups repair surkhet',
  'printer toner cartridge refill surkhet',
  // IoT & Smart Home
  'iot smart home automation surkhet',
  'automatic water tank controller surkhet',
  'sonoff smart switch nepal',
  'smart circuit breaker surkhet',
  // Leading Hardware Brands Available
  'tp-link routers surkhet',
  'hikvision cameras surkhet',
  'dell laptops surkhet',
  'mikrotik routers nepal',
  'sonoff smart devices nepal',
  'canon toner cartridges surkhet',
  'hp toner cartridges surkhet',
  // Pricing & Commercial
  'electronics price in nepal',
  'buy electronics online surkhet',
  'computer hardware wholesale surkhet',
];

export async function generateMetadata(): Promise<Metadata> {
  const profile = await getMergedBusinessProfile();

  const title = profile.metaTitle || `${profile.siteName} | Premier Electronics & IT Services in Surkhet`;
  const description = profile.metaDescription || profile.siteDescription;
  const siteUrl = 'https://krishnaelectronics.com.np';
  const ogImageUrl = `${siteUrl}/images/logo.png`;

  return {
    title: {
      default: title,
      template: `%s | ${profile.siteName}`,
    },
    description: description,
    keywords: SEO_KEYWORDS,
    applicationName: profile.siteName,
    authors: [{ name: 'Krishna Electronics Order & Suppliers', url: siteUrl }],
    creator: 'Krishna Electronics',
    publisher: 'Krishna Electronics Order & Suppliers',
    category: 'technology',
    classification: 'Electronics & Computer Technology Services',
    metadataBase: new URL(siteUrl),
    alternates: {
      canonical: siteUrl,
      languages: {
        'en-NP': siteUrl,
        'ne-NP': siteUrl,
      },
    },
    openGraph: {
      title: title,
      description: description,
      url: siteUrl,
      siteName: profile.siteName,
      images: [
        {
          url: ogImageUrl,
          width: 1600,
          height: 1600,
          alt: `${profile.siteName} Official Seal & Brand Logo`,
          type: 'image/png',
        },
      ],
      locale: 'en_NP',
      alternateLocale: ['ne_NP', 'en_US'],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: title,
      description: description,
      images: [ogImageUrl],
      creator: '@krishnaelectronics',
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    other: {
      'geo.region': 'NP-KA',
      'geo.placename': 'Birendranagar, Surkhet',
      'geo.position': '28.5983;81.6339',
      'ICBM': '28.5983, 81.6339',
      'format-detection': 'telephone=yes',
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
    '@graph': [
      {
        '@type': ['ElectronicsStore', 'ProfessionalService'],
        '@id': 'https://krishnaelectronics.com.np/#store',
        name: profile.siteName,
        alternateName: [
          'कृष्ण इलेक्ट्रोनिक्स',
          'Krishna Electronics',
          'Krishna Electronics Surkhet',
          'Krishna Electronics Order & Suppliers',
        ],
        image: 'https://krishnaelectronics.com.np/images/logo.png',
        logo: 'https://krishnaelectronics.com.np/images/logo.png',
        url: 'https://krishnaelectronics.com.np',
        telephone: profile.contactPhone || '083-522006',
        email: profile.contactEmail || 'krishnelectronics2077@gmail.com',
        priceRange: 'रुरु (NPR)',
        currenciesAccepted: 'NPR',
        paymentAccepted: 'Cash, Fonepay, QR, eSewa, Khalti, Bank Transfer',
        description: profile.siteDescription,
        address: {
          '@type': 'PostalAddress',
          streetAddress: 'Birendranagar',
          addressLocality: 'Surkhet',
          addressRegion: 'Karnali Province',
          postalCode: '21700',
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
        areaServed: [
          { '@type': 'City', name: 'Surkhet' },
          { '@type': 'City', name: 'Birendranagar' },
          { '@type': 'AdministrativeArea', name: 'Karnali Province' },
          { '@type': 'Country', name: 'Nepal' },
        ],
        hasOfferCatalog: {
          '@type': 'OfferCatalog',
          name: 'Electronics Catalog & Technical Engineering Services',
          itemListElement: [
            { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Chip-Level Computer & Laptop Motherboard Repair' } },
            { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Structured Cat6 / Optical Fiber Networking Installation' } },
            { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Enterprise Wi-Fi 6 & MikroTik Bandwidth Management' } },
            { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Hikvision CCTV & Surveillance Camera Installation' } },
            { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'IoT Smart Home & Water Tank Automation Systems' } },
            { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Annual Maintenance Contracts (AMC) for Institutions' } },
          ],
        },
      },
      {
        '@type': 'WebSite',
        '@id': 'https://krishnaelectronics.com.np/#website',
        url: 'https://krishnaelectronics.com.np',
        name: profile.siteName,
        alternateName: 'Krishna Electronics Surkhet',
        description: profile.siteDescription,
        publisher: {
          '@id': 'https://krishnaelectronics.com.np/#store',
        },
        inLanguage: ['en-NP', 'ne-NP'],
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: 'https://krishnaelectronics.com.np/products?q={search_term_string}',
          },
          'query-input': 'required name=search_term_string',
        },
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
  )}:wght@400;600;700&display=swap`;

  const dynamicCss = `
    :root {
      --brand-primary: ${primaryColor};
      --brand-secondary: ${secondaryColor};
      --brand-accent: ${accentColor};
      --surface-dark: ${darkSurface};
      --surface-dark-alt: ${darkSurface}dd;
      --surface-light: ${lightSurface};
      --font-custom: '${fontFamily}', system-ui, -apple-system, sans-serif;
    }
  `;

  return (
    <html lang="en">
      <head>
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
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
