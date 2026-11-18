const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  console.log('=== DATABASE INTEGRITY AUDIT ===');
  const products = await prisma.product.findMany({ orderBy: { createdAt: 'asc' } });
  console.log('DB Products count:', products.length);
  products.forEach((p, idx) => {
    console.log(` [${idx + 1}] SKU: ${p.sku} | Title: "${p.title}" | Price: NPR ${p.regularPrice} (Offer: ${p.offerPrice || 'None'}) | Status: ${p.status}`);
  });

  const users = await prisma.user.findMany({ select: { id: true, email: true, role: true } });
  console.log('\nDB Users count:', users.length);
  users.forEach(u => console.log(` - ${u.email} (${u.role})`));

  const categories = await prisma.category.count();
  console.log('\nDB Categories count:', categories);

  const brands = await prisma.brand.count();
  console.log('DB Brands count:', brands);

  const services = await prisma.service.count();
  console.log('DB Services count:', services);

  const setting = await prisma.setting.findFirst();
  console.log('\nDB Setting:');
  console.log(` - Site Name: ${setting?.siteName}`);
  console.log(` - Address: ${setting?.locationAddress}`);
  console.log(` - Currency: ${setting?.currencySymbol} (${setting?.currencyCode})`);

  const inquiries = await prisma.inquiry.findMany();
  console.log('\nDB Inquiries count:', inquiries.length);

  await prisma.$disconnect();
}

check().catch(e => {
  console.error('Integrity check failed:', e);
  process.exit(1);
});
