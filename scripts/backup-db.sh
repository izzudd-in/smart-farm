#!/usr/bin/env bash
# ==============================================================================
# Smart Farm - Automated PostgreSQL Daily Backup Script
# Schedule with cron (e.g. daily at 02:00 AM):
# 0 2 * * * /path/to/smart-farm/scripts/backup-db.sh >> /var/log/smartfarm_backup.log 2>&1
# ==============================================================================

set -euo pipefail

# Directory configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
BACKUP_DIR="${PROJECT_DIR}/backups"
TIMESTAMP="$(date +"%Y%m%d_%H%M%S")"
BACKUP_FILE="${BACKUP_DIR}/smartfarm_backup_${TIMESTAMP}.sql.gz"
RETENTION_DAYS=14

# Ensure backup directory exists
mkdir -p "${BACKUP_DIR}"

# Extract DATABASE_URL from .env if present
if [ -f "${PROJECT_DIR}/.env" ]; then
  # shellcheck disable=SC1091
  DATABASE_URL="$(grep -v '^#' "${PROJECT_DIR}/.env" | grep -E '^DATABASE_URL=' | head -n 1 | cut -d '=' -f2- | tr -d '"' | tr -d "'")"
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo "[-] ERROR: DATABASE_URL not found in environment or .env"
  exit 1
fi

echo "[+] [$(date)] Starting automated database backup..."

# Perform compressed pg_dump
if pg_dump "${DATABASE_URL}" | gzip > "${BACKUP_FILE}"; then
  BACKUP_SIZE="$(du -h "${BACKUP_FILE}" | cut -f1)"
  echo "[+] Backup successfully created: ${BACKUP_FILE} (${BACKUP_SIZE})"
else
  echo "[-] ERROR: pg_dump failed!"
  rm -f "${BACKUP_FILE}"
  exit 1
fi

# Apply retention policy: remove backups older than RETENTION_DAYS
echo "[+] Cleaning up backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -name "smartfarm_backup_*.sql.gz" -type f -mtime +"${RETENTION_DAYS}" -exec rm -f {} +

echo "[+] Database backup completed successfully at $(date)."
