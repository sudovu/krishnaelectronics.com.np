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

/**
 * Merges database-persisted administrator overrides on top of the active business manifest.
 */
export async function getMergedBusinessProfile(): Promise<SiteSettingsData> {
  const manifest = getActiveBusinessManifest();

  try {
    const dbSetting = await prisma.setting.findUnique({
      where: { id: 'site-settings' },
    });

    if (dbSetting) {
      return {
        id: dbSetting.id,
        siteName: dbSetting.siteName || manifest.identity.name,
        siteTagline: dbSetting.siteTagline || manifest.identity.tagline,
        siteDescription: dbSetting.siteDescription || manifest.identity.description,
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
        metaTitle: dbSetting.metaTitle || `${manifest.identity.name} | ${manifest.identity.location.city}, ${manifest.identity.location.country}`,
        metaDescription: dbSetting.metaDescription || manifest.identity.description,
        ogImageUrl: dbSetting.ogImageUrl,
      };
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
    metaTitle: `${manifest.identity.name} | ${manifest.identity.location.city}, ${manifest.identity.location.country}`,
    metaDescription: manifest.identity.description,
    ogImageUrl: null,
  };
}
