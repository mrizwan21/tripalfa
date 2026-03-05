#!/bin/bash
set -e

PROJECT_ROOT="/Users/mohamedrizwan/Desktop/TripAlfa - Node"
DB_PATH="$PROJECT_ROOT/database/static-db"
BACKUP_DIR="$DB_PATH/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}ℹ${NC} $1"; }
log_success() { echo -e "${GREEN}✅${NC} $1"; }
log_warning() { echo -e "${YELLOW}⚠${NC} $1"; }
log_error() { echo -e "${RED}❌${NC} $1"; }

log_info "=========================================="
log_info "PostgreSQL PITR Recovery - LiteAPI Hotels"
log_info "=========================================="
echo ""

mkdir -p "$BACKUP_DIR"

# STEP 1: Safety Backup
log_info "[1/7] Creating safety backup..."
SAFETY_BACKUP="$BACKUP_DIR/safety_backup_$TIMESTAMP.dump"

docker exec tripalfa-staticdb pg_dump -U staticdb_admin -d tripalfa_static \
  -F custom -f /tmp/safety_backup.dump 2>&1 | tail -3

docker cp tripalfa-staticdb:/tmp/safety_backup.dump "$SAFETY_BACKUP"
log_success "Backup: $SAFETY_BACKUP"
echo ""

# STEP 2: Current State
log_info "[2/7] Current database state:"
REV=$(docker exec tripalfa-staticdb psql -U staticdb_admin -d tripalfa_static -A -t \
  -c "SELECT COUNT(*) FROM hotel.reviews;")
log_warning "  Reviews: $REV"
echo ""

# STEP 3: Recovery Config
log_info "[3/7] Creating recovery configuration..."
RECOVERY_CONF="$DB_PATH/recovery.conf"

cat > "$RECOVERY_CONF" << 'EOF'
restore_command = 'cp /var/lib/postgresql/data/pg_wal/%f %p 2>/dev/null'
recovery_target_timeline = 'latest'
recovery_target_time = '2026-03-05 11:41:00 UTC'
recovery_target_inclusive = true
EOF

log_success "Config created"
echo ""

# STEP 4: Stop DB
log_info "[4/7] Stopping database..."
cd "$DB_PATH"
docker-compose down --remove-orphans 2>&1 | grep -v "^$"
sleep 3
log_success "Stopped"
echo ""

# STEP 5: Install Config
log_info "[5/7] Installing recovery configuration..."
docker run --rm \
  -v tripalfa_staticdb_data:/var/lib/postgresql/data \
  -v "$DB_PATH":/backup:ro \
  -u root \
  alpine cp /backup/recovery.conf /var/lib/postgresql/data/recovery.conf 2>&1 | grep -v "^$"

log_success "Installed"
echo ""

# STEP 6: Start Recovery
log_info "[6/7] Starting recovery (5-10 minutes)..."
docker-compose up -d staticdb

for i in {1..60}; do
  sleep 5
  if docker logs tripalfa-staticdb 2>&1 | grep -q "database system is ready"; then
    log_success "Recovery complete!"
    break
  fi
done

sleep 5
log_success "Online"
echo ""

# STEP 7: Verify
log_info "[7/7] Verifying recovery..."
docker exec tripalfa-staticdb psql -U staticdb_admin -d tripalfa_static << 'SQL'
SELECT 'reviews' as table_name, COUNT(*) as row_count FROM hotel.reviews
UNION ALL
SELECT 'rooms', COUNT(*) FROM hotel.rooms
UNION ALL
SELECT 'room_photos', COUNT(*) FROM hotel.room_photos;
SQL

NEW_REV=$(docker exec tripalfa-staticdb psql -U staticdb_admin -d tripalfa_static -A -t \
  -c "SELECT COUNT(*) FROM hotel.reviews;")

echo ""
if [ "$NEW_REV" -gt 0 ]; then
  log_success "RECOVERY SUCCESSFUL! Recovered $NEW_REV reviews"
  rm -f "$RECOVERY_CONF"
  docker-compose up -d pgadmin
  log_success "All services online"
else
  log_error "Recovery failed - no data recovered"
fi
