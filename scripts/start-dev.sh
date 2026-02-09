#!/bin/bash

# Quick Start Script for Seat Maps Feature Testing
# Starts backend, frontend, and optionally runs tests

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║        SEAT MAPS FEATURE - QUICK START SCRIPT              ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Parse arguments
RUN_TESTS=${1:-false}

echo "📋 PRE-START VALIDATION"
echo "======================="
echo ""

# Validate files exist
echo "Checking required files..."

files=(
  "services/booking-service/src/integrations/duffelApiClient.ts"
  "services/booking-service/src/controllers/seatMapsController.ts"
  "services/booking-service/src/routes/seatMapsRoutes.ts"
  "apps/booking-engine/src/pages/SeatSelection.tsx"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "  ✅ $file"
  else
    echo "  ❌ $file NOT FOUND"
    exit 1
  fi
done

echo ""
echo "✅ All required files present"
echo ""

# Start services
echo "🚀 STARTING SERVICES"
echo "===================="
echo ""

echo -e "${BLUE}Terminal 1: Starting Backend Service${NC}"
echo "Command: npm run dev --workspace=@tripalfa/booking-service"
echo ""

# Start backend in background
cd /Users/mohamedrizwan/Desktop/TripAlfa\ -\ Node
npm run dev --workspace=@tripalfa/booking-service > /tmp/backend.log 2>&1 &
BACKEND_PID=$!

echo -e "${GREEN}Backend PID: $BACKEND_PID${NC}"
echo ""

# Wait for backend to start
echo "⏳ Waiting for backend to start (max 15s)..."
for i in {1..30}; do
  if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend started successfully${NC}"
    echo ""
    break
  fi
  if [ $i -eq 30 ]; then
    echo -e "${YELLOW}⚠️  Backend may not have started. Check logs:${NC}"
    echo "tail -f /tmp/backend.log"
    echo ""
  fi
  sleep 0.5
done

echo ""
echo -e "${BLUE}Terminal 2: Starting Frontend Service${NC}"
echo "Command: npm run dev --workspace=@tripalfa/booking-engine"
echo ""

# Start frontend in background
npm run dev --workspace=@tripalfa/booking-engine > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!

echo -e "${GREEN}Frontend PID: $FRONTEND_PID${NC}"
echo ""

# Wait for frontend to start
echo "⏳ Waiting for frontend to start (max 15s)..."
for i in {1..30}; do
  if curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend started successfully${NC}"
    echo ""
    break
  fi
  if [ $i -eq 30 ]; then
    echo -e "${YELLOW}⚠️  Frontend may not have started. Check logs:${NC}"
    echo "tail -f /tmp/frontend.log"
    echo ""
  fi
  sleep 0.5
done

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                 SERVICES STARTED                           ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

echo -e "${GREEN}✅ Backend:  http://localhost:3001${NC}"
echo -e "${GREEN}✅ Frontend: http://localhost:5173${NC}"
echo ""

echo "📋 NEXT STEPS"
echo "============="
echo ""
echo "1. Test the API endpoints:"
echo "   curl 'http://localhost:3001/bookings/flight/seat-maps?offerId=offer_00007ZiY9N4mTK0K'"
echo ""
echo "2. Open Frontend:"
echo "   open http://localhost:5173"
echo ""
echo "3. Run integration tests (in new terminal):"
echo "   npx ts-node scripts/test-full-booking-flow.ts"
echo ""
echo "📊 Server Logs"
echo "============="
echo ""
echo "Backend:  tail -f /tmp/backend.log"
echo "Frontend: tail -f /tmp/frontend.log"
echo ""
echo "⚠️  To stop services, press Ctrl+C or run:"
echo "   kill $BACKEND_PID $FRONTEND_PID"
echo ""

# Optionally run tests
if [ "$RUN_TESTS" = "true" ] || [ "$RUN_TESTS" = "test" ]; then
  echo ""
  echo "🧪 RUNNING INTEGRATION TESTS"
  echo "============================"
  echo ""
  
  sleep 3
  
  npx ts-node scripts/test-full-booking-flow.ts
fi

# Keep script running
wait $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
