#!/bin/bash
# Kill any existing gateway processes
lsof -ti :3000 | xargs kill -9 2>/dev/null

echo "Starting API Gateway..."
cd services/api-gateway
npm run dev > gateway.log 2>&1 &
GATEWAY_PID=$!

echo "Waiting for Gateway to initialize..."
sleep 15

echo "Running Verification Tests..."
cd ../..
npx tsx services/inventory-service/test/verify-integration.ts

echo "Shutting down Gateway..."
kill $GATEWAY_PID

echo "--- GATEWAY LOGS ---"
cat services/api-gateway/gateway.log
