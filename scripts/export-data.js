const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function exportDatabase() {
  console.log('====================================================');
  console.log('  Krishna Electronics — Full Database Export Tool   ');
  console.log('====================================================');

  try {
    const [
      settings,
      users,
      categories,
      subcategories,
      brands,
      products,
      services,
      banners,
      faqs,
      inquiries,
      auditLogs,
    ] = await Promise.all([
      prisma.setting.findMany(),
      prisma.user.findMany(),
      prisma.category.findMany(),
      prisma.subcategory.findMany(),
      prisma.brand.findMany(),
      prisma.product.findMany(),
      prisma.service.findMany(),
      prisma.banner.findMany(),
      prisma.fAQ.findMany(),
      prisma.inquiry.findMany(),
      prisma.auditLog.findMany({ take: 500, orderBy: { createdAt: 'desc' } }),
    ]);

    const backupData = {
      exportTimestamp: new Date().toISOString(),
      platformVersion: '1.0.0',
      tenantId: process.env.TENANT_ID || 'krishna-electronics',
      stats: {
        settings: settings.length,
        users: users.length,
        categories: categories.length,
        subcategories: subcategories.length,
        brands: brands.length,
        products: products.length,
        services: services.length,
        banners: banners.length,
        faqs: faqs.length,
        inquiries: inquiries.length,
        auditLogs: auditLogs.length,
      },
      data: {
        settings,
        users,
        categories,
        subcategories,
        brands,
        products,
        services,
        banners,
        faqs,
        inquiries,
        auditLogs,
      },
    };

    const backupDir = path.join(__dirname, '..', 'backup');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `data-backup-${timestamp}.json`;
    const targetPath = path.join(backupDir, filename);
    const latestPath = path.join(backupDir, 'latest.json');

    fs.writeFileSync(targetPath, JSON.stringify(backupData, null, 2), 'utf8');
    fs.writeFileSync(latestPath, JSON.stringify(backupData, null, 2), 'utf8');

    console.log(`\n✓ Backup saved successfully:`);
    console.log(`  - Versioned: ${targetPath}`);
    console.log(`  - Latest:    ${latestPath}`);
    console.log(`\nStatistics:`);
    console.table(backupData.stats);
    console.log('\n✅ Database exported successfully and ready for migration!');
  } catch (err) {
    console.error('❌ Export failed:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

exportDatabase();
