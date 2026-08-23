#!/bin/sh
set -e

DATA_ROOT="${DATA_DIR:-/app}"
mkdir -p "${DATA_ROOT}/uploads/syllabi"

cd /app

echo "Applying database schema..."
npx prisma db push --accept-data-loss

echo "Starting Study Haul..."
exec "$@"
