#!/bin/bash
# Krishna Electronics & Order Suppliers — Database & Media Restore Script
# Usage: ./restore-db.sh /path/to/db_TIMESTAMP.sqlite.gz [/path/to/uploads_TIMESTAMP.tar.gz]

set -e

if [ -z "$1" ]; then
    echo "Error: Please specify the database backup file to restore."
    echo "Usage: ./restore-db.sh /opt/krishna-electronics/backups/db_YYYYMMDD_HHMMSS.sqlite.gz"
    exit 1
fi

DB_BACKUP="$1"
UPLOADS_BACKUP="$2"
TARGET_DB="/opt/krishna-electronics/prisma/dev.db"

echo "============================================"
echo " Restoring Krishna Electronics Database"
echo "============================================"

# Stop app container if running
echo "Stopping web container..."
docker-compose stop app || true

# Restore database
echo "Restoring database from $DB_BACKUP..."
gunzip -c "$DB_BACKUP" > "$TARGET_DB"
chmod 664 "$TARGET_DB"
echo "✓ Database restored to $TARGET_DB"

# Restore uploads if provided
if [ -n "$UPLOADS_BACKUP" ] && [ -f "$UPLOADS_BACKUP" ]; then
    echo "Restoring uploads from $UPLOADS_BACKUP..."
    tar -xzf "$UPLOADS_BACKUP" -C "/opt/krishna-electronics/public"
    echo "✓ Uploads restored to /opt/krishna-electronics/public/uploads"
fi

# Restart app container
echo "Restarting application container..."
docker-compose start app

echo "Restore operation finished successfully!"
