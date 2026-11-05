import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { signToken, AUTH_COOKIE_NAME, logAudit } from '@/lib/auth';

// In-memory rate limiter for brute-force defense
interface AttemptRecord {
  count: number;
  firstAttempt: number;
  lockedUntil?: number;
}

const loginAttempts = new Map<string, AttemptRecord>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes window
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes lockout

// Dummy hash for constant-time comparison on nonexistent accounts
const DUMMY_HASH = '$2a$10$wN3tNq5PqL6n0p0W4P1s4Oe2nQ4T9jYfB3hA0mC8kD6lM8qE0sS6i';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'local';
    const now = Date.now();

    // Check rate limit for IP
    const ipRecord = loginAttempts.get(ip);
    if (ipRecord && ipRecord.lockedUntil && now < ipRecord.lockedUntil) {
      const remainingMin = Math.ceil((ipRecord.lockedUntil - now) / 60000);
      return NextResponse.json(
        { error: `Too many failed login attempts. Temporarily locked for security. Please try again in ${remainingMin} minute(s).` },
        { status: 429 }
      );
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
      // Record failed attempt
      const current = loginAttempts.get(ip) || { count: 0, firstAttempt: now };
      if (now - current.firstAttempt > WINDOW_MS) {
        current.count = 1;
        current.firstAttempt = now;
      } else {
        current.count += 1;
      }

      if (current.count >= MAX_ATTEMPTS) {
        current.lockedUntil = now + LOCKOUT_MS;
      }
      loginAttempts.set(ip, current);

      // Audit log failed login
      await logAudit({
        userId: user?.id || null,
        userName: user?.name || identifier,
        action: 'LOGIN_FAILED',
        entity: 'Security',
        entityId: 'auth',
        details: `Failed administrative login attempt (Attempt ${current.count}/${MAX_ATTEMPTS})`,
        ipAddress: ip,
      }).catch(() => {});

      return NextResponse.json(
        { error: 'Invalid credentials. Access is monitored and logged.' },
        { status: 401 }
      );
    }

    // Reset rate limiter on successful authentication
    loginAttempts.delete(ip);

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
  }
}
