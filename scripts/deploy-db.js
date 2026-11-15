try {
  require('dotenv').config();
} catch (e) {
  // dotenv optional
}
const { execSync } = require('child_process');

/**
 * Explicit database schema synchronization script.
 * Separated from application build to prevent uncontrolled production mutations.
 * Usage: npm run db:deploy
 */
async function run() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('[deploy-db] ERROR: No DATABASE_URL specified. Aborting database deployment.');
    process.exit(1);
  }

  console.log(`[deploy-db] Synchronizing database schema for: ${dbUrl.replace(/:[^:@]*@/, ':***@')}`);

  // Require explicit flag for destructive operations
  const allowDataLoss = process.env.ALLOW_DATA_LOSS === 'true';
  const pushArgs = allowDataLoss ? '--accept-data-loss' : '';

  if (allowDataLoss) {
    console.warn('[deploy-db] WARNING: ALLOW_DATA_LOSS=true is set. Schema changes that cause data loss will be accepted.');
  }

  try {
    execSync(`npx prisma db push ${pushArgs}`.trim(), { stdio: 'inherit' });
    console.log('[deploy-db] ✓ Database schema synchronized successfully.');
  } catch (err) {
    console.error('[deploy-db] ✗ Failed to synchronize database schema:', err.message);
    process.exit(1);
  }

  // Seeding is decoupled and must be explicitly requested
  if (process.env.SEED_ON_DEPLOY === 'true') {
    console.log('[deploy-db] SEED_ON_DEPLOY=true detected. Seeding tenant catalog and settings...');
    try {
      execSync('node prisma/seed.js', { stdio: 'inherit' });
      console.log('[deploy-db] ✓ Seeding complete.');
    } catch (err) {
      console.error('[deploy-db] ✗ Seeding failed:', err.message);
      process.exit(1);
    }
  } else {
    console.log('[deploy-db] Note: Database seeding was not executed. Run "npm run db:seed" separately if initial data is needed.');
  }
}

run();
