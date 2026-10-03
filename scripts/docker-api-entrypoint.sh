#!/bin/sh
set -e
cd /app

# Em Docker Compose (POSTGRES_HOST definido) remonta sempre o URL interno.
# Assim um DATABASE_URL=@localhost copiado do .env.example nao parte o contentor.
# Fora do Compose, respeita DATABASE_URL se ja existir.
if [ -n "${POSTGRES_HOST:-}" ] && [ -n "${POSTGRES_PASSWORD:-}" ] && [ -n "${POSTGRES_USER:-}" ]; then
  ENCODED_USER=$(node -p "encodeURIComponent(process.env.POSTGRES_USER)")
  ENCODED_PW=$(node -p "encodeURIComponent(process.env.POSTGRES_PASSWORD)")
  DB_NAME="${POSTGRES_DB:-clubos}"
  export DATABASE_URL="postgresql://${ENCODED_USER}:${ENCODED_PW}@${POSTGRES_HOST}:5432/${DB_NAME}?schema=public"
elif [ -z "${DATABASE_URL:-}" ] && [ -n "${POSTGRES_PASSWORD:-}" ] && [ -n "${POSTGRES_USER:-}" ]; then
  ENCODED_USER=$(node -p "encodeURIComponent(process.env.POSTGRES_USER)")
  ENCODED_PW=$(node -p "encodeURIComponent(process.env.POSTGRES_PASSWORD)")
  DB_NAME="${POSTGRES_DB:-clubos}"
  DB_HOST="${POSTGRES_HOST:-postgres}"
  export DATABASE_URL="postgresql://${ENCODED_USER}:${ENCODED_PW}@${DB_HOST}:5432/${DB_NAME}?schema=public"
fi

pnpm db:deploy
cd /app/apps/api
exec node dist/main.js
