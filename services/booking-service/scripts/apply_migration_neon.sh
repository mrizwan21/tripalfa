#!/usr/bin/env bash
# Apply notifications migration to a Neon (or other) Postgres instance using psql.
# Usage: DATABASE_URL="postgres://..." ./scripts/apply_migration_neon.sh

set -euo pipefail

if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERROR: DATABASE_URL must be set to your Neon connection string. Example:"
  echo "  export DATABASE_URL=\"postgres://user:pass@host:port/db?sslmode=require\""
  exit 2
fi

SQL_FILE="$(cd "$(dirname "$0")/../../.." && pwd)/database/migrations/20260129_create_notifications_table.sql"

echo "Applying migration from: $SQL_FILE"

# psql respects PGSSLMODE and other PG env vars; ensure sslmode is require for Neon
export PGSSLMODE=${PGSSLMODE:-require}

# Use psql; if psql is not available, suggest Node helper
if command -v psql >/dev/null 2>&1; then
  echo "Running psql..."
  psql "$DATABASE_URL" -f "$SQL_FILE"
  echo "Migration applied successfully."
else
  echo "psql not found. You can run the Node helper: node scripts/apply_migration_neon.js"
  exit 1
fi
