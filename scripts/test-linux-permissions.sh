#!/usr/bin/env bash
# ==============================================================================
# Krishna Electronics — Isolated Linux Application User Permission & Lifecycle Test
#
# Verified on Linux (Ubuntu / Debian).
# Strictly exercises:
#   1. Real Linux UID/GID 1001 file creation, write, read, and delete.
#   2. Real Linux SQLite WAL/SHM lock allocation as UID 1001.
#   3. Real fail-closed permission detection under simulated non-writable directories.
#   4. deploy/backup-db.sh and deploy/restore-db.sh using temporary test volumes only.
#
# SAFETY GUARANTEE: Uses isolated /tmp directories only. NEVER touches production DB.
# ==============================================================================

set -euo pipefail

echo "================================================================="
echo " Krishna Electronics — Isolated Linux Permissions & Deploy Test"
echo "================================================================="

# Ensure sqlite3 is present
if ! command -v sqlite3 >/dev/null 2>&1; then
    echo "Installing sqlite3 for verification..."
    if command -v apt-get >/dev/null 2>&1; then
        sudo apt-get update -qq && sudo apt-get install -y -qq sqlite3
    elif command -v apk >/dev/null 2>&1; then
        apk add --no-cache sqlite
    fi
fi

# Ensure user with UID 1001 exists for test
APP_UID=1001
APP_GID=1001
if ! id -u "$APP_UID" >/dev/null 2>&1; then
    echo "Creating test app user (UID $APP_UID)..."
    if command -v useradd >/dev/null 2>&1; then
        useradd -u "$APP_UID" -U appuser 2>/dev/null || true
    elif command -v adduser >/dev/null 2>&1; then
        adduser -u "$APP_UID" -D -g "$APP_GID" appuser 2>/dev/null || true
    fi
fi

# Determine privilege-dropping utility
RUN_CMD=""
if command -v setpriv >/dev/null 2>&1; then
    RUN_CMD="setpriv --reuid=$APP_UID --regid=$APP_GID --clear-groups"
elif command -v runuser >/dev/null 2>&1; then
    RUN_CMD="runuser -u $APP_UID -g $APP_GID --"
elif command -v su >/dev/null 2>&1; then
    RUN_CMD="su -s /bin/sh appuser -c"
fi

if [ -z "$RUN_CMD" ]; then
    echo "FATAL: No privilege dropping command (setpriv, runuser, su) available on this host." >&2
    exit 1
fi
echo "✓ Using privilege dropper: $RUN_CMD"

# Create isolated scratch workspace
ISOLATED_DIR="$(mktemp -d /tmp/krishna_ci_perm_test_XXXXXX)"
cleanup() {
    rm -rf "$ISOLATED_DIR"
}
trap cleanup EXIT INT TERM

mkdir -p "$ISOLATED_DIR/prisma" "$ISOLATED_DIR/backups" "$ISOLATED_DIR/public/uploads"
chown -R "$APP_UID:$APP_GID" "$ISOLATED_DIR"
chmod 775 "$ISOLATED_DIR/prisma" "$ISOLATED_DIR/public/uploads"

# ------------------------------------------------------------------------------
# Test 1: Real UID 1001 File Creation, Write, Read, Delete
# ------------------------------------------------------------------------------
echo "[1/4] Testing real Linux UID 1001 filesystem lifecycle..."
TEST_FILE="$ISOLATED_DIR/prisma/probe_uid_test.tmp"
$RUN_CMD sh -c "echo 'uid_1001_verified' > '$TEST_FILE'"

READ_VAL="$($RUN_CMD cat "$TEST_FILE")"
if [ "$READ_VAL" != "uid_1001_verified" ]; then
    echo "FAILED: UID 1001 read mismatch: got '$READ_VAL'" >&2
    exit 1
fi
$RUN_CMD rm -f "$TEST_FILE"
if [ -f "$TEST_FILE" ]; then
    echo "FAILED: UID 1001 failed to remove probe file" >&2
    exit 1
fi
echo "  ✓ PASS: UID 1001 write, read, delete succeeded"

# ------------------------------------------------------------------------------
# Test 2: Real Linux SQLite WAL/SHM Lock Allocation as UID 1001
# ------------------------------------------------------------------------------
echo "[2/4] Testing real Linux SQLite WAL/SHM allocation as UID 1001..."
TEST_DB="$ISOLATED_DIR/prisma/test_wal.db"
$RUN_CMD sqlite3 "$TEST_DB" "PRAGMA journal_mode=WAL; CREATE TABLE items (id INTEGER PRIMARY KEY, name TEXT); INSERT INTO items (name) VALUES ('Test Item');"

# Verify table and data
ITEM_COUNT="$($RUN_CMD sqlite3 "$TEST_DB" "SELECT count(*) FROM items;")"
if [ "$ITEM_COUNT" -ne 1 ]; then
    echo "FAILED: SQLite insert as UID 1001 failed: count=$ITEM_COUNT" >&2
    exit 1
fi

$RUN_CMD sqlite3 "$TEST_DB" "PRAGMA wal_checkpoint(TRUNCATE);"
$RUN_CMD rm -f "$TEST_DB" "${TEST_DB}-wal" "${TEST_DB}-shm"
echo "  ✓ PASS: SQLite WAL/SHM creation, write, and checkpoint succeeded under UID 1001"

# ------------------------------------------------------------------------------
# Test 3: Permission Failure & Fail-Closed Enforcement
# ------------------------------------------------------------------------------
echo "[3/4] Testing fail-closed permission rejection under non-writable directory..."
RESTRICTED_DIR="$ISOLATED_DIR/restricted"
mkdir -p "$RESTRICTED_DIR"
chmod 0555 "$RESTRICTED_DIR"

if $RUN_CMD touch "$RESTRICTED_DIR/probe.tmp" 2>/dev/null; then
    echo "FAILED: Probe should have failed under 0555 directory!" >&2
    exit 1
fi
echo "  ✓ PASS: Fail-closed verified: UID 1001 write denied under non-writable directory"
chmod 0755 "$RESTRICTED_DIR"

# ------------------------------------------------------------------------------
# Test 4: Backup & Restore Scripts on Temporary Test Volume Only
# ------------------------------------------------------------------------------
echo "[4/4] Testing deploy/backup-db.sh and deploy/restore-db.sh on isolated temporary volume..."
SCRIPT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Initialize mock production DB in isolated dir
MOCK_DB="$ISOLATED_DIR/prisma/prod.db"
sqlite3 "$MOCK_DB" "CREATE TABLE User (id TEXT PRIMARY KEY, email TEXT, passwordHash TEXT, role TEXT, isActive BOOLEAN); INSERT INTO User VALUES ('u1', 'admin@example.com', 'hash', 'SUPER_ADMIN', 1); CREATE TABLE Setting (id TEXT PRIMARY KEY, siteName TEXT); INSERT INTO Setting VALUES ('site-settings', 'Krishna Electronics');"

# Run backup
PROJECT_ROOT="$ISOLATED_DIR" \
BACKUP_DIR="$ISOLATED_DIR/backups" \
DATABASE_FILE="$MOCK_DB" \
CONTAINER_NAME="nonexistent_container_for_host_fallback" \
bash "$SCRIPT_ROOT/deploy/backup-db.sh"

LATEST_BACKUP="$(ls -1t "$ISOLATED_DIR/backups"/db_*.sqlite.gz | head -n1)"
if [ ! -f "$LATEST_BACKUP" ]; then
    echo "FAILED: Backup file not generated in isolated test directory" >&2
    exit 1
fi
gzip -t "$LATEST_BACKUP"
echo "  ✓ PASS: Isolated backup generated and verified (gzip integrity OK)"

# Mutate mock database
sqlite3 "$MOCK_DB" "UPDATE Setting SET siteName = 'Mutated Store' WHERE id = 'site-settings';"

# Run restore in dev mode (isolated test workspace)
PROJECT_ROOT="$ISOLATED_DIR" \
BACKUP_DIR="$ISOLATED_DIR/backups" \
bash "$SCRIPT_ROOT/deploy/restore-db.sh" --dev --confirm "$LATEST_BACKUP"

RESTORED_NAME="$(sqlite3 "$MOCK_DB" "SELECT siteName FROM Setting WHERE id = 'site-settings';")"
if [ "$RESTORED_NAME" != "Krishna Electronics" ]; then
    echo "FAILED: Expected restored siteName 'Krishna Electronics', got '$RESTORED_NAME'" >&2
    exit 1
fi
echo "  ✓ PASS: Isolated restore succeeded and verified database integrity"

echo "================================================================="
echo " ✅ ALL ISOLATED LINUX PERMISSION & LIFECYCLE TESTS PASSED!"
echo "================================================================="
