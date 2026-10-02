#!/bin/sh
set -e
cd /app

# Monta DATABASE_URL com password URL-encoded (evita partir com @ / : # etc.).
if [ -n "${POSTGRES_PASSWORD:-}" ] && [ -n "${POSTGRES_USER:-}" ]; then
  ENCODED_USER=$(node -p "encodeURIComponent(process.env.POSTGRES_USER)")
  ENCODED_PW=$(node -p "encodeURIComponent(process.env.POSTGRES_PASSWORD)")
  DB_NAME="${POSTGRES_DB:-clubos}"
  DB_HOST="${POSTGRES_HOST:-postgres}"
  export DATABASE_URL="postgresql://${ENCODED_USER}:${ENCODED_PW}@${DB_HOST}:5432/${DB_NAME}?schema=public"
fi

pnpm db:deploy
cd /app/apps/api
exec node dist/main.js
