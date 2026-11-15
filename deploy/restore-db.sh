#!/usr/bin/env bash
# ==============================================================================
# Krishna Electronics & Order Suppliers — Safe Database & Media Restore Tool
# ==============================================================================
# Performs validated, non-destructive restore with pre-flight integrity check,
# automated pre-restore safety snapshot, and WAL file cleanup.
#
# Usage:
#   ./restore-db.sh [--dry-run] [--confirm] <backup-file.sqlite.gz> [uploads.tar.gz]
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

DRY_RUN=0
CONFIRMED=0
DB_BACKUP=""
UPLOADS_BACKUP=""
CONTAINER_NAME="krishna_electronics_web"

# Parse arguments
while [[ $# -gt 0 ]]; do
    case "$1" in
        --dry-run)
            DRY_RUN=1
            shift
            ;;
        --confirm)
            CONFIRMED=1
            shift
            ;;
        -*)
            echo "Unknown option: $1" >&2
            echo "Usage: $0 [--dry-run] [--confirm] <backup-file.sqlite.gz> [uploads.tar.gz]" >&2
            exit 1
            ;;
        *)
            if [ -z "$DB_BACKUP" ]; then
                DB_BACKUP="$1"
            elif [ -z "$UPLOADS_BACKUP" ]; then
                UPLOADS_BACKUP="$1"
            else
                echo "Unexpected argument: $1" >&2
                exit 1
            fi
            shift
            ;;
    esac
done

if [ -z "$DB_BACKUP" ]; then
    echo "ERROR: Please specify the database backup file to restore." >&2
    echo "Usage: $0 [--dry-run] [--confirm] /path/to/db_TIMESTAMP.sqlite.gz [uploads_TIMESTAMP.tar.gz]" >&2
    exit 1
fi

if [ ! -f "$DB_BACKUP" ]; then
    echo "ERROR: Database backup file does not exist: $DB_BACKUP" >&2
    exit 1
fi

echo "================================================================="
echo " Krishna Electronics — Safe Database Restore Procedure"
echo " Backup File: $DB_BACKUP"
if [ "$DRY_RUN" -eq 1 ]; then
    echo " MODE: DRY RUN (No changes will be applied)"
fi
echo "================================================================="

# Create isolated working directory
TEMP_DIR="$(mktemp -d /tmp/krishna_restore_XXXXXX)"
cleanup() {
    rm -rf "$TEMP_DIR"
}
trap cleanup EXIT INT TERM

# ------------------------------------------------------------------------------
# 1. Pre-flight Validation of Backup Archive
# ------------------------------------------------------------------------------
echo "[1/6] Validating backup archive integrity..."
if ! gzip -t "$DB_BACKUP" 2>/dev/null; then
    echo "ERROR: Corrupt or invalid gzip archive: $DB_BACKUP" >&2
    exit 1
fi

EXTRACTED_DB="$TEMP_DIR/restored_candidate.sqlite"
gunzip -c "$DB_BACKUP" > "$EXTRACTED_DB"

if command -v sqlite3 >/dev/null 2>&1; then
    INTEGRITY=$(sqlite3 "$EXTRACTED_DB" "PRAGMA integrity_check;")
    if [ "$INTEGRITY" != "ok" ]; then
        echo "ERROR: Database integrity check failed on candidate: $INTEGRITY" >&2
        exit 1
    fi

    # Smoke check for essential tables
    TABLE_COUNT=$(sqlite3 "$EXTRACTED_DB" "SELECT count(*) FROM sqlite_master WHERE type='table' AND name IN ('User', 'Product', 'Setting');")
    if [ "$TABLE_COUNT" -lt 3 ]; then
        echo "ERROR: Backup archive does not contain expected application tables (found $TABLE_COUNT/3)." >&2
        exit 1
    fi
    echo "✓ Pre-flight integrity check passed: SQLite snapshot is valid."
else
    echo "Notice: Host sqlite3 not available. Skipping local candidate verification."
fi

# Validate uploads archive if provided
if [ -n "$UPLOADS_BACKUP" ]; then
    if [ ! -f "$UPLOADS_BACKUP" ]; then
        echo "ERROR: Uploads backup specified but file not found: $UPLOADS_BACKUP" >&2
        exit 1
    fi
    if ! tar -tzf "$UPLOADS_BACKUP" >/dev/null 2>&1; then
        echo "ERROR: Corrupt uploads archive: $UPLOADS_BACKUP" >&2
        exit 1
    fi
    echo "✓ Pre-flight uploads archive check passed."
fi

# ------------------------------------------------------------------------------
# 2. Determine Target Database Destination
# ------------------------------------------------------------------------------
TARGET_DB_PATH=""
TARGET_DIR=""

if command -v docker >/dev/null 2>&1; then
    VOLUME_DIR=$(docker volume inspect --format '{{.Mountpoint}}' krishna-electronics_krishna_db_data 2>/dev/null || \
                docker volume inspect --format '{{.Mountpoint}}' krishna_db_data 2>/dev/null || true)
    if [ -n "$VOLUME_DIR" ]; then
        TARGET_DIR="$VOLUME_DIR"
        TARGET_DB_PATH="$VOLUME_DIR/prod.db"
    fi
fi

if [ -z "$TARGET_DB_PATH" ]; then
    TARGET_DIR="$PROJECT_ROOT/prisma"
    TARGET_DB_PATH="$PROJECT_ROOT/prisma/prod.db"
fi

echo "[2/6] Target production database destination: $TARGET_DB_PATH"

if [ "$DRY_RUN" -eq 1 ]; then
    echo "-----------------------------------------------------------------"
    echo " DRY RUN COMPLETED SUCCESSFULLY."
    echo " Validated candidate database contains valid schema and data."
    echo " Target path: $TARGET_DB_PATH"
    echo " No changes were made to production containers or volumes."
    echo "-----------------------------------------------------------------"
    exit 0
fi

# ------------------------------------------------------------------------------
# 3. Confirmation Safety Gate
# ------------------------------------------------------------------------------
if [ "$CONFIRMED" -ne 1 ]; then
    if [ -t 0 ]; then
        echo ""
        echo "⚠️  CRITICAL WARNING: This operation will replace the active database!"
        echo "   Target: $TARGET_DB_PATH"
        read -r -p "   Type 'RESTORE-CONFIRM' to proceed: " CONFIRM_INPUT
        if [ "$CONFIRM_INPUT" != "RESTORE-CONFIRM" ]; then
            echo "Restore cancelled by user."
            exit 1
        fi
    else
        echo "ERROR: Non-interactive execution requires explicit --confirm flag." >&2
        exit 1
    fi
fi

# ------------------------------------------------------------------------------
# 4. Mandatory Pre-Restore Safety Snapshot
# ------------------------------------------------------------------------------
echo "[3/6] Creating mandatory pre-restore safety snapshot of active database..."
BACKUP_SCRIPT="$PROJECT_ROOT/deploy/backup-db.sh"
if [ -x "$BACKUP_SCRIPT" ]; then
    "$BACKUP_SCRIPT" || echo "Notice: Standard backup script warning, proceeding with manual snapshot."
fi

if [ -f "$TARGET_DB_PATH" ]; then
    PRE_RESTORE_SNAPSHOT="$PROJECT_ROOT/backups/pre_restore_$(date +"%Y%m%d_%H%M%S").sqlite"
    mkdir -p "$(dirname "$PRE_RESTORE_SNAPSHOT")"
    cp "$TARGET_DB_PATH" "$PRE_RESTORE_SNAPSHOT"
    gzip -9 "$PRE_RESTORE_SNAPSHOT"
    echo "✓ Pre-restore snapshot secured: ${PRE_RESTORE_SNAPSHOT}.gz"
fi

# ------------------------------------------------------------------------------
# 5. Stop Application & Apply Database Restoration
# ------------------------------------------------------------------------------
echo "[4/6] Stopping application container to guarantee zero active locks..."
if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
    (cd "$PROJECT_ROOT" && docker compose stop app || true)
fi

echo "[5/6] Overwriting target database and cleaning WAL/SHM locks..."
# Clean stale WAL and SHM files to prevent database corruption
rm -f "${TARGET_DB_PATH}-wal" "${TARGET_DB_PATH}-shm"

mkdir -p "$TARGET_DIR"
cp "$EXTRACTED_DB" "$TARGET_DB_PATH"
chmod 664 "$TARGET_DB_PATH"

# Restore uploads if provided
if [ -n "$UPLOADS_BACKUP" ]; then
    echo "Restoring product uploads archive..."
    UPLOADS_TARGET="$PROJECT_ROOT/public"
    if command -v docker >/dev/null 2>&1; then
        UPLOADS_VOL=$(docker volume inspect --format '{{.Mountpoint}}' krishna-electronics_krishna_uploads_data 2>/dev/null || \
                      docker volume inspect --format '{{.Mountpoint}}' krishna_uploads_data 2>/dev/null || true)
        if [ -n "$UPLOADS_VOL" ]; then
            UPLOADS_TARGET="$UPLOADS_VOL"
        fi
    fi
    tar -xzf "$UPLOADS_BACKUP" -C "$UPLOADS_TARGET"
    echo "✓ Media uploads restored."
fi

# ------------------------------------------------------------------------------
# 6. Post-Restore Verification & Application Restart
# ------------------------------------------------------------------------------
echo "[6/6] Verifying restored database integrity..."
if command -v sqlite3 >/dev/null 2>&1; then
    POST_CHECK=$(sqlite3 "$TARGET_DB_PATH" "PRAGMA integrity_check;")
    if [ "$POST_CHECK" != "ok" ]; then
        echo "FATAL: Post-restore integrity check failed: $POST_CHECK" >&2
        echo "A pre-restore snapshot is available in $PROJECT_ROOT/backups/" >&2
        exit 1
    fi
    echo "✓ Restored database verified: OK"
fi

if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
    echo "Restarting application container..."
    (cd "$PROJECT_ROOT" && docker compose start app)
    echo "Application container started."
fi

echo "================================================================="
echo " Database restoration completed successfully at $(date)!"
echo " Restored to: $TARGET_DB_PATH"
echo "================================================================="
exit 0
