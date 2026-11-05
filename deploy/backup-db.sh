#!/bin/bash
# Krishna Electronics & Order Suppliers — Automated Backup Script
# Run daily via cron: 0 2 * * * /opt/krishna-electronics/deploy/backup-db.sh

set -e

BACKUP_DIR="/opt/krishna-electronics/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DATABASE_FILE="/opt/krishna-electronics/prisma/dev.db"
UPLOADS_DIR="/opt/krishna-electronics/public/uploads"

mkdir -p "$BACKUP_DIR"

echo "============================================"
echo " Starting Backup: $TIMESTAMP"
echo "============================================"

# 1. Backup SQLite Database safely using sqlite3 backup command or direct copy
if [ -f "$DATABASE_FILE" ]; then
    echo "Backing up database..."
    sqlite3 "$DATABASE_FILE" ".backup '$BACKUP_DIR/db_$TIMESTAMP.sqlite'"
    gzip "$BACKUP_DIR/db_$TIMESTAMP.sqlite"
    echo "✓ Database backup saved: $BACKUP_DIR/db_$TIMESTAMP.sqlite.gz"
fi

# 2. Backup Uploaded Images
if [ -d "$UPLOADS_DIR" ]; then
    echo "Backing up product and promotional media..."
    tar -czf "$BACKUP_DIR/uploads_$TIMESTAMP.tar.gz" -C "/opt/krishna-electronics/public" uploads
    echo "✓ Uploads backup saved: $BACKUP_DIR/uploads_$TIMESTAMP.tar.gz"
fi

# 3. Retention policy: Remove backups older than 30 days
echo "Cleaning up backups older than 30 days..."
find "$BACKUP_DIR" -type f -name "*.gz" -mtime +30 -exec rm {} \;

echo "Backup completed successfully at $(date)!"
