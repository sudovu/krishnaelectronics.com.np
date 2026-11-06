const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

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
  console.log('\n=================================================================');
  console.log('  Krishna Electronics & Reusable Platform — Full QA Test Suite');
  console.log('=================================================================\n');

  // Test 1: Database Connectivity & Site Settings
  console.log('[1/7] Verifying Database Connection & Settings...');
  const settings = await prisma.setting.findUnique({ where: { id: 'site-settings' } });
  assert(settings !== null, 'Site settings record exists in database');
  assert(settings?.currencyCode === 'NPR', 'Default currency is NPR');
  assert(settings?.currencySymbol === 'रु', 'Default currency symbol is रु');
  assert(settings?.locationAddress.includes('Surkhet'), 'Store address correctly points to Surkhet, Nepal');
  assert(settings?.siteName.includes('Order & Suppliers'), 'Store name is Krishna Electronics Order & Suppliers');

  // Test 2: Category & Brand Seeding
  console.log('\n[2/7] Verifying Catalog Taxonomy & Brands...');
  const categoriesCount = await prisma.category.count();
  const brandsCount = await prisma.brand.count();
  assert(categoriesCount >= 6, `Categories seeded correctly (${categoriesCount} categories)`);
  assert(brandsCount >= 10, `Brands seeded correctly (${brandsCount} brands)`);

  const tpLink = await prisma.brand.findUnique({ where: { slug: 'tp-link' } });
  assert(tpLink !== null, 'Official brand TP-Link is present');

  // Test 3: Technical Services Division
  console.log('\n[3/7] Verifying Technical Services Showcase...');
  const servicesCount = await prisma.service.count();
  assert(servicesCount >= 7, `All 7 technical services seeded (${servicesCount} found)`);

  const repairService = await prisma.service.findUnique({ where: { slug: 'computer-laptop-repair' } });
  assert(repairService !== null, 'Computer & laptop repair service is present');
  assert(repairService?.startingPrice === 500, 'Diagnostic starting price properly configured in NPR');

  // Test 4: Product Integrity & Specifications
  console.log('\n[4/7] Verifying Products & Specifications...');
  const productsCount = await prisma.product.count({ where: { status: 'PUBLISHED' } });
  assert(productsCount > 0, `Published products available for public storefront (${productsCount} active listings)`);

  const wifiRouter = await prisma.product.findUnique({ where: { slug: 'tp-link-archer-ax73-wifi6-router' } });
  assert(wifiRouter !== null, 'Wi-Fi 6 router product found');
  assert(wifiRouter?.regularPrice === 17500, 'Regular price is NPR 17,500');
  assert(wifiRouter?.offerPrice === 15800, 'Offer price is NPR 15,800');
  const specs = JSON.parse(wifiRouter?.specifications || '[]');
  assert(specs.length > 0, `Structured specifications table present (${specs.length} items)`);

  // Test 5: Authentication & Security Controls
  console.log('\n[5/7] Verifying Admin Authentication & Security...');
  const admin = await prisma.user.findFirst({
    where: {
      OR: [
        { email: 'adminbikram@krishnaelectronics.com.np' },
        { email: 'adminbikram' },
        { email: 'admin@krishnaelectronics.com.np' },
      ],
    },
  });
  assert(admin !== null, 'Super-admin account exists');
  assert(admin?.role === 'SUPER_ADMIN', 'Owner account has SUPER_ADMIN role');

  const passwordValid = await bcrypt.compare('Bikram@221$#@!', admin?.passwordHash || '');
  assert(passwordValid, 'Admin password hash verified using bcrypt');

  // JWT Token Signing & Verification
  const token = jwt.sign({ id: admin?.id, role: admin?.role }, JWT_SECRET, { expiresIn: '7d' });
  const decoded = jwt.verify(token, JWT_SECRET);
  assert(decoded.id === admin?.id, 'JWT token signing and verification functioning');

  // Test 6: Audit Logging
  console.log('\n[6/7] Verifying Content Publishing & Audit Trails...');
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

  // Test 7: Layer Separation & Commercialization Verification
  console.log('\n[7/7] Verifying Layer Separation (Business vs Reusable Platform)...');
  const manifestFile = path.join(__dirname, '..', 'src', 'business', 'krishna-electronics', 'data.json');
  assert(fs.existsSync(manifestFile), 'Krishna Electronics business manifest exists in isolated directory');

  const manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
  assert(manifest.tenantId === 'krishna-electronics', 'Manifest carries unique tenantId');
  assert(manifest.identity.name === 'Krishna Electronics Order & Suppliers', 'Business identity isolated in manifest');
  assert(manifest.identity.currency.code === 'NPR', 'Manifest defines currency NPR');
  assert(manifest.services.length >= 7, 'All service definitions isolated in business manifest');
  assert(manifest.categories.length >= 6, 'Category definitions isolated in business manifest');

  // Check tenant contract file existence
  const contractFile = path.join(__dirname, '..', 'src', 'platform', 'config', 'tenant-contract.ts');
  assert(fs.existsSync(contractFile), 'Platform tenant contract interface exists');

  // Check white-label example
  const whiteLabelFile = path.join(__dirname, '..', 'src', 'business', 'templates', 'white-label-template.ts');
  assert(fs.existsSync(whiteLabelFile), 'White-label reusability template exists for future commercialization');

  console.log('\n=================================================================');
  console.log(`  Tests Passed: ${passed}`);
  console.log(`  Tests Failed: ${failed}`);
  console.log('=================================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('✅ ALL TEST SUITES PASSED! Architectural separation confirmed.\n');
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
