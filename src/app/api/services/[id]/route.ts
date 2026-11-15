import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedAdmin, hasPermission, logAudit } from '@/lib/auth';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await getAuthenticatedAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized: Administrative authentication required.' }, { status: 401 });
    }

    if (!hasPermission(admin.role, 'canManageServices')) {
      return NextResponse.json(
        { error: 'Forbidden: Your role does not have permission to modify technical services.' },
        { status: 403 }
      );
    }

    const data = await req.json();
    const updated = await prisma.service.update({
      where: { id: params.id },
      data: {
        title: data.title,
        shortDescription: data.shortDescription,
        fullDescription: data.fullDescription,
        pricingNote: data.pricingNote,
        startingPrice: data.startingPrice !== undefined ? (data.startingPrice ? parseFloat(data.startingPrice) : null) : undefined,
        isFeatured: data.isFeatured !== undefined ? Boolean(data.isFeatured) : undefined,
        isActive: data.isActive !== undefined ? Boolean(data.isActive) : undefined,
        features: data.features !== undefined ? (typeof data.features === 'string' ? data.features : JSON.stringify(data.features)) : undefined,
      },
    });

    await logAudit({
      userId: admin.id,
      userName: admin.name,
      action: 'UPDATE_SERVICE',
      entity: 'Service',
      entityId: updated.id,
      details: `Updated service "${updated.title}"`,
      ipAddress: req.headers.get('x-forwarded-for') || 'local',
    });

    return NextResponse.json({ success: true, service: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update service' }, { status: 500 });
  }
}
