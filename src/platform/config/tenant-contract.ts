/**
 * Reusable Website Platform Engine — Tenant & Business Profile Contract
 * 
 * Defines the contract that decouples the underlying CMS, eCommerce engine,
 * and Admin Panel from specific business identities, allowing the platform
 * to be white-labeled, commercialized, or deployed for multiple organizations.
 */

export interface BusinessIdentity {
  name: string;
  logoUrl?: string;
  tagline: string;
  description: string;
  websiteUrl: string;
  location: {
    address: string;
    city: string;
    province: string;
    country: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  contact: {
    phoneDefault: string;
    emailDefault: string;
    whatsappDefault: string;
    hoursDefault: string;
  };
  currency: {
    code: string;
    symbol: string;
    name: string;
    formatPattern: string; // e.g., "NPR" standard numbering
  };
}

export interface BusinessBrandingTheme {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  darkSurface: string;
  lightSurface: string;
  fontFamily: string;
  logoSvgOrUrl?: string;
  faviconUrl?: string;
}

export interface BusinessCategorySeed {
  name: string;
  slug: string;
  description: string;
  icon: string;
  orderIndex: number;
  subcategories: string[];
}

export interface BusinessBrandSeed {
  name: string;
  slug: string;
  isPopular: boolean;
}

export interface BusinessServiceSeed {
  title: string;
  slug: string;
  icon: string;
  shortDescription: string;
  fullDescription: string;
  features: string[];
  pricingNote: string;
  startingPrice: number | null;
  isFeatured: boolean;
  orderIndex: number;
}

export interface BusinessProductSeed {
  title: string;
  slug: string;
  sku: string;
  categorySlug: string;
  brandSlug?: string;
  regularPrice: number;
  offerPrice?: number;
  discountPercent?: number;
  stockQuantity: number;
  stockStatus: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
  shortDescription: string;
  fullDescription: string;
  specifications: Array<{ name: string; value: string }>;
  warranty: string;
  primaryImage: string;
  isFeatured: boolean;
  isPopular: boolean;
  isNewArrival: boolean;
  status: 'PUBLISHED' | 'DRAFT';
}

export interface BusinessBannerSeed {
  title: string;
  subtitle: string;
  badgeText: string;
  ctaText: string;
  ctaLink: string;
  position: 'HERO_SLIDER' | 'PROMO_GRID' | 'OFFER_BANNER';
  imageUrl: string;
  discountPercent?: number | null;
  isApproved: boolean;
  status: 'PUBLISHED' | 'DRAFT';
  orderIndex: number;
}

export interface BusinessFAQSeed {
  question: string;
  answer: string;
  category: string;
  orderIndex: number;
}

export interface BusinessManifest {
  manifestVersion: string;
  tenantId: string;
  identity: BusinessIdentity;
  branding: BusinessBrandingTheme;
  categories: BusinessCategorySeed[];
  brands: BusinessBrandSeed[];
  services: BusinessServiceSeed[];
  products: BusinessProductSeed[];
  banners: BusinessBannerSeed[];
  faqs: BusinessFAQSeed[];
  deliveryNote: string;
  paymentMethodsNote: string;
}
