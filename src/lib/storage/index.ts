import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export interface StoredAttachment {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  storageKey: string;
  storageProvider: 's3' | 'r2' | 'vercel-blob' | 'local';
  createdAt: string;
}

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  detectedMime?: string;
}

// Magic bytes definitions for high-security verification
const MAGIC_BYTES = {
  JPEG: [0xff, 0xd8, 0xff],
  PNG: [0x89, 0x50, 0x4e, 0x47],
  PDF: [0x25, 0x50, 0x44, 0x46], // %PDF
  RIFF: [0x52, 0x49, 0x46, 0x46], // 'RIFF' for WEBP
  WEBP: [0x57, 0x45, 0x42, 0x50], // 'WEBP' at offset 8
};

export const MAX_ATTACHMENT_COUNT = 5;
export const MAX_ATTACHMENT_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
export const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];

/**
 * Validates file buffer magic bytes against declared extension and MIME type.
 * Protects against disguised executables, scripts, and HTML files.
 */
export function validateAttachmentBuffer(
  buffer: Buffer,
  fileName: string,
  clientMimeType?: string
): FileValidationResult {
  if (!buffer || buffer.length === 0) {
    return { valid: false, error: 'File is empty.' };
  }

  if (buffer.length > MAX_ATTACHMENT_SIZE_BYTES) {
    return {
      valid: false,
      error: `File size exceeds the 10 MB limit (${(buffer.length / (1024 * 1024)).toFixed(1)} MB provided).`,
    };
  }

  const ext = path.extname(fileName).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return {
      valid: false,
      error: `Unsupported file type "${ext}". Only JPG, PNG, WEBP, and PDF documents are permitted.`,
    };
  }

  // Double extension or script checking (e.g. evil.php.jpg)
  const normalizedBase = path.basename(fileName, ext).toLowerCase();
  const dangerousPatterns = [
    /\.exe$/i, /\.bat$/i, /\.cmd$/i, /\.sh$/i, /\.php$/i, /\.js$/i,
    /\.html$/i, /\.htm$/i, /\.svg$/i, /\.vbs$/i, /\.ps1$/i, /\.jar$/i
  ];
  for (const pat of dangerousPatterns) {
    if (pat.test(normalizedBase)) {
      return { valid: false, error: 'Executable or script files are strictly prohibited.' };
    }
  }

  // Magic bytes inspection
  if (ext === '.jpg' || ext === '.jpeg') {
    if (
      buffer[0] !== MAGIC_BYTES.JPEG[0] ||
      buffer[1] !== MAGIC_BYTES.JPEG[1] ||
      buffer[2] !== MAGIC_BYTES.JPEG[2]
    ) {
      return { valid: false, error: 'Corrupt or invalid JPEG image header.' };
    }
    return { valid: true, detectedMime: 'image/jpeg' };
  }

  if (ext === '.png') {
    if (
      buffer[0] !== MAGIC_BYTES.PNG[0] ||
      buffer[1] !== MAGIC_BYTES.PNG[1] ||
      buffer[2] !== MAGIC_BYTES.PNG[2] ||
      buffer[3] !== MAGIC_BYTES.PNG[3]
    ) {
      return { valid: false, error: 'Corrupt or invalid PNG image header.' };
    }
    return { valid: true, detectedMime: 'image/png' };
  }

  if (ext === '.webp') {
    const isRiff =
      buffer[0] === MAGIC_BYTES.RIFF[0] &&
      buffer[1] === MAGIC_BYTES.RIFF[1] &&
      buffer[2] === MAGIC_BYTES.RIFF[2] &&
      buffer[3] === MAGIC_BYTES.RIFF[3];
    const isWebp =
      buffer.length >= 12 &&
      buffer[8] === MAGIC_BYTES.WEBP[0] &&
      buffer[9] === MAGIC_BYTES.WEBP[1] &&
      buffer[10] === MAGIC_BYTES.WEBP[2] &&
      buffer[11] === MAGIC_BYTES.WEBP[3];
    if (!isRiff || !isWebp) {
      return { valid: false, error: 'Corrupt or invalid WebP image header.' };
    }
    return { valid: true, detectedMime: 'image/webp' };
  }

  if (ext === '.pdf') {
    if (
      buffer[0] !== MAGIC_BYTES.PDF[0] ||
      buffer[1] !== MAGIC_BYTES.PDF[1] ||
      buffer[2] !== MAGIC_BYTES.PDF[2] ||
      buffer[3] !== MAGIC_BYTES.PDF[3]
    ) {
      return { valid: false, error: 'Corrupt or invalid PDF document header.' };
    }
    return { valid: true, detectedMime: 'application/pdf' };
  }

  return { valid: false, error: 'Unable to verify file signature.' };
}

/**
 * Storage provider interface for durable object storage.
 */
export interface IStorageProvider {
  readonly providerType: StoredAttachment['storageProvider'];
  upload(
    buffer: Buffer,
    key: string,
    mimeType?: string,
    originalName?: string
  ): Promise<{ storageKey: string; provider: StoredAttachment['storageProvider'] }>;
  delete(key: string): Promise<void>;
  getReadStream(key: string): Promise<{ stream: NodeJS.ReadableStream; size?: number; mimeType?: string } | null>;
  getPresignedUrl?(key: string, expiresInSeconds?: number): Promise<string | null>;
}

/**
 * Local Storage Provider (Development / Fallback mode).
 * Stores files securely outside the public document root to prevent direct URL sniffing.
 */
export class LocalStorageProvider implements IStorageProvider {
  readonly providerType = 'local' as const;
  private baseDir: string;

  constructor() {
    this.baseDir = path.join(process.cwd(), 'uploads', 'secure_attachments');
    if (!fs.existsSync(this.baseDir)) {
      try {
        fs.mkdirSync(this.baseDir, { recursive: true });
      } catch (_) {}
    }
  }

  async upload(buffer: Buffer, key: string): Promise<{ storageKey: string; provider: 'local' }> {
    const filePath = path.join(this.baseDir, key);
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, buffer);
    return { storageKey: key, provider: 'local' };
  }

  async delete(key: string): Promise<void> {
    const filePath = path.join(this.baseDir, key);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (_) {}
    }
  }

  async getReadStream(key: string) {
    const filePath = path.join(this.baseDir, key);
    if (!fs.existsSync(filePath)) return null;
    const stat = fs.statSync(filePath);
    return { stream: fs.createReadStream(filePath), size: stat.size };
  }
}

/**
 * S3-Compatible Storage Provider (AWS S3, Cloudflare R2, Supabase, MinIO).
 * Uses standard AWS SigV4 signed requests for zero extra runtime dependencies.
 */
export class S3CompatibleStorageProvider implements IStorageProvider {
  get providerType(): 's3' | 'r2' {
    return this.endpoint.includes('r2.cloudflarestorage.com') ? 'r2' : 's3';
  }
  private bucket: string;
  private region: string;
  private accessKeyId: string;
  private secretAccessKey: string;
  private endpoint: string;

  constructor(config: {
    bucket: string;
    region?: string;
    accessKeyId: string;
    secretAccessKey: string;
    endpoint?: string;
  }) {
    this.bucket = config.bucket;
    this.region = config.region || 'us-east-1';
    this.accessKeyId = config.accessKeyId;
    this.secretAccessKey = config.secretAccessKey;
    this.endpoint = config.endpoint
      ? config.endpoint.replace(/\/+$/, '')
      : `https://${this.bucket}.s3.${this.region}.amazonaws.com`;
  }

  private getHost(): string {
    const url = new URL(this.endpoint);
    return url.host;
  }

  async upload(
    buffer: Buffer,
    key: string,
    mimeType: string
  ): Promise<{ storageKey: string; provider: 's3' | 'r2' }> {
    const host = this.getHost();
    const date = new Date();
    const amzDate = date.toISOString().replace(/[:-]|\.\d{3}/g, '');
    const dateStamp = amzDate.slice(0, 8);
    const pathKey = `/${key.replace(/^\/+/, '')}`;
    const payloadHash = crypto.createHash('sha256').update(buffer).digest('hex');

    // Canonical headers
    const canonicalHeaders =
      `content-type:${mimeType}\n` +
      `host:${host}\n` +
      `x-amz-content-sha256:${payloadHash}\n` +
      `x-amz-date:${amzDate}\n`;
    const signedHeaders = 'content-type;host;x-amz-content-sha256;x-amz-date';

    const canonicalRequest = [
      'PUT',
      pathKey,
      '',
      canonicalHeaders,
      signedHeaders,
      payloadHash,
    ].join('\n');

    const credentialScope = `${dateStamp}/${this.region}/s3/aws4_request`;
    const stringToSign = [
      'AWS4-HMAC-SHA256',
      amzDate,
      credentialScope,
      crypto.createHash('sha256').update(canonicalRequest).digest('hex'),
    ].join('\n');

    // Signature calculation
    const kDate = crypto.createHmac('sha256', `AWS4${this.secretAccessKey}`).update(dateStamp).digest();
    const kRegion = crypto.createHmac('sha256', kDate).update(this.region).digest();
    const kService = crypto.createHmac('sha256', kRegion).update('s3').digest();
    const kSigning = crypto.createHmac('sha256', kService).update('aws4_request').digest();
    const signature = crypto.createHmac('sha256', kSigning).update(stringToSign).digest('hex');

    const authorization =
      `AWS4-HMAC-SHA256 Credential=${this.accessKeyId}/${credentialScope}, ` +
      `SignedHeaders=${signedHeaders}, Signature=${signature}`;

    const putUrl = `${this.endpoint}${pathKey}`;
    const res = await fetch(putUrl, {
      method: 'PUT',
      headers: {
        'Host': host,
        'Content-Type': mimeType,
        'x-amz-date': amzDate,
        'x-amz-content-sha256': payloadHash,
        'Authorization': authorization,
      },
      body: new Uint8Array(buffer),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`S3 upload failed (${res.status}): ${errText.slice(0, 200)}`);
    }

    const isR2 = this.endpoint.includes('r2.cloudflarestorage.com');
    return { storageKey: key, provider: isR2 ? 'r2' : 's3' };
  }

  async delete(key: string): Promise<void> {
    const host = this.getHost();
    const date = new Date();
    const amzDate = date.toISOString().replace(/[:-]|\.\d{3}/g, '');
    const dateStamp = amzDate.slice(0, 8);
    const pathKey = `/${key.replace(/^\/+/, '')}`;
    const payloadHash = crypto.createHash('sha256').update('').digest('hex');

    const canonicalHeaders =
      `host:${host}\n` +
      `x-amz-content-sha256:${payloadHash}\n` +
      `x-amz-date:${amzDate}\n`;
    const signedHeaders = 'host;x-amz-content-sha256;x-amz-date';

    const canonicalRequest = [
      'DELETE',
      pathKey,
      '',
      canonicalHeaders,
      signedHeaders,
      payloadHash,
    ].join('\n');

    const credentialScope = `${dateStamp}/${this.region}/s3/aws4_request`;
    const stringToSign = [
      'AWS4-HMAC-SHA256',
      amzDate,
      credentialScope,
      crypto.createHash('sha256').update(canonicalRequest).digest('hex'),
    ].join('\n');

    const kDate = crypto.createHmac('sha256', `AWS4${this.secretAccessKey}`).update(dateStamp).digest();
    const kRegion = crypto.createHmac('sha256', kDate).update(this.region).digest();
    const kService = crypto.createHmac('sha256', kRegion).update('s3').digest();
    const kSigning = crypto.createHmac('sha256', kService).update('aws4_request').digest();
    const signature = crypto.createHmac('sha256', kSigning).update(stringToSign).digest('hex');

    const authorization =
      `AWS4-HMAC-SHA256 Credential=${this.accessKeyId}/${credentialScope}, ` +
      `SignedHeaders=${signedHeaders}, Signature=${signature}`;

    const delUrl = `${this.endpoint}${pathKey}`;
    await fetch(delUrl, {
      method: 'DELETE',
      headers: {
        'Host': host,
        'x-amz-date': amzDate,
        'x-amz-content-sha256': payloadHash,
        'Authorization': authorization,
      },
    }).catch(() => {});
  }

  async getPresignedUrl(key: string, expiresInSeconds: number = 7200): Promise<string> {
    const host = this.getHost();
    const date = new Date();
    const amzDate = date.toISOString().replace(/[:-]|\.\d{3}/g, '');
    const dateStamp = amzDate.slice(0, 8);
    const pathKey = `/${key.replace(/^\/+/, '')}`;
    const credentialScope = `${dateStamp}/${this.region}/s3/aws4_request`;

    const queryParams: Record<string, string> = {
      'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
      'X-Amz-Credential': `${this.accessKeyId}/${credentialScope}`,
      'X-Amz-Date': amzDate,
      'X-Amz-Expires': expiresInSeconds.toString(),
      'X-Amz-SignedHeaders': 'host',
    };

    const canonicalQueryString = Object.keys(queryParams)
      .sort()
      .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(queryParams[k])}`)
      .join('&');

    const canonicalHeaders = `host:${host}\n`;
    const canonicalRequest = [
      'GET',
      pathKey,
      canonicalQueryString,
      canonicalHeaders,
      'host',
      'UNSIGNED-PAYLOAD',
    ].join('\n');

    const stringToSign = [
      'AWS4-HMAC-SHA256',
      amzDate,
      credentialScope,
      crypto.createHash('sha256').update(canonicalRequest).digest('hex'),
    ].join('\n');

    const kDate = crypto.createHmac('sha256', `AWS4${this.secretAccessKey}`).update(dateStamp).digest();
    const kRegion = crypto.createHmac('sha256', kDate).update(this.region).digest();
    const kService = crypto.createHmac('sha256', kRegion).update('s3').digest();
    const kSigning = crypto.createHmac('sha256', kService).update('aws4_request').digest();
    const signature = crypto.createHmac('sha256', kSigning).update(stringToSign).digest('hex');

    return `${this.endpoint}${pathKey}?${canonicalQueryString}&X-Amz-Signature=${signature}`;
  }

  async getReadStream(key: string) {
    const presigned = await this.getPresignedUrl(key, 300);
    const res = await fetch(presigned);
    if (!res.ok || !res.body) return null;
    const arrayBuf = await res.arrayBuffer();
    const buf = Buffer.from(arrayBuf);
    const readable = require('stream').Readable.from(buf);
    return {
      stream: readable,
      size: buf.length,
      mimeType: res.headers.get('content-type') || undefined,
    };
  }
}

export class StorageConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StorageConfigurationError';
  }
}

/**
 * Guard provider for production environments where S3/R2 is not yet configured.
 * Strictly prevents silent, dangerous fallbacks to ephemeral serverless container disk.
 */
export class ProductionDisabledStorageProvider implements IStorageProvider {
  readonly providerType = 'local' as const;

  async upload(): Promise<never> {
    throw new StorageConfigurationError(
      'Secure cloud object storage (S3 or Cloudflare R2) is not configured in this production environment. Attachments cannot be stored on ephemeral serverless disks.'
    );
  }

  async delete(): Promise<void> {}

  async getReadStream(): Promise<null> {
    return null;
  }
}

/**
 * Returns the active storage provider based on environment configuration.
 * Strictly blocks ephemeral local disk storage in production.
 */
export function getStorageProvider(): IStorageProvider {
  const isProduction = process.env.NODE_ENV === 'production';

  // 1. S3 / Cloudflare R2 / Supabase Storage
  const s3Bucket = process.env.S3_BUCKET || process.env.R2_BUCKET;
  const s3Key = process.env.S3_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY_ID;
  const s3Secret = process.env.S3_SECRET_ACCESS_KEY || process.env.R2_SECRET_ACCESS_KEY;

  if (s3Bucket && s3Key && s3Secret) {
    return new S3CompatibleStorageProvider({
      bucket: s3Bucket,
      region: process.env.S3_REGION || 'auto',
      accessKeyId: s3Key,
      secretAccessKey: s3Secret,
      endpoint: process.env.S3_ENDPOINT || process.env.R2_ENDPOINT,
    });
  }

  // 2. Enforce fail-safe in production: never silently use ephemeral disk
  if (isProduction) {
    return new ProductionDisabledStorageProvider();
  }

  // 3. Default Local Storage Provider for development and standalone testing
  return new LocalStorageProvider();
}

/**
 * Generates a cryptographic, time-limited signed URL token for attachment access.
 */
export function signAttachmentAccessToken(attachmentId: string, expiresInSeconds: number = 7200): string {
  const secret = process.env.JWT_SECRET || 'secure-attachment-key-fallback';
  const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const data = `${attachmentId}:${expiresAt}`;
  const hmac = crypto.createHmac('sha256', secret).update(data).digest('hex');
  return `${expiresAt}.${hmac}`;
}

/**
 * Validates a signed attachment access token.
 */
export function verifyAttachmentAccessToken(attachmentId: string, token: string): boolean {
  try {
    const [expiresAtStr, signature] = token.split('.');
    const expiresAt = parseInt(expiresAtStr, 10);
    if (!expiresAt || isNaN(expiresAt)) return false;

    if (Math.floor(Date.now() / 1000) > expiresAt) {
      return false; // Token expired
    }

    const secret = process.env.JWT_SECRET || 'secure-attachment-key-fallback';
    const data = `${attachmentId}:${expiresAt}`;
    const expected = crypto.createHmac('sha256', secret).update(data).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

/**
 * Generates a safe, unguessable storage key for customer attachments.
 */
export function generateAttachmentStorageKey(inquiryRef: string, originalName: string): string {
  const date = new Date();
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const ext = path.extname(originalName).toLowerCase() || '.bin';
  const randomSlug = crypto.randomBytes(8).toString('hex');
  const cleanBase = path
    .basename(originalName, ext)
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '_')
    .slice(0, 30);

  return `inquiries/${year}/${month}/${inquiryRef}_${cleanBase}_${randomSlug}${ext}`;
}
