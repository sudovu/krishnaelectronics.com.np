import { prisma } from '@/lib/prisma';
import { BusinessManifest } from '@/platform/config/tenant-contract';
import { krishnaElectronicsManifest } from '@/business/krishna-electronics/manifest';
import { SiteSettingsData } from '@/types';

/**
 * Returns the currently active declarative business manifest.
 * Can be driven by environment variable (e.g. TENANT_ID) for multi-tenant deployments.
 */
export function getActiveBusinessManifest(): BusinessManifest {
  const tenantId = process.env.TENANT_ID || 'krishna-electronics';
  if (tenantId === 'krishna-electronics') {
    return krishnaElectronicsManifest;
  }
  return krishnaElectronicsManifest;
}

let cachedProfile: SiteSettingsData | null = null;
let cachedTime = 0;
const CACHE_TTL_MS = 60 * 1000; // 60 seconds in-memory cache

export function clearProfileCache() {
  cachedProfile = null;
  cachedTime = 0;
}

/**
 * Merges database-persisted administrator overrides on top of the active business manifest.
 */
export async function getMergedBusinessProfile(): Promise<SiteSettingsData> {
  const now = Date.now();
  if (cachedProfile && (now - cachedTime < CACHE_TTL_MS)) {
    return cachedProfile;
  }

  const manifest = getActiveBusinessManifest();

  try {
    const dbSetting = await prisma.setting.findUnique({
      where: { id: 'site-settings' },
    });

    if (dbSetting) {
      const profile: SiteSettingsData = {
        id: dbSetting.id,
        siteName: dbSetting.siteName !== null && dbSetting.siteName !== undefined ? dbSetting.siteName : manifest.identity.name,
        siteTagline: dbSetting.siteTagline !== null && dbSetting.siteTagline !== undefined ? dbSetting.siteTagline : manifest.identity.tagline,
        siteDescription: dbSetting.siteDescription !== null && dbSetting.siteDescription !== undefined ? dbSetting.siteDescription : manifest.identity.description,
        contactPhone: dbSetting.contactPhone || manifest.identity.contact.phoneDefault,
        contactEmail: dbSetting.contactEmail || manifest.identity.contact.emailDefault,
        contactWhatsapp: dbSetting.contactWhatsapp || manifest.identity.contact.whatsappDefault,
        locationAddress: dbSetting.locationAddress || `${manifest.identity.location.address}, ${manifest.identity.location.city}, ${manifest.identity.location.country}`,
        businessHours: dbSetting.businessHours || manifest.identity.contact.hoursDefault,
        googleMapsEmbedUrl: dbSetting.googleMapsEmbedUrl || '',
        socialFacebook: dbSetting.socialFacebook || '',
        socialInstagram: dbSetting.socialInstagram || '',
        socialLinkedin: dbSetting.socialLinkedin || '',
        socialYoutube: dbSetting.socialYoutube || '',
        deliveryInfo: dbSetting.deliveryInfo || manifest.deliveryNote,
        paymentMethods: dbSetting.paymentMethods || manifest.paymentMethodsNote,
        currencyCode: dbSetting.currencyCode || manifest.identity.currency.code,
        currencySymbol: dbSetting.currencySymbol || manifest.identity.currency.symbol,
        taxRatePercent: dbSetting.taxRatePercent ?? 13.0,
        maintenanceMode: Boolean(dbSetting.maintenanceMode),
        primaryColor: dbSetting.primaryColor || manifest.branding.primaryColor || '#0066FF',
        secondaryColor: dbSetting.secondaryColor || manifest.branding.secondaryColor || '#0052cc',
        accentColor: dbSetting.accentColor || manifest.branding.accentColor || '#00F0FF',
        darkSurface: dbSetting.darkSurface || manifest.branding.darkSurface || '#0B132B',
        lightSurface: dbSetting.lightSurface || manifest.branding.lightSurface || '#F8FAFC',
        fontFamily: dbSetting.fontFamily || manifest.branding.fontFamily || 'Inter',
        metaTitle: dbSetting.metaTitle || `${manifest.identity.name} | ${manifest.identity.location.city}, ${manifest.identity.location.country}`,
        metaDescription: dbSetting.metaDescription || manifest.identity.description,
        ogImageUrl: dbSetting.ogImageUrl,
        homeConfig: dbSetting.homeConfig || null,
      };
      cachedProfile = profile;
      cachedTime = now;
      return profile;
    }
  } catch (err) {
    console.error('Error fetching settings from DB, falling back to manifest:', err);
  }

  // Fallback directly to declarative manifest
  return {
    id: 'site-settings',
    siteName: manifest.identity.name,
    siteTagline: manifest.identity.tagline,
    siteDescription: manifest.identity.description,
    contactPhone: manifest.identity.contact.phoneDefault,
    contactEmail: manifest.identity.contact.emailDefault,
    contactWhatsapp: manifest.identity.contact.whatsappDefault,
    locationAddress: `${manifest.identity.location.address}, ${manifest.identity.location.city}, ${manifest.identity.location.country}`,
    businessHours: manifest.identity.contact.hoursDefault,
    googleMapsEmbedUrl: '',
    socialFacebook: '',
    socialInstagram: '',
    socialLinkedin: '',
    socialYoutube: '',
    deliveryInfo: manifest.deliveryNote,
    paymentMethods: manifest.paymentMethodsNote,
    currencyCode: manifest.identity.currency.code,
    currencySymbol: manifest.identity.currency.symbol,
    taxRatePercent: 13.0,
    maintenanceMode: false,
    primaryColor: manifest.branding.primaryColor || '#0066FF',
    secondaryColor: manifest.branding.secondaryColor || '#0052cc',
    accentColor: manifest.branding.accentColor || '#00F0FF',
    darkSurface: manifest.branding.darkSurface || '#0B132B',
    lightSurface: manifest.branding.lightSurface || '#F8FAFC',
    fontFamily: manifest.branding.fontFamily || 'Inter',
    metaTitle: `${manifest.identity.name} | ${manifest.identity.location.city}, ${manifest.identity.location.country}`,
    metaDescription: manifest.identity.description,
    ogImageUrl: null,
    homeConfig: null,
  };
}
