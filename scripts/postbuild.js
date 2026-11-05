const fs = require('fs');
const path = require('path');

function copyFolderSync(from, to) {
  if (!fs.existsSync(from)) return;
  if (!fs.existsSync(to)) {
    fs.mkdirSync(to, { recursive: true });
  }
  fs.readdirSync(from).forEach((element) => {
    const fromPath = path.join(from, element);
    const toPath = path.join(to, element);
    if (fs.lstatSync(fromPath).isDirectory()) {
      copyFolderSync(fromPath, toPath);
    } else {
      fs.copyFileSync(fromPath, toPath);
    }
  });
}

try {
  const root = path.resolve(__dirname, '..');
  const standaloneDir = path.join(root, '.next', 'standalone');

  if (fs.existsSync(standaloneDir)) {
    // Copy public
    copyFolderSync(path.join(root, 'public'), path.join(standaloneDir, 'public'));
    // Copy .next/static
    copyFolderSync(path.join(root, '.next', 'static'), path.join(standaloneDir, '.next', 'static'));
    // Copy prisma files
    copyFolderSync(path.join(root, 'prisma'), path.join(standaloneDir, 'prisma'));
    // Ensure dev.db exists in standalone root if present
    const devDbSource = path.join(root, 'prisma', 'dev.db');
    if (fs.existsSync(devDbSource)) {
      fs.copyFileSync(devDbSource, path.join(standaloneDir, 'dev.db'));
    }
    console.log('✓ Postbuild: Synced static assets, prisma schema, and database to standalone build.');
  }
} catch (err) {
  console.warn('Warning during postbuild sync:', err.message);
}
