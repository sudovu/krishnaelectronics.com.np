import { NextRequest, NextResponse } from 'next/server';
import { whatsAppClient } from '@/lib/whatsapp';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Meta Webhook Verification Endpoint (GET).
 * Responds to Meta verification challenge when registering the webhook in Meta App Dashboard.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const verifiedChallenge = whatsAppClient.verifyWebhookChallenge(mode, token, challenge);
  if (verifiedChallenge) {
    return new NextResponse(verifiedChallenge, { status: 200 });
  }

  return NextResponse.json({ error: 'Forbidden: Invalid verify token or subscription mode.' }, { status: 403 });
}

/**
 * Meta Webhook Event Receiver (POST).
 * Receives delivery receipts (SENT, DELIVERED, READ, FAILED) and updates inquiry status.
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-hub-signature-256');

    // Cryptographic signature check if app secret is configured
    const config = whatsAppClient['config'];
    if (config?.appSecret && !whatsAppClient.verifyWebhookSignature(rawBody, signature)) {
      console.warn('[WhatsApp Webhook] Signature verification failed.');
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);

    // Process incoming message statuses
    const entries = payload?.entry || [];
    for (const entry of entries) {
      const changes = entry?.changes || [];
      for (const change of changes) {
        const value = change?.value;
        const statuses = value?.statuses || [];

        for (const statusObj of statuses) {
          const messageId = statusObj?.id;
          const status = statusObj?.status; // sent, delivered, read, failed

          if (messageId && status) {
            let mappedStatus: 'SENT' | 'DELIVERED' | 'FAILED' = 'SENT';
            if (status === 'delivered' || status === 'read') {
              mappedStatus = 'DELIVERED';
            } else if (status === 'failed') {
              mappedStatus = 'FAILED';
            }

            // Update matching Inquiry record
            await prisma.inquiry.updateMany({
              where: {
                whatsappMessageId: messageId,
              },
              data: {
                whatsappStatus: mappedStatus,
                ...(mappedStatus === 'FAILED' ? { whatsappError: statusObj?.errors?.[0]?.message || 'Delivery failed' } : {}),
              },
            }).catch(() => {});

            // Update matching NotificationOutbox record
            await prisma.notificationOutbox.updateMany({
              where: {
                idempotencyKey: {
                  contains: messageId,
                },
              },
              data: {
                status: mappedStatus === 'DELIVERED' ? 'SENT' : mappedStatus,
              },
            }).catch(() => {});
          }
        }
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('[WhatsApp Webhook] Error processing event:', error);
    return NextResponse.json({ error: 'Internal processing error' }, { status: 500 });
  }
}
