#!/bin/bash

cd "/Users/mohamedrizwan/Desktop/TripAlfa - Node"

echo "=========================================="
echo "TripAlfa Deployment Monitoring"
echo "=========================================="
echo "$(date)"
echo ""

# Count built images
BUILT=$(docker images --filter "reference=tripalfa-*" --format "{{.Repository}}" | wc -l)
echo "✓ Images Built: $BUILT"
docker images --filter "reference=tripalfa-*" --format "table {{.Repository}}\t{{.Size}}"

echo ""
echo "Active Build Processes:"
ps aux | grep "docker build" | grep -v grep | wc -l | xargs echo "  Count:"

echo ""
echo "Running Containers:"
docker ps --filter "name=tripalfa" --format "table {{.Names}}\t{{.Status}}"

echo ""
echo "=========================================="
