export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'EDITOR' | 'PRODUCT_MANAGER' | 'CONTENT_MANAGER';

export interface AdminSessionUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string | null;
}

export interface SpecificationItem {
  name: string;
  value: string;
}

export type ProductStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type StockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';

export interface ProductData {
  id: string;
  title: string;
  slug: string;
  sku: string;
  categoryId: string;
  subcategoryId?: string | null;
  brandId?: string | null;
  regularPrice: number;
  offerPrice?: number | null;
  discountPercent?: number | null;
  currency: string;
  stockQuantity: number;
  stockStatus: StockStatus;
  shortDescription: string;
  fullDescription: string;
  specifications: string; // JSON string
  warranty?: string | null;
  isFeatured: boolean;
  isPopular: boolean;
  isNewArrival: boolean;
  isDeal: boolean;
  primaryImage: string;
  gallery: string; // JSON string
  status: ProductStatus;
  viewsCount: number;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  category?: {
    id: string;
    name: string;
    slug: string;
  };
  subcategory?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  brand?: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

export interface ServiceData {
  id: string;
  title: string;
  slug: string;
  icon: string;
  shortDescription: string;
  fullDescription: string;
  features: string; // JSON string array
  pricingNote: string;
  startingPrice?: number | null;
  isFeatured: boolean;
  isActive: boolean;
  orderIndex: number;
  imageUrl?: string | null;
}

export interface BannerData {
  id: string;
  title: string;
  subtitle?: string | null;
  badgeText?: string | null;
  ctaText?: string | null;
  ctaLink?: string | null;
  position: 'HERO_SLIDER' | 'POPUP_MODAL' | 'PROMO_GRID' | 'OFFER_BANNER' | 'SIDEBAR';
  imageUrl: string;
  mobileImageUrl?: string | null;
  bgGradientOrColor?: string | null;
  discountPercent?: number | null;
  couponCode?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  isAiGenerated: boolean;
  aiPrompt?: string | null;
  aiStyle?: string | null;
  isApproved: boolean;
  approvedBy?: string | null;
  approvedAt?: string | null;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  orderIndex: number;
}

export interface InquiryData {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  customerAddress?: string | null;
  type: 'PRODUCT_INQUIRY' | 'SERVICE_REQUEST' | 'AMC_REQUEST' | 'DIRECT_ORDER' | 'GENERAL_INQUIRY';
  subject: string;
  message: string;
  productId?: string | null;
  serviceId?: string | null;
  preferredContact: 'PHONE' | 'WHATSAPP' | 'EMAIL';
  status: 'NEW' | 'CONTACTED' | 'IN_PROGRESS' | 'RESOLVED' | 'CANCELLED';
  adminNotes?: string | null;
  createdAt: string;
}

export interface SiteSettingsData {
  id: string;
  siteName: string;
  logoUrl?: string;
  siteTagline: string;
  siteDescription: string;
  contactPhone: string;
  contactEmail: string;
  contactWhatsapp: string;
  locationAddress: string;
  businessHours: string;
  googleMapsEmbedUrl: string;
  socialFacebook: string;
  socialInstagram: string;
  socialLinkedin: string;
  socialYoutube: string;
  deliveryInfo: string;
  paymentMethods: string;
  currencyCode: string;
  currencySymbol: string;
  taxRatePercent: number;
  maintenanceMode: boolean;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  darkSurface?: string;
  lightSurface?: string;
  fontFamily?: string;
  metaTitle: string;
  metaDescription: string;
  ogImageUrl?: string | null;
  homeConfig?: string | null;
}

export interface HomeConfigData {
  // Top Header & Heading Customization
  showHeaderHeading?: boolean;
  headerHeadingText?: string;
  showHeaderTagline?: boolean;
  headerTaglineText?: string;
  showTopNotificationBar?: boolean;
  topNotificationText?: string;
  showTopContactLinks?: boolean;
  showTopPortalLink?: boolean;
  showContactButton?: boolean;
  contactButtonLabel?: string;
  showBookRepairButton?: boolean;
  bookRepairButtonLabel?: string;
  showNavbarBadge?: boolean;
  navbarBadgeText?: string;

  // Category Section
  categoryBadge?: string;
  categoryTitle?: string;
  categorySubtitle?: string;
  // Featured Section
  featuredBadge?: string;
  featuredTitle?: string;
  featuredSubtitle?: string;
  // Mid Showcase Section
  showcaseBadge?: string;
  showcaseTitle?: string;
  showcaseSubtitle?: string;
  showcaseCtaText?: string;
  showcaseCtaLink?: string;
  showcaseCtaSecondaryText?: string;
  showcaseCtaSecondaryLink?: string;
  showcaseFeature1Title?: string;
  showcaseFeature1Desc?: string;
  showcaseFeature2Title?: string;
  showcaseFeature2Desc?: string;
  showcaseFeature3Title?: string;
  showcaseFeature3Desc?: string;
  showcaseFeature4Title?: string;
  showcaseFeature4Desc?: string;
  // Services Section
  servicesBadge?: string;
  servicesTitle?: string;
  servicesSubtitle?: string;
  // Why Choose Us Section
  whyTitle?: string;
  whySubtitle?: string;
  whyCard1Title?: string;
  whyCard1Desc?: string;
  whyCard2Title?: string;
  whyCard2Desc?: string;
  whyCard3Title?: string;
  whyCard3Desc?: string;
  whyCard4Title?: string;
  whyCard4Desc?: string;
  // Store Location & Visit Section
  locationBadge?: string;
  locationTitle?: string;
  locationSubtitle?: string;
}
