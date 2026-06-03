#!/bin/bash
# Run prisma migrate deploy with an automatic pre-migration backup.
# Usage: bash scripts/safe-migrate.sh
set -euo pipefail

BACKUP_DIR="/opt/backup/praxis"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/pre-migrate-${TIMESTAMP}.sql"

mkdir -p "$BACKUP_DIR"

echo "==> Creating pre-migration backup: $BACKUP_FILE"
sudo -u postgres pg_dump praxis > "$BACKUP_FILE"
echo "    Backup OK ($(du -h "$BACKUP_FILE" | cut -f1))"

echo "==> Running prisma migrate deploy"
cd /opt/praxis-app
npx prisma migrate deploy

echo "==> Migration complete. Backup retained at: $BACKUP_FILE"
echo "    To restore if something went wrong:"
echo "    sudo -u postgres psql praxis < $BACKUP_FILE"
