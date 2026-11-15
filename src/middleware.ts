import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const AUTH_COOKIE_NAME = 'krishna_admin_session';

/**
 * Validates the HS256 JWT using Web Crypto API.
 * Runs in Next.js Edge Runtime without Node.js dependencies.
 */
async function verifyEdgeToken(token: string, secret: string): Promise<boolean> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;

    const [headerB64, payloadB64, signatureB64] = parts;
    const data = new TextEncoder().encode(`${headerB64}.${payloadB64}`);

    // Base64url to Uint8Array decoding
    const sigStr = signatureB64.replace(/-/g, '+').replace(/_/g, '/');
    const pad = sigStr.length % 4;
    const paddedSig = pad ? sigStr + '='.repeat(4 - pad) : sigStr;
    const binarySig = Uint8Array.from(atob(paddedSig), (c) => c.charCodeAt(0));

    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const isValid = await crypto.subtle.verify('HMAC', key, binarySig, data);
    if (!isValid) return false;

    // Check payload expiration and required claims
    const payloadPad = payloadB64.length % 4;
    const paddedPayload = payloadPad ? payloadB64 + '='.repeat(4 - payloadPad) : payloadB64;
    const payload = JSON.parse(atob(paddedPayload.replace(/-/g, '+').replace(/_/g, '/')));

    if (!payload.id || !payload.role) {
      return false;
    }

    if (payload.exp && Date.now() >= payload.exp * 1000) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Protect all /admin routes except the public /admin/login screen
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const sessionToken = req.cookies.get(AUTH_COOKIE_NAME)?.value;

    if (!sessionToken) {
      const loginUrl = new URL('/admin/login', req.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }

    const secret = process.env.JWT_SECRET || 'dev-local-jwt-secret-do-not-use-in-production-32chars';
    const isValid = await verifyEdgeToken(sessionToken, secret);

    if (!isValid) {
      const loginUrl = new URL('/admin/login', req.url);
      loginUrl.searchParams.set('from', pathname);
      const res = NextResponse.redirect(loginUrl);
      // Clean up the invalid or expired session cookie
      res.cookies.delete(AUTH_COOKIE_NAME);
      return res;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
