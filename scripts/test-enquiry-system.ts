import assert from 'assert';
import crypto from 'crypto';
import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { 
  validateAttachmentBuffer, 
  signAttachmentAccessToken, 
  verifyAttachmentAccessToken,
  generateAttachmentStorageKey,
  LocalStorageProvider,
  ProductionDisabledStorageProvider,
  StorageConfigurationError
} from '../src/lib/storage';

import { 
  generateInquiryReference, 
  getEmailSubject, 
  buildStaffNotificationEmailHtml,
  processPendingNotificationOutbox,
  EnhancedInquiryPayload
} from '../src/lib/notifications/inquiry-notification';

import { 
  normalizePhoneNumber, 
  MetaWhatsAppClient,
  WHATSAPP_COEXISTENCE_SPECIFICATION
} from '../src/lib/whatsapp';

// Import actual Next.js route handlers for real integration testing
import { POST as handlePostInquiry } from '../src/app/api/inquiries/route';
import { GET as handleGetAttachment } from '../src/app/api/inquiries/attachments/[id]/route';
import { POST as handleCronPost, GET as handleCronGet } from '../src/app/api/cron/process-notifications/route';

const prisma = new PrismaClient();

let passedTests = 0;
let totalTests = 0;

function test(name: string, fn: () => void) {
  totalTests++;
  try {
    fn();
    console.log(`  ✓ PASS: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ FAIL: ${name}`);
    console.error(err);
  }
}

async function asyncTest(name: string, fn: () => Promise<void>) {
  totalTests++;
  try {
    await fn();
    console.log(`  ✓ PASS: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ FAIL: ${name}`);
    console.error(err);
  }
}

async function runEnquiryTests() {
  console.log('\n=================================================================');
  console.log('  Krishna Electronics — Full Phase 2B Integration Test Suite');
  console.log('=================================================================\n');

  console.log('[1/7] Reference Generator & Business Formatting...');
  test('Generates reference conforming to KE-YYMMDD-XXXX format', () => {
    const ref = generateInquiryReference();
    const regex = /^KE-\d{6}-[A-Z0-9]{4}$/;
    assert.match(ref, regex, `Reference "${ref}" does not match format KE-YYMMDD-XXXX`);
  });

  test('Builds appropriate email subjects for product and repair', () => {
    const dummyPayload = {
      inquiryId: 'test-1',
      reference: 'KE-261118-TEST',
      customerName: 'Shyam Sharma',
      customerPhone: '9858083951',
      category: 'REPAIR',
      type: 'SERVICE_REQUEST',
      subject: 'Laptop Screen Flickering',
      message: 'Display flickers when moved.',
    };
    const subject = getEmailSubject(dummyPayload as any);
    assert.ok(subject.includes('[REPAIR BOOKING]'), 'Subject must contain [REPAIR BOOKING]');
    assert.ok(subject.includes('KE-261118-TEST'), 'Subject must contain reference');
    assert.ok(subject.includes('Shyam Sharma'), 'Subject must contain customer name');
  });

  test('Builds rich staff email HTML containing customer and action links', () => {
    const dummyPayload = {
      inquiryId: 'test-1',
      reference: 'KE-261118-TEST',
      customerName: 'Shyam Sharma',
      customerPhone: '9858083951',
      customerEmail: 'shyam@example.com',
      customerAddress: 'Birendranagar',
      category: 'REPAIR',
      type: 'SERVICE_REQUEST',
      subject: 'Laptop Screen Flickering',
      message: 'Display flickers when moved.',
      deviceCategory: 'Laptop Computer',
      deviceBrand: 'Dell',
      deviceModel: 'Inspiron 15',
    };
    const html = buildStaffNotificationEmailHtml(dummyPayload as any);
    assert.ok(html.includes('KE-261118-TEST'), 'HTML must include reference');
    assert.ok(html.includes('Shyam Sharma'), 'HTML must include customer name');
    assert.ok(html.includes('9858083951'), 'HTML must include phone number');
    assert.ok(html.includes('Laptop Computer'), 'HTML must include device category');
    assert.ok(html.includes('wa.me/9779858083951'), 'HTML must include WhatsApp direct reply link');
  });

  test('Escapes malicious HTML in customer input to prevent email XSS injection', () => {
    const maliciousPayload = {
      inquiryId: 'test-xss',
      reference: 'KE-261118-XSS1',
      customerName: '<script>alert("pwned")</script> Ram',
      customerPhone: '9858083951',
      customerEmail: 'ram@example.com',
      customerAddress: '<b>Birendranagar</b>',
      category: 'GENERAL',
      type: 'GENERAL_INQUIRY',
      subject: 'Inquiry with <img src=x onerror=steal()>',
      message: 'Hello <script>fetch("evil.com")</script> & "quotes"',
    };
    const html = buildStaffNotificationEmailHtml(maliciousPayload as any);
    assert.ok(!html.includes('<script>'), 'Must not contain raw unescaped <script>');
    assert.ok(html.includes('&lt;script&gt;'), 'Must contain escaped &lt;script&gt;');
    assert.ok(html.includes('&amp;'), 'Must escape ampersand');
    assert.ok(!html.includes('<b>Birendranagar</b>'), 'Must escape HTML tags in address');
    assert.ok(html.includes('&lt;b&gt;Birendranagar&lt;/b&gt;'), 'Must contain escaped address');
  });

  test('Prevents CRLF header injection in email subjects', () => {
    const crlfPayload = {
      inquiryId: 'test-crlf',
      reference: 'KE-261118-CRLF\r\nBcc: evil@attacker.com',
      customerName: 'Hacker\r\nSubject: Injected Subject\r\n',
      customerPhone: '9858083951\r\nContent-Type: text/html',
      category: 'GENERAL',
      type: 'GENERAL_INQUIRY',
    };
    const subject = getEmailSubject(crlfPayload as any);
    assert.ok(!subject.includes('\r'), 'Email subject must not contain carriage return');
    assert.ok(!subject.includes('\n'), 'Email subject must not contain newline');
    assert.ok(subject.includes('Hacker Subject: Injected Subject'), 'Newlines replaced with spaces safely');
  });

  console.log('\n[2/7] Secure Attachment Validation & Magic Bytes...');
  test('Accepts valid JPEG buffer with correct magic bytes', () => {
    const validJpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46]);
    const res = validateAttachmentBuffer(validJpeg, 'photo.jpg');
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.detectedMime, 'image/jpeg');
  });

  test('Accepts valid PNG buffer with correct magic bytes', () => {
    const validPng = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const res = validateAttachmentBuffer(validPng, 'screenshot.png');
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.detectedMime, 'image/png');
  });

  test('Accepts valid PDF document with %PDF magic bytes', () => {
    const validPdf = Buffer.from('%PDF-1.4 sample content');
    const res = validateAttachmentBuffer(validPdf, 'invoice.pdf');
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.detectedMime, 'application/pdf');
  });

  test('Rejects disguised file with invalid magic bytes', () => {
    const fakeJpeg = Buffer.from('this is plain text pretending to be jpeg');
    const res = validateAttachmentBuffer(fakeJpeg, 'fake.jpg');
    assert.strictEqual(res.valid, false);
    assert.ok(res.error?.includes('Corrupt or invalid JPEG image header'));
  });

  test('Rejects executable and script extensions', () => {
    const validPng = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const res1 = validateAttachmentBuffer(validPng, 'exploit.exe');
    assert.strictEqual(res1.valid, false);
    const res2 = validateAttachmentBuffer(validPng, 'script.php.png');
    assert.strictEqual(res2.valid, false);
  });

  test('Rejects files exceeding 10 MB limit', () => {
    const largeBuf = Buffer.alloc(11 * 1024 * 1024);
    const res = validateAttachmentBuffer(largeBuf, 'huge.jpg');
    assert.strictEqual(res.valid, false);
    assert.ok(res.error?.includes('10 MB limit'));
  });

  console.log('\n[3/7] Storage Security & Production Serverless Safeguards...');
  test('Generates and verifies time-limited HMAC attachment tokens', () => {
    const attId = 'att_test123456';
    const token = signAttachmentAccessToken(attId, 3600);
    assert.strictEqual(verifyAttachmentAccessToken(attId, token), true);
    assert.strictEqual(verifyAttachmentAccessToken('att_wrongid', token), false);
    assert.strictEqual(verifyAttachmentAccessToken(attId, 'tampered.token'), false);
    
    // Expired token verification
    const expiredToken = signAttachmentAccessToken(attId, -10); // 10 seconds in the past
    assert.strictEqual(verifyAttachmentAccessToken(attId, expiredToken), false);
  });

  test('ProductionDisabledStorageProvider strictly blocks upload and throws clear error', async () => {
    const prodGuard = new ProductionDisabledStorageProvider();
    try {
      await prodGuard.upload();
      assert.fail('Must throw StorageConfigurationError');
    } catch (err: any) {
      assert.ok(err instanceof StorageConfigurationError || err.name === 'StorageConfigurationError');
      assert.ok(err.message.includes('Secure cloud object storage'));
    }
  });

  await asyncTest('LocalStorageProvider uploads, streams, and deletes securely in development', async () => {
    const storage = new LocalStorageProvider();
    const testBuffer = Buffer.from('Krishna Electronics Attachment Test Payload');
    const testKey = generateAttachmentStorageKey('KE-TEST-REF', 'diagnostic.png');

    const uploaded = await storage.upload(testBuffer, testKey);
    assert.strictEqual(uploaded.provider, 'local');

    const read = await storage.getReadStream(testKey);
    assert.ok(read && read.stream, 'Stream must be readable');
    assert.strictEqual(read.size, testBuffer.length);
    read.stream.on('error', () => {});
    if ((read.stream as any).destroy) (read.stream as any).destroy();

    await storage.delete(testKey);
    const afterDelete = await storage.getReadStream(testKey);
    assert.strictEqual(afterDelete, null, 'File must not exist after deletion');
  });

  console.log('\n[4/7] WhatsApp Cloud API Client & Coexistence Ready...');
  test('Normalizes Nepali phone numbers accurately', () => {
    assert.strictEqual(normalizePhoneNumber('9858083951'), '9779858083951');
    assert.strictEqual(normalizePhoneNumber('+977-9858083951'), '9779858083951');
    assert.strictEqual(normalizePhoneNumber('9741234567'), '9779741234567');
    assert.strictEqual(normalizePhoneNumber('083-522006'), '97783522006');
  });

  test('Gracefully handles unconfigured WhatsApp Cloud API without crashing', async () => {
    const client = new MetaWhatsAppClient();
    const res = await client.sendCustomerAcknowledgement({
      customerPhone: '9858083951',
      customerName: 'Test Customer',
      reference: 'KE-TEST-0001',
      subject: 'Test Inquiry',
    });
    assert.strictEqual(res.status, 'NOT_CONFIGURED');
  });

  test('Validates Webhook challenge and signature mechanisms', () => {
    const client = new MetaWhatsAppClient();
    const challengeRes = client.verifyWebhookChallenge('subscribe', 'wrong-token', 'test_challenge_code');
    assert.strictEqual(challengeRes, null);

    const valid = client.verifyWebhookSignature('{"object":"whatsapp_business_account"}', 'invalid_sig');
    assert.strictEqual(valid, false);
  });

  test('Verifies WhatsApp Business Mobile Application Coexistence contract', () => {
    assert.strictEqual(WHATSAPP_COEXISTENCE_SPECIFICATION.businessNumber, '9858083951');
    assert.strictEqual(WHATSAPP_COEXISTENCE_SPECIFICATION.mobileApplicationPreserved, true);
    assert.strictEqual(WHATSAPP_COEXISTENCE_SPECIFICATION.coexistenceReady, true);
  });

  console.log('\n[5/7] Real HTTP API Route End-to-End Integration (POST /api/inquiries)...');
  let createdInquiryRef: string = '';
  let createdInquiryId: string = '';

  await asyncTest('POST /api/inquiries handles JSON product inquiry end-to-end', async () => {
    const req = new NextRequest('http://localhost:3000/api/inquiries', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '127.0.0.1',
      },
      body: JSON.stringify({
        customerName: 'Aayush Shrestha',
        customerPhone: '9858012345',
        customerEmail: 'aayush@example.com',
        customerAddress: 'Birendranagar-4, Surkhet',
        category: 'PRODUCT',
        type: 'PRODUCT_INQUIRY',
        subject: 'Inquiry for Wi-Fi 6 Router',
        message: 'Is the Archer AX73 available for delivery today?',
        preferredContact: 'PHONE',
        productDetails: JSON.stringify({
          title: 'TP-Link Archer AX73',
          sku: 'TPL-AX73-GIG',
          price: 15800,
        }),
      }),
    });

    const res = await handlePostInquiry(req);
    assert.strictEqual(res.status, 201);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(data.reference.startsWith('KE-'));
    assert.ok(data.id);
    assert.strictEqual(data.whatsappUrl, undefined, 'Must not return external redirect whatsappUrl');

    createdInquiryRef = data.reference;
    createdInquiryId = data.id;

    // Verify DB record
    const record = await prisma.inquiry.findUnique({ where: { id: data.id } });
    assert.ok(record);
    assert.strictEqual(record?.customerName, 'Aayush Shrestha');
    assert.strictEqual(record?.category, 'PRODUCT');
    assert.ok(
      ['PENDING', 'FAILED', 'SENT'].includes(record?.emailStatus || ''),
      'emailStatus must be valid state'
    );
    if (record?.emailStatus === 'FAILED') {
      assert.ok(record.emailError?.includes('SMTP credentials'));
    }
  });

  await asyncTest('POST /api/inquiries silently rejects bot submissions via honeypot', async () => {
    const req = new NextRequest('http://localhost:3000/api/inquiries', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '127.0.0.2',
      },
      body: JSON.stringify({
        customerName: 'Spam Bot',
        customerPhone: '9800000000',
        message: 'Buy cheap seo services now',
        website_hp: 'http://spam-link.com', // Honeypot filled!
      }),
    });

    const res = await handlePostInquiry(req);
    const data = await res.json();
    assert.strictEqual(data.reference, 'KE-SPAM-PREV');
    
    // Ensure no record was created
    const record = await prisma.inquiry.findFirst({ where: { customerName: 'Spam Bot' } });
    assert.strictEqual(record, null);
  });

  console.log('\n[6/7] Secure Attachment Endpoint Authorization (GET /api/inquiries/attachments/[id])...');
  await asyncTest('Rejects unauthorized, tampered, or expired access to attachments', async () => {
    // 1. No token, no admin session
    const reqNoToken = new NextRequest('http://localhost:3000/api/inquiries/attachments/att_test123');
    const resNoToken = await handleGetAttachment(reqNoToken, { params: { id: 'att_test123' } });
    assert.strictEqual(resNoToken.status, 401);

    // 2. Tampered token
    const reqTampered = new NextRequest('http://localhost:3000/api/inquiries/attachments/att_test123?token=invalid.token');
    const resTampered = await handleGetAttachment(reqTampered, { params: { id: 'att_test123' } });
    assert.strictEqual(resTampered.status, 401);

    // 3. Expired token
    const expiredToken = signAttachmentAccessToken('att_test123', -60);
    const reqExpired = new NextRequest(`http://localhost:3000/api/inquiries/attachments/att_test123?token=${expiredToken}`);
    const resExpired = await handleGetAttachment(reqExpired, { params: { id: 'att_test123' } });
    assert.strictEqual(resExpired.status, 401);

    // 4. Valid token and attachment streaming with Content-Security-Policy & X-Content-Type-Options
    const testStorage = new LocalStorageProvider();
    const testFileKey = `test_csp_${Date.now()}.png`;
    const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    await testStorage.upload(pngBuffer, testFileKey);

    const testAttId = `att_csp_${Date.now()}`;
    const testInqWithAtt = await prisma.inquiry.create({
      data: {
        reference: `KE-CSP-${Date.now().toString().slice(-4)}`,
        customerName: 'CSP Test User',
        customerPhone: '9858000000',
        subject: 'CSP Header Test',
        message: 'Testing security headers',
        status: 'NEW',
        attachments: JSON.stringify([{
          id: testAttId,
          originalName: 'test.png',
          mimeType: 'image/png',
          size: pngBuffer.length,
          storageKey: testFileKey,
          storageProvider: 'local',
          createdAt: new Date().toISOString(),
        }]),
      },
    });

    const validToken = signAttachmentAccessToken(testAttId, 300);
    const reqValid = new NextRequest(`http://localhost:3000/api/inquiries/attachments/${testAttId}?token=${validToken}`);
    const resValid = await handleGetAttachment(reqValid, { params: { id: testAttId } });
    assert.strictEqual(resValid.status, 200);
    assert.ok(resValid.headers.get('content-security-policy')?.includes('sandbox'), 'Attachment response must have sandbox CSP');
    assert.strictEqual(resValid.headers.get('x-content-type-options'), 'nosniff');

    // Clean up
    await testStorage.delete(testFileKey);
    await prisma.inquiry.delete({ where: { id: testInqWithAtt.id } });
  });

  console.log('\n[7/7] Outbox Retry Worker Lifecycle & Cleanup...');
  await asyncTest('Outbox retry engine executes bounded retry with state transitions', async () => {
    const testOutboxKey = `test-retry-key-${Date.now()}`;
    const outboxRecord = await prisma.notificationOutbox.create({
      data: {
        inquiryId: createdInquiryId,
        channel: 'EMAIL',
        recipient: 'krishanelectronics2077@gmail.com',
        payload: JSON.stringify({
          inquiryId: createdInquiryId,
          reference: createdInquiryRef,
          customerName: 'Aayush Shrestha',
          customerPhone: '9858012345',
          category: 'PRODUCT',
          type: 'PRODUCT_INQUIRY',
          subject: 'Test Retry Inquiry',
          message: 'Testing outbox worker',
        }),
        status: 'PENDING',
        attempts: 0,
        maxAttempts: 3,
        idempotencyKey: testOutboxKey,
      },
    });

    assert.ok(outboxRecord.id);

    // Run the outbox worker
    const workerResult = await processPendingNotificationOutbox(5);
    assert.ok(workerResult.processed >= 1);

    // Verify record state after attempt (since SMTP not set in test, attempt increments and records failure/pending)
    const updated = await prisma.notificationOutbox.findUnique({ where: { id: outboxRecord.id } });
    assert.ok(updated);
    assert.ok(updated?.attempts >= 1, 'Attempts must increment on processor run');

    // Clean up test records
    await prisma.notificationOutbox.deleteMany({ where: { inquiryId: createdInquiryId } });
    await prisma.inquiry.delete({ where: { id: createdInquiryId } });
  });

  await asyncTest('Outbox worker crash recovery safely reclaims abandoned stale jobs', async () => {
    // Simulate an abandoned job: status is PROCESSING and updatedAt is 6 minutes in the past
    const staleDate = new Date(Date.now() - 6 * 60 * 1000);
    const staleKey = `stale-job-${Date.now()}`;

    // Create a temporary inquiry for the outbox FK
    const tempInq = await prisma.inquiry.create({
      data: {
        reference: `KE-STALE-${Date.now().toString().slice(-4)}`,
        customerName: 'Stale Job Recovery Test',
        customerPhone: '9858000000',
        subject: 'Crash Recovery Test',
        message: 'Testing crash recovery lease',
        status: 'NEW',
      },
    });

    const crashedRecord = await prisma.notificationOutbox.create({
      data: {
        inquiryId: tempInq.id,
        channel: 'EMAIL',
        recipient: 'krishanelectronics2077@gmail.com',
        payload: JSON.stringify({
          inquiryId: tempInq.id,
          reference: tempInq.reference,
          customerName: tempInq.customerName,
          customerPhone: tempInq.customerPhone,
          category: 'GENERAL',
          type: 'GENERAL_INQUIRY',
          subject: 'Stale Recovery',
          message: 'Recovery test',
        }),
        status: 'PROCESSING',
        attempts: 1, // Was attempted once before crash
        maxAttempts: 3,
        idempotencyKey: staleKey,
        updatedAt: staleDate,
      },
    });

    // Run outbox worker - should detect stale PROCESSING lease (> 5 mins) and reclaim it
    const res = await processPendingNotificationOutbox(5);
    assert.ok(res.processed >= 1, 'Worker must process the reclaimed stale job');

    const verified = await prisma.notificationOutbox.findUnique({ where: { id: crashedRecord.id } });
    assert.ok(verified, 'Record must exist');
    assert.strictEqual(verified?.attempts, 2, 'Attempts must increment from 1 to 2 upon reclamation');

    // Clean up
    await prisma.notificationOutbox.deleteMany({ where: { inquiryId: tempInq.id } });
    await prisma.inquiry.delete({ where: { id: tempInq.id } });
  });

  await asyncTest('Vercel Cron endpoint handles GET & POST and enforces CRON_SECRET in production', async () => {
    const prevSecret = process.env.CRON_SECRET;
    const prevEnv = process.env.NODE_ENV;
    try {
      process.env.CRON_SECRET = 'test-cron-secret-12345';
      (process.env as any).NODE_ENV = 'production';

      // 1. Unauthorized POST without secret
      const reqUnauthPost = new NextRequest('http://localhost:3000/api/cron/process-notifications', {
        method: 'POST',
      });
      const resUnauthPost = await handleCronPost(reqUnauthPost);
      assert.strictEqual(resUnauthPost.status, 401, 'POST without secret in production must return 401');

      // 2. Unauthorized GET without secret
      const reqUnauthGet = new NextRequest('http://localhost:3000/api/cron/process-notifications', {
        method: 'GET',
      });
      const resUnauthGet = await handleCronGet(reqUnauthGet);
      assert.strictEqual(resUnauthGet.status, 401, 'GET without secret in production must return 401');

      // 3. Authorized GET with Bearer secret
      const reqAuthGet = new NextRequest('http://localhost:3000/api/cron/process-notifications', {
        method: 'GET',
        headers: { authorization: 'Bearer test-cron-secret-12345' },
      });
      const resAuthGet = await handleCronGet(reqAuthGet);
      assert.strictEqual(resAuthGet.status, 200, 'GET with valid Bearer secret must return 200');
      const dataAuthGet = await resAuthGet.json();
      assert.strictEqual(dataAuthGet.success, true);
    } finally {
      process.env.CRON_SECRET = prevSecret;
      (process.env as any).NODE_ENV = prevEnv;
    }
  });

  await prisma.$disconnect();

  console.log('\n=================================================================');
  console.log(`  Tests Passed: ${passedTests} / ${totalTests}`);
  console.log('=================================================================\n');

  if (passedTests === totalTests) {
    console.log(`✅ ALL ${totalTests} INTEGRATION TESTS PASSED!\n`);
    process.exit(0);
  } else {
    console.error('❌ SOME TESTS FAILED!\n');
    process.exit(1);
  }
}

runEnquiryTests().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
