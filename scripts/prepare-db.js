const fs = require('fs');
const path = require('path');

try {
  const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
  if (!fs.existsSync(schemaPath)) {
    process.exit(0);
  }
  let schema = fs.readFileSync(schemaPath, 'utf8');

  // Support Vercel Postgres / Neon environment variables
  const dbUrl = process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL || '';

  if (dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://')) {
    if (schema.includes('provider = "sqlite"')) {
      schema = schema.replace(/provider\s*=\s*"sqlite"/g, 'provider = "postgresql"');
      fs.writeFileSync(schemaPath, schema, 'utf8');
      console.log('✓ Configured Prisma datasource provider to: postgresql (Neon / Cloud Postgres detected)');
    }
  } else {
    if (schema.includes('provider = "postgresql"')) {
      schema = schema.replace(/provider\s*=\s*"postgresql"/g, 'provider = "sqlite"');
      fs.writeFileSync(schemaPath, schema, 'utf8');
      console.log('✓ Configured Prisma datasource provider to: sqlite (Local database detected)');
    }
  }
} catch (err) {
  console.warn('Warning in prepare-db script:', err.message);
}
