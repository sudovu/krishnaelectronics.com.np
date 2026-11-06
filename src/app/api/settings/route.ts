import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentAdminFromRequest, hasPermission, logAudit } from '@/lib/auth';
import { clearProfileCache } from '@/platform/engine/tenant-loader';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const settings = await prisma.setting.findUnique({
      where: { id: 'site-settings' },
    });
    return NextResponse.json({ settings });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

async function handleSaveSettings(req: NextRequest) {
  try {
    const admin = getCurrentAdminFromRequest(req);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
      siteName: data.siteName,
      logoUrl: data.logoUrl,
      siteTagline: data.siteTagline,
      siteDescription: data.siteDescription,
      contactPhone: data.contactPhone,
      contactEmail: data.contactEmail,
      contactWhatsapp: data.contactWhatsapp,
      locationAddress: data.locationAddress,
      businessHours: data.businessHours,
      googleMapsEmbedUrl: data.googleMapsEmbedUrl,
      socialFacebook: data.socialFacebook,
      socialInstagram: data.socialInstagram,
      socialLinkedin: data.socialLinkedin,
      socialYoutube: data.socialYoutube,
      deliveryInfo: data.deliveryInfo,
      paymentMethods: data.paymentMethods,
      currencyCode: data.currencyCode,
      currencySymbol: data.currencySymbol,
      taxRatePercent: taxRatePercent,
      maintenanceMode: data.maintenanceMode !== undefined ? Boolean(data.maintenanceMode) : undefined,
      primaryColor: data.primaryColor || undefined,
      secondaryColor: data.secondaryColor || undefined,
      accentColor: data.accentColor || undefined,
      darkSurface: data.darkSurface || undefined,
      lightSurface: data.lightSurface || undefined,
      fontFamily: data.fontFamily || undefined,
      metaTitle: data.metaTitle,
      metaDescription: data.metaDescription,
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

export async function POST(req: NextRequest) {
  return handleSaveSettings(req);
}

export async function PUT(req: NextRequest) {
  return handleSaveSettings(req);
}
