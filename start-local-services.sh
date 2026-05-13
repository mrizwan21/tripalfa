#!/bin/bash
# Start all local services for TripAlfa architecture

echo "Starting Local Gateway (port 8000)..."
cd "/Users/mohamedrizwan/Desktop/TripAlfa - Node"
nohup node local-gateway.mjs > /tmp/gateway.log 2>&1 &
echo $! > /tmp/gateway.pid
echo "Local Gateway started (PID: $(cat /tmp/gateway.pid))"

sleep 2

echo "Starting Static Data API (port 3022)..."
cd "/Users/mohamedrizwan/Desktop/TripAlfa - Node/packages/static-data"
nohup node server.mjs > /tmp/static-data.log 2>&1 &
echo $! > /tmp/static-data.pid
echo "Static Data API started (PID: $(cat /tmp/static-data.pid))"

sleep 2

echo ""
echo "Testing services..."
echo "===================="
echo "Local Gateway health:"
curl -s "http://localhost:8000/api/gateway/health-status" || echo "Gateway not responding"
echo ""
echo "Static Data API health:"
curl -s "http://localhost:3022/health" || echo "Static Data API not responding"
echo ""
echo "Static Data API test (amenities):"
curl -s "http://localhost:3022/api/static/amenities" | head -c 200
echo ""
echo ""
echo "Languages endpoint test:"
curl -s "http://localhost:8000/api/liteapi/languages" | head -c 200
echo ""
echo ""
echo "===================="
echo "All services started!"
echo "To stop: kill \$(cat /tmp/gateway.pid) \$(cat /tmp/static-data.pid)"
echo "Logs: /tmp/gateway.log /tmp/static-data.log"
