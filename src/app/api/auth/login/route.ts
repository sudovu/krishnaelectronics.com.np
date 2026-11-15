import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { signToken, AUTH_COOKIE_NAME, logAudit } from '@/lib/auth';

// Rate limiter configuration for brute-force defense
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes window
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes lockout
const MAX_CONCURRENT_PER_IP = 2; // Prevent race conditions from concurrent brute-force bursts

// In-memory cache layer for immediate fast-path rate limiting
interface AttemptRecord {
  count: number;
  firstAttempt: number;
  lockedUntil?: number;
}
const memoryRateLimiter = new Map<string, AttemptRecord>();
const inFlightLogins = new Map<string, number>();

// Dummy hash for constant-time comparison on nonexistent accounts
const DUMMY_HASH = '$2a$10$wN3tNq5PqL6n0p0W4P1s4Oe2nQ4T9jYfB3hA0mC8kD6lM8qE0sS6i';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || req.headers.get('x-real-ip') || 'local';

  // Concurrency gate: Prevent race condition bypasses from simultaneous parallel bursts
  const currentInFlight = inFlightLogins.get(ip) || 0;
  if (currentInFlight >= MAX_CONCURRENT_PER_IP) {
    return NextResponse.json(
      { error: 'Too many simultaneous authentication requests from this IP. Please submit requests sequentially.' },
      { status: 429 }
    );
  }
  inFlightLogins.set(ip, currentInFlight + 1);

  try {
    const now = Date.now();

    // 1. In-memory fast-path check
    const memRecord = memoryRateLimiter.get(ip);
    if (memRecord && memRecord.lockedUntil && now < memRecord.lockedUntil) {
      const remainingMin = Math.ceil((memRecord.lockedUntil - now) / 60000);
      return NextResponse.json(
        { error: `Too many failed login attempts. Temporarily locked for security. Please try again in ${remainingMin} minute(s).` },
        { status: 429 }
      );
    }

    // 2. Persistent database-backed rate limiting check (survives restarts and serverless lambdas)
    try {
      const windowStart = new Date(now - WINDOW_MS);
      const recentFailures = await prisma.auditLog.findMany({
        where: {
          action: 'LOGIN_FAILED',
          ipAddress: ip,
          createdAt: { gte: windowStart },
        },
        orderBy: { createdAt: 'desc' },
        take: MAX_ATTEMPTS,
      });

      if (recentFailures.length >= MAX_ATTEMPTS) {
        const lastFailure = recentFailures[0];
        const elapsed = now - lastFailure.createdAt.getTime();
        if (elapsed < LOCKOUT_MS) {
          const remainingMin = Math.ceil((LOCKOUT_MS - elapsed) / 60000);
          return NextResponse.json(
            { error: `Too many failed login attempts. Temporarily locked for security. Please try again in ${remainingMin} minute(s).` },
            { status: 429 }
          );
        }
      }
    } catch (dbErr) {
      // If database audit log check encounters an error, fall back safely to the in-memory rate limiting layer
      console.warn('Database rate-limit check notice (using in-memory rate limiting layer):', dbErr);
    }

    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Username or email and password are required.' },
        { status: 400 }
      );
    }

    const identifier = email.toLowerCase().trim();
    let user = null;
    try {
      user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: identifier },
            { email: `${identifier}@krishnaelectronics.com.np` },
            { email: identifier.replace(/@.*$/, '') },
          ],
        },
      });
    } catch (userErr) {
      console.error('Notice: Database user query error:', userErr);
    }

    // Emergency bootstrap fallback for initial super admin if database is unreachable or unseeded
    if (!user && (identifier === 'adminbikram' || identifier === 'adminbikram@krishnaelectronics.com.np')) {
      const bootstrapPass = process.env.INITIAL_ADMIN_PASSWORD || 'Krishna@Admin2026!';
      if (password === bootstrapPass) {
        user = {
          id: 'bootstrap-super-admin',
          name: 'Bikram (Super Admin)',
          email: 'adminbikram@krishnaelectronics.com.np',
          role: 'SUPER_ADMIN',
          isActive: true,
          passwordHash: '',
        } as any;
      }
    }

    // Constant-time check: If user not found or bootstrap, compare with dummy hash to prevent timing attacks
    const hashToCompare = user?.passwordHash || DUMMY_HASH;
    const isValidPassword = user?.id === 'bootstrap-super-admin'
      ? true
      : await bcrypt.compare(password, hashToCompare);

    if (!user || !user.isActive || !isValidPassword) {
      // Record failed attempt in memory cache
      const current = memoryRateLimiter.get(ip) || { count: 0, firstAttempt: now };
      if (now - current.firstAttempt > WINDOW_MS) {
        current.count = 1;
        current.firstAttempt = now;
      } else {
        current.count += 1;
      }

      if (current.count >= MAX_ATTEMPTS) {
        current.lockedUntil = now + LOCKOUT_MS;
      }
      memoryRateLimiter.set(ip, current);

      // Audit log failed login (persists across restarts and instances)
      await logAudit({
        userId: user?.id || undefined,
        userName: user?.name || identifier,
        action: 'LOGIN_FAILED',
        entity: 'Security',
        entityId: 'auth',
        details: `Failed administrative login attempt (Attempt count ${current.count})`,
        ipAddress: ip,
      }).catch(() => {});

      return NextResponse.json(
        { error: 'Invalid credentials. Access is monitored and logged.' },
        { status: 401 }
      );
    }

    // Reset memory rate limiter on successful authentication
    memoryRateLimiter.delete(ip);

    // Update lastLoginAt (safely handles read-only database)
    if (user.id !== 'bootstrap-super-admin') {
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      }).catch((err) => {
        console.warn('Notice: Could not update lastLoginAt (read-only environment):', err?.message);
      });
    }

    // Create session token
    const token = signToken({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as any,
      avatarUrl: user.avatarUrl,
    });

    await logAudit({
      userId: user.id,
      userName: user.name,
      action: 'LOGIN',
      entity: 'User',
      entityId: user.id,
      details: `Successful authenticated login as ${user.role}`,
      ipAddress: ip,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

    // Set secure HTTP-only cookie
    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'An unexpected authentication error occurred.' },
      { status: 500 }
    );
  } finally {
    const remaining = (inFlightLogins.get(ip) || 1) - 1;
    if (remaining <= 0) {
      inFlightLogins.delete(ip);
    } else {
      inFlightLogins.set(ip, remaining);
    }
  }
}
