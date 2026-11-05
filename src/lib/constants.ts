import { getActiveBusinessManifest } from '@/platform/engine/tenant-loader';

const manifest = getActiveBusinessManifest();

export const APP_CONSTANTS = {
  BUSINESS_NAME: manifest.identity.name,
  DEFAULT_LOCATION: `${manifest.identity.location.address}, ${manifest.identity.location.city}, ${manifest.identity.location.country}`,
  DEFAULT_CURRENCY: manifest.identity.currency.code,
  CURRENCY_SYMBOL: manifest.identity.currency.symbol,
  DEFAULT_TIMEZONE: 'Asia/Kathmandu',
  CONTACT_NOTE: 'Phone and WhatsApp inquiry support available during store hours.',
};

export const ROLE_PERMISSIONS = {
  SUPER_ADMIN: {
    canManageUsers: true,
    canManageSettings: true,
    canApproveBanners: true,
    canPublishProducts: true,
    canDeleteProducts: true,
    canManageServices: true,
    canManageInquiries: true,
    canViewAuditLogs: true,
    canViewAnalytics: true,
  },
  ADMIN: {
    canManageUsers: false,
    canManageSettings: true,
    canApproveBanners: true,
    canPublishProducts: true,
    canDeleteProducts: true,
    canManageServices: true,
    canManageInquiries: true,
    canViewAuditLogs: true,
    canViewAnalytics: true,
  },
  EDITOR: {
    canManageUsers: false,
    canManageSettings: false,
    canApproveBanners: false,
    canPublishProducts: true,
    canDeleteProducts: false,
    canManageServices: true,
    canManageInquiries: true,
    canViewAuditLogs: false,
    canViewAnalytics: true,
  },
  PRODUCT_MANAGER: {
    canManageUsers: false,
    canManageSettings: false,
    canApproveBanners: false,
    canPublishProducts: true,
    canDeleteProducts: false,
    canManageServices: false,
    canManageInquiries: true,
    canViewAuditLogs: false,
    canViewAnalytics: true,
  },
  CONTENT_MANAGER: {
    canManageUsers: false,
    canManageSettings: false,
    canApproveBanners: false,
    canPublishProducts: false,
    canDeleteProducts: false,
    canManageServices: true,
    canManageInquiries: false,
    canViewAuditLogs: false,
    canViewAnalytics: false,
  },
};
