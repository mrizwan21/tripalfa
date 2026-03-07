#!/bin/bash

#######################################################################
# Cron Job Configuration for TripAlfa Production
# Setup automated backups, maintenance, and health checks
#######################################################################

# Install this file with:
# crontab -e
# Then paste the contents below

#######################################################################
# Environment Variables (set in /etc/cron.d/tripalfa or ~/.bashrc)
#######################################################################

# Add to system crontab: sudo nano /etc/cron.d/tripalfa
# SHELL=/bin/bash
# PATH=/usr/local/sbin:/usr/local/bin:/sbin:/bin:/usr/sbin:/usr/bin
# 
# NEON_API_KEY=<your-key>
# NEON_PROJECT_ID=<your-project>
# DATABASE_URL=postgresql://...
# SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
# S3_BACKUP_BUCKET=tripalfa-backups
# APP_HOME=/opt/tripalfa

#######################################################################
# BACKUP JOBS
#######################################################################

# Daily backup at 2:00 AM UTC
0 2 * * * root cd $APP_HOME && ./scripts/backup-neon-database.sh backup >> /var/log/tripalfa/backup.log 2>&1

# Verify backup integrity at 3:00 AM UTC
0 3 * * * root cd $APP_HOME && ./scripts/verify-backup-integrity.sh >> /var/log/tripalfa/backup-verify.log 2>&1

# Cleanup old backups every Sunday at 4:00 AM UTC
0 4 * * 0 root cd $APP_HOME && find ./backups -name "dump-*.sql.gz" -mtime +30 -delete >> /var/log/tripalfa/backup-cleanup.log 2>&1

# Export backups to S3 (daily)
0 2 * * * root cd $APP_HOME && ./scripts/backup-neon-database.sh backup 2>/dev/null | tail -1 | xargs -I {} aws s3 cp {} s3://tripalfa-backups/neon-backups/ >> /var/log/tripalfa/s3-sync.log 2>&1

#######################################################################
# DATABASE MAINTENANCE
#######################################################################

# Database VACUUM every night at 1:00 AM UTC
0 1 * * * root psql $DATABASE_URL -c "VACUUM ANALYZE;" >> /var/log/tripalfa/db-vacuum.log 2>&1

# Reindex slow-growing tables (monthly, first Sunday)
0 2 1 * 0 root cd $APP_HOME && ./scripts/database-reindex.sh >> /var/log/tripalfa/db-reindex.log 2>&1

# Update query statistics (daily)
30 1 * * * root psql $DATABASE_URL -c "ANALYZE;" >> /var/log/tripalfa/db-analyze.log 2>&1

# Archive old logs (weekly)
0 3 * * 1 root psql $DATABASE_URL -c "DELETE FROM logs WHERE created_at < NOW() - INTERVAL '90 days';" >> /var/log/tripalfa/log-archive.log 2>&1

#######################################################################
# HEALTH CHECKS & MONITORING
#######################################################################

# Check API gateway health every 5 minutes
*/5 * * * * root curl -s http://localhost:3000/health >> /var/log/tripalfa/health-check.log 2>&1

# Comprehensive health check every hour
0 * * * * root cd $APP_HOME && ./scripts/health-check.sh >> /var/log/tripalfa/comprehensive-health.log 2>&1

# Check database replication lag every 30 minutes
*/30 * * * * root psql $DATABASE_URL -c "SELECT now() - pg_last_wal_receive_lsn();" >> /var/log/tripalfa/replication-lag.log 2>&1

# Monitor disk space every 6 hours
0 0,6,12,18 * * * root df -h / >> /var/log/tripalfa/disk-space.log 2>&1

#######################################################################
# LOG ROTATION & CLEANUP
#######################################################################

# Rotate application logs (daily at midnight)
0 0 * * * root logrotate /etc/logrotate.d/tripalfa

# Cleanup old error logs (weekly)
0 2 * * 1 root find /var/log/tripalfa -name "*.log" -mtime +30 -delete >> /var/log/tripalfa/log-cleanup.log 2>&1

# Compress archived logs (daily)
0 3 * * * root find /var/log/tripalfa -name "*.log" -mtime +7 -exec gzip {} \;

#######################################################################
# DEPLOYMENT & UPDATES
#######################################################################

# Pull latest code from repository (every 6 hours)
0 */6 * * * root cd $APP_HOME && git pull origin main >> /var/log/tripalfa/git-sync.log 2>&1

# Build Docker images for new commits (every hour)
0 * * * * root cd $APP_HOME && ./scripts/build-images.sh >> /var/log/tripalfa/docker-build.log 2>&1

# Check for security updates (daily)
0 5 * * * root apt list --upgradable >> /var/log/tripalfa/security-updates.log 2>&1

#######################################################################
# CERTIFICATE RENEWAL
#######################################################################

# Renew SSL certificates (every 60 days, 2:00 AM)
0 2 1 1,3,5,7,9,11 * root certbot renew --quiet >> /var/log/tripalfa/certbot.log 2>&1

# Verify certificate expiry (monthly)
0 3 1 * * root ./scripts/check-cert-expiry.sh >> /var/log/tripalfa/cert-check.log 2>&1

#######################################################################
# PERFORMANCE MONITORING
#######################################################################

# Collect performance metrics (every 30 minutes)
*/30 * * * * root cd $APP_HOME && ./scripts/collect-metrics.sh >> /var/log/tripalfa/metrics.log 2>&1

# Generate performance report (daily at 1:00 AM)
0 1 * * * root cd $APP_HOME && ./scripts/generate-performance-report.sh >> /var/log/tripalfa/performance-report.log 2>&1

# Analyze slow queries (weekly)
0 1 * * 1 root psql $DATABASE_URL -f scripts/analyze-slow-queries.sql >> /var/log/tripalfa/slow-queries.log 2>&1

#######################################################################
# CLEANUP JOBS
#######################################################################

# Cleanup temp files (daily)
0 4 * * * root find /tmp -maxdepth 1 -type f -mtime +7 -delete >> /var/log/tripalfa/tmp-cleanup.log 2>&1

# Cleanup docker dangling images (weekly)
0 2 * * 0 root docker image prune -f --filter "dangling=true" >> /var/log/tripalfa/docker-cleanup.log 2>&1

# Cleanup old database backups from S3 (monthly)
0 3 1 * * root aws s3 rm s3://tripalfa-backups/neon-backups/ --recursive --exclude "*" --include "*.sql.gz" | tail -30 >> /var/log/tripalfa/s3-cleanup.log 2>&1

#######################################################################
# NOTIFICATIONS & ALERTS
#######################################################################

# Send daily status report to Slack (6:00 AM UTC)
0 6 * * * root cd $APP_HOME && ./scripts/send-status-report.sh >> /var/log/tripalfa/status-report.log 2>&1

# Weekly production summary (Mondays at 9:00 AM UTC)
0 9 * * 1 root cd $APP_HOME && ./scripts/weekly-summary.sh >> /var/log/tripalfa/weekly-summary.log 2>&1

# Alert on backup failures
*/15 * * * * root test -f /var/log/tripalfa/backup-failed && \
  curl -X POST $SLACK_WEBHOOK_URL -d '{"text":"❌ Backup failed - check logs"}' && \
  rm /var/log/tripalfa/backup-failed

#######################################################################
# SYSTEM INFORMATION
#######################################################################

# To view scheduled jobs:
# crontab -l

# To edit scheduled jobs:
# crontab -e

# To view system-wide cron jobs:
# cat /etc/crontab
# ls /etc/cron.d/

# To view execution logs:
# tail -f /var/log/syslog | grep CRON
# journalctl -u cron

#######################################################################
# INSTALLATION INSTRUCTIONS
#######################################################################

# 1. Copy this file to /etc/cron.d/tripalfa:
#    sudo cp cron-jobs.sh /etc/cron.d/tripalfa
#
# 2. Update environment variables:
#    sudo nano /etc/cron.d/tripalfa
#    Set NEON_API_KEY, DATABASE_URL, etc.
#
# 3. Create log directory:
#    sudo mkdir -p /var/log/tripalfa
#    sudo chown root:root /var/log/tripalfa
#    sudo chmod 755 /var/log/tripalfa
#
# 4. Add logrotate configuration:
#    sudo cp logrotate-tripalfa /etc/logrotate.d/tripalfa
#
# 5. Verify installation:
#    sudo systemctl restart cron
#    crontab -l (for user cron)
#    sudo cat /etc/cron.d/tripalfa (for system cron)
#
# 6. Test a job:
#    sudo run-parts --test /etc/cron.d/tripalfa
#
# 7. Monitor execution:
#    sudo tail -f /var/log/syslog | grep CRON
#    tail -f /var/log/tripalfa/*.log

#######################################################################
# TIME ZONES
#######################################################################

# Important: All cron times shown are in UTC (0 hours)
# 
# UTC Time Conversions:
# 00:00 UTC = 17:00 PST (previous day) = 20:00 EST (previous day)
# 01:00 UTC = 18:00 PST (previous day) = 21:00 EST (previous day)
# 02:00 UTC = 19:00 PST (previous day) = 22:00 EST (previous day)
# 06:00 UTC = 23:00 PST (previous day) = 02:00 EST (current day)
# 09:00 UTC = 02:00 PST (current day) = 05:00 EST (current day)
# 14:00 UTC = 07:00 PST (current day) = 10:00 EST (current day)
#
# To adjust all jobs to your timezone, shift times accordingly

#######################################################################
# BACKUP VERIFICATION SCRIPT
#######################################################################

# Add to scripts/verify-backup-integrity.sh:
# 
# #!/bin/bash
# LATEST_BACKUP=$(ls -t ./backups/dump-*.sql.gz | head -1)
# 
# if gunzip -t "$LATEST_BACKUP" >/dev/null 2>&1; then
#   echo "✅ Backup integrity OK: $LATEST_BACKUP"
#   exit 0
# else
#   echo "❌ Backup corrupted: $LATEST_BACKUP"
#   # Send alert
#   curl -X POST $SLACK_WEBHOOK_URL \
#     -d '{"text":"❌ Database backup integrity check failed"}'
#   touch /var/log/tripalfa/backup-failed
#   exit 1
# fi

#######################################################################
# LOGROTATE CONFIGURATION
#######################################################################

# Create /etc/logrotate.d/tripalfa:
#
# /var/log/tripalfa/*.log {
#   daily
#   rotate 30
#   compress
#   delaycompress
#   notifempty
#   create 0640 root root
#   sharedscripts
#   postrotate
#     systemctl reload-or-restart rsyslog > /dev/null 2>&1 || true
#   endscript
# }

#######################################################################
# MONITORING NOTES
#######################################################################

# 1. BACKUP JOBS
#    - Run daily to ensure data protection
#    - Verify integrity immediately after
#    - Upload to S3 for additional redundancy
#    - Test restore procedure monthly
#
# 2. DATABASE MAINTENANCE
#    - VACUUM ANALYZE: reclaims disk space, improves query planning
#    - REINDEX: optimizes B-tree indexes
#    - Analyze: updates table statistics
#    - Schedule during low-traffic windows
#
# 3. HEALTH CHECKS
#    - 5-min checks: detect immediate issues
#    - Hourly comprehensive: full system validation
#    - Replication lag: ensure HA synchronization
#    - Disk space: prevent filesystem full errors
#
# 4. PERFORMANCE MONITORING
#    - Collect metrics for trending
#    - Identify slow queries
#    - Generate reports for capacity planning
#    - Archive old metrics after 90 days
#
# 5. SECURITY
#    - SSL certificate renewal: prevent downtime
#    - Security updates: patch vulnerabilities
#    - Log rotation: manage disk usage
#    - Check certificate expiry: 60 days before

echo "✅ Cron job configuration loaded"
echo "📋 To install: sudo cp cron-jobs.sh /etc/cron.d/tripalfa"
echo "📊 To monitor: tail -f /var/log/tripalfa/*.log"
