#!/bin/bash
# full_neon_deploy.sh
# Automates Neon bulk database migration and deployment for wallet-service

set -e

# 1. Export Docker/Postgres database
echo "Step 1: Exporting Docker/Postgres database..."
echo "Enter Docker container name (or ID):"
read CONTAINER

echo "Enter Postgres user (default: postgres):"
read -r DB_USER
DB_USER=${DB_USER:-postgres}

echo "Enter database name (default: wallet_db):"
read -r DB_NAME
DB_NAME=${DB_NAME:-wallet_db}

echo "Exporting database..."
docker exec -t "$CONTAINER" pg_dump -U "$DB_USER" -d "$DB_NAME" -Fc -f /tmp/wallet_db.dump
docker cp "$CONTAINER":/tmp/wallet_db.dump ./wallet_db.dump

echo "Database exported to ./wallet_db.dump"

# 2. Import into Neon
echo "Step 2: Importing into Neon..."
echo "Enter your Neon DATABASE_URL (see .env.example):"
read NEON_URL

chmod +x ./services/wallet-service/scripts/migrate_to_neon.sh
./services/wallet-service/scripts/migrate_to_neon.sh "$NEON_URL" wallet_db.dump

echo "Migration to Neon complete."

# 3. Prompt to update .env
echo "Step 3: Update your .env file with the Neon DATABASE_URL if you haven't already."
echo "Press Enter to continue after updating .env."
read

# 4. Run migrations (optional)
echo "Step 4: Run migrations (if needed)"
echo "Run: npm run migrations"

echo "Step 5: Start your service and verify endpoints."
echo "Run: npm run dev or npm start"

echo "All done!"
