#!/bin/bash

# Local Database Backup Script
# Backs up tripalfa_local database with timestamp

BACKUP_DIR="./database/backups"
DB_NAME="tripalfa_local"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_backup_${TIMESTAMP}.sql"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo "🔄 Starting database backup..."
echo "   Database: $DB_NAME"
echo "   Output: $BACKUP_FILE"

# Perform backup
pg_dump -U postgres -d "$DB_NAME" -F c -b -v -f "$BACKUP_FILE"

if [ $? -eq 0 ]; then
  FILE_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
  echo "✅ Backup completed successfully"
  echo "   File: $BACKUP_FILE"
  echo "   Size: $FILE_SIZE"
  
  # Keep only last 7 backups
  echo "🧹 Cleaning up old backups (keeping last 7)..."
  ls -t "$BACKUP_DIR"/${DB_NAME}_backup_*.sql 2>/dev/null | tail -n +8 | xargs -r rm
  
  echo "✓ Backup process complete"
else
  echo "❌ Backup failed"
  exit 1
fi
