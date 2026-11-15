const fs = require('fs');
const path = require('path');

/**
 * Prepares the environment for Prisma Client generation and local development.
 * Note: Database schema mutations and dynamic provider rewrites have been decoupled.
 * The declared datasource provider in prisma/schema.prisma remains stable (sqlite).
 */
try {
  const root = path.resolve(__dirname, '..');
  const envPath = path.join(root, '.env');

  // Ensure DATABASE_URL is defined in process.env so prisma generate can execute
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = 'file:./dev.db';
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
} catch (err) {
  console.warn('Warning in prepare-db script:', err.message);
}
