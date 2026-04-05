#!/bin/bash

# Database Health Check Script
# Monitors both application (5433) and analytics (5432) databases

echo "🔍 Database Health Check - $(date)"
echo "=========================================="

# Function to check database health
check_database() {
  local db_name=$1
  local db_port=$2
  local db_type=$3
  
  echo ""
  echo "Checking $db_type database ($db_name on port $db_port)..."
  
  # Check if database is reachable
  if pg_isready -h localhost -p "$db_port" -d "$db_name" >/dev/null 2>&1; then
    echo "  ✅ Connection: OK"
    
    # Get basic stats
    echo "  📊 Getting database statistics..."
    
    # Get table count
    table_count=$(psql -h localhost -p "$db_port" -d "$db_name" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | tr -d ' ' || echo "N/A")
    
    # Get database size
    db_size=$(psql -h localhost -p "$db_port" -d "$db_name" -t -c "SELECT pg_size_pretty(pg_database_size('$db_name'));" 2>/dev/null | tr -d ' ' || echo "N/A")
    
    # Get connection count
    conn_count=$(psql -h localhost -p "$db_port" -d "$db_name" -t -c "SELECT COUNT(*) FROM pg_stat_activity WHERE datname = '$db_name';" 2>/dev/null | tr -d ' ' || echo "N/A")
    
    echo "  📈 Tables: $table_count"
    echo "  💾 Size: $db_size"
    echo "  🔗 Connections: $conn_count"
    
    return 0
  else
    echo "  ❌ Connection: FAILED"
    return 1
  fi
}

# Check application databases (port 5433)
echo ""
echo "📱 APPLICATION DATABASES (Port 5433)"
echo "------------------------------------------"

check_database "tripalfa_core" "5433" "Core"
check_database "tripalfa_local" "5433" "Local"
check_database "tripalfa_ops" "5433" "Ops"
check_database "tripalfa_finance" "5433" "Finance"

# Check analytics database (port 5432)
echo ""
echo "📊 ANALYTICS DATABASE (Port 5432)"
echo "------------------------------------------"
check_database "tripalfa_analytics" "5432" "Analytics"

# Check Redis
echo ""
echo "🧠 REDIS CACHE"
echo "------------------------------------------"
if redis-cli ping >/dev/null 2>&1; then
  echo "  ✅ Redis: OK"
  redis_info=$(redis-cli info memory | grep -E "used_memory_human|maxmemory_human" | head -2)
  echo "  📊 $(echo "$redis_info" | sed 's/^/  /')"
else
  echo "  ❌ Redis: FAILED"
fi

echo ""
echo "=========================================="
echo "✅ Health check completed at $(date)"