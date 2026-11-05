import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentAdminFromRequest, logAudit } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const admin = getCurrentAdminFromRequest(req);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, categoryId } = await req.json();
    if (!name || !categoryId) {
      return NextResponse.json({ error: 'Name and Category ID are required' }, { status: 400 });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const subcategory = await prisma.subcategory.create({
      data: {
        name,
        slug: `${categoryId.slice(0, 4)}-${slug}`,
        categoryId,
      },
    });

    await logAudit({
      userId: admin.id,
      userName: admin.name,
      action: 'CREATE_SUBCATEGORY',
      entity: 'Subcategory',
      entityId: subcategory.id,
      details: `Added subcategory "${name}" to category ID ${categoryId}`,
    });

    return NextResponse.json({ success: true, subcategory }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create subcategory' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const admin = getCurrentAdminFromRequest(req);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Subcategory ID is required' }, { status: 400 });
    }

    await prisma.subcategory.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete subcategory' }, { status: 500 });
  }
}
