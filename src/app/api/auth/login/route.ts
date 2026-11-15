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
      // In production, enforce fail-closed: do not allow unrestricted logins if persistent security check is broken
      if (process.env.NODE_ENV === 'production') {
        console.error('FATAL: Database rate limiter check failed in production:', dbErr);
        return NextResponse.json(
          { error: 'Authentication service temporarily unavailable. Security verification checks cannot be completed. Please try again in a few moments.' },
          { status: 503 }
        );
      }
      console.warn('Database rate-limit check notice (development fallback active):', dbErr);
    }

    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Username or email and password are required.' },
        { status: 400 }
      );
    }

    const identifier = email.toLowerCase().trim();
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { email: `${identifier}@krishnaelectronics.com.np` },
          { email: identifier.replace(/@.*$/, '') },
        ],
      },
    });

    // Constant-time check: If user not found, compare with dummy hash to prevent timing attacks
    const hashToCompare = user?.passwordHash || DUMMY_HASH;
    const isValidPassword = await bcrypt.compare(password, hashToCompare);

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

    // Update lastLoginAt
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

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
