#!/bin/bash

#######################################################################
# Neon Database Backup Automation Script
# Manages automatic backups with retention policy
#######################################################################

set -e

# Configuration
NEON_API_KEY=${NEON_API_KEY:-}
NEON_PROJECT_ID=${NEON_PROJECT_ID:-}
BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS=${RETENTION_DAYS:-30}
LOG_FILE="neon-backup-$(date +%Y%m%d).log"
SLACK_WEBHOOK=${SLACK_WEBHOOK_URL:-}

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging functions
log_info() {
  echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$LOG_FILE"
}

log_success() {
  echo -e "${GREEN}[✓]${NC} $1" | tee -a "$LOG_FILE"
}

log_error() {
  echo -e "${RED}[✗]${NC} $1" | tee -a "$LOG_FILE"
}

log_warning() {
  echo -e "${YELLOW}[!]${NC} $1" | tee -a "$LOG_FILE"
}

# Send Slack notification
send_slack_notification() {
  local message=$1
  local color=$2

  if [ -z "$SLACK_WEBHOOK" ]; then
    return
  fi

  curl -X POST "$SLACK_WEBHOOK" \
    -H 'Content-Type: application/json' \
    -d "{
      \"attachments\": [
        {
          \"color\": \"$color\",
          \"title\": \"Neon Backup Notification\",
          \"text\": \"$message\",
          \"ts\": $(date +%s)
        }
      ]
    }" 2>/dev/null || log_warning "Failed to send Slack notification"
}

#######################################################################
# Check Prerequisites
#######################################################################
check_prerequisites() {
  log_info "Checking prerequisites..."

  if [ -z "$NEON_API_KEY" ]; then
    log_error "NEON_API_KEY environment variable not set"
    exit 1
  fi

  if [ -z "$NEON_PROJECT_ID" ]; then
    log_error "NEON_PROJECT_ID environment variable not set"
    exit 1
  fi

  if ! command -v curl &> /dev/null; then
    log_error "curl is not installed"
    exit 1
  fi

  if ! command -v jq &> /dev/null; then
    log_error "jq is not installed"
    exit 1
  fi

  mkdir -p "$BACKUP_DIR"
  log_success "Prerequisites check passed"
}

#######################################################################
# Get Current Database Branches
#######################################################################
get_branches() {
  log_info "Fetching database branches..."

  local response=$(curl -s -X GET \
    "https://api.neon.tech/api/v2/projects/$NEON_PROJECT_ID/branches" \
    -H "Authorization: Bearer $NEON_API_KEY" \
    -H "Content-Type: application/json")

  if ! echo "$response" | jq . > /dev/null 2>&1; then
    log_error "Failed to fetch branches: $response"
    send_slack_notification "❌ Failed to fetch Neon branches" "danger"
    exit 1
  fi

  echo "$response"
}

#######################################################################
# Create Branch-based Backup
#######################################################################
create_branch_backup() {
  local backup_name="backup-$(date +%Y%m%d-%H%M%S)"
  
  log_info "Creating backup branch: $backup_name"

  local response=$(curl -s -X POST \
    "https://api.neon.tech/api/v2/projects/$NEON_PROJECT_ID/branches" \
    -H "Authorization: Bearer $NEON_API_KEY" \
    -H "Content-Type: application/json" \
    -d "{
      \"branch\": {
        \"name\": \"$backup_name\",
        \"parent_id\": \"main\"
      }
    }")

  if ! echo "$response" | jq . > /dev/null 2>&1; then
    log_error "Failed to create backup branch: $response"
    send_slack_notification "❌ Failed to create Neon backup branch: $response" "danger"
    exit 1
  fi

  local branch_id=$(echo "$response" | jq -r '.branch.id')
  log_success "Backup branch created: $branch_id"
  echo "$branch_id"
}

#######################################################################
# Backup Database via SQL Dump
#######################################################################
backup_database_dump() {
  log_info "Creating SQL dump backup..."

  local backup_file="$BACKUP_DIR/dump-$(date +%Y%m%d-%H%M%S).sql.gz"
  
  # Get database connection string
  local db_url="${DATABASE_URL}"
  
  if [ -z "$db_url" ]; then
    log_error "DATABASE_URL not set"
    send_slack_notification "❌ DATABASE_URL not set for backup" "danger"
    exit 1
  fi

  # Create SQL dump
  if pg_dump "$db_url" | gzip > "$backup_file" 2>/dev/null; then
    local file_size=$(du -h "$backup_file" | cut -f1)
    log_success "SQL dump created: $backup_file ($file_size)"
    echo "$backup_file"
  else
    log_error "Failed to create SQL dump"
    send_slack_notification "❌ Failed to create SQL database dump" "danger"
    exit 1
  fi
}

#######################################################################
# Export Backup to Cloud Storage
#######################################################################
export_backup_to_s3() {
  local backup_file=$1
  local s3_bucket=${S3_BACKUP_BUCKET:-tripalfa-backups}
  local s3_path="s3://$s3_bucket/neon-backups/$(basename "$backup_file")"

  if ! command -v aws &> /dev/null; then
    log_warning "AWS CLI not available, skipping S3 upload"
    return
  fi

  log_info "Uploading backup to S3: $s3_path"

  if aws s3 cp "$backup_file" "$s3_path" --sse AES256 2>&1 | tee -a "$LOG_FILE"; then
    log_success "Backup uploaded to S3"
    
    # Set lifecycle policy
    aws s3api put-object-tagging \
      --bucket "$s3_bucket" \
      --key "neon-backups/$(basename "$backup_file")" \
      --tagging 'TagSet=[{Key=backup,Value=true},{Key=retention,Value='$RETENTION_DAYS'}]' \
      2>/dev/null || log_warning "Failed to set S3 tags"
  else
    log_error "Failed to upload backup to S3"
    send_slack_notification "❌ Failed to upload backup to S3" "danger"
    return 1
  fi
}

#######################################################################
# Cleanup Old Backups
#######################################################################
cleanup_old_backups() {
  log_info "Cleaning up old backups (retention: $RETENTION_DAYS days)..."

  local cutoff_date=$(date -d "$RETENTION_DAYS days ago" +%Y%m%d)
  local count=0

  # Cleanup local backups
  for backup_file in "$BACKUP_DIR"/dump-*.sql.gz; do
    if [ -f "$backup_file" ]; then
      local file_date=$(basename "$backup_file" | grep -o "[0-9]\{8\}" | head -1)
      if [ "$file_date" -lt "$cutoff_date" ]; then
        log_info "Removing old backup: $backup_file"
        rm -f "$backup_file"
        ((count++))
      fi
    fi
  done

  log_success "Removed $count old local backups"

  # Cleanup S3 backups (if configured)
  if command -v aws &> /dev/null; then
    log_info "Cleaning up old S3 backups..."
    
    local s3_bucket=${S3_BACKUP_BUCKET:-tripalfa-backups}
    
    aws s3 ls "s3://$s3_bucket/neon-backups/" | while read -r date time size name; do
      local s3_date=$(echo $date | tr -d '-')
      if [ "$s3_date" -lt "$cutoff_date" ]; then
        log_info "Removing old S3 backup: $name"
        aws s3 rm "s3://$s3_bucket/neon-backups/$name" 2>/dev/null || true
        ((count++))
      fi
    done
  fi

  log_success "Backup cleanup completed"
}

#######################################################################
# List Available Backups
#######################################################################
list_backups() {
  log_info "Available backups:"
  echo ""
  
  ls -lh "$BACKUP_DIR"/dump-*.sql.gz 2>/dev/null | awk '{print $9, "(" $5 ")"}' || {
    log_warning "No local backups found"
  }
  
  if command -v aws &> /dev/null; then
    echo ""
    log_info "S3 Backups:"
    local s3_bucket=${S3_BACKUP_BUCKET:-tripalfa-backups}
    aws s3 ls "s3://$s3_bucket/neon-backups/" 2>/dev/null | awk '{print $4}' || log_warning "No S3 backups found"
  fi
}

#######################################################################
# Restore Database from Backup
#######################################################################
restore_backup() {
  local backup_file=$1
  local target_db=${2:-tripalfa}

  if [ -z "$backup_file" ] || [ ! -f "$backup_file" ]; then
    log_error "Backup file not found: $backup_file"
    return 1
  fi

  log_warning "Starting database restoration from: $backup_file"
  log_warning "Target database: $target_db"
  echo ""
  echo "⚠️  WARNING: This will overwrite the current database!"
  echo "Type 'restore' to confirm, anything else to cancel:"
  read -r confirmation

  if [ "$confirmation" != "restore" ]; then
    log_warning "Restoration cancelled"
    return
  fi

  log_info "Restoring database..."

  gunzip -c "$backup_file" | psql "$DATABASE_URL" -d "$target_db" 2>&1 | tee -a "$LOG_FILE" || {
    log_error "Restoration failed"
    send_slack_notification "❌ Database restoration failed from $backup_file" "danger"
    return 1
  }

  log_success "Database restoration completed"
  send_slack_notification "✅ Database restored from backup: $backup_file" "good"
}

#######################################################################
# Main Backup Job
#######################################################################
run_backup_job() {
  log_info "=========================================="
  log_info "Neon Backup Job Started"
  log_info "$(date)"
  log_info "=========================================="
  echo ""

  check_prerequisites
  
  # Create backup
  local backup_file=$(backup_database_dump) || exit 1
  
  # Upload to S3
  export_backup_to_s3 "$backup_file"
  
  # Create Neon branch backup
  create_branch_backup
  
  # Cleanup old backups
  cleanup_old_backups
  
  log_success "Backup job completed successfully"
  send_slack_notification "✅ Database backup completed\nFile: $(basename "$backup_file")\nSize: $(du -h "$backup_file" | cut -f1)" "good"
  
  echo ""
  log_info "=========================================="
}

#######################################################################
# Command Dispatcher
#######################################################################
main() {
  local command=${1:-backup}

  case "$command" in
    backup)
      run_backup_job
      ;;
    list)
      list_backups
      ;;
    restore)
      restore_backup "$2"
      ;;
    *)
      echo "Usage: $0 {backup|list|restore <backup-file>}"
      echo ""
      echo "Commands:"
      echo "  backup           - Run automated backup job"
      echo "  list             - List available backups"
      echo "  restore <file>   - Restore database from backup file"
      exit 1
      ;;
  esac
}

main "$@"
