import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentAdminFromRequest, logAudit } from '@/lib/auth';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = getCurrentAdminFromRequest(req);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();

    const updateData: any = {};
    if (body.name !== undefined) {
      updateData.name = body.name;
      updateData.slug = body.slug || body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }
    if (body.logoUrl !== undefined) updateData.logoUrl = body.logoUrl;
    if (body.websiteUrl !== undefined) updateData.websiteUrl = body.websiteUrl;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.isPopular !== undefined) updateData.isPopular = Boolean(body.isPopular);

    const brand = await prisma.brand.update({
      where: { id },
      data: updateData,
    });

    await logAudit({
      userId: admin.id,
      userName: admin.name,
      action: 'UPDATE_BRAND',
      entity: 'Brand',
      entityId: id,
      details: `Updated brand "${brand.name}"`,
    });

    return NextResponse.json({ success: true, brand });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update brand' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = getCurrentAdminFromRequest(req);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    const productCount = await prisma.product.count({
      where: { brandId: id },
    });

    if (productCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete brand because it is associated with ${productCount} products.` },
        { status: 400 }
      );
    }

    const brand = await prisma.brand.delete({
      where: { id },
    });

    await logAudit({
      userId: admin.id,
      userName: admin.name,
      action: 'DELETE_BRAND',
      entity: 'Brand',
      entityId: id,
      details: `Deleted brand "${brand.name}"`,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete brand' }, { status: 500 });
  }
}
