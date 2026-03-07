#!/bin/bash
# Seed database with proper environment setup

set -a
source "$(dirname "$0")/.env.local" 2>/dev/null || true

# Override localhost DATABASE_URL with Neon DIRECT connection for seeding
if [ -n "$DIRECT_DATABASE_URL" ]; then
  export DATABASE_URL="$DIRECT_DATABASE_URL"
fi

# Must have DATABASE_URL set  
if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL must be set in .env.local"
  exit 1
fi

set +a

# Run the seed script
node --require tsx/cjs "./database/prisma/seed.ts"
