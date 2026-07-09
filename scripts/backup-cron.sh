#!/usr/bin/env bash
# Exemplo cron diario (VPS) — ajustar caminhos e credenciais S3.
# crontab -e:
# 0 3 * * * /opt/clubos/scripts/backup-cron.sh >> /var/log/clubos-backup.log 2>&1

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export DATABASE_URL="${DATABASE_URL:?DATABASE_URL em falta}"

pnpm db:backup

# Opcional: enviar para S3 (requer AWS CLI configurado)
if [ -n "${BACKUP_S3_BUCKET:-}" ]; then
  LATEST="$(ls -t backups/clubos-*.dump 2>/dev/null | head -1)"
  if [ -n "$LATEST" ]; then
    aws s3 cp "$LATEST" "s3://${BACKUP_S3_BUCKET}/clubos/$(basename "$LATEST")"
  fi
fi

echo "[$(date -Iseconds)] Backup concluido."
