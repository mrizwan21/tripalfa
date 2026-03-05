#!/bin/bash

# run-sync.sh
# ------------
# Script to run the LiteAPI sync with proper environment loading

set -e

echo "=== LiteAPI Sync Runner ==="
echo "Starting at: $(date)"
echo ""

# Change to the correct directory
cd "$(dirname "$0")"

# Load environment variables
if [ -f ".env" ]; then
    echo "Loading environment variables from .env..."
    # Use source for proper handling of values with spaces
    set -a
    source .env
    set +a
else
    echo "Error: .env file not found"
    exit 1
fi

# Verify LITEAPI_KEY is loaded
if [ -z "$LITEAPI_KEY" ]; then
    echo "Error: LITEAPI_KEY not found in .env file"
    exit 1
fi

echo "LITEAPI_KEY loaded successfully"

# Test connectivity first
echo ""
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
echo ""
echo "Stopping existing sync processes..."
pkill -f "sync-liteapi.ts" || true
sleep 2

# Clean up old logs
echo "Cleaning up old logs..."
rm -f nohup.out
rm -f /tmp/connectivity-test.log

# Start the sync
echo ""
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
echo "Sync started successfully at: $(date)"