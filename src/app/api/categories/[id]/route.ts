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
    if (body.description !== undefined) updateData.description = body.description;
    if (body.icon !== undefined) updateData.icon = body.icon;
    if (body.imageUrl !== undefined) updateData.imageUrl = body.imageUrl;
    if (body.orderIndex !== undefined) updateData.orderIndex = parseInt(body.orderIndex, 10);
    if (body.isActive !== undefined) updateData.isActive = Boolean(body.isActive);

    const category = await prisma.category.update({
      where: { id },
      data: updateData,
    });

    await logAudit({
      userId: admin.id,
      userName: admin.name,
      action: 'UPDATE_CATEGORY',
      entity: 'Category',
      entityId: id,
      details: `Updated category "${category.name}"`,
    });

    return NextResponse.json({ success: true, category });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update category' }, { status: 500 });
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

    // Check if category has products
    const productCount = await prisma.product.count({
      where: { categoryId: id },
    });

    if (productCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete category because it contains ${productCount} active products. Reassign or delete products first.` },
        { status: 400 }
      );
    }

    // Delete related subcategories first
    await prisma.subcategory.deleteMany({
      where: { categoryId: id },
    });

    const category = await prisma.category.delete({
      where: { id },
    });

    await logAudit({
      userId: admin.id,
      userName: admin.name,
      action: 'DELETE_CATEGORY',
      entity: 'Category',
      entityId: id,
      details: `Deleted category "${category.name}"`,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete category' }, { status: 500 });
  }
}
