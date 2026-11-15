#!/usr/bin/env bash
# ==============================================================================
# Krishna Electronics & Order Suppliers — Production Database & Media Backup
# ==============================================================================
# Automated, WAL-consistent SQLite backup with integrity verification.
# Designed for Docker Compose on Ubuntu Server (Crontab: 0 2 * * * /opt/krishna-electronics/deploy/backup-db.sh)
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

BACKUP_DIR="${BACKUP_DIR:-$PROJECT_ROOT/backups}"
TIMESTAMP="$(date +"%Y%m%d_%H%M%S")"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
CONTAINER_NAME="${CONTAINER_NAME:-krishna_electronics_web}"

mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"

echo "================================================================="
echo " Krishna Electronics — Automated Backup Service"
echo " Timestamp: $TIMESTAMP"
echo " Backup Directory: $BACKUP_DIR"
echo "================================================================="

TEMP_DIR="$(mktemp -d /tmp/krishna_backup_XXXXXX)"
cleanup() {
    rm -rf "$TEMP_DIR"
}
trap cleanup EXIT INT TERM

RAW_BACKUP="$TEMP_DIR/db_${TIMESTAMP}.sqlite"
GZ_BACKUP="$BACKUP_DIR/db_${TIMESTAMP}.sqlite.gz"
UPLOADS_BACKUP="$BACKUP_DIR/uploads_${TIMESTAMP}.tar.gz"

# ------------------------------------------------------------------------------
# 1. Locate and perform WAL-safe SQLite backup
# ------------------------------------------------------------------------------
BACKUP_SUCCESS=0

# Strategy A: If production container is running, execute online backup inside container
if command -v docker >/dev/null 2>&1 && docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "[1/3] Executing online SQLite backup via container '${CONTAINER_NAME}'..."
    # Ensure temporary backup in container
    docker exec "$CONTAINER_NAME" sh -c "sqlite3 /app/prisma/prod.db \".backup '/tmp/backup_${TIMESTAMP}.sqlite'\""
    docker cp "${CONTAINER_NAME}:/tmp/backup_${TIMESTAMP}.sqlite" "$RAW_BACKUP"
    docker exec "$CONTAINER_NAME" rm -f "/tmp/backup_${TIMESTAMP}.sqlite"
    BACKUP_SUCCESS=1
fi

# Strategy B: If container not running or Strategy A skipped, check Docker volume directly
if [ "$BACKUP_SUCCESS" -eq 0 ] && command -v docker >/dev/null 2>&1; then
    VOLUME_DIR=$(docker volume inspect --format '{{.Mountpoint}}' krishna-electronics_krishna_db_data 2>/dev/null || \
                docker volume inspect --format '{{.Mountpoint}}' krishna_db_data 2>/dev/null || true)
    
    if [ -n "$VOLUME_DIR" ] && [ -f "$VOLUME_DIR/prod.db" ] && command -v sqlite3 >/dev/null 2>&1; then
        echo "[1/3] Backing up SQLite database directly from Docker volume..."
        sqlite3 "$VOLUME_DIR/prod.db" ".backup '$RAW_BACKUP'"
        BACKUP_SUCCESS=1
    fi
fi

# Strategy C: Host path fallback (for standalone deployments or dev/staging)
if [ "$BACKUP_SUCCESS" -eq 0 ]; then
    CANDIDATE_DB="${DATABASE_FILE:-$PROJECT_ROOT/prisma/prod.db}"
    if [ ! -f "$CANDIDATE_DB" ]; then
        CANDIDATE_DB="$PROJECT_ROOT/prisma/dev.db"
    fi

    if [ -f "$CANDIDATE_DB" ] && command -v sqlite3 >/dev/null 2>&1; then
        echo "[1/3] Backing up SQLite database from host path: $CANDIDATE_DB"
        sqlite3 "$CANDIDATE_DB" ".backup '$RAW_BACKUP'"
        BACKUP_SUCCESS=1
    fi
fi

if [ "$BACKUP_SUCCESS" -eq 0 ] || [ ! -f "$RAW_BACKUP" ]; then
    echo "ERROR: Failed to locate or backup production database." >&2
    exit 1
fi

# ------------------------------------------------------------------------------
# 2. Verify backup integrity
# ------------------------------------------------------------------------------
echo "[2/3] Verifying database snapshot integrity..."
if command -v sqlite3 >/dev/null 2>&1; then
    INTEGRITY_CHECK=$(sqlite3 "$RAW_BACKUP" "PRAGMA integrity_check;")
    if [ "$INTEGRITY_CHECK" != "ok" ]; then
        echo "ERROR: Database integrity check failed: $INTEGRITY_CHECK" >&2
        exit 1
    fi
    echo "✓ Database integrity verified: OK"
else
    # Fallback to docker container for integrity check if host lacks sqlite3
    if command -v docker >/dev/null 2>&1 && docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        docker cp "$RAW_BACKUP" "${CONTAINER_NAME}:/tmp/verify.sqlite"
        CHECK=$(docker exec "$CONTAINER_NAME" sqlite3 /tmp/verify.sqlite "PRAGMA integrity_check;")
        docker exec "$CONTAINER_NAME" rm -f /tmp/verify.sqlite
        if [ "$CHECK" != "ok" ]; then
            echo "ERROR: Database integrity check via container failed: $CHECK" >&2
            exit 1
        fi
        echo "✓ Database integrity verified via container: OK"
    else
        echo "WARNING: Neither host sqlite3 nor running container available to verify integrity."
    fi
fi

# Compress and lock permissions
gzip -9 -c "$RAW_BACKUP" > "$GZ_BACKUP"
chmod 600 "$GZ_BACKUP"
BACKUP_SIZE=$(ls -lh "$GZ_BACKUP" | awk '{print $5}')
echo "✓ Database backup compressed & secured: $GZ_BACKUP ($BACKUP_SIZE)"

# ------------------------------------------------------------------------------
# 3. Media & Uploads Backup
# ------------------------------------------------------------------------------
echo "[3/3] Backing up product media and uploads..."
UPLOADS_SOURCE=""

if [ -d "$PROJECT_ROOT/public/uploads" ]; then
    UPLOADS_SOURCE="$PROJECT_ROOT/public/uploads"
elif command -v docker >/dev/null 2>&1; then
    UPLOADS_VOL=$(docker volume inspect --format '{{.Mountpoint}}' krishna-electronics_krishna_uploads_data 2>/dev/null || \
                  docker volume inspect --format '{{.Mountpoint}}' krishna_uploads_data 2>/dev/null || true)
    if [ -n "$UPLOADS_VOL" ] && [ -d "$UPLOADS_VOL" ]; then
        UPLOADS_SOURCE="$UPLOADS_VOL"
    fi
fi

if [ -n "$UPLOADS_SOURCE" ] && [ -d "$UPLOADS_SOURCE" ]; then
    tar -czf "$UPLOADS_BACKUP" -C "$(dirname "$UPLOADS_SOURCE")" "$(basename "$UPLOADS_SOURCE")"
    chmod 600 "$UPLOADS_BACKUP"
    UPLOADS_SIZE=$(ls -lh "$UPLOADS_BACKUP" | awk '{print $5}')
    echo "✓ Media backup saved: $UPLOADS_BACKUP ($UPLOADS_SIZE)"
else
    echo "Notice: No uploads directory found to backup. Skipping media archive."
fi

# ------------------------------------------------------------------------------
# 4. Retention Policy: Retain backups for specified days
# ------------------------------------------------------------------------------
echo "Applying retention policy (pruning backups older than $RETENTION_DAYS days)..."
find "$BACKUP_DIR" -type f \( -name "db_*.sqlite.gz" -o -name "uploads_*.tar.gz" \) -mtime "+$RETENTION_DAYS" -exec rm -f {} + 2>/dev/null || true

echo "================================================================="
echo " Backup operation completed successfully at $(date)!"
echo " Database: $GZ_BACKUP"
echo "================================================================="
exit 0
