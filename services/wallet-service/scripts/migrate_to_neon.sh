#!/bin/bash
# migrate_to_neon.sh
# Usage: ./migrate_to_neon.sh <NEON_DATABASE_URL> <DUMP_FILE>
# Example: ./migrate_to_neon.sh postgresql://user:pass@host/db?sslmode=require wallet_db.dump

set -e

if [ "$#" -ne 2 ]; then
  echo "Usage: $0 <NEON_DATABASE_URL> <DUMP_FILE>"
  exit 1
fi

NEON_URL="$1"
DUMP_FILE="$2"

# Extract connection params for pg_restore
PGHOST=$(echo "$NEON_URL" | sed -E 's|.*@([^:/]+).*|\1|')
PGUSER=$(echo "$NEON_URL" | sed -E 's|postgresql://([^:]+):.*|\1|')
PGPASSWORD=$(echo "$NEON_URL" | sed -E 's|postgresql://[^:]+:([^@]+)@.*|\1|')
PGDATABASE=$(echo "$NEON_URL" | sed -E 's|.*/([^?]+).*|\1|')
PGPORT=5432
export PGPASSWORD

# Restore to Neon
pg_restore --no-owner --no-privileges -h "$PGHOST" -U "$PGUSER" -d "$PGDATABASE" -p "$PGPORT" "$DUMP_FILE"

unset PGPASSWORD
echo "Migration to Neon completed."
