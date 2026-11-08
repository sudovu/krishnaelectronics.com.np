import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentAdminFromRequest, hasPermission, logAudit } from '@/lib/auth';
import { clearProfileCache } from '@/platform/engine/tenant-loader';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const settings = await prisma.setting.findUnique({
      where: { id: 'site-settings' },
    });
    return NextResponse.json({ settings }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0'
      }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

async function handleUpdateSettings(req: NextRequest) {
  try {
    const admin = getCurrentAdminFromRequest(req);
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
