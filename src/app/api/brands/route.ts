import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedAdmin, hasPermission, logAudit } from '@/lib/auth';

export async function GET() {
  try {
    const brands = await prisma.brand.findMany({
      include: {
        _count: { select: { products: true } },
      },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json({ brands });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch brands' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await getAuthenticatedAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized: Administrative authentication required.' }, { status: 401 });
    }

    if (!hasPermission(admin.role, 'canManageSettings') && !hasPermission(admin.role, 'canPublishProducts')) {
      return NextResponse.json(
        { error: 'Forbidden: Your role does not have permission to create brands.' },
        { status: 403 }
      );
    }

    const { name, isPopular, websiteUrl } = await req.json();
    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const brand = await prisma.brand.create({
      data: { name, slug, isPopular: Boolean(isPopular), websiteUrl },
    });

    await logAudit({
      userId: admin.id,
      userName: admin.name,
      action: 'CREATE_BRAND',
      entity: 'Brand',
      entityId: brand.id,
      details: `Created brand "${brand.name}"`,
      ipAddress: req.headers.get('x-forwarded-for') || 'local',
    });

    return NextResponse.json({ success: true, brand }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create brand' }, { status: 500 });
  }
}
