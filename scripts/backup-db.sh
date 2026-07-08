#!/usr/bin/env bash
# Backup PostgreSQL do ClubOS (formato custom pg_dump -Fc).
# Uso: ./scripts/backup-db.sh [directorio_saida]
# Requer: Docker com contentor clubos-postgres OU pg_dump no PATH + DATABASE_URL.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT_DIR="${1:-$ROOT/backups}"
mkdir -p "$OUT_DIR"

TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
OUT_FILE="$OUT_DIR/clubos-${TIMESTAMP}.dump"

if docker ps --format '{{.Names}}' 2>/dev/null | grep -qx 'clubos-postgres'; then
  echo "Backup via Docker (clubos-postgres) -> $OUT_FILE"
  docker exec clubos-postgres pg_dump -U clubos -Fc --no-owner --no-acl clubos > "$OUT_FILE"
elif command -v pg_dump >/dev/null 2>&1 && [[ -n "${DATABASE_URL:-}" ]]; then
  echo "Backup via pg_dump (DATABASE_URL) -> $OUT_FILE"
  pg_dump "$DATABASE_URL" -Fc --no-owner --no-acl -f "$OUT_FILE"
else
  echo "Erro: arranca o Postgres (pnpm docker:up) ou define DATABASE_URL com pg_dump instalado." >&2
  exit 1
fi

SIZE="$(du -h "$OUT_FILE" | cut -f1)"
echo "Backup concluido ($SIZE): $OUT_FILE"
echo "Restore: pnpm db:restore -- $OUT_FILE"
