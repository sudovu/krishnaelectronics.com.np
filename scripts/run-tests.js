const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'krishna-electronics-default-fallback-secret-2026';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log('\n======================================================');
  console.log('  Krishna Electronics Platform — QA & Verification Suite');
  console.log('======================================================\n');

  // Test 1: Database Connectivity & Site Settings
  console.log('[1/6] Verifying Database Connection & Settings...');
  const settings = await prisma.setting.findUnique({ where: { id: 'site-settings' } });
  assert(settings !== null, 'Site settings record exists in database');
  assert(settings?.currencyCode === 'NPR', 'Default currency is NPR');
  assert(settings?.currencySymbol === 'रु', 'Default currency symbol is रु');
  assert(settings?.locationAddress.includes('Surkhet'), 'Store address correctly points to Surkhet, Nepal');

  // Test 2: Category & Brand Seeding
  console.log('\n[2/6] Verifying Catalog Taxonomy & Brands...');
  const categoriesCount = await prisma.category.count();
  const brandsCount = await prisma.brand.count();
  assert(categoriesCount >= 6, `Categories seeded correctly (${categoriesCount} categories)`);
  assert(brandsCount >= 10, `Brands seeded correctly (${brandsCount} brands)`);

  const tpLink = await prisma.brand.findUnique({ where: { slug: 'tp-link' } });
  assert(tpLink !== null, 'Official brand TP-Link is present');

  // Test 3: Technical Services Division
  console.log('\n[3/6] Verifying Technical Services Showcase...');
  const servicesCount = await prisma.service.count();
  assert(servicesCount >= 7, `All 7 technical services seeded (${servicesCount} found)`);

  const repairService = await prisma.service.findUnique({ where: { slug: 'computer-laptop-repair' } });
  assert(repairService !== null, 'Computer & laptop repair service is present');
  assert(repairService?.startingPrice === 500, 'Diagnostic starting price properly configured in NPR');

  // Test 4: Product Integrity & Specifications
  console.log('\n[4/6] Verifying Products & Specifications...');
  const productsCount = await prisma.product.count({ where: { status: 'PUBLISHED' } });
  assert(productsCount > 0, `Published products available for public storefront (${productsCount} active listings)`);

  const wifiRouter = await prisma.product.findUnique({ where: { slug: 'tp-link-archer-ax73-wifi6-router' } });
  assert(wifiRouter !== null, 'Wi-Fi 6 router product found');
  assert(wifiRouter?.regularPrice === 17500, 'Regular price is NPR 17,500');
  assert(wifiRouter?.offerPrice === 15800, 'Offer price is NPR 15,800');
  const specs = JSON.parse(wifiRouter?.specifications || '[]');
  assert(specs.length > 0, `Structured specifications table present (${specs.length} items)`);

  // Test 5: Authentication & Security Controls
  console.log('\n[5/6] Verifying Admin Authentication & Security...');
  const admin = await prisma.user.findUnique({ where: { email: 'admin@krishnaelectronics.com.np' } });
  assert(admin !== null, 'Super-admin account exists');
  assert(admin?.role === 'SUPER_ADMIN', 'Owner account has SUPER_ADMIN role');

  const passwordValid = await bcrypt.compare('AdminSecurePassword123!', admin?.passwordHash || '');
  assert(passwordValid, 'Admin password hash verified using bcrypt');

  // JWT Token Signing & Verification
  const token = jwt.sign({ id: admin?.id, role: admin?.role }, JWT_SECRET, { expiresIn: '7d' });
  const decoded = jwt.verify(token, JWT_SECRET);
  assert(decoded.id === admin?.id, 'JWT token signing and verification functioning');

  // Test 6: Audit Logging
  console.log('\n[6/6] Verifying Content Publishing & Audit Trails...');
  const testAudit = await prisma.auditLog.create({
    data: {
      userId: admin?.id,
      userName: admin?.name,
      action: 'SYSTEM_VERIFICATION_TEST',
      entity: 'System',
      details: 'Automated test suite ran successfully',
      ipAddress: '127.0.0.1',
    },
  });
  assert(testAudit?.id !== null, 'Audit log created and verified in database');

  console.log('\n======================================================');
  console.log(`  Tests Passed: ${passed}`);
  console.log(`  Tests Failed: ${failed}`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('✅ ALL TEST SUITES PASSED SUCCESSFULLY!\n');
    process.exit(0);
  }
}

runTests()
  .catch((e) => {
    console.error('Test execution error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
