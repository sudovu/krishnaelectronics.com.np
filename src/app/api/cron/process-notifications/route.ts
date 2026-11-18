import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { processPendingNotificationOutbox } from '@/lib/notifications/inquiry-notification';
import { getAuthenticatedAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    const isProduction = process.env.NODE_ENV === 'production';

    let isAuthorized = false;

    // 1. Primary Authorization: Timing-safe comparison of Bearer CRON_SECRET
    if (cronSecret && authHeader) {
      const expectedHeader = `Bearer ${cronSecret}`;
      if (
        authHeader.length === expectedHeader.length &&
        crypto.timingSafeEqual(Buffer.from(authHeader), Buffer.from(expectedHeader))
      ) {
        isAuthorized = true;
      }
    }

    // 2. Fallback: ONLY permitted in non-production environments for manual dev testing
    if (!isAuthorized && !isProduction) {
      const admin = await getAuthenticatedAdmin(req);
      if (admin) isAuthorized = true;
    }

    // In production, CRON_SECRET is strictly required; admin session fallback is disabled
    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Unauthorized: Valid CRON_SECRET required.' },
        { status: 401 }
      );
    }

    const result = await processPendingNotificationOutbox(15);
    return NextResponse.json({
      success: true,
      result,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[Cron Process Notifications] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process notification outbox' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  return POST(req);
}
