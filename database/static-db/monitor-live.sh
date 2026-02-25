#!/bin/bash

# Live Import Monitor for TripAlfa Hotels

echo "🏨 TripAlfa Hotel Import Live Monitor"
echo "=================================="
echo ""

while true; do
  clear
  echo "🏨 TripAlfa Hotel Import Live Monitor"
  echo "=================================="
  echo "Last updated: $(date '+%Y-%m-%d %H:%M:%S')"
  echo ""
  
  # Database stats
  echo "📊 DATABASE STATS:"
  docker exec tripalfa-staticdb psql -U staticdb_admin -d tripalfa_static -t -c \
    "SELECT 'Hotels: ' || COUNT(*) FROM hotel.hotels;
     SELECT 'Images: ' || COUNT(*) FROM hotel.images;
     SELECT 'Rooms: ' || COUNT(*) FROM hotel.rooms;" 2>/dev/null
  
  echo ""
  echo "🌍 IMPORT PROGRESS:"
  docker exec tripalfa-staticdb psql -U staticdb_admin -d tripalfa_static -t -c \
    "SELECT '  Completed: ' || COUNT(*) || ' countries' FROM sync_progress WHERE status='completed';
     SELECT '  In Progress: ' || COUNT(*) || ' countries' FROM sync_progress WHERE status='in_progress';
     SELECT '  Pending: ' || COUNT(*) || ' countries' FROM sync_progress WHERE status='pending';" 2>/dev/null
  
  echo ""
  echo "📝 RECENT LOG (last 5 entries):"
  tail -5 nohup.out | sed 's/^/  /'
  
  echo ""
  echo "⏱️  Refreshing in 10 seconds... (Press Ctrl+C to exit)"
  echo "=================================="
  sleep 10
done
