# Database Backup and Restore Strategy

## Overview

TripAlfa uses 4 separate PostgreSQL databases. This document outlines the comprehensive backup and restore strategy for all databases, ensuring data durability and quick recovery in case of failures.

## Database Architecture

| Database | Purpose | Size Estimate | Backup Priority |
|----------|---------|---------------|-----------------|
| `tripalfa_core` | Users, bookings, wallet, KYC | High | Critical |
| `tripalfa_local` | Static reference data (hotels, flights) | Medium | High |
| `tripalfa_ops` | Notifications, rules, documents | Medium | High |
| `tripalfa_finance` | Invoices, commissions, suppliers | High | Critical |

## Backup Strategy

### Backup Types

1. **Full Backups** (Weekly)
   - Complete dump of all 4 databases
   - Compressed with gzip
   - Stored with timestamp
   - Retention: 4 weeks

2. **Incremental Backups** (Daily)
   - Only data changed since last full backup
   - Using PostgreSQL WAL archiving
   - Retention: 7 days

3. **Transaction Log Backups** (Every 15 minutes)
   - WAL (Write-Ahead Logging) segments
   - Enables point-in-time recovery
   - Retention: 24 hours

### Backup Schedule

```bash
# Weekly full backup (Sunday 2:00 AM)
0 2 * * 0 /path/to/scripts/backup-all-databases.sh full

# Daily incremental backup (2:00 AM)
0 2 * * 1-6 /path/to/scripts/backup-all-databases.sh incremental

# Transaction log backup (every 15 minutes)
*/15 * * * * /path/to/scripts/backup-wal-segments.sh
```

## Backup Implementation

### Full Database Backup Script

**Location**: `scripts/backup-all-databases.sh`

```bash
#!/bin/bash
# Full backup of all 4 TripAlfa databases

set -e

BACKUP_DIR="./database/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="${BACKUP_DIR}/backup-${TIMESTAMP}.log"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Log function
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "Starting full database backup..."

# Databases to backup
DATABASES=("tripalfa_core" "tripalfa_local" "tripalfa_ops" "tripalfa_finance")

for DB in "${DATABASES[@]}"; do
    BACKUP_FILE="${BACKUP_DIR}/${DB}_${TIMESTAMP}.dump"
    log "Backing up ${DB} to ${BACKUP_FILE}..."
    
    # Perform backup with pg_dump
    pg_dump -U postgres -d "$DB" -F c -b -v -f "$BACKUP_FILE" 2>&1 | tee -a "$LOG_FILE"
    
    # Compress backup
    gzip "$BACKUP_FILE"
    log "Compressed: ${BACKUP_FILE}.gz"
    
    # Verify backup
    if pg_restore -l "${BACKUP_FILE}.gz" > /dev/null 2>&1; then
        log "✓ Backup verified: ${DB}"
    else
        log "✗ Backup verification failed: ${DB}"
        exit 1
    fi
done

# Clean up old backups (keep last 4 full backups)
log "Cleaning up old backups (keeping last 4)..."
ls -t "${BACKUP_DIR}"/*_*.dump.gz 2>/dev/null | tail -n +5 | xargs -r rm

log "Full backup completed successfully!"
```

### WAL Archiving Configuration

**PostgreSQL Configuration** (`database/postgresql.conf`):

```conf
# Enable WAL archiving
wal_level = replica
archive_mode = on
archive_command = 'cp %p /path/to/backups/wal/%f'
archive_cleanup_command = 'pg_archivecleanup /path/to/backups/wal %r'
```

**Recovery Configuration** (`database/recovery.conf`):

```conf
restore_command = 'cp /path/to/backups/wal/%f %p'
recovery_target_timeline = 'latest'
```

### Backup Verification

Automatically verify backups after creation:

```bash
#!/bin/bash
# Verify a backup file is valid

BACKUP_FILE=$1

if ! pg_restore -l "$BACKUP_FILE" > /dev/null 2>&1; then
    echo "❌ Backup verification failed: $BACKUP_FILE"
    exit 1
fi

# Check backup size (should be > 1MB for non-empty DB)
SIZE=$(du -m "$BACKUP_FILE" | cut -f1)
if [ "$SIZE" -lt 1 ]; then
    echo "❌ Backup too small: $BACKUP_FILE ($SIZE MB)"
    exit 1
fi

echo "✓ Backup verified: $BACKUP_FILE (${SIZE}MB)"
```

## Restore Procedures

### Restore All Databases

**Script**: `scripts/restore-all-databases.sh`

```bash
#!/bin/bash
# Restore all databases from latest backup

set -e

BACKUP_DIR="./database/backups"
LOG_FILE="${BACKUP_DIR}/restore-$(date +%Y%m%d_%H%M%S).log"

# Check if specific timestamp provided
if [ $# -eq 1 ]; then
    TIMESTAMP=$1
    log "Restoring all databases from timestamp: ${TIMESTAMP}"
else
    # Get latest backup timestamp
    TIMESTAMP=$(ls -t "${BACKUP_DIR}"/*_*.dump.gz 2>/dev/null | head -1 | sed 's/.*_\(.*\)\.dump\.gz/\1/')
    log "Restoring all databases from latest backup: ${TIMESTAMP}"
fi

DATABASES=("tripalfa_core" "tripalfa_local" "tripalfa_ops" "tripalfa_finance")

for DB in "${DATABASES[@]}"; do
    BACKUP_FILE="${BACKUP_DIR}/${DB}_${TIMESTAMP}.dump.gz"
    
    if [ ! -f "$BACKUP_FILE" ]; then
        log "✗ Backup file not found: $BACKUP_FILE"
        exit 1
    fi
    
    log "Restoring ${DB}..."
    
    # Drop existing database
    PGPASSWORD="" psql -U postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='${DB}' AND pid <> pg_backend_pid();" 2>/dev/null || true
    PGPASSWORD="" psql -U postgres -c "DROP DATABASE IF EXISTS ${DB};" 2>/dev/null
    
    # Create and restore
    PGPASSWORD="" psql -U postgres -c "CREATE DATABASE ${DB};"
    gunzip -c "$BACKUP_FILE" | pg_restore -U postgres -d "$DB" --verbose 2>&1 | tee -a "$LOG_FILE"
    
    log "✓ Restored: ${DB}"
done

log "All databases restored successfully!"
```

### Restore Single Database

**Script**: `scripts/restore-single-database.sh`

```bash
#!/bin/bash
# Restore a single database

USAGE="Usage: $0 -d DATABASE [-t TIMESTAMP]"

DATABASE=""
TIMESTAMP=""

while getopts "d:t:h" opt; do
    case "$opt" in
        d) DATABASE=$OPTARG ;;
        t) TIMESTAMP=$OPTARG ;;
        h) echo "$USAGE"; exit 0 ;;
        *) echo "$USAGE"; exit 1 ;;
    esac
done

if [ -z "$DATABASE" ]; then
    echo "Error: Database name required"
    echo "$USAGE"
    exit 1
fi

BACKUP_DIR="./database/backups"

# Find backup file
if [ -z "$TIMESTAMP" ]; then
    BACKUP_FILE=$(ls -t "${BACKUP_DIR}/${DATABASE}"_*.dump.gz 2>/dev/null | head -1)
else
    BACKUP_FILE="${BACKUP_DIR}/${DATABASE}_${TIMESTAMP}.dump.gz"
fi

if [ ! -f "$BACKUP_FILE" ]; then
    echo "Error: Backup file not found: $BACKUP_FILE"
    echo "Available backups:"
    ls -1 "${BACKUP_DIR}/${DATABASE}"_*.dump.gz 2>/dev/null || echo "  None found"
    exit 1
fi

echo "⚠️  WARNING: This will DROP and recreate database '${DATABASE}'"
echo "Backup: $(basename "$BACKUP_FILE")"
read -p "Continue? (yes/no): " CONFIRM

if [[ "$CONFIRM" != "yes" ]]; then
    echo "Restore cancelled"
    exit 0
fi

# Drop existing database
PGPASSWORD="" psql -U postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='${DATABASE}' AND pid <> pg_backend_pid();" 2>/dev/null || true
PGPASSWORD="" psql -U postgres -c "DROP DATABASE IF EXISTS ${DATABASE};" 2>/dev/null

# Create and restore
PGPASSWORD="" psql -U postgres -c "CREATE DATABASE ${DATABASE};"
gunzip -c "$BACKUP_FILE" | pg_restore -U postgres -d "$DATABASE" --verbose

echo "✓ Database '${DATABASE}' restored successfully"
```

### Point-in-Time Recovery (PITR)

For critical databases (`tripalfa_core`, `tripalfa_finance`), enable PITR:

1. **Configure WAL Archiving** (see above)
2. **Take a base backup**:
   ```bash
   pg_basebackup -D /path/to/backup/base -Ft -z -P -U postgres
   ```

3. **Restore to specific time**:
   ```bash
   # Restore base backup
   tar -xzf base_backup.tar.gz -C /var/lib/postgresql/restore
   
   # Copy WAL segments to archive location
   cp /path/to/wal_archive/* /var/lib/postgresql/restore/pg_wal/
   
   # Create recovery.conf
   cat > /var/lib/postgresql/restore/recovery.conf << EOF
   restore_command = 'cp /path/to/wal_archive/%f %p'
   recovery_target_time = '2025-03-27 10:30:00'
   recovery_target_action = 'promote'
   EOF
   
   # Start PostgreSQL
   pg_ctl -D /var/lib/postgresql/restore start
   ```

## Backup Storage and Retention

### Local Storage

```
database/backups/
├── tripalfa_core_20260327_020000.dump.gz  # Full backup (weekly)
├── tripalfa_local_20260327_020000.dump.gz
├── tripalfa_ops_20260327_020000.dump.gz
├── tripalfa_finance_20260327_020000.dump.gz
├── wal/
│   ├── 000000010000000000000001   # WAL segments (15min intervals)
│   ├── 000000010000000000000002
│   └── ...
└── backup-20260327_020000.log        # Backup log
```

### Offsite Storage (Production)

Copy backups to offsite location daily:

```bash
#!/bin/bash
# Upload backups to S3/cloud storage

BACKUP_DIR="./database/backups"
LATEST_BACKUP=$(ls -t "${BACKUP_DIR}"/*_*.dump.gz 2>/dev/null | head -1)

if [ -f "$LATEST_BACKUP" ]; then
    aws s3 cp "$LATEST_BACKUP" "s3://tripalfa-backups/$(date +%Y/%m)/" \
        --storage-class STANDARD_IA
fi

# Upload WAL segments
aws s3 sync "${BACKUP_DIR}/wal/" "s3://tripalfa-backups/wal/$(date +%Y/%m/%d)/" \
    --exclude "*" --include "0000000100000000*"
```

### Retention Policy

| Backup Type | Retention | Storage Location |
|-------------|-----------|------------------|
| Full backups | 4 weeks | Local + S3 |
| Incremental backups | 7 days | Local + S3 |
| WAL segments | 24 hours | Local + S3 |
| Audit logs | 7 years | S3 Glacier |

## Monitoring and Alerting

### Backup Success/Failure Alerts

Add to `infrastructure/monitoring/alert-rules.yml`:

```yaml
# Alert if backup fails
- alert: BackupFailed
  expr: backup_last_success_timestamp{job="backup"} < time() - 86400
  for: 5m
  labels:
    severity: critical
  annotations:
    description: "Database backup failed for {{ $labels.database }}"
    summary: "Backup failed: {{ $labels.database }}"

# Alert if backup size is too small (possible corruption)
- alert: BackupTooSmall
  expr: backup_size_bytes{job="backup"} < 1048576  # 1MB
  for: 1h
  labels:
    severity: warning
  annotations:
    description: "Backup for {{ $labels.database }} is suspiciously small"
    summary: "Backup size anomaly: {{ $labels.database }}"
```

### Backup Metrics

Expose backup metrics for Prometheus:

```bash
#!/bin/bash
# scripts/backup-metrics.sh

BACKUP_DIR="./database/backups"
LATEST_BACKUP=$(ls -t "${BACKUP_DIR}"/*_*.dump.gz 2>/dev/null | head -1)

if [ -f "$LATEST_BACKUP" ]; then
    TIMESTAMP=$(stat -c %Y "$LATEST_BACKUP")
    SIZE=$(stat -c %s "$LATEST_BACKUP")
    DB_NAME=$(basename "$LATEST_BACKUP" | cut -d'_' -f1)
    
    echo "backup_last_success_timestamp{database=\"${DB_NAME}\"} ${TIMESTAMP}"
    echo "backup_size_bytes{database=\"${DB_NAME}\"} ${SIZE}"
fi
```

## Testing Restore Procedures

### Quarterly Restore Tests

Schedule quarterly tests to ensure backups are valid and restore procedures work:

1. **Create test environment**:
   ```bash
   createdb tripalfa_core_test
   createdb tripalfa_local_test
   createdb tripalfa_ops_test
   createdb tripalfa_finance_test
   ```

2. **Restore backups to test databases**:
   ```bash
   ./scripts/restore-all-databases.sh -t 20260327_020000 \
       -d tripalfa_core_test \
       -d tripalfa_local_test \
       -d tripalfa_ops_test \
       -d tripalfa_finance_test
   ```

3. **Verify data integrity**:
   ```sql
   -- Check row counts match expected values
   SELECT 'tripalfa_core.users' as table_name, COUNT(*) as count FROM tripalfa_core_test.users;
   SELECT 'tripalfa_core.bookings' as table_name, COUNT(*) as count FROM tripalfa_core_test.bookings;
   -- ... repeat for all critical tables
   ```

4. **Run application tests** against restored databases:
   ```bash
   DATABASE_URL="postgresql://postgres:password@localhost:5432/tripalfa_core_test" \
   pnpm --filter booking-service test
   ```

5. **Document results** in `database/restore-test-results/`

### Automated Backup Validation

Add to CI/CD pipeline:

```yaml
# .github/workflows/backup-validation.yml
name: Backup Validation
on:
  schedule:
    - cron: '0 3 * * 0'  # Weekly Sunday 3AM
  workflow_dispatch:

jobs:
  validate-backup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Download latest backup
        run: |
          aws s3 cp s3://tripalfa-backups/latest/ ./backup/ --recursive
      - name: Validate backup integrity
        run: |
          for file in ./backup/*.dump.gz; do
            if ! gunzip -t "$file"; then
              echo "❌ Backup corrupted: $file"
              exit 1
            fi
          done
      - name: Test restore to temporary database
        run: |
          docker-compose up -d postgres
          ./scripts/restore-single-database.sh -d tripalfa_core_test -t $(basename latest_backup .dump.gz)
          # Run validation queries
```

## Disaster Recovery

### Recovery Time Objectives (RTO)

| Database | RTO | Recovery Method |
|----------|-----|-----------------|
| `tripalfa_core` | 1 hour | Full restore from backup + WAL replay |
| `tripalfa_finance` | 1 hour | Full restore from backup + WAL replay |
| `tripalfa_local` | 4 hours | Full restore from backup |
| `tripalfa_ops` | 4 hours | Full restore from backup |

### Recovery Point Objectives (RPO)

| Database | RPO | Backup Frequency |
|----------|-----|------------------|
| `tripalfa_core` | 15 minutes | WAL archiving every 15min |
| `tripalfa_finance` | 15 minutes | WAL archiving every 15min |
| `tripalfa_local` | 24 hours | Daily incremental |
| `tripalfa_ops` | 24 hours | Daily incremental |

### Disaster Recovery Runbook

1. **Assess damage**: Determine which databases are affected
2. **Notify stakeholders**: Alert team of outage and estimated recovery time
3. **Provision new infrastructure**: Spin up new PostgreSQL instances
4. **Restore latest full backup**: Use most recent full backup
5. **Apply WAL segments**: Replay transaction logs to latest point
6. **Verify data integrity**: Run validation queries
7. **Update connection strings**: Point applications to new databases
8. **Monitor**: Watch for errors and performance issues
9. **Post-mortem**: Document incident and improve procedures

## Security Considerations

### Backup Encryption

Encrypt backups at rest:

```bash
# Encrypt with GPG
gpg --encrypt --recipient "tripalfa-backup@example.com" \
    --output "${BACKUP_FILE}.gpg" "${BACKUP_FILE}"

# Or use openssl
openssl enc -aes-256-cbc -salt -in "${BACKUP_FILE}" \
    -out "${BACKUP_FILE}.enc" -k "$ENCRYPTION_KEY"
```

### Access Control

- Backup directory: `chmod 700`, owned by `postgres:postgres`
- Only DBAs and sysadmins have access
- Use separate IAM roles for backup/restore operations
- Audit all backup/restore access

### Backup Integrity

- Store checksums of all backups:
  ```bash
  sha256sum "${BACKUP_FILE}" > "${BACKUP_FILE}.sha256"
  ```
- Verify checksum before restore:
  ```bash
  sha256sum -c "${BACKUP_FILE}.sha256"
  ```

## Automation and Monitoring

### Cron Jobs

```bash
# /etc/cron.d/tripalfa-backups
0 2 * * 0 postgres /path/to/scripts/backup-all-databases.sh full
0 2 * * 1-6 postgres /path/to/scripts/backup-all-databases.sh incremental
*/15 * * * * postgres /path/to/scripts/backup-wal-segments.sh
0 6 * * * postgres /path/to/scripts/upload-backups-to-s3.sh
```

### Monitoring

- Monitor backup job success/failure via logs
- Alert on missed backups (>24 hours)
- Track backup storage usage
- Monitor WAL archive size

## Checklist

### Backup Configuration
- [ ] All 4 databases included in backup schedule
- [ ] Full backups weekly with 4-week retention
- [ ] WAL archiving enabled for PITR
- [ ] Backups compressed and verified
- [ ] Offsite replication to S3/cloud storage
- [ ] Backup encryption enabled
- [ ] Access controls in place

### Restore Procedures
- [ ] Restore scripts tested quarterly
- [ ] Point-in-time recovery tested annually
- [ ] Documentation includes step-by-step instructions
- [ ] Team trained on restore procedures
- [ ] Emergency contacts documented

### Monitoring
- [ ] Backup success/failure alerts configured
- [ ] Backup size anomalies monitored
- [ ] Storage capacity alerts set
- [ ] WAL archive growth monitored

### Security
- [ ] Backups encrypted at rest
- [ ] Access logged and audited
- [ ] Checksums stored and verified
- [ ] Offsite storage secure (S3 with encryption)

## References

- [PostgreSQL Backup and Restore](https://www.postgresql.org/docs/current/backup.html)
- [Point-in-Time Recovery](https://www.postgresql.org/docs/current/continuous-archiving.html)
- [pg_dump Documentation](https://www.postgresql.org/docs/current/app-pgdump.html)
- [pg_restore Documentation](https://www.postgresql.org/docs/current/app-pgrestore.html)