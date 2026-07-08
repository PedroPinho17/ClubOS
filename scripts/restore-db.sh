#!/usr/bin/env bash
# Restaura backup PostgreSQL do ClubOS (ficheiro .dump do pg_dump -Fc).
# Uso: ./scripts/restore-db.sh caminho/para/clubos-YYYYMMDD-HHMMSS.dump
# ATENCAO: substitui dados da base clubos.

set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Uso: $0 <ficheiro.dump>" >&2
  exit 1
fi

DUMP_FILE="$1"
if [[ ! -f "$DUMP_FILE" ]]; then
  echo "Ficheiro em falta: $DUMP_FILE" >&2
  exit 1
fi

if docker ps --format '{{.Names}}' 2>/dev/null | grep -qx 'clubos-postgres'; then
  echo "A restaurar via Docker (clubos-postgres)..."
  docker exec -i clubos-postgres pg_restore -U clubos -d clubos --clean --if-exists --no-owner --no-acl < "$DUMP_FILE"
elif command -v pg_restore >/dev/null 2>&1 && [[ -n "${DATABASE_URL:-}" ]]; then
  echo "A restaurar via pg_restore (DATABASE_URL)..."
  pg_restore -d "$DATABASE_URL" --clean --if-exists --no-owner --no-acl "$DUMP_FILE"
else
  echo "Erro: arranca o Postgres (pnpm docker:up) ou define DATABASE_URL com pg_restore instalado." >&2
  exit 1
fi

echo "Restore concluido."
