#!/bin/bash

# Local Database Restore Script
# Restores tripalfa_local database from backup

DB_NAME="tripalfa_local"
BACKUP_FILE="${1:-.}"

if [ "$BACKUP_FILE" = "." ]; then
  echo "❌ Usage: ./restore-local-database.sh <backup-file>"
  echo ""
  echo "Available backups:"
  ls -lh ./database/backups/${DB_NAME}_backup_*.sql 2>/dev/null | tail -10
  exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
  echo "❌ Backup file not found: $BACKUP_FILE"
  exit 1
fi

echo "⚠️  WARNING: This will DROP the current database!"
echo "Database: $DB_NAME"
echo "Backup:   $BACKUP_FILE"
read -p "Continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
  echo "Restore cancelled"
  exit 0
fi

echo "🔄 Dropping existing database..."
psql -U postgres -tc "DROP DATABASE IF EXISTS $DB_NAME;"

echo "🔄 Creating new database..."
psql -U postgres -tc "CREATE DATABASE $DB_NAME;"

echo "🔄 Restoring from backup..."
pg_restore -U postgres -d "$DB_NAME" -v "$BACKUP_FILE"

if [ $? -eq 0 ]; then
  echo "✅ Restore completed successfully"
  echo "✓ Database restored from: $BACKUP_FILE"
else
  echo "❌ Restore failed"
  exit 1
fi
