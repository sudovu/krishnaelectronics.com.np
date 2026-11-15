import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedAdmin } from '@/lib/auth';
import { ROLE_PERMISSIONS } from '@/lib/constants';

export async function GET(req: NextRequest) {
  const admin = await getAuthenticatedAdmin(req);
  if (!admin) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const permissions = ROLE_PERMISSIONS[admin.role] || {};

  return NextResponse.json({
    authenticated: true,
    user: admin,
    permissions,
  });
}
