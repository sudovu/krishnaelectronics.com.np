const { execSync } = require('child_process');

async function run() {
  try {
    const dbUrl = process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL;
    if (!dbUrl) {
      console.log('[deploy-db] No DATABASE_URL specified. Skipping remote DB push.');
      return;
    }

    console.log('[deploy-db] Synchronizing database schema with Prisma...');
    execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
    console.log('[deploy-db] Database schema synchronized.');

    console.log('[deploy-db] Seeding initial tenant catalog and settings...');
    execSync('node prisma/seed.js', { stdio: 'inherit' });
    console.log('[deploy-db] Seeding complete.');
  } catch (err) {
    console.warn('[deploy-db] Notice: Could not sync/seed database during this build step:', err.message);
    // Don't crash build so Next.js static build can complete
  }
}

run();
