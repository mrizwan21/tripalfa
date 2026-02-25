#!/bin/bash
# monitor-import.sh - Monitor the LiteAPI import progress

set -e

DB_HOST="localhost"
DB_PORT="5435"
DB_NAME="tripalfa_static"
DB_USER="staticdb_admin"
LOG_FILE="/Users/mohamedrizwan/Desktop/TripAlfa - Node/database/static-db/nohup.out"

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║         LiteAPI Import Monitor                                ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Check if import is running
if pgrep -f "sync-liteapi" > /dev/null; then
  echo "✅ Import process is RUNNING"
  echo ""
else
  echo "❌ Import process is NOT running"
  echo ""
fi

# Get database stats
echo "─ Database Statistics ─"
docker exec tripalfa-staticdb psql -U $DB_USER -d $DB_NAME -t -c "
  SELECT 
    'Hotels' as entity, COUNT(*) as count FROM hotel.hotels
  UNION ALL
  SELECT 'Hotel Images', COUNT(*) FROM hotel.images
  UNION ALL
  SELECT 'Rooms', COUNT(*) FROM hotel.rooms
  UNION ALL
  SELECT 'Room Photos', COUNT(*) FROM hotel.room_photos
  UNION ALL
  SELECT 'Policies', COUNT(*) FROM hotel.policies
  UNION ALL
  SELECT 'Sentiment', COUNT(*) FROM hotel.sentiment_analysis;
" 2>/dev/null || echo "(Database not accessible)"

echo ""
echo "─ Sync Progress ─"
docker exec tripalfa-staticdb psql -U $DB_USER -d $DB_NAME -c "
  SELECT 
    COUNT(*) as total,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
    COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress,
    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed
  FROM sync_progress;
" 2>/dev/null || echo "(sync_progress table not found yet)"

echo ""
echo "─ Latest Log Entries ─"
if [ -f "$LOG_FILE" ]; then
  tail -10 "$LOG_FILE" | grep "hotels listed\|fetched\|Checkpoint\|complete" || tail -5 "$LOG_FILE"
else
  echo "Log file not found: $LOG_FILE"
fi

echo ""
echo "─ Commands ─"
echo "Monitor live:      tail -f \"$LOG_FILE\" | grep 'hotels listed'"
echo "Check failures:    docker exec tripalfa-staticdb psql -U $DB_USER -d $DB_NAME -c \"SELECT country_code, error_message FROM sync_progress WHERE status='failed';\""
echo "View completed:    docker exec tripalfa-staticdb psql -U $DB_USER -d $DB_NAME -c \"SELECT country_code, completed_at FROM sync_progress WHERE status='completed' ORDER BY completed_at DESC LIMIT 10;\""
echo ""
