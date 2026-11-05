import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentAdminFromRequest, logAudit } from '@/lib/auth';

export async function GET() {
  try {
    const services = await prisma.service.findMany({
      orderBy: { orderIndex: 'asc' },
    });
    return NextResponse.json({ services });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = getCurrentAdminFromRequest(req);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();
    if (!data.title || !data.shortDescription) {
      return NextResponse.json({ error: 'Title and short description are required.' }, { status: 400 });
    }

    const slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const service = await prisma.service.create({
      data: {
        title: data.title,
        slug,
        icon: data.icon || 'Wrench',
        shortDescription: data.shortDescription,
        fullDescription: data.fullDescription || data.shortDescription,
        features: JSON.stringify(data.features || []),
        pricingNote: data.pricingNote || 'Contact for diagnosis',
        startingPrice: data.startingPrice ? parseFloat(data.startingPrice) : null,
        isFeatured: Boolean(data.isFeatured),
        isActive: true,
      },
    });

    await logAudit({
      userId: admin.id,
      userName: admin.name,
      action: 'CREATE_SERVICE',
      entity: 'Service',
      entityId: service.id,
      details: `Created technical service "${service.title}"`,
      ipAddress: req.headers.get('x-forwarded-for') || 'local',
    });

    return NextResponse.json({ success: true, service }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create service' }, { status: 500 });
  }
}
