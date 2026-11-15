import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { AdminSessionUser, UserRole } from '@/types';
import { ROLE_PERMISSIONS } from './constants';
import { prisma } from './prisma';

export const AUTH_COOKIE_NAME = 'krishna_admin_session';

/**
 * Retrieves the cryptographic JWT secret.
 * Enforces strict secret configuration in production environments to prevent session forgery.
 */
export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (process.env.NODE_ENV === 'production') {
    if (!secret || secret.length < 32 || secret.includes('fallback') || secret.includes('default')) {
      throw new Error(
        'FATAL SECURITY CONFIGURATION ERROR: JWT_SECRET environment variable must be set to a cryptographically secure key of at least 32 characters in production.'
      );
    }
    return secret;
  }

  // Development/Test fallback with warning
  if (!secret) {
    return 'dev-local-jwt-secret-do-not-use-in-production-32chars';
  }
  return secret;
}

export function signToken(user: AdminSessionUser): string {
  return jwt.sign(
    {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    getJwtSecret(),
    { expiresIn: '7d' }
  );
}

/**
 * Validates the cryptographic signature and expiration of an administrative token.
 */
export function verifyToken(token: string): AdminSessionUser | null {
  try {
    const decoded = jwt.verify(token, getJwtSecret()) as AdminSessionUser;
    if (!decoded || !decoded.id || !decoded.role) return null;
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Verifies token from request cookies or Authorization header.
 * Fast-path synchronous verification for initial request inspection.
 */
export function getCurrentAdminFromRequest(req: NextRequest): AdminSessionUser | null {
  try {
    const token = req.cookies.get(AUTH_COOKIE_NAME)?.value || req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return null;
    return verifyToken(token);
  } catch {
    return null;
  }
}

/**
 * Fully validates the administrator session against the database.
 * Verifies that the account still exists and is currently active (isActive: true).
 * Ensures deactivated or deleted accounts cannot access administrative APIs even with a valid JWT.
 */
export async function getAuthenticatedAdmin(req: NextRequest): Promise<AdminSessionUser | null> {
  const decoded = getCurrentAdminFromRequest(req);
  if (!decoded || !decoded.id) return null;

  try {
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      return null;
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as UserRole,
    };
  } catch (err) {
    console.error('Failed to validate admin session against database:', err);
    return null;
  }
}

export async function getCurrentAdminFromCookies(): Promise<AdminSessionUser | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    if (!token) return null;
    const decoded = verifyToken(token);
    if (!decoded || !decoded.id) return null;

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) return null;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as UserRole,
    };
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
