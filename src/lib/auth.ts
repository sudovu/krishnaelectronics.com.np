import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { AdminSessionUser, UserRole } from '@/types';
import { ROLE_PERMISSIONS } from './constants';
import { prisma } from './prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'krishna-electronics-default-fallback-secret-2026';
export const AUTH_COOKIE_NAME = 'krishna_admin_session';

export function signToken(user: AdminSessionUser): string {
  return jwt.sign(
    {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyToken(token: string): AdminSessionUser | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AdminSessionUser;
    return decoded;
  } catch {
    return null;
  }
}

export async function getCurrentAdminFromCookies(): Promise<AdminSessionUser | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    if (!token) return null;
    return verifyToken(token);
  } catch {
    return null;
  }
}

export function getCurrentAdminFromRequest(req: NextRequest): AdminSessionUser | null {
  try {
    const token = req.cookies.get(AUTH_COOKIE_NAME)?.value || req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return null;
    return verifyToken(token);
  } catch {
    return null;
  }
}

export function hasPermission(
  role: UserRole,
  permission: keyof (typeof ROLE_PERMISSIONS)['SUPER_ADMIN']
): boolean {
  const perms = ROLE_PERMISSIONS[role];
  if (!perms) return false;
  return Boolean(perms[permission]);
}

export async function logAudit(params: {
  userId?: string;
  userName?: string;
  action: string;
  entity: string;
  entityId?: string;
  details?: string;
  ipAddress?: string;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId,
        userName: params.userName,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        details: params.details,
        ipAddress: params.ipAddress,
      },
    });
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
}
