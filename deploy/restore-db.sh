#!/usr/bin/env bash
# ==============================================================================
# Krishna Electronics & Order Suppliers — Safe Database & Media Restore Tool
# ==============================================================================
# Performs validated, non-destructive restore with:
#   1. Pre-flight archive integrity and schema smoke validation
#   2. Uploads path traversal & unsafe link defenses
#   3. Dry-run simulation mode (--dry-run)
#   4. Mandatory confirmation gate (--confirm)
#   5. Controlled application shutdown before snapshotting
#   6. Consistent, verified pre-restore safety backup (WAL checkpointed)
#   7. Stale WAL/SHM file cleanup while writers are stopped
#   8. Atomic filesystem database replacement (mv -f)
#   9. Post-restore integrity verification with fail-closed container safety
#
# Execution Requirement: GNU Bash (shebang: #!/usr/bin/env bash) is required.
# Do not invoke via plain POSIX /bin/sh (dash).
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${PROJECT_ROOT:-$(cd "$SCRIPT_DIR/.." && pwd)}"

ORIGINAL_ARGS=("$@")

DRY_RUN=0
CONFIRMED=0
ALLOW_DEV_RESTORE="${ALLOW_DEV_RESTORE:-0}"
DB_BACKUP=""
UPLOADS_BACKUP=""
CONTAINER_NAME="${CONTAINER_NAME:-krishna_electronics_web}"
COMPOSE_PROJECT_NAME="${COMPOSE_PROJECT_NAME:-}"
COMPOSE_FILE="${COMPOSE_FILE:-}"
COMPOSE_SERVICE_NAME="${COMPOSE_SERVICE_NAME:-app}"
DB_VOLUME_NAME="${DB_VOLUME_NAME:-krishna-electronics_krishna_db_data}"
UPLOADS_VOLUME_NAME="${UPLOADS_VOLUME_NAME:-krishna-electronics_krishna_uploads_data}"
DATABASE_FILE="${DATABASE_FILE:-$PROJECT_ROOT/prisma/prod.db}"
BACKUP_DIR="${BACKUP_DIR:-$PROJECT_ROOT/backups}"
MAX_DB_COMPRESSED_MB="${MAX_DB_COMPRESSED_MB:-256}"
MAX_DB_DECOMPRESSED_MB="${MAX_DB_DECOMPRESSED_MB:-512}"
APP_UID="${APP_UID:-1001}"
APP_GID="${APP_GID:-1001}"

start_application() {
    if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
        local compose_args=()
        [ -n "$COMPOSE_PROJECT_NAME" ] && compose_args+=("-p" "$COMPOSE_PROJECT_NAME")
        [ -n "$COMPOSE_FILE" ] && compose_args+=("-f" "$COMPOSE_FILE")
        (cd "$PROJECT_ROOT" && docker compose "${compose_args[@]}" start "${COMPOSE_SERVICE_NAME:-app}")
    fi
}

safe_chmod() {
    if command -v chmod >/dev/null 2>&1; then
        chmod "$@"
    fi
}

run_as_app_user() {
    # Usage: run_as_app_user <command> [args...]
    # Executes command strictly under numeric UID/GID $APP_UID:$APP_GID
    if [ "$(id -u 2>/dev/null)" = "$APP_UID" ]; then
        "$@"
    elif command -v setpriv >/dev/null 2>&1; then
        setpriv --reuid="$APP_UID" --regid="$APP_GID" --clear-groups "$@"
    elif command -v runuser >/dev/null 2>&1; then
        runuser -u "$APP_UID" -g "$APP_GID" -- "$@"
    elif command -v node >/dev/null 2>&1; then
        APP_UID="$APP_UID" APP_GID="$APP_GID" node -e "
const { execFileSync } = require('child_process');
const cmd = process.argv[1];
const args = process.argv.slice(2);
const opts = { stdio: 'inherit' };
if (process.platform !== 'win32') {
    opts.uid = parseInt(process.env.APP_UID || '1001', 10);
    opts.gid = parseInt(process.env.APP_GID || '1001', 10);
}
try {
    execFileSync(cmd, args, opts);
} catch (err) {
    process.exit(err.status !== undefined && err.status !== null ? err.status : 1);
}
" "$@"
    else
        case "$(uname -s 2>/dev/null)" in
            Linux*|Darwin*)
                echo "FATAL: No privilege-dropping utility found (setpriv, runuser, or node) to execute as UID $APP_UID." >&2
                return 1
                ;;
            *)
                "$@"
                ;;
        esac
    fi
}

decompress_gzip() {
    local src="$1"
    local dst="$2"
    local max_decompressed_mb="${MAX_DB_DECOMPRESSED_MB:-512}"
    local max_compressed_mb="${MAX_DB_COMPRESSED_MB:-256}"
    local max_decompressed_bytes=$((max_decompressed_mb * 1024 * 1024))
    local max_compressed_bytes=$((max_compressed_mb * 1024 * 1024))

    # Pre-check compressed file size before allocation
    local comp_size
    comp_size=$(wc -c < "$src" 2>/dev/null || stat -c '%s' "$src" 2>/dev/null || stat -f '%z' "$src" 2>/dev/null || echo 0)
    if [ "$comp_size" -gt "$max_compressed_bytes" ]; then
        echo "ERROR: Compressed database archive exceeds maximum permitted size of ${max_compressed_mb} MB (actual: $((comp_size / 1024 / 1024)) MB)." >&2
        rm -f "$dst"
        return 1
    fi

    # Streaming decompression with hard byte accounting and atomic cleanup
    if command -v node >/dev/null 2>&1; then
        if ! node -e "
const fs = require('fs');
const zlib = require('zlib');
const src = process.argv[1];
const dst = process.argv[2];
const maxBytes = parseInt(process.argv[3], 10);
const maxCompBytes = parseInt(process.argv[4], 10);

try {
    const compSize = fs.statSync(src).size;
    if (compSize > maxCompBytes) {
        console.error('ERROR: Compressed database archive exceeds maximum permitted size of ' + Math.round(maxCompBytes / 1048576) + ' MB (actual: ' + Math.round(compSize / 1048576) + ' MB).');
        process.exit(1);
    }
} catch (e) {
    console.error('ERROR: Failed to inspect compressed database file: ' + e.message);
    process.exit(1);
}

const readStream = fs.createReadStream(src);
const gunzip = zlib.createGunzip();
const writeStream = fs.createWriteStream(dst);

let decompressedBytes = 0;
let aborted = false;

function abortWith(msg) {
    if (aborted) return;
    aborted = true;
    try { readStream.destroy(); } catch (_) {}
    try { gunzip.destroy(); } catch (_) {}

    const finalizeCleanup = () => {
        try {
            if (fs.existsSync(dst)) fs.unlinkSync(dst);
        } catch (_) {}
        if (msg) console.error(msg);
        process.exit(1);
    };

    if (writeStream.destroyed || writeStream.closed) {
        setImmediate(finalizeCleanup);
    } else {
        writeStream.once('close', finalizeCleanup);
        writeStream.destroy();
        setTimeout(finalizeCleanup, 1000).unref();
    }
}

process.once('SIGINT', () => abortWith('ERROR: Decompression interrupted by SIGINT.'));
process.once('SIGTERM', () => abortWith('ERROR: Decompression interrupted by SIGTERM.'));

gunzip.on('data', (chunk) => {
    decompressedBytes += chunk.length;
    if (decompressedBytes > maxBytes) {
        abortWith('ERROR: Decompressed database size exceeds safety limit of ' + Math.round(maxBytes / 1048576) + ' MB (streaming aborted).');
    }
});

readStream.on('error', (err) => {
    abortWith('ERROR: Read failure during archive decompression: ' + err.message);
});

gunzip.on('error', (err) => {
    abortWith('ERROR: Candidate archive is corrupt or invalid gzip: ' + err.message);
});

writeStream.on('error', (err) => {
    abortWith('ERROR: Disk write failure during database decompression: ' + err.message);
});

writeStream.on('finish', () => {
    writeStream.close(() => {
        if (!aborted) {
            process.exit(0);
        }
    });
});

readStream.pipe(gunzip).pipe(writeStream);
" "$src" "$dst" "$max_decompressed_bytes" "$max_compressed_bytes"; then
            rm -f "$dst"
            return 1
        fi
    elif command -v gunzip >/dev/null 2>&1 || command -v gzip >/dev/null 2>&1; then
        local decompress_cmd="gunzip -c"
        if ! command -v gunzip >/dev/null 2>&1; then
            decompress_cmd="gzip -dc"
        fi
        rm -f "$dst"
        if ! $decompress_cmd "$src" > "$dst"; then
            echo "ERROR: Decompression failed for archive: $src" >&2
            rm -f "$dst"
            return 1
        fi
        local decomp_size
        decomp_size=$(wc -c < "$dst" 2>/dev/null || stat -c '%s' "$dst" 2>/dev/null || stat -f '%z' "$dst" 2>/dev/null || echo 0)
        if [ "$decomp_size" -gt "$max_decompressed_bytes" ]; then
            echo "ERROR: Decompressed database size ($((decomp_size / 1024 / 1024)) MB) exceeds limit of ${max_decompressed_mb} MB!" >&2
            rm -f "$dst"
            return 1
        fi
    else
        echo "ERROR: Neither node, gunzip nor gzip found for streaming decompression." >&2
        rm -f "$dst"
        return 1
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
        --dev)
            ALLOW_DEV_RESTORE=1
            shift
            ;;
        -*)
            echo "Unknown option: $1" >&2
            echo "Usage: $0 [--dry-run] [--confirm] [--dev] <backup-file.sqlite.gz> [uploads.tar.gz]" >&2
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
    echo "ERROR: Please specify the database backup archive to restore." >&2
    echo "Usage: $0 [--dry-run] [--confirm] [--dev] /path/to/db_TIMESTAMP.sqlite.gz [uploads_TIMESTAMP.tar.gz]" >&2
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
    echo " MODE: DRY RUN (Zero filesystem mutations / Zero service stops)"
fi
echo "================================================================="

# Create isolated working directory for candidates and staging
TEMP_DIR="$(mktemp -d "${TMPDIR:-/tmp}/krishna_restore_XXXXXX")"
case "$(uname -s 2>/dev/null)" in
    MINGW*|MSYS*)
        TEMP_DIR="$(cd "$TEMP_DIR" && pwd -W 2>/dev/null || echo "$TEMP_DIR")"
        ;;
esac
cleanup() {
    rm -rf "$TEMP_DIR"
}
trap cleanup EXIT INT TERM

# ------------------------------------------------------------------------------
# 1. Pre-flight Validation of Candidate Database Archive
# ------------------------------------------------------------------------------
echo "[1/8] Validating database backup archive integrity..."
if ! verify_gzip "$DB_BACKUP"; then
    echo "ERROR: Candidate archive is corrupt or invalid gzip: $DB_BACKUP" >&2
    exit 1
fi

EXTRACTED_DB="$TEMP_DIR/restored_candidate.sqlite"
decompress_gzip "$DB_BACKUP" "$EXTRACTED_DB"

if ! command -v sqlite3 >/dev/null 2>&1; then
    echo "FATAL: sqlite3 CLI is required for database restoration validation. gzip verification alone is insufficient." >&2
    exit 1
fi

INTEGRITY=$(sqlite3 "$EXTRACTED_DB" "PRAGMA integrity_check;" 2>&1 || echo "failed")
if [ "$INTEGRITY" != "ok" ]; then
    echo "ERROR: Candidate database integrity check failed: $INTEGRITY" >&2
    exit 1
fi

# Smoke check for essential tables
TABLE_COUNT=$(sqlite3 "$EXTRACTED_DB" "SELECT count(*) FROM sqlite_master WHERE type='table' AND name IN ('User', 'Product', 'Setting');")
if [ "$TABLE_COUNT" -lt 3 ]; then
    echo "ERROR: Backup archive does not contain expected application tables (found $TABLE_COUNT/3)." >&2
    exit 1
fi
echo "✓ Candidate database verified: valid SQLite snapshot with core schema intact."

# ------------------------------------------------------------------------------
# 2. Pre-flight Security & Integrity Check of Uploads Archive (if provided)
# ------------------------------------------------------------------------------
if [ -n "$UPLOADS_BACKUP" ]; then
    echo "[2/8] Validating media archive security, structure, and path members..."
    if [ ! -f "$UPLOADS_BACKUP" ]; then
        echo "ERROR: Uploads backup specified but file not found: $UPLOADS_BACKUP" >&2
        exit 1
    fi

    if ! verify_gzip "$UPLOADS_BACKUP"; then
        echo "ERROR: Uploads archive is corrupt or unreadable gzip: $UPLOADS_BACKUP" >&2
        exit 1
    fi

    # Execute strict pre-extraction validator
    VALIDATOR_SCRIPT="$PROJECT_ROOT/scripts/validate-archive.js"
    if [ ! -f "$VALIDATOR_SCRIPT" ] || ! command -v node >/dev/null 2>&1; then
        echo "FATAL: Strict archive validator ($VALIDATOR_SCRIPT) and Node.js runtime are required for uploads restoration." >&2
        echo "Restoration aborted before modifying any databases or files." >&2
        exit 1
    fi

    echo "Running strict archive member validator..."
    node "$VALIDATOR_SCRIPT" "$UPLOADS_BACKUP"
    echo "✓ Media archive passed all pre-flight security validations."
else
    echo "[2/8] No media archive specified. Skipping uploads validation."
fi

# ------------------------------------------------------------------------------
# 3. Determine Target Production Database Destination
# ------------------------------------------------------------------------------
TARGET_DB_PATH=""
TARGET_DIR=""

if command -v docker >/dev/null 2>&1; then
    VOLUME_DIR=$(docker volume inspect --format '{{.Mountpoint}}' "$DB_VOLUME_NAME" 2>/dev/null || \
                docker volume inspect --format '{{.Mountpoint}}' krishna_db_data 2>/dev/null || true)
    if [ -n "$VOLUME_DIR" ]; then
        TARGET_DIR="$VOLUME_DIR"
        TARGET_DB_PATH="$VOLUME_DIR/prod.db"
    fi
fi

if [ -z "$TARGET_DB_PATH" ]; then
    TARGET_DIR="$(dirname "$DATABASE_FILE")"
    TARGET_DB_PATH="$DATABASE_FILE"
fi

if [ "$ALLOW_DEV_RESTORE" -ne 1 ] && [[ "$TARGET_DB_PATH" == *"dev.db"* ]]; then
    echo "ERROR: Target database resolved to 'dev.db'. Production restore strictly targets 'prod.db'." >&2
    echo "Pass '--dev' if you explicitly intended a development restore." >&2
    exit 1
fi

echo "[3/8] Target database destination verified: $TARGET_DB_PATH"

# ------------------------------------------------------------------------------
# 4. Dry-Run Gate
# ------------------------------------------------------------------------------
if [ "$DRY_RUN" -eq 1 ]; then
    echo "-----------------------------------------------------------------"
    echo " DRY RUN COMPLETED SUCCESSFULLY."
    echo " Candidate archive verified: PRAGMA integrity_check OK, schema valid."
    if [ -n "$UPLOADS_BACKUP" ]; then
        echo " Media archive verified: 0 security violations."
    fi
    echo " Target destination: $TARGET_DB_PATH"
    echo " NO CONTAINERS WERE STOPPED. NO FILES WERE MODIFIED."
    echo "-----------------------------------------------------------------"
    exit 0
fi

# ------------------------------------------------------------------------------
# 5. Privilege Enforcement Gate (Enforce root/sudo on Linux before modification)
# ------------------------------------------------------------------------------
# Note: Dry-run safely operates above without requiring root privileges.
if command -v id >/dev/null 2>&1; then
    case "$(uname -s 2>/dev/null)" in
        MINGW*|MSYS*)
            # Windows development/test environment; skip Linux root privilege enforcement
            ;;
        *)
            if [ "$(id -u)" != "0" ]; then
                echo "ERROR: Production restoration requires root/sudo privileges to manage Docker services" >&2
                echo "       and apply container application user ownership (UID 1001: nextjs)." >&2
                echo "Please re-run with sudo:" >&2
                QUOTED_ARGS=""
                if [ ${#ORIGINAL_ARGS[@]} -gt 0 ]; then
                    printf -v QUOTED_ARGS '%q ' "${ORIGINAL_ARGS[@]}"
                fi
                echo "  sudo $0 $QUOTED_ARGS" >&2
                exit 1
            fi
            ;;
    esac
fi

# ------------------------------------------------------------------------------
# 6. Confirmation Safety Gate
# ------------------------------------------------------------------------------
if [ "$CONFIRMED" -ne 1 ]; then
    if [ -t 0 ]; then
        echo ""
        echo "⚠️  CRITICAL WARNING: This operation will replace the active production database!"
        echo "   Target: $TARGET_DB_PATH"
        read -r -p "   Type 'RESTORE-CONFIRM' to proceed: " CONFIRM_INPUT
        if [ "$CONFIRMED_INPUT:-$CONFIRM_INPUT" != "RESTORE-CONFIRM" ]; then
            echo "Restore cancelled by user."
            exit 1
        fi
    else
        echo "ERROR: Non-interactive execution requires explicit --confirm flag." >&2
        exit 1
    fi
fi

# ------------------------------------------------------------------------------
# 6. Stop Application Compose Service (Eliminate Active Writers)
# ------------------------------------------------------------------------------
echo "[4/8] Stopping application service to guarantee zero active writers..."
if [ "$ALLOW_DEV_RESTORE" -eq 1 ]; then
    echo "Notice: Development restore mode (--dev); stopping local application container if Docker is available."
    if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
        COMPOSE_ARGS=()
        [ -n "$COMPOSE_PROJECT_NAME" ] && COMPOSE_ARGS+=("-p" "$COMPOSE_PROJECT_NAME")
        [ -n "$COMPOSE_FILE" ] && COMPOSE_ARGS+=("-f" "$COMPOSE_FILE")
        (cd "$PROJECT_ROOT" && docker compose "${COMPOSE_ARGS[@]}" stop "${COMPOSE_SERVICE_NAME:-app}") 2>/dev/null || true
    fi
else
    # PRODUCTION RESTORE: Mandatory stop guarantee
    if ! command -v docker >/dev/null 2>&1; then
        echo "FATAL: Docker is required for production database restoration to ensure zero active writers." >&2
        echo "If you intend to restore a local development database without Docker, pass '--dev'." >&2
        exit 1
    fi
    if ! docker compose version >/dev/null 2>&1; then
        echo "FATAL: Docker Compose is required to manage application services for production restoration." >&2
        exit 1
    fi

    COMPOSE_ARGS=()
    [ -n "$COMPOSE_PROJECT_NAME" ] && COMPOSE_ARGS+=("-p" "$COMPOSE_PROJECT_NAME")
    [ -n "$COMPOSE_FILE" ] && COMPOSE_ARGS+=("-f" "$COMPOSE_FILE")

    svc_name="${COMPOSE_SERVICE_NAME:-app}"
    echo "Executing: docker compose ${COMPOSE_ARGS[*]:-} stop $svc_name"
    if ! (cd "$PROJECT_ROOT" && docker compose "${COMPOSE_ARGS[@]}" stop "$svc_name"); then
        echo "FATAL: Failed to stop production application service '$svc_name' via Docker Compose!" >&2
        echo "Restoration aborted before touching the database or modifying any files." >&2
        exit 1
    fi

    # Confirm the target container is actually stopped using Docker Compose for the specific service
    running_containers=""
    if ! running_containers=$(cd "$PROJECT_ROOT" && docker compose "${COMPOSE_ARGS[@]}" ps --status running -q "$svc_name"); then
        echo "FATAL: Docker failure while querying status of Compose service '$svc_name'!" >&2
        echo "Restoration aborted to prevent modifying database with unverified writer state." >&2
        exit 1
    fi
    if [ -n "$running_containers" ]; then
        echo "FATAL: Target application container(s) for service '$svc_name' are still running after stop command: $running_containers" >&2
        echo "Database replacement aborted to guarantee zero active writers." >&2
        exit 1
    fi

    # Explicit handling of missing vs stopped containers
    all_containers=""
    if ! all_containers=$(cd "$PROJECT_ROOT" && docker compose "${COMPOSE_ARGS[@]}" ps -a -q "$svc_name"); then
        echo "FATAL: Docker failure while querying container inventory for service '$svc_name'!" >&2
        exit 1
    fi
    if [ -z "$all_containers" ]; then
        echo "Notice: No existing containers found for Compose service '$svc_name'. Zero running instances confirmed."
    else
        echo "✓ Application service '$svc_name' confirmed stopped (container: $all_containers): zero active writers guaranteed."
    fi

    # Also verify CONTAINER_NAME if specified or default
    if [ -n "$CONTAINER_NAME" ]; then
        named_running=""
        if ! named_running=$(docker ps --filter "name=^/${CONTAINER_NAME}$" --filter "status=running" -q); then
            echo "FATAL: Docker failure while querying status of container '$CONTAINER_NAME'!" >&2
            exit 1
        fi
        if [ -n "$named_running" ]; then
            echo "FATAL: Target application container '${CONTAINER_NAME}' is still running after stop command!" >&2
            echo "Database replacement aborted to prevent database corruption." >&2
            exit 1
        fi
    fi
fi

# ------------------------------------------------------------------------------
# 7. Create & Verify Pre-Restore Safety Snapshot (Performed While App Is Stopped)
# ------------------------------------------------------------------------------
echo "[5/8] Creating and verifying pre-restore safety snapshot while application is stopped..."
mkdir -p "$BACKUP_DIR"
PRE_RESTORE_RAW="$TEMP_DIR/pre_restore_safety.sqlite"
PRE_RESTORE_GZ="$BACKUP_DIR/pre_restore_$(date +"%Y%m%d_%H%M%S").sqlite.gz"

if [ -f "$TARGET_DB_PATH" ]; then
    if ! command -v sqlite3 >/dev/null 2>&1; then
        echo "FATAL: sqlite3 CLI is required to create a WAL-consistent pre-restore safety snapshot." >&2
        if [ "$ALLOW_DEV_RESTORE" -ne 1 ]; then
            start_application || true
        fi
        exit 1
    fi

    # Online .backup checkpoints WAL frames consistently
    if ! sqlite3 "$TARGET_DB_PATH" ".backup '$PRE_RESTORE_RAW'" 2>/dev/null; then
        echo "FATAL: Existing database pre-restore backup failed (database may be corrupt)." >&2
        echo "Aborting restore to prevent destroying existing state without a valid backup." >&2
        if [ "$ALLOW_DEV_RESTORE" -ne 1 ]; then
            echo "Attempting to restart application Compose service..."
            if start_application; then
                echo "Application service restarted successfully."
            else
                echo "WARNING: Application service failed to restart. Service status: Stopped." >&2
            fi
        fi
        exit 1
    fi

    PRE_INTEGRITY=$(sqlite3 "$PRE_RESTORE_RAW" "PRAGMA integrity_check;" 2>&1 || echo "failed")
    if [ "$PRE_INTEGRITY" != "ok" ]; then
        echo "FATAL: Existing database pre-restore integrity check failed: $PRE_INTEGRITY" >&2
        echo "Aborting restore to prevent destroying existing state without a valid backup." >&2
        if [ "$ALLOW_DEV_RESTORE" -ne 1 ]; then
            echo "Attempting to restart application Compose service..."
            if start_application; then
                echo "Application service restarted successfully."
            else
                echo "WARNING: Application service failed to restart. Service status: Stopped." >&2
            fi
        fi
        exit 1
    fi

    # Compress safety backup
    compress_gzip "$PRE_RESTORE_RAW" "$PRE_RESTORE_GZ"
    safe_chmod 600 "$PRE_RESTORE_GZ"

    # Verify safety backup can be read
    if ! verify_gzip "$PRE_RESTORE_GZ"; then
        echo "FATAL: Failed to verify pre-restore safety snapshot archive!" >&2
        if [ "$ALLOW_DEV_RESTORE" -ne 1 ]; then
            start_application || true
        fi
        exit 1
    fi
    echo "✓ Pre-restore safety snapshot verified and secured: $PRE_RESTORE_GZ"
else
    echo "Notice: Target database does not exist yet. Skipping pre-restore safety snapshot."
fi

# ------------------------------------------------------------------------------
# 8. Stale Lock Cleanup, Atomic Replacement & Application User Ownership
# ------------------------------------------------------------------------------
echo "[6/8] Cleaning stale WAL/SHM locks and atomically replacing database..."
# Remove stale lock files only now that writers are confirmed stopped
rm -f "${TARGET_DB_PATH}-wal" "${TARGET_DB_PATH}-shm"

mkdir -p "$TARGET_DIR"

# Application container runs as nextjs (UID 1001, GID 1001) per Dockerfile
APP_UID=1001
APP_GID=1001

# Atomic Replacement: Copy candidate to target directory on the SAME filesystem, then mv -f
ATOMIC_TEMP_FILE="$TARGET_DIR/.prod.db.atomic_replace.$$"
cp "$EXTRACTED_DB" "$ATOMIC_TEMP_FILE"

# Apply ownership to candidate before atomic rename
if command -v chown >/dev/null 2>&1; then
    case "$(uname -s 2>/dev/null)" in
        Linux*|Darwin*)
            if [ "$ALLOW_DEV_RESTORE" -ne 1 ] || [ "$(id -u)" = "0" ]; then
                chown "$APP_UID:$APP_GID" "$ATOMIC_TEMP_FILE" || {
                    echo "FATAL: Failed to set ownership on $ATOMIC_TEMP_FILE to $APP_UID:$APP_GID" >&2
                    exit 1
                }
                chown "$APP_UID:$APP_GID" "$TARGET_DIR" || {
                    echo "FATAL: Failed to set ownership on $TARGET_DIR to $APP_UID:$APP_GID" >&2
                    exit 1
                }
            else
                chown "$APP_UID:$APP_GID" "$ATOMIC_TEMP_FILE" 2>/dev/null || true
                chown "$APP_UID:$APP_GID" "$TARGET_DIR" 2>/dev/null || true
            fi
            ;;
        *)
            chown "$APP_UID:$APP_GID" "$ATOMIC_TEMP_FILE" 2>/dev/null || true
            chown "$APP_UID:$APP_GID" "$TARGET_DIR" 2>/dev/null || true
            ;;
    esac
fi
safe_chmod 664 "$ATOMIC_TEMP_FILE"
safe_chmod 775 "$TARGET_DIR"

# Atomic rename syscall replaces destination instantly
mv -f "$ATOMIC_TEMP_FILE" "$TARGET_DB_PATH"
echo "✓ Target database replaced atomically via rename."

# Ensure ownership and permissions on restored database and containing directory
# The containing directory MUST allow UID 1001 to create SQLite WAL and SHM files
if command -v chown >/dev/null 2>&1; then
    case "$(uname -s 2>/dev/null)" in
        Linux*|Darwin*)
            if [ "$ALLOW_DEV_RESTORE" -ne 1 ] || [ "$(id -u)" = "0" ]; then
                chown "$APP_UID:$APP_GID" "$TARGET_DB_PATH" || {
                    echo "FATAL: Failed to set ownership on $TARGET_DB_PATH to $APP_UID:$APP_GID" >&2
                    echo "APPLICATION CONTAINER REMAINS STOPPED." >&2
                    exit 1
                }
                chown "$APP_UID:$APP_GID" "$TARGET_DIR" || {
                    echo "FATAL: Failed to set ownership on $TARGET_DIR to $APP_UID:$APP_GID" >&2
                    echo "APPLICATION CONTAINER REMAINS STOPPED." >&2
                    exit 1
                }
            else
                chown "$APP_UID:$APP_GID" "$TARGET_DB_PATH" 2>/dev/null || true
                chown "$APP_UID:$APP_GID" "$TARGET_DIR" 2>/dev/null || true
            fi
            ;;
        *)
            chown "$APP_UID:$APP_GID" "$TARGET_DB_PATH" 2>/dev/null || true
            chown "$APP_UID:$APP_GID" "$TARGET_DIR" 2>/dev/null || true
            ;;
    esac
fi
safe_chmod 664 "$TARGET_DB_PATH"
safe_chmod 775 "$TARGET_DIR"

# ------------------------------------------------------------------------------
# 9. Post-Restore Verification Gate
# ------------------------------------------------------------------------------
echo "[7/8] Verifying restored database integrity and container user permissions..."
if ! command -v sqlite3 >/dev/null 2>&1; then
    echo "CRITICAL FAILURE: sqlite3 CLI is required for post-restore verification." >&2
    echo "APPLICATION CONTAINER REMAINS STOPPED." >&2
    exit 1
fi

POST_CHECK=$(sqlite3 "$TARGET_DB_PATH" "PRAGMA integrity_check;" 2>&1 || echo "failed")
if [ "$POST_CHECK" != "ok" ]; then
    echo "=================================================================" >&2
    echo " CRITICAL FAILURE: Restored database integrity check failed: $POST_CHECK" >&2
    echo " APPLICATION CONTAINER REMAINS STOPPED." >&2
    echo " A verified pre-restore safety snapshot is available at:" >&2
    echo "   $PRE_RESTORE_GZ" >&2
    echo " To safely restore from the pre-restore safety snapshot, execute:" >&2
    echo "   sudo $0 \"$PRE_RESTORE_GZ\"" >&2
    echo "=================================================================" >&2
    exit 1
fi
echo "✓ Restored database integrity verified: OK"

# Strict Ownership & Permissions Verification
STRICT_PERM_ENFORCEMENT=0
case "$(uname -s 2>/dev/null)" in
    Linux*|Darwin*)
        STRICT_PERM_ENFORCEMENT=1
        ;;
    *)
        STRICT_PERM_ENFORCEMENT="${FORCE_PERM_CHECK:-0}"
        ;;
esac

if [ "$STRICT_PERM_ENFORCEMENT" -eq 1 ] && { [ "$ALLOW_DEV_RESTORE" -ne 1 ] || [ "${FORCE_PERM_CHECK:-0}" = "1" ] || [ "$(id -u 2>/dev/null)" = "0" ]; }; then
    ACTUAL_UID=$(stat -c '%u' "$TARGET_DB_PATH" 2>/dev/null || stat -f '%u' "$TARGET_DB_PATH" 2>/dev/null || echo "")
    ACTUAL_GID=$(stat -c '%g' "$TARGET_DB_PATH" 2>/dev/null || stat -f '%g' "$TARGET_DB_PATH" 2>/dev/null || echo "")
    DIR_UID=$(stat -c '%u' "$TARGET_DIR" 2>/dev/null || stat -f '%u' "$TARGET_DIR" 2>/dev/null || echo "")
    DIR_GID=$(stat -c '%g' "$TARGET_DIR" 2>/dev/null || stat -f '%g' "$TARGET_DIR" 2>/dev/null || echo "")

    case "$(uname -s 2>/dev/null)" in
        Linux*|Darwin*)
            if [ "$ACTUAL_UID" != "$APP_UID" ] || [ "$ACTUAL_GID" != "$APP_GID" ]; then
                echo "FATAL: Database file ownership verification failed: expected $APP_UID:$APP_GID, found $ACTUAL_UID:$ACTUAL_GID" >&2
                echo "APPLICATION CONTAINER REMAINS STOPPED." >&2
                echo "Run: sudo chown -R $APP_UID:$APP_GID $TARGET_DIR" >&2
                exit 1
            fi
            if [ "$DIR_UID" != "$APP_UID" ] || [ "$DIR_GID" != "$APP_GID" ]; then
                echo "FATAL: Database directory ownership verification failed: expected $APP_UID:$APP_GID, found $DIR_UID:$DIR_GID" >&2
                echo "APPLICATION CONTAINER REMAINS STOPPED." >&2
                echo "Run: sudo chown -R $APP_UID:$APP_GID $TARGET_DIR" >&2
                exit 1
            fi
            ;;
    esac
            # 1. Numeric Mode Bits Diagnostic
            DIR_MODE=$(stat -c '%a' "$TARGET_DIR" 2>/dev/null || stat -f '%Lp' "$TARGET_DIR" 2>/dev/null || echo "")
            DB_MODE=$(stat -c '%a' "$TARGET_DB_PATH" 2>/dev/null || stat -f '%Lp' "$TARGET_DB_PATH" 2>/dev/null || echo "")
            if [ -n "$DIR_MODE" ]; then
                if [ "$(( 8#$DIR_MODE & 8#300 ))" -ne "$(( 8#300 ))" ]; then
                    echo "FATAL: Database directory mode ($DIR_MODE) lacks owner write and/or execute permission for UID $APP_UID." >&2
                    echo "APPLICATION CONTAINER REMAINS STOPPED." >&2
                    echo "Run: sudo chmod 775 $TARGET_DIR" >&2
                    exit 1
                fi
            fi
            if [ -n "$DB_MODE" ]; then
                if [ "$(( 8#$DB_MODE & 8#600 ))" -ne "$(( 8#600 ))" ]; then
                    echo "FATAL: Database file mode ($DB_MODE) lacks owner read and/or write permission for UID $APP_UID." >&2
                    echo "APPLICATION CONTAINER REMAINS STOPPED." >&2
                    echo "Run: sudo chmod 664 $TARGET_DB_PATH" >&2
                    exit 1
                fi
            fi

            # 2. Real UID/GID 1001 File Operation Probe (Create, Write, Read, Delete)
            echo "Executing real UID $APP_UID file permission probe in $TARGET_DIR..."
            PROBE_FILE="$TARGET_DIR/.perm_probe_file.$$.tmp"
            rm -f "$PROBE_FILE"
            if ! run_as_app_user sh -c "printf 'probe_token_$$' > '$PROBE_FILE' && [ \"\$(cat '$PROBE_FILE')\" = 'probe_token_$$' ] && rm -f '$PROBE_FILE'"; then
                echo "FATAL: Real application-user permission probe failed in $TARGET_DIR!" >&2
                echo "UID $APP_UID cannot create, write, read, or delete files in $TARGET_DIR." >&2
                echo "APPLICATION CONTAINER REMAINS STOPPED." >&2
                echo "Verify directory ownership ($APP_UID:$APP_GID) and write permissions (chmod 775)." >&2
                echo "A verified pre-restore safety snapshot is available at:" >&2
                echo "  $PRE_RESTORE_GZ" >&2
                echo "To safely rollback, run: sudo $0 \"$PRE_RESTORE_GZ\"" >&2
                rm -f "$PROBE_FILE" 2>/dev/null || true
                exit 1
            fi

            # 3. Real UID/GID 1001 SQLite WAL/SHM Allocation Probe (Using temporary copy of candidate DB)
            echo "Executing real UID $APP_UID SQLite WAL/SHM allocation probe in $TARGET_DIR..."
            PROBE_DB="$TARGET_DIR/.perm_probe_wal.$$.sqlite"
            rm -f "$PROBE_DB" "${PROBE_DB}-wal" "${PROBE_DB}-shm"
            cp "$EXTRACTED_DB" "$PROBE_DB"
            if command -v chown >/dev/null 2>&1; then
                chown "$APP_UID:$APP_GID" "$PROBE_DB" 2>/dev/null || true
            fi
            safe_chmod 664 "$PROBE_DB"

            WAL_PROBE_FAILED=0
            if ! run_as_app_user sqlite3 "$PROBE_DB" "
                PRAGMA journal_mode=WAL;
                CREATE TABLE _perm_probe (id INT PRIMARY KEY, val TEXT);
                INSERT INTO _perm_probe VALUES (1, 'probe_val_$$');
                PRAGMA wal_checkpoint(TRUNCATE);
            " >/dev/null 2>&1; then
                WAL_PROBE_FAILED=1
            fi

            if [ "$WAL_PROBE_FAILED" -eq 0 ]; then
                PROBE_READ=$(run_as_app_user sqlite3 "$PROBE_DB" "SELECT val FROM _perm_probe WHERE id=1;" 2>/dev/null || echo "")
                if [ "$PROBE_READ" != "probe_val_$$" ]; then
                    WAL_PROBE_FAILED=1
                fi
            fi

            # Clean up probe database files immediately
            rm -f "$PROBE_DB" "${PROBE_DB}-wal" "${PROBE_DB}-shm"

            if [ "$WAL_PROBE_FAILED" -ne 0 ]; then
                echo "FATAL: Application user (UID $APP_UID) failed SQLite WAL/SHM allocation probe in $TARGET_DIR!" >&2
                echo "UID $APP_UID cannot allocate or write SQLite WAL/SHM locks in $TARGET_DIR." >&2
                echo "APPLICATION CONTAINER REMAINS STOPPED." >&2
                echo "A verified pre-restore safety snapshot is available at:" >&2
                echo "  $PRE_RESTORE_GZ" >&2
                echo "To safely rollback, run: sudo $0 \"$PRE_RESTORE_GZ\"" >&2
                exit 1
            fi
            echo "✓ Database ownership, directory mode ($DIR_MODE), and real UID $APP_UID WAL-writable probes verified successfully."
fi

# ------------------------------------------------------------------------------
# 10. Install Uploads Archive (if provided) & Restart Application
# ------------------------------------------------------------------------------
if [ -n "$UPLOADS_BACKUP" ]; then
    echo "[8/8] Installing media uploads archive safely..."
    UPLOADS_TARGET="$PROJECT_ROOT/public/uploads"
    if command -v docker >/dev/null 2>&1; then
        UPLOADS_VOL=$(docker volume inspect --format '{{.Mountpoint}}' "$UPLOADS_VOLUME_NAME" 2>/dev/null || \
                      docker volume inspect --format '{{.Mountpoint}}' krishna_uploads_data 2>/dev/null || true)
        if [ -n "$UPLOADS_VOL" ]; then
            UPLOADS_TARGET="$UPLOADS_VOL"
        fi
    fi

    # Extract first into isolated staging directory inside TEMP_DIR
    STAGING_UPLOADS="$TEMP_DIR/uploads_staging"
    mkdir -p "$STAGING_UPLOADS"
    tar --no-same-owner -xzf "$UPLOADS_BACKUP" -C "$STAGING_UPLOADS"

    # Post-extraction security assertions
    # 1. Zero symlinks permitted in staging
    SYMLINK_COUNT=$(find "$STAGING_UPLOADS" -type l 2>/dev/null | wc -l)
    if [ "$SYMLINK_COUNT" -gt 0 ]; then
        echo "FATAL SECURITY ERROR: $SYMLINK_COUNT symlinks detected in extracted uploads staging!" >&2
        echo "Application will not be restarted. Database was restored, but media installation was aborted." >&2
        echo "To rollback database to pre-restore snapshot, execute:" >&2
        echo "  sudo $0 \"$PRE_RESTORE_GZ\"" >&2
        exit 1
    fi

    # 2. Zero non-regular, non-directory files permitted (FIFOs, device files, sockets)
    SPECIAL_COUNT=$(find "$STAGING_UPLOADS" ! -type f ! -type d 2>/dev/null | wc -l)
    if [ "$SPECIAL_COUNT" -gt 0 ]; then
        echo "FATAL SECURITY ERROR: $SPECIAL_COUNT special files detected in extracted uploads staging!" >&2
        echo "Application will not be restarted. Database was restored, but media installation was aborted." >&2
        echo "To rollback database to pre-restore snapshot, execute:" >&2
        echo "  sudo $0 \"$PRE_RESTORE_GZ\"" >&2
        exit 1
    fi

    mkdir -p "$UPLOADS_TARGET"
    if [ -d "$STAGING_UPLOADS/uploads" ]; then
        cp -r "$STAGING_UPLOADS/uploads/." "$UPLOADS_TARGET/"
    else
        cp -r "$STAGING_UPLOADS/." "$UPLOADS_TARGET/"
    fi

    # Correct ownership and permissions for application user
    if command -v chown >/dev/null 2>&1; then
        chown -R "$APP_UID:$APP_GID" "$UPLOADS_TARGET" 2>/dev/null || true
    fi
    find "$UPLOADS_TARGET" -type d -exec chmod 775 {} + 2>/dev/null || true
    find "$UPLOADS_TARGET" -type f -exec chmod 664 {} + 2>/dev/null || true

    echo "✓ Media uploads restored and secured for container user 1001:1001."
else
    echo "[8/8] Media archive skipped."
fi

if [ "$ALLOW_DEV_RESTORE" -ne 1 ]; then
    if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
        echo "Restarting application Compose service..."
        COMPOSE_ARGS=()
        [ -n "$COMPOSE_PROJECT_NAME" ] && COMPOSE_ARGS+=("-p" "$COMPOSE_PROJECT_NAME")
        [ -n "$COMPOSE_FILE" ] && COMPOSE_ARGS+=("-f" "$COMPOSE_FILE")
        if ! (cd "$PROJECT_ROOT" && docker compose "${COMPOSE_ARGS[@]}" start "${COMPOSE_SERVICE_NAME:-app}"); then
            echo "=================================================================" >&2
            echo " ERROR: Failed to restart application service '${COMPOSE_SERVICE_NAME:-app}'!" >&2
            echo " APPLICATION CONTAINER STATUS: Stopped / Failed to restart." >&2
            echo " Database was restored successfully, but service start exited non-zero." >&2
            echo " Inspect logs with: docker compose logs ${COMPOSE_SERVICE_NAME:-app}" >&2
            echo " Manually start with: docker compose start ${COMPOSE_SERVICE_NAME:-app}" >&2
            echo "=================================================================" >&2
            exit 1
        fi
        echo "✓ Application container started successfully."
    fi
fi

echo "================================================================="
echo " Database restoration completed and verified successfully at $(date)!"
echo " Restored to: $TARGET_DB_PATH"
echo " Pre-restore safety backup retained: $PRE_RESTORE_GZ"
echo "================================================================="
exit 0
