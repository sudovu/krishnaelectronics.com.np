#!/usr/bin/env bash
# ==============================================================================
# Krishna Electronics & Order Suppliers — Production Database & Media Backup
# ==============================================================================
# Automated, WAL-consistent SQLite backup with integrity verification.
# Designed for Docker Compose on Ubuntu Server (Crontab: 0 2 * * * /opt/krishna-electronics/deploy/backup-db.sh)
#
# Options:
#   --dev      Explicitly permit backing up local development database (dev.db).
#              By default, the script strictly targets the production database (prod.db).
#
# Execution Requirement: GNU Bash (shebang: #!/usr/bin/env bash) is required.
# Do not invoke via plain POSIX /bin/sh (dash).
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${PROJECT_ROOT:-$(cd "$SCRIPT_DIR/.." && pwd)}"

BACKUP_DIR="${BACKUP_DIR:-$PROJECT_ROOT/backups}"
TIMESTAMP="$(date +"%Y%m%d_%H%M%S")"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
CONTAINER_NAME="${CONTAINER_NAME:-krishna_electronics_web}"
DB_VOLUME_NAME="${DB_VOLUME_NAME:-krishna-electronics_krishna_db_data}"
UPLOADS_VOLUME_NAME="${UPLOADS_VOLUME_NAME:-krishna-electronics_krishna_uploads_data}"
DATABASE_FILE="${DATABASE_FILE:-$PROJECT_ROOT/prisma/prod.db}"
ALLOW_DEV_BACKUP="${ALLOW_DEV_BACKUP:-false}"

# Parse optional command-line flags
for arg in "$@"; do
    case "$arg" in
        --dev)
            ALLOW_DEV_BACKUP="true"
            ;;
        *)
            echo "Unknown option: $arg" >&2
            echo "Usage: $0 [--dev]" >&2
            exit 1
            ;;
    esac
done

safe_chmod() {
    if command -v chmod >/dev/null 2>&1; then
        chmod "$@"
    fi
}

compress_gzip() {
    local src="$1"
    local dst="$2"
    if command -v gzip >/dev/null 2>&1; then
        gzip -9 -c "$src" > "$dst"
    elif command -v node >/dev/null 2>&1; then
        node -e "const fs=require('fs'),zlib=require('zlib'); fs.writeFileSync(process.argv[2], zlib.gzipSync(fs.readFileSync(process.argv[1]), { level: 9 }));" "$src" "$dst"
    else
        echo "ERROR: Neither gzip nor node found for compression." >&2
        return 1
    fi
}

verify_gzip() {
    local file="$1"
    if command -v gzip >/dev/null 2>&1; then
        gzip -t "$file" 2>/dev/null
    elif command -v node >/dev/null 2>&1; then
        node -e "const fs=require('fs'),zlib=require('zlib'); try { zlib.gunzipSync(fs.readFileSync(process.argv[1])); process.exit(0); } catch (_) { process.exit(1); }" "$file" 2>/dev/null
    else
        echo "ERROR: Neither gzip nor node found for archive verification." >&2
        return 1
    fi
}

mkdir -p "$BACKUP_DIR"
safe_chmod 700 "$BACKUP_DIR"

echo "================================================================="
echo " Krishna Electronics — Automated Backup Service"
echo " Timestamp: $TIMESTAMP"
echo " Backup Directory: $BACKUP_DIR"
if [ "$ALLOW_DEV_BACKUP" = "true" ]; then
    echo " Target Mode: DEVELOPMENT PERMITTED (--dev)"
else
    echo " Target Mode: PRODUCTION ONLY (prod.db)"
fi
echo "================================================================="

TEMP_DIR="$(mktemp -d "${TMPDIR:-/tmp}/krishna_backup_XXXXXX")"
case "$(uname -s 2>/dev/null)" in
    MINGW*|MSYS*)
        TEMP_DIR="$(cd "$TEMP_DIR" && pwd -W 2>/dev/null || echo "$TEMP_DIR")"
        ;;
esac
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
    echo "[1/4] Executing online SQLite backup via container '${CONTAINER_NAME}'..."
    # Ensure temporary backup in container
    docker exec "$CONTAINER_NAME" sh -c "sqlite3 /app/prisma/prod.db \".backup '/tmp/backup_${TIMESTAMP}.sqlite'\""
    docker cp "${CONTAINER_NAME}:/tmp/backup_${TIMESTAMP}.sqlite" "$RAW_BACKUP"
    docker exec "$CONTAINER_NAME" rm -f "/tmp/backup_${TIMESTAMP}.sqlite"
    BACKUP_SUCCESS=1
fi

# Strategy B: If container not running, check Docker volume directly for prod.db
if [ "$BACKUP_SUCCESS" -eq 0 ] && command -v docker >/dev/null 2>&1; then
    VOLUME_DIR=$(docker volume inspect --format '{{.Mountpoint}}' "$DB_VOLUME_NAME" 2>/dev/null || \
                docker volume inspect --format '{{.Mountpoint}}' krishna_db_data 2>/dev/null || true)
    
    if [ -n "$VOLUME_DIR" ] && [ -f "$VOLUME_DIR/prod.db" ] && command -v sqlite3 >/dev/null 2>&1; then
        echo "[1/4] Backing up SQLite database directly from Docker volume (prod.db)..."
        sqlite3 "$VOLUME_DIR/prod.db" ".backup '$RAW_BACKUP'"
        BACKUP_SUCCESS=1
    fi
fi

# Strategy C: Host path fallback (strictly prod.db unless --dev is explicitly enabled)
if [ "$BACKUP_SUCCESS" -eq 0 ]; then
    CANDIDATE_DB="${DATABASE_FILE:-$PROJECT_ROOT/prisma/prod.db}"
    
    if [ ! -f "$CANDIDATE_DB" ]; then
        if [ "$ALLOW_DEV_BACKUP" = "true" ] && [ -f "$PROJECT_ROOT/prisma/dev.db" ]; then
            echo "[1/4] NOTICE: Explicit development backup requested. Using host path: $PROJECT_ROOT/prisma/dev.db"
            CANDIDATE_DB="$PROJECT_ROOT/prisma/dev.db"
        else
            echo "ERROR: Production database file not found at: $CANDIDATE_DB" >&2
            echo "Production backup requires 'prod.db'. Silent fallback to dev.db is disabled." >&2
            echo "If you intend to back up the local development database, pass '--dev' or set ALLOW_DEV_BACKUP=true." >&2
            exit 1
        fi
    fi

    if [ -f "$CANDIDATE_DB" ] && command -v sqlite3 >/dev/null 2>&1; then
        echo "[1/4] Backing up SQLite database from host path: $CANDIDATE_DB"
        sqlite3 "$CANDIDATE_DB" ".backup '$RAW_BACKUP'"
        BACKUP_SUCCESS=1
    fi
fi

if [ "$BACKUP_SUCCESS" -eq 0 ] || [ ! -f "$RAW_BACKUP" ]; then
    echo "ERROR: Failed to locate or backup database." >&2
    exit 1
fi

# ------------------------------------------------------------------------------
# 2. Verify raw snapshot integrity
# ------------------------------------------------------------------------------
echo "[2/4] Verifying database snapshot integrity..."
if command -v sqlite3 >/dev/null 2>&1; then
    INTEGRITY_CHECK=$(sqlite3 "$RAW_BACKUP" "PRAGMA integrity_check;" 2>&1 || echo "failed")
    if [ "$INTEGRITY_CHECK" != "ok" ]; then
        echo "ERROR: Database integrity check failed on raw snapshot: $INTEGRITY_CHECK" >&2
        exit 1
    fi
    echo "✓ Raw database integrity verified: OK"
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
        echo "✓ Raw database integrity verified via container: OK"
    else
        echo "ERROR: Neither host sqlite3 nor running container available to verify integrity." >&2
        exit 1
    fi
fi

# ------------------------------------------------------------------------------
# 3. Compress and verify archive integrity
# ------------------------------------------------------------------------------
echo "[3/4] Compressing and verifying backup archive..."
compress_gzip "$RAW_BACKUP" "$GZ_BACKUP"
safe_chmod 600 "$GZ_BACKUP"

# Rigorous decompression verification
if ! verify_gzip "$GZ_BACKUP"; then
    echo "ERROR: Compressed backup verification failed (archive is corrupt or truncated): $GZ_BACKUP" >&2
    rm -f "$GZ_BACKUP"
    exit 1
fi
echo "✓ Compressed archive verification passed (gzip integrity: OK)"

BACKUP_SIZE=$(ls -lh "$GZ_BACKUP" | awk '{print $5}')
echo "✓ Database backup secured: $GZ_BACKUP ($BACKUP_SIZE)"

# ------------------------------------------------------------------------------
# 4. Media & Uploads Backup
# ------------------------------------------------------------------------------
echo "[4/4] Backing up product media and uploads..."
UPLOADS_SOURCE=""

if [ -d "$PROJECT_ROOT/public/uploads" ]; then
    UPLOADS_SOURCE="$PROJECT_ROOT/public/uploads"
elif command -v docker >/dev/null 2>&1; then
    UPLOADS_VOL=$(docker volume inspect --format '{{.Mountpoint}}' "$UPLOADS_VOLUME_NAME" 2>/dev/null || \
                  docker volume inspect --format '{{.Mountpoint}}' krishna_uploads_data 2>/dev/null || true)
    if [ -n "$UPLOADS_VOL" ] && [ -d "$UPLOADS_VOL" ]; then
        UPLOADS_SOURCE="$UPLOADS_VOL"
    fi
fi

if [ -n "$UPLOADS_SOURCE" ] && [ -d "$UPLOADS_SOURCE" ]; then
    tar -czf "$UPLOADS_BACKUP" -C "$(dirname "$UPLOADS_SOURCE")" "$(basename "$UPLOADS_SOURCE")"
    safe_chmod 600 "$UPLOADS_BACKUP"

    # Verify tarball integrity
    if ! tar -tzf "$UPLOADS_BACKUP" >/dev/null 2>&1; then
        echo "ERROR: Media backup archive is corrupt: $UPLOADS_BACKUP" >&2
        rm -f "$UPLOADS_BACKUP"
        exit 1
    fi

    UPLOADS_SIZE=$(ls -lh "$UPLOADS_BACKUP" | awk '{print $5}')
    echo "✓ Media backup saved and verified: $UPLOADS_BACKUP ($UPLOADS_SIZE)"
else
    echo "Notice: No uploads directory found to backup. Skipping media archive."
fi

# ------------------------------------------------------------------------------
# 5. Retention Policy: Retain backups for specified days
# ------------------------------------------------------------------------------
echo "Applying retention policy (pruning backups older than $RETENTION_DAYS days)..."
find "$BACKUP_DIR" -type f \( -name "db_*.sqlite.gz" -o -name "uploads_*.tar.gz" \) -mtime "+$RETENTION_DAYS" -exec rm -f {} + 2>/dev/null || true

echo "================================================================="
echo " Backup operation completed and verified successfully at $(date)!"
echo " Database Archive: $GZ_BACKUP"
echo "================================================================="
exit 0
