const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function importDatabase() {
  console.log('====================================================');
  console.log('  Krishna Electronics — Full Database Import Tool   ');
  console.log('====================================================');

  const filePathArg = process.argv[2];
  const defaultPath = path.join(__dirname, '..', 'backup', 'latest.json');
  const backupPath = filePathArg ? path.resolve(filePathArg) : defaultPath;

  if (!fs.existsSync(backupPath)) {
    console.error(`❌ Backup file not found at: ${backupPath}`);
    console.log('Usage: node scripts/import-data.js [path/to/backup.json]');
    process.exit(1);
  }

  try {
    const raw = fs.readFileSync(backupPath, 'utf8');
    const backup = JSON.parse(raw);
    const { data } = backup;

    console.log(`\nImporting from: ${backupPath}`);
    console.log(`Export timestamp: ${backup.exportTimestamp}`);

    // 1. Settings
    if (data.settings && data.settings.length > 0) {
      for (const s of data.settings) {
        await prisma.setting.upsert({
          where: { id: s.id },
          update: { ...s, updatedAt: new Date() },
          create: s,
        });
      }
      console.log(`✓ Settings restored (${data.settings.length})`);
    }

    // 2. Users
    if (data.users && data.users.length > 0) {
      for (const u of data.users) {
        await prisma.user.upsert({
          where: { email: u.email },
          update: {
            name: u.name,
            role: u.role,
            isActive: u.isActive,
            avatarUrl: u.avatarUrl,
            updatedAt: new Date(),
          },
          create: u,
        });
      }
      console.log(`✓ Users restored (${data.users.length})`);
    }

    // 3. Categories
    if (data.categories && data.categories.length > 0) {
      for (const c of data.categories) {
        await prisma.category.upsert({
          where: { id: c.id },
          update: {
            name: c.name,
            slug: c.slug,
            description: c.description,
            icon: c.icon,
            orderIndex: c.orderIndex,
            isActive: c.isActive,
          },
          create: c,
        });
      }
      console.log(`✓ Categories restored (${data.categories.length})`);
    }

    // 4. Subcategories
    if (data.subcategories && data.subcategories.length > 0) {
      for (const sub of data.subcategories) {
        await prisma.subcategory.upsert({
          where: { id: sub.id },
          update: {
            name: sub.name,
            slug: sub.slug,
            categoryId: sub.categoryId,
            orderIndex: sub.orderIndex,
            isActive: sub.isActive,
          },
          create: sub,
        });
      }
      console.log(`✓ Subcategories restored (${data.subcategories.length})`);
    }

    // 5. Brands
    if (data.brands && data.brands.length > 0) {
      for (const b of data.brands) {
        await prisma.brand.upsert({
          where: { id: b.id },
          update: {
            name: b.name,
            slug: b.slug,
            logoUrl: b.logoUrl,
            isPopular: b.isPopular,
            websiteUrl: b.websiteUrl,
          },
          create: b,
        });
      }
      console.log(`✓ Brands restored (${data.brands.length})`);
    }

    // 6. Services
    if (data.services && data.services.length > 0) {
      for (const s of data.services) {
        await prisma.service.upsert({
          where: { id: s.id },
          update: {
            title: s.title,
            slug: s.slug,
            icon: s.icon,
            shortDescription: s.shortDescription,
            fullDescription: s.fullDescription,
            features: s.features,
            pricingNote: s.pricingNote,
            startingPrice: s.startingPrice,
            turnaroundTime: s.turnaroundTime,
            warrantyPeriod: s.warrantyPeriod,
            badge: s.badge,
            isFeatured: s.isFeatured,
            isActive: s.isActive,
            orderIndex: s.orderIndex,
          },
          create: s,
        });
      }
      console.log(`✓ Technical services restored (${data.services.length})`);
    }

    // 7. Products
    if (data.products && data.products.length > 0) {
      for (const p of data.products) {
        await prisma.product.upsert({
          where: { id: p.id },
          update: {
            title: p.title,
            slug: p.slug,
            sku: p.sku,
            categoryId: p.categoryId,
            subcategoryId: p.subcategoryId,
            brandId: p.brandId,
            regularPrice: p.regularPrice,
            offerPrice: p.offerPrice,
            discountPercent: p.discountPercent,
            stockQuantity: p.stockQuantity,
            stockStatus: p.stockStatus,
            shortDescription: p.shortDescription,
            fullDescription: p.fullDescription,
            specifications: p.specifications,
            warranty: p.warranty,
            isFeatured: p.isFeatured,
            isPopular: p.isPopular,
            isNewArrival: p.isNewArrival,
            isDeal: p.isDeal,
            primaryImage: p.primaryImage,
            gallery: p.gallery,
            status: p.status,
            updatedAt: new Date(),
          },
          create: p,
        });
      }
      console.log(`✓ Products restored (${data.products.length})`);
    }

    // 8. Banners
    if (data.banners && data.banners.length > 0) {
      for (const b of data.banners) {
        await prisma.banner.upsert({
          where: { id: b.id },
          update: {
            title: b.title,
            subtitle: b.subtitle,
            badgeText: b.badgeText,
            ctaText: b.ctaText,
            ctaLink: b.ctaLink,
            position: b.position,
            imageUrl: b.imageUrl,
            discountPercent: b.discountPercent,
            couponCode: b.couponCode,
            startDate: b.startDate ? new Date(b.startDate) : null,
            endDate: b.endDate ? new Date(b.endDate) : null,
            isApproved: b.isApproved,
            status: b.status,
            orderIndex: b.orderIndex,
            updatedAt: new Date(),
          },
          create: b,
        });
      }
      console.log(`✓ Promotional banners restored (${data.banners.length})`);
    }

    // 9. FAQs
    if (data.faqs && data.faqs.length > 0) {
      for (const f of data.faqs) {
        await prisma.fAQ.upsert({
          where: { id: f.id },
          update: {
            question: f.question,
            answer: f.answer,
            category: f.category,
            orderIndex: f.orderIndex,
            isActive: f.isActive,
          },
          create: f,
        });
      }
      console.log(`✓ FAQs restored (${data.faqs.length})`);
    }

    console.log('\n✅ Database import completed successfully!');
  } catch (err) {
    console.error('❌ Import failed:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

importDatabase();
