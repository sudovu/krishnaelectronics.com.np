import { NextRequest, NextResponse } from 'next/server';
import { AUTH_COOKIE_NAME, getCurrentAdminFromRequest, logAudit } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const currentAdmin = getCurrentAdminFromRequest(req);
  if (currentAdmin) {
    await logAudit({
      userId: currentAdmin.id,
      userName: currentAdmin.name,
      action: 'LOGOUT',
      entity: 'User',
      entityId: currentAdmin.id,
      details: 'Admin logged out',
      ipAddress: req.headers.get('x-forwarded-for') || 'local',
    });
  }

  const response = NextResponse.json({ success: true, message: 'Logged out successfully.' });
  response.cookies.delete(AUTH_COOKIE_NAME);
  return response;
}
