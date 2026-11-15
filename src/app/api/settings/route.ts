import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedAdmin, hasPermission, logAudit } from '@/lib/auth';
import { clearProfileCache } from '@/platform/engine/tenant-loader';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const settings = await prisma.setting.findUnique({
      where: { id: 'site-settings' },
    });
    if (settings) {
      return NextResponse.json({ settings }, {
        headers: {
          'Cache-Control': 'no-store, max-age=0'
        }
      });
    }
    throw new Error('Settings record not found');
  } catch (error) {
    try {
      const manifest = require('@/business/krishna-electronics/data.json');
      const fallbackSettings = {
        id: 'site-settings',
        siteName: manifest.identity.name,
        logoUrl: manifest.identity.logoUrl || '/images/logo.jpg',
        siteTagline: manifest.identity.tagline,
        siteDescription: manifest.identity.description,
        contactPhone: manifest.identity.contact?.phoneDefault || '083-522006',
        contactEmail: manifest.identity.contact?.emailDefault || 'krishanelectronics2077@gmail.com',
        contactWhatsapp: manifest.identity.contact?.whatsappDefault || '9858083951',
        locationAddress: 'Birendranagar, Surkhet',
        businessHours: manifest.identity.contact?.hoursDefault || 'Sun - Fri: 9:30 AM - 6:30 PM | Saturday: Closed (On-call emergency services available)',
        googleMapsEmbedUrl: '',
        socialFacebook: '',
        socialTiktok: '',
        socialInstagram: '',
        currencyCode: 'NPR',
        currencySymbol: 'रु',
        taxRatePercent: 13.0,
        maintenanceMode: false,
        primaryColor: '#0066FF',
        secondaryColor: '#0052cc',
        accentColor: '#00F0FF',
        darkSurface: '#0B132B',
        lightSurface: '#F8FAFC',
        fontFamily: 'Inter',
        metaTitle: 'Krishna Electronics Order & Suppliers | Surkhet, Nepal',
        metaDescription: 'Trusted electronics store & technology service center in Surkhet.',
        homeConfig: JSON.stringify(manifest.homeConfig || {}),
      };
      return NextResponse.json({ settings: fallbackSettings }, {
        headers: {
          'Cache-Control': 'no-store, max-age=0'
        }
      });
    } catch (_) {}
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

async function handleUpdateSettings(req: NextRequest) {
  try {
    const admin = await getAuthenticatedAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized: Please log in to update settings.' }, { status: 401 });
    }

    if (!hasPermission(admin.role, 'canManageSettings')) {
      return NextResponse.json(
        { error: 'Forbidden: Your role does not have permission to manage website settings.' },
        { status: 403 }
      );
    }

    const data = await req.json();

    const taxRatePercent = data.taxRatePercent !== undefined && data.taxRatePercent !== '' && !isNaN(parseFloat(data.taxRatePercent))
      ? parseFloat(data.taxRatePercent)
      : undefined;

    const homeConfig = data.homeConfig !== undefined
      ? (typeof data.homeConfig === 'object' && data.homeConfig !== null ? JSON.stringify(data.homeConfig) : (data.homeConfig || null))
      : undefined;

    const settingPayload = {
      siteName: data.siteName !== undefined ? data.siteName : undefined,
      logoUrl: data.logoUrl !== undefined ? data.logoUrl : undefined,
      siteTagline: data.siteTagline !== undefined ? data.siteTagline : undefined,
      siteDescription: data.siteDescription !== undefined ? data.siteDescription : undefined,
      contactPhone: data.contactPhone !== undefined ? data.contactPhone : undefined,
      contactEmail: data.contactEmail !== undefined ? data.contactEmail : undefined,
      contactWhatsapp: data.contactWhatsapp !== undefined ? data.contactWhatsapp : undefined,
      locationAddress: data.locationAddress !== undefined ? data.locationAddress : undefined,
      businessHours: data.businessHours !== undefined ? data.businessHours : undefined,
      googleMapsEmbedUrl: data.googleMapsEmbedUrl !== undefined ? data.googleMapsEmbedUrl : undefined,
      socialFacebook: data.socialFacebook !== undefined ? data.socialFacebook : undefined,
      socialInstagram: data.socialInstagram !== undefined ? data.socialInstagram : undefined,
      socialLinkedin: data.socialLinkedin !== undefined ? data.socialLinkedin : undefined,
      socialYoutube: data.socialYoutube !== undefined ? data.socialYoutube : undefined,
      deliveryInfo: data.deliveryInfo !== undefined ? data.deliveryInfo : undefined,
      paymentMethods: data.paymentMethods !== undefined ? data.paymentMethods : undefined,
      currencyCode: data.currencyCode !== undefined ? data.currencyCode : undefined,
      currencySymbol: data.currencySymbol !== undefined ? data.currencySymbol : undefined,
      taxRatePercent: taxRatePercent,
      maintenanceMode: data.maintenanceMode !== undefined ? Boolean(data.maintenanceMode) : undefined,
      primaryColor: data.primaryColor || undefined,
      secondaryColor: data.secondaryColor || undefined,
      accentColor: data.accentColor || undefined,
      darkSurface: data.darkSurface || undefined,
      lightSurface: data.lightSurface || undefined,
      fontFamily: data.fontFamily || undefined,
      metaTitle: data.metaTitle !== undefined ? data.metaTitle : undefined,
      metaDescription: data.metaDescription !== undefined ? data.metaDescription : undefined,
      ogImageUrl: data.ogImageUrl,
      homeConfig: homeConfig,
    };

    const updated = await prisma.setting.upsert({
      where: { id: 'site-settings' },
      update: settingPayload,
      create: {
        id: 'site-settings',
        ...settingPayload,
        taxRatePercent: taxRatePercent ?? 13.0,
        maintenanceMode: Boolean(data.maintenanceMode),
      },
    });

    clearProfileCache();
    try {
      revalidatePath('/', 'layout');
    } catch (_) {}

    await logAudit({
      userId: admin.id,
      userName: admin.name,
      action: 'UPDATE_SETTINGS',
      entity: 'Setting',
      entityId: 'site-settings',
      details: 'Updated global website contact, location, and operational settings',
      ipAddress: req.headers.get('x-forwarded-for') || 'local',
    });

    return NextResponse.json({ success: true, settings: updated });
  } catch (error: any) {
    console.error('Settings update error:', error);
    let errorMsg = error?.message || 'Failed to update settings';
    if (errorMsg.includes('EROFS') || errorMsg.includes('read-only')) {
      errorMsg = 'Database is in read-only mode. On Vercel serverless, please connect a cloud PostgreSQL database (e.g. Neon or Supabase) via DATABASE_URL.';
    }
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  return handleUpdateSettings(req);
}

export async function POST(req: NextRequest) {
  return handleUpdateSettings(req);
}
