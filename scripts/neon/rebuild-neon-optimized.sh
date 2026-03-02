#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"

# Required Neon admin connection must point to maintenance DB (usually postgres)
# Example:
# export NEON_ADMIN_DATABASE_URL="postgresql://neondb_owner:***@<host>/postgres?sslmode=require"
# export NEON_POOLED_HOST="<pooler-host>"
# export NEON_DIRECT_HOST="<direct-host>"
# export DB_PASSWORD="***"

# Fallback: derive required variables from existing DATABASE_URL + DIRECT_DATABASE_URL
# (useful when service env files already contain Neon URLs)
if [[ -z "${NEON_ADMIN_DATABASE_URL:-}" || -z "${NEON_POOLED_HOST:-}" || -z "${NEON_DIRECT_HOST:-}" || -z "${DB_PASSWORD:-}" ]]; then
  if [[ -n "${DATABASE_URL:-}" && -n "${DIRECT_DATABASE_URL:-}" ]]; then
    eval "$(python3 - <<'PY'
import os
from urllib.parse import urlparse

db = os.environ.get('DATABASE_URL', '').strip('"')
direct = os.environ.get('DIRECT_DATABASE_URL', '').strip('"')

u1 = urlparse(db)
u2 = urlparse(direct)

user = u2.username or u1.username or ''
pw = u2.password or u1.password or ''
pooled_host = u1.hostname or ''
direct_host = u2.hostname or ''
port = u2.port or 5432

if all([user, pw, pooled_host, direct_host]):
    admin = f'postgresql://{user}:{pw}@{direct_host}:{port}/postgres?sslmode=require&connect_timeout=15'
    print(f'export NEON_POOLED_HOST={pooled_host}')
    print(f'export NEON_DIRECT_HOST={direct_host}')
    print(f'export DB_PASSWORD={pw}')
    print(f'export NEON_ADMIN_DATABASE_URL="{admin}"')
PY
)"
  fi
fi

required_vars=(NEON_ADMIN_DATABASE_URL NEON_POOLED_HOST NEON_DIRECT_HOST DB_PASSWORD)
for var in "${required_vars[@]}"; do
  if [[ -z "${!var:-}" ]]; then
    echo "❌ Missing required variable: $var"
    exit 1
  fi
done

if [[ "${NEON_ADMIN_DATABASE_URL}" == *"staticdatabase"* ]]; then
  echo "❌ NEON_ADMIN_DATABASE_URL points to staticdatabase. Aborting."
  exit 1
fi

# Databases to recreate in Neon (optimized topology)
# staticdatabase is intentionally excluded and must remain local Docker only.
TARGET_DATABASES=(
  "neondb"
  "tripalfa_user_service"
  "tripalfa_payment_service"
  "tripalfa_booking_service"
  "tripalfa_notification_service"
  "tripalfa_wallet_service"
  "tripalfa_audit_service"
)

echo "🔎 Verifying target list..."
printf ' - %s\n' "${TARGET_DATABASES[@]}"

echo "⛔ Terminating active connections for target Neon DBs..."
for db in "${TARGET_DATABASES[@]}"; do
  psql "${NEON_ADMIN_DATABASE_URL}" -v ON_ERROR_STOP=1 -c "
    SELECT pg_terminate_backend(pid)
    FROM pg_stat_activity
    WHERE datname = '${db}'
      AND pid <> pg_backend_pid();
  " >/dev/null || true
done

echo "🗑️ Dropping existing target Neon DBs (if any)..."
for db in "${TARGET_DATABASES[@]}"; do
  psql "${NEON_ADMIN_DATABASE_URL}" -v ON_ERROR_STOP=1 -c "DROP DATABASE IF EXISTS \"${db}\";"
done

echo "🏗️ Creating optimized Neon DB topology..."
for db in "${TARGET_DATABASES[@]}"; do
  psql "${NEON_ADMIN_DATABASE_URL}" -v ON_ERROR_STOP=1 -c "CREATE DATABASE \"${db}\";"
done

echo "⚙️ Applying database-level tuning defaults..."
for db in "${TARGET_DATABASES[@]}"; do
  psql "${NEON_ADMIN_DATABASE_URL}" -v ON_ERROR_STOP=1 -c "ALTER DATABASE \"${db}\" SET statement_timeout='30s';"
  psql "${NEON_ADMIN_DATABASE_URL}" -v ON_ERROR_STOP=1 -c "ALTER DATABASE \"${db}\" SET lock_timeout='5s';"
  psql "${NEON_ADMIN_DATABASE_URL}" -v ON_ERROR_STOP=1 -c "ALTER DATABASE \"${db}\" SET idle_in_transaction_session_timeout='10s';"
  psql "${NEON_ADMIN_DATABASE_URL}" -v ON_ERROR_STOP=1 -c "ALTER DATABASE \"${db}\" SET default_statistics_target='200';"
done

echo "🧱 Pushing Prisma schema to core DB (neondb)..."
export DATABASE_URL="postgresql://neondb_owner:${DB_PASSWORD}@${NEON_POOLED_HOST}/neondb?sslmode=require&pgbouncer=true&connection_limit=20"
export DIRECT_DATABASE_URL="postgresql://neondb_owner:${DB_PASSWORD}@${NEON_DIRECT_HOST}/neondb?sslmode=require"

cd "${ROOT_DIR}"
pnpm exec prisma db push --schema=database/prisma/schema.prisma
pnpm exec prisma generate --schema=database/prisma/schema.prisma

echo "✅ Neon rebuild + core schema deployment complete."
echo "ℹ️ staticdatabase was not touched (local Docker only)."
