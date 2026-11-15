const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Prepares the environment for Prisma Client generation, database synchronization,
 * and build execution across local development (SQLite) and Vercel cloud (PostgreSQL or SQLite).
 */
try {
  const root = path.resolve(__dirname, '..');
  const schemaPath = path.join(root, 'prisma', 'schema.prisma');
  const envPath = path.join(root, '.env');

  // Support Vercel Postgres / Neon / Supabase environment variables
  const dbUrl = 
    process.env.POSTGRES_PRISMA_URL || 
    process.env.DATABASE_URL || 
    process.env.POSTGRES_URL || 
    '';

  const isPostgres = dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://');

  if (isPostgres) {
    // 1. PostgreSQL (Neon / Supabase / Vercel Postgres)
    process.env.DATABASE_URL = dbUrl;

    if (fs.existsSync(schemaPath)) {
      let schema = fs.readFileSync(schemaPath, 'utf8');
      if (schema.includes('provider = "sqlite"')) {
        schema = schema.replace(/provider\s*=\s*"sqlite"/g, 'provider = "postgresql"');
        fs.writeFileSync(schemaPath, schema, 'utf8');
        console.log('✓ Configured Prisma datasource provider to: postgresql (Cloud Postgres detected)');
      }
    }

    // Synchronize schema and seed non-destructively
    try {
      console.log('Synchronizing remote database schema with Prisma...');
      execSync('npx prisma db push --skip-generate', { stdio: 'inherit', env: process.env });
      console.log('✓ Remote database schema synchronized successfully.');

      console.log('Running database seeder to ensure catalog and settings are synchronized...');
      execSync('node prisma/seed.js', { stdio: 'inherit', env: process.env });
      console.log('✓ Seeding complete.');
    } catch (syncErr) {
      console.warn('Notice: Remote database synchronization notice:', syncErr.message);
    }
  } else {
    // 2. Local SQLite or Fallback for builds without external DB configured
    const fallbackDbUrl = process.env.DATABASE_URL || 'file:./dev.db';
    process.env.DATABASE_URL = fallbackDbUrl;

    if (fs.existsSync(schemaPath)) {
      let schema = fs.readFileSync(schemaPath, 'utf8');
      if (schema.includes('provider = "postgresql"')) {
        schema = schema.replace(/provider\s*=\s*"postgresql"/g, 'provider = "sqlite"');
        fs.writeFileSync(schemaPath, schema, 'utf8');
        console.log('✓ Configured Prisma datasource provider to: sqlite (Local SQLite detected)');
      }
    }

    // Ensure dev.db exists and has tables
    try {
      execSync('npx prisma db push --skip-generate', { stdio: 'inherit', env: process.env });
      execSync('node prisma/seed.js', { stdio: 'inherit', env: process.env });
    } catch (localErr) {
      console.warn('Notice: SQLite initialization notice:', localErr.message);
    }

    // For initial local development setup, ensure .env exists with local defaults
    if (process.env.NODE_ENV !== 'production') {
      let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
      let updated = false;

      if (!envContent.includes('DATABASE_URL=')) {
        envContent += `\nDATABASE_URL="file:./dev.db"\n`;
        updated = true;
      }

      if (!envContent.includes('JWT_SECRET=') && !process.env.JWT_SECRET) {
        const devSecret = require('crypto').randomBytes(32).toString('hex');
        envContent += `\nJWT_SECRET="${devSecret}"\n`;
        updated = true;
      }

      if (updated) {
        fs.writeFileSync(envPath, envContent, 'utf8');
        console.log('✓ Initialized local development .env configuration.');
      }
    }
  }
} catch (err) {
  console.warn('Warning in prepare-db script:', err.message);
}
