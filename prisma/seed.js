const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  const tenantId = process.env.TENANT_ID || 'krishna-electronics';
  console.log(`[Platform Seeder] Initializing business dataset for tenant: "${tenantId}"...`);

  // Load business manifest
  const manifestPath = path.join(__dirname, '..', 'src', 'business', tenantId, 'data.json');
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Business manifest not found at ${manifestPath}`);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  console.log(`[Platform Seeder] Loaded manifest: ${manifest.identity.name} (v${manifest.manifestVersion})`);

  // 1. Initial Admin User (Supports 'adminbikram' & 'adminbikram@krishnaelectronics.com.np')
  const adminEmail = process.env.INITIAL_ADMIN_EMAIL || 'adminbikram@krishnaelectronics.com.np';
  const rawPassword = process.env.INITIAL_ADMIN_PASSWORD || 'Bikram@221$#@!';
  const passwordHash = await bcrypt.hash(rawPassword, 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: `Bikram - ${manifest.identity.name} Administrator`,
      role: 'SUPER_ADMIN',
      passwordHash: passwordHash,
      isActive: true,
    },
    create: {
      email: adminEmail,
      name: `Bikram - ${manifest.identity.name} Administrator`,
      passwordHash: passwordHash,
      role: 'SUPER_ADMIN',
      isActive: true,
    },
  });
  console.log(`✓ Admin user upserted: ${admin.email}`);

  // Also support bare username 'adminbikram'
  await prisma.user.upsert({
    where: { email: 'adminbikram' },
    update: {
      name: `Bikram (Super Admin)`,
      role: 'SUPER_ADMIN',
      passwordHash: passwordHash,
      isActive: true,
    },
    create: {
      email: 'adminbikram',
      name: `Bikram (Super Admin)`,
      passwordHash: passwordHash,
      role: 'SUPER_ADMIN',
      isActive: true,
    },
  });

  // Also update previous admin if existing
  try {
    await prisma.user.updateMany({
      where: { email: 'admin@krishnaelectronics.com.np' },
      data: { passwordHash: passwordHash },
    });
  } catch (_) {}

  // 2. Business Settings from Manifest (Preserves user changes if already configured)
  const fullAddress = 'Birendranagar, Surkhet';
  const existingSetting = await prisma.setting.findUnique({
    where: { id: 'site-settings' },
  });

  if (!existingSetting) {
    await prisma.setting.create({
      data: {
        id: 'site-settings',
        siteName: manifest.identity.name,
        logoUrl: manifest.identity.logoUrl || '/images/logo.jpg',
        siteTagline: manifest.identity.tagline,
        siteDescription: manifest.identity.description,
        contactPhone: manifest.identity.contact.phoneDefault,
        contactEmail: manifest.identity.contact.emailDefault,
        contactWhatsapp: manifest.identity.contact.whatsappDefault,
        locationAddress: fullAddress,
        businessHours: manifest.identity.contact.hoursDefault,
        googleMapsEmbedUrl: '',
        socialFacebook: '',
        socialInstagram: '',
        socialLinkedin: '',
        socialYoutube: '',
        deliveryInfo: manifest.deliveryNote,
        paymentMethods: manifest.paymentMethodsNote,
        currencyCode: manifest.identity.currency.code,
        currencySymbol: manifest.identity.currency.symbol,
        taxRatePercent: 13.0,
        maintenanceMode: false,
        metaTitle: `${manifest.identity.name} | ${manifest.identity.location.city}, ${manifest.identity.location.country}`,
        metaDescription: manifest.identity.description,
      },
    });
    console.log('✓ Initial site settings initialized from business manifest');
  } else {
    try {
      await prisma.setting.update({
        where: { id: 'site-settings' },
        data: { locationAddress: 'Birendranagar, Surkhet' },
      });
      console.log('✓ Existing site settings updated: locationAddress set to Birendranagar, Surkhet');
    } catch (_) {}
  }

  // 3. Categories & Subcategories
  const categoryMap = new Map();
  for (const cat of manifest.categories) {
    let createdCat = await prisma.category.findUnique({ where: { slug: cat.slug } });
    if (!createdCat) {
      createdCat = await prisma.category.create({
        data: {
          name: cat.name,
          slug: cat.slug,
          description: cat.description,
          icon: cat.icon,
          orderIndex: cat.orderIndex,
          isActive: true,
        },
      });
    }
    categoryMap.set(cat.slug, createdCat.id);

    for (const subName of cat.subcategories) {
      const subSlug = subName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const existingSub = await prisma.subcategory.findUnique({ where: { slug: subSlug } });
      if (!existingSub) {
        await prisma.subcategory.create({
          data: {
            name: subName,
            slug: subSlug,
            categoryId: createdCat.id,
          },
        });
      }
    }
  }
  console.log('✓ Categories and subcategories verified/seeded');

  // 4. Brands
  const brandMap = new Map();
  for (const b of manifest.brands) {
    let createdBrand = await prisma.brand.findUnique({ where: { slug: b.slug } });
    if (!createdBrand) {
      createdBrand = await prisma.brand.create({
        data: { name: b.name, slug: b.slug, isPopular: b.isPopular },
      });
    }
    brandMap.set(b.slug, createdBrand.id);
  }
  console.log('✓ Brands verified/seeded');

  // 5. Technical Services
  for (const s of manifest.services) {
    const existingService = await prisma.service.findUnique({ where: { slug: s.slug } });
    if (!existingService) {
      await prisma.service.create({
        data: {
          title: s.title,
          slug: s.slug,
          icon: s.icon,
          shortDescription: s.shortDescription,
          fullDescription: s.fullDescription,
          features: JSON.stringify(s.features),
          pricingNote: s.pricingNote,
          startingPrice: s.startingPrice,
          isFeatured: s.isFeatured,
          orderIndex: s.orderIndex,
          isActive: true,
        },
      });
    }
  }
  console.log('✓ Services verified/seeded');

  // 6. Products
  for (const p of manifest.products) {
    const categoryId = categoryMap.get(p.categorySlug);
    const brandId = p.brandSlug ? brandMap.get(p.brandSlug) : null;

    if (!categoryId) {
      console.warn(`Category slug not found: ${p.categorySlug}`);
      continue;
    }

    const existingProduct = await prisma.product.findUnique({ where: { slug: p.slug } });
    if (!existingProduct) {
      await prisma.product.create({
        data: {
          title: p.title,
          slug: p.slug,
          sku: p.sku,
          categoryId: categoryId,
          brandId: brandId,
          regularPrice: p.regularPrice,
          offerPrice: p.offerPrice,
          discountPercent: p.discountPercent,
          stockQuantity: p.stockQuantity,
          stockStatus: p.stockStatus,
          shortDescription: p.shortDescription,
          fullDescription: p.fullDescription,
          specifications: JSON.stringify(p.specifications),
          warranty: p.warranty,
          isFeatured: p.isFeatured,
          isPopular: p.isPopular,
          isNewArrival: p.isNewArrival,
          primaryImage: p.primaryImage,
          status: p.status,
          publishedAt: p.status === 'PUBLISHED' ? new Date() : null,
        },
      });
    }
  }
  console.log('✓ Products verified/seeded');
  console.log('✓ Products seeded');

  // 7. Banners
  for (const b of manifest.banners) {
    const existing = await prisma.banner.findFirst({
      where: { title: b.title },
    });
    if (!existing) {
      await prisma.banner.create({
        data: {
          title: b.title,
          subtitle: b.subtitle,
          badgeText: b.badgeText,
          ctaText: b.ctaText,
          ctaLink: b.ctaLink,
          position: b.position,
          imageUrl: b.imageUrl,
          discountPercent: b.discountPercent,
          isApproved: b.isApproved,
          status: b.status,
          orderIndex: b.orderIndex,
        },
      });
    }
  }
  console.log('✓ Promotional banners seeded');

  // 8. FAQs
  for (const f of manifest.faqs) {
    const existing = await prisma.fAQ.findFirst({
      where: { question: f.question },
    });
    if (!existing) {
      await prisma.fAQ.create({
        data: f,
      });
    }
  }
  console.log('✓ FAQs seeded');

  console.log(`✅ [Platform Seeder] Seeding finished successfully for ${manifest.identity.name}!`);
}

main()
  .catch((e) => {
    console.error('Error seeding data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
