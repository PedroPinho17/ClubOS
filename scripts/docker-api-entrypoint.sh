#!/bin/sh
set -e
cd /app
pnpm db:deploy
cd /app/apps/api
exec node dist/main.js
