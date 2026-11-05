const fs = require('fs');
const path = require('path');

try {
  const root = path.resolve(__dirname, '..');
  const schemaPath = path.join(root, 'prisma', 'schema.prisma');
  const envPath = path.join(root, '.env');
  const envProdPath = path.join(root, '.env.production');

  // Support Vercel Postgres / Neon environment variables
  const dbUrl = 
    process.env.POSTGRES_PRISMA_URL || 
    process.env.DATABASE_URL || 
    process.env.POSTGRES_URL || 
    '';

  const isPostgres = dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://');

  if (isPostgres) {
    // 1. Neon / Cloud Postgres Detected
    process.env.DATABASE_URL = dbUrl;

    // Ensure .env and .env.production contain DATABASE_URL for Prisma & Next.js
    let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
    if (!envContent.includes('DATABASE_URL=')) {
      envContent += `\nDATABASE_URL="${dbUrl}"\nPOSTGRES_PRISMA_URL="${dbUrl}"\n`;
    } else {
      envContent = envContent.replace(/DATABASE_URL=.*(\r?\n|$)/g, `DATABASE_URL="${dbUrl}"\n`);
    }
    fs.writeFileSync(envPath, envContent, 'utf8');
    fs.writeFileSync(envProdPath, envContent, 'utf8');

    // Update schema.prisma provider to postgresql
    if (fs.existsSync(schemaPath)) {
      let schema = fs.readFileSync(schemaPath, 'utf8');
      schema = schema.replace(/provider\s*=\s*"sqlite"/g, 'provider = "postgresql"');
      fs.writeFileSync(schemaPath, schema, 'utf8');
      console.log('✓ Configured Prisma datasource provider to: postgresql (Neon / Cloud Postgres detected)');
    }
  } else {
    // 2. Local SQLite or Fallback for builds without DB configured yet
    const fallbackDbUrl = process.env.DATABASE_URL || 'file:./dev.db';
    process.env.DATABASE_URL = fallbackDbUrl;

    let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
    if (!envContent.includes('DATABASE_URL=')) {
      envContent += `\nDATABASE_URL="${fallbackDbUrl}"\nJWT_SECRET="${process.env.JWT_SECRET || 'krishna-electronics-default-fallback-secret-2026'}"\n`;
      fs.writeFileSync(envPath, envContent, 'utf8');
    }

    if (fs.existsSync(schemaPath)) {
      let schema = fs.readFileSync(schemaPath, 'utf8');
      schema = schema.replace(/provider\s*=\s*"postgresql"/g, 'provider = "sqlite"');
      fs.writeFileSync(schemaPath, schema, 'utf8');
      console.log('✓ Configured Prisma datasource provider to: sqlite (Local / Fallback database)');
    }
  }
} catch (err) {
  console.warn('Warning in prepare-db script:', err.message);
}
