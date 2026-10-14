#!/bin/sh
set -e

DATA_ROOT="${DATA_DIR:-/app}"
mkdir -p "${DATA_ROOT}/uploads/syllabi"

cd /app

echo "Applying database schema..."
# 2P-51 — Prefer migrate deploy when migrations exist.
# Never default to --accept-data-loss (destructive). Opt-in via ALLOW_DB_DATA_LOSS=1.
if [ -d prisma/migrations ] && find prisma/migrations -mindepth 2 -name 'migration.sql' | head -n 1 | grep -q .; then
  echo "Using prisma migrate deploy..."
  npx prisma migrate deploy
elif [ "${ALLOW_DB_DATA_LOSS:-0}" = "1" ]; then
  echo "ALLOW_DB_DATA_LOSS=1 — prisma db push --accept-data-loss"
  npx prisma db push --accept-data-loss
else
  echo "Using prisma db push (no data-loss flag)..."
  npx prisma db push
fi

echo "Starting Study Haul..."
exec "$@"
