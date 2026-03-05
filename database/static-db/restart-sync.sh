#!/bin/bash

# restart-sync.sh
# ---------------
# Script to restart the LiteAPI sync with improved timeout handling

set -e

echo "=== LiteAPI Sync Restart Script ==="
echo "Starting at: $(date)"
echo ""

# Check if we're in the right directory
if [ ! -f "scripts/sync-liteapi.ts" ]; then
    echo "Error: Please run this script from the database/static-db directory"
    exit 1
fi

# Check if API key is set
if [ -z "$LITEAPI_KEY" ]; then
    echo "Error: LITEAPI_KEY environment variable is not set"
    echo "Please set it in your .env file or export it"
    exit 1
fi

# Test connectivity first
echo "Testing connectivity..."
if ! npx ts-node scripts/monitor-liteapi.ts > /tmp/connectivity-test.log 2>&1; then
    echo "Connectivity test failed. Check the log:"
    cat /tmp/connectivity-test.log
    echo ""
    echo "Common fixes:"
    echo "1. Check your internet connection"
    echo "2. Verify LITEAPI_KEY is correct"
    echo "3. Check DNS resolution for api.liteapi.travel"
    echo "4. Run: npx ts-node scripts/test-network.ts"
    exit 1
fi

echo "Connectivity test passed!"

# Stop any existing sync processes
echo "Stopping existing sync processes..."
pkill -f "sync-liteapi.ts" || true
sleep 2

# Clean up old logs
echo "Cleaning up old logs..."
rm -f nohup.out
rm -f /tmp/connectivity-test.log

# Start the sync
echo "Starting sync process..."
nohup npx ts-node scripts/sync-liteapi.ts > nohup.out 2>&1 &

# Get the process ID
SYNC_PID=$!

echo "Sync started with PID: $SYNC_PID"
echo "Output redirected to: nohup.out"
echo ""
echo "To monitor progress:"
echo "  tail -f nohup.out"
echo ""
echo "To check if running:"
echo "  ps aux | grep sync-liteapi"
echo ""
echo "To stop the sync:"
echo "  kill $SYNC_PID"
echo ""
echo "Sync restart completed at: $(date)"