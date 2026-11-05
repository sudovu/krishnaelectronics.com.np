import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentAdminFromRequest, hasPermission, logAudit } from '@/lib/auth';

export async function GET() {
  try {
    const settings = await prisma.setting.findUnique({
      where: { id: 'site-settings' },
    });
    return NextResponse.json({ settings });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
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

    const updated = await prisma.setting.upsert({
      where: { id: 'site-settings' },
      update: {
        siteName: data.siteName,
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
        taxRatePercent: data.taxRatePercent !== undefined ? parseFloat(data.taxRatePercent) : undefined,
        maintenanceMode: data.maintenanceMode !== undefined ? Boolean(data.maintenanceMode) : undefined,
        metaTitle: data.metaTitle,
        metaDescription: data.metaDescription,
      },
      create: {
        id: 'site-settings',
        ...data,
      },
    });

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
    return NextResponse.json({ error: error.message || 'Failed to update settings' }, { status: 500 });
  }
}
