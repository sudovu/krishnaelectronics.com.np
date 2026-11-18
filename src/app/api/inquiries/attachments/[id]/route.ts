import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedAdmin } from '@/lib/auth';
import { getStorageProvider, verifyAttachmentAccessToken, StoredAttachment } from '@/lib/storage';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const attachmentId = params.id;
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    // 1. Authorization: Valid signed token OR Authenticated Admin Session
    let isAuthorized = false;
    if (token && verifyAttachmentAccessToken(attachmentId, token)) {
      isAuthorized = true;
    } else {
      const admin = await getAuthenticatedAdmin(req);
      if (admin) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Unauthorized: Valid attachment access token or administrative session required.' },
        { status: 401 }
      );
    }

    // 2. Locate attachment record in inquiry database
    const inquiries = await prisma.inquiry.findMany({
      where: {
        attachments: {
          contains: attachmentId,
        },
      },
      select: {
        id: true,
        reference: true,
        attachments: true,
      },
      take: 1,
    });

    if (inquiries.length === 0) {
      return NextResponse.json({ error: 'Attachment not found.' }, { status: 404 });
    }

    const inquiry = inquiries[0];
    let parsedAttachments: StoredAttachment[] = [];
    try {
      parsedAttachments = JSON.parse(inquiry.attachments || '[]');
    } catch {
      parsedAttachments = [];
    }

    const attachment = parsedAttachments.find((a) => a.id === attachmentId);
    if (!attachment) {
      return NextResponse.json({ error: 'Attachment record not found.' }, { status: 404 });
    }

    // 3. Fetch stream from storage provider
    const storage = getStorageProvider();

    // If S3 presigned URL is available and requested, can redirect or stream
    if (storage.getPresignedUrl && attachment.storageProvider !== 'local') {
      const presignedUrl = await storage.getPresignedUrl(attachment.storageKey, 3600);
      if (presignedUrl) {
        return NextResponse.redirect(presignedUrl);
      }
    }

    const readResult = await storage.getReadStream(attachment.storageKey);
    if (!readResult) {
      return NextResponse.json({ error: 'File content missing from storage.' }, { status: 404 });
    }

    // Convert readable stream to web stream for Next.js response
    const stream = new ReadableStream({
      start(controller) {
        readResult.stream.on('data', (chunk) => controller.enqueue(chunk));
        readResult.stream.on('end', () => controller.close());
        readResult.stream.on('error', (err) => controller.error(err));
      },
    });

    const safeFilename = encodeURIComponent(attachment.originalName);
    return new NextResponse(stream, {
      status: 200,
      headers: {
        'Content-Type': attachment.mimeType || 'application/octet-stream',
        'Content-Disposition': `inline; filename="${safeFilename}"`,
        'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; sandbox",
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'private, no-cache, no-store, max-age=0',
      },
    });
  } catch (error: any) {
    console.error('Error serving attachment:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve attachment.' },
      { status: 500 }
    );
  }
}
