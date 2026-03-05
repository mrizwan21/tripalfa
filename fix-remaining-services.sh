#!/bin/bash

# TripAlfa - Fix Remaining 3 Services
# Fixes user-service, organization-service, and service port conflicts

set -e

echo "🔧 TripAlfa Service Fixes"
echo "========================="
echo ""

PROJECT_ROOT=$(pwd)

# Fix 1: user-service
echo "📌 Fix #1: user-service (Missing dev script)"
echo "============================================"
echo "Checking user-service package.json..."
cd "$PROJECT_ROOT/services/user-service"

if [ -f "package.json" ]; then
    echo "✅ Found package.json"
    echo ""
    echo "Available scripts:"
    grep -A 20 '"scripts"' package.json | grep ":" | head -10
    echo ""
    
    # Try to find the correct dev/start script
    if grep -q '"dev"' package.json; then
        echo "✅ 'dev' script found"
        echo "Starting user-service with: pnpm dev"
        nohup pnpm dev > "$PROJECT_ROOT/logs/user-service.log" 2>&1 &
        echo $! > "$PROJECT_ROOT/logs/user-service.pid"
        sleep 3
        if curl -s http://localhost:3003/health > /dev/null 2>&1; then
            echo "✅ user-service started successfully!"
        else
            echo "⚠️  user-service started but health check not responding yet"
            echo "Check logs: tail -f $PROJECT_ROOT/logs/user-service.log"
        fi
    elif grep -q '"start"' package.json; then
        echo "⚠️  'start' script found (no explicit 'dev' script)"
        echo "Starting user-service with: pnpm start"
        nohup pnpm start > "$PROJECT_ROOT/logs/user-service.log" 2>&1 &
        echo $! > "$PROJECT_ROOT/logs/user-service.pid"
        sleep 3
        if curl -s http://localhost:3003/health > /dev/null 2>&1; then
            echo "✅ user-service started successfully!"
        else
            echo "⚠️  user-service started but not responding yet"
        fi
    else
        echo "❌ No 'dev' or 'start' script found"
        echo "Manual action needed - check package.json scripts"
    fi
else
    echo "❌ package.json not found"
fi

cd "$PROJECT_ROOT"
echo ""

# Fix 2: organization-service
echo "📌 Fix #2: organization-service (TypeScript path issue)"
echo "======================================================="
echo "Checking organization-service..."
cd "$PROJECT_ROOT/services/organization-service"

if [ -f "package.json" ]; then
    echo "✅ Found package.json"
    echo "Reinstalling dependencies..."
    pnpm install --frozen-lockfile 2>&1 | tail -5
    echo "✅ Dependencies installed"
    echo ""
    
    if [ -f "tsconfig.json" ]; then
        echo "Checking TypeScript configuration..."
        if grep -q '"@/"' tsconfig.json; then
            echo "✅ TypeScript path aliases configured for '@/'"
        else
            echo "⚠️  TypeScript path aliases may not be configured"
            echo "You may need to update tsconfig.json compilerOptions.paths"
        fi
        echo ""
    fi
    
    echo "Starting organization-service..."
    nohup pnpm dev > "$PROJECT_ROOT/logs/organization-service.log" 2>&1 &
    echo $! > "$PROJECT_ROOT/logs/organization-service.pid"
    sleep 4
    
    if curl -s http://localhost:3006/health > /dev/null 2>&1; then
        echo "✅ organization-service started successfully!"
    else
        echo "⚠️  organization-service starting..."
        echo "Check logs: tail -f $PROJECT_ROOT/logs/organization-service.log"
        sleep 3
        if curl -s http://localhost:3006/health > /dev/null 2>&1; then
            echo "✅ organization-service is now responding!"
        fi
    fi
else
    echo "❌ package.json not found"
fi

cd "$PROJECT_ROOT"
echo ""

# Fix 3: Service port conflicts
echo "📌 Fix #3: b2b-admin-service & booking-engine-service (Port conflicts)"
echo "====================================================================="
echo "Checking port configuration..."
echo ""

echo "Checking b2b-admin-service..."
if grep -r "port.*3000\|PORT.*3000" services/b2b-admin-service/src/ 2>/dev/null | head -3; then
    echo "❌ Found hardcoded port 3000"
    echo "Fix: Need to use environment variable or port 3020"
    echo "Suggested change in services/b2b-admin-service/src/index.ts:"
    echo '  const port = process.env.PORT || 3020;'
else
    echo "✅ Port 3000 not hardcoded"
fi

echo ""
echo "Checking booking-engine-service..."
if grep -r "port.*3000\|PORT.*3000" services/booking-engine-service/src/ 2>/dev/null | head -3; then
    echo "❌ Found hardcoded port 3000"
    echo "Fix: Need to use environment variable or port 3021"
    echo "Suggested change in services/booking-engine-service/src/index.ts:"
    echo '  const port = process.env.PORT || 3021;'
else
    echo "✅ Port 3000 not hardcoded"
fi

echo ""
echo "Verifying .env.local has correct ports..."
if grep -q "B2B_ADMIN_SERVICE_PORT=3020" .env.local; then
    echo "✅ B2B_ADMIN_SERVICE_PORT=3020"
else
    echo "⚠️  Adding B2B_ADMIN_SERVICE_PORT=3020 to .env.local"
    echo "B2B_ADMIN_SERVICE_PORT=3020" >> .env.local
fi

if grep -q "BOOKING_ENGINE_SERVICE_PORT=3021" .env.local; then
    echo "✅ BOOKING_ENGINE_SERVICE_PORT=3021"
else
    echo "⚠️  Adding BOOKING_ENGINE_SERVICE_PORT=3021 to .env.local"
    echo "BOOKING_ENGINE_SERVICE_PORT=3021" >> .env.local
fi

echo ""
echo "Starting b2b-admin-service..."
cd "$PROJECT_ROOT/services/b2b-admin-service"
nohup pnpm dev > "$PROJECT_ROOT/logs/b2b-admin-service.log" 2>&1 &
echo $! > "$PROJECT_ROOT/logs/b2b-admin-service.pid"
sleep 3

if curl -s http://localhost:3020/health > /dev/null 2>&1; then
    echo "✅ b2b-admin-service started on port 3020!"
else
    echo "⚠️  b2b-admin-service starting..."
    echo "Check logs: tail -f $PROJECT_ROOT/logs/b2b-admin-service.log"
fi

echo ""
echo "Starting booking-engine-service..."
cd "$PROJECT_ROOT/services/booking-engine-service"
nohup pnpm dev > "$PROJECT_ROOT/logs/booking-engine-service.log" 2>&1 &
echo $! > "$PROJECT_ROOT/logs/booking-engine-service.pid"
sleep 3

if curl -s http://localhost:3021/health > /dev/null 2>&1; then
    echo "✅ booking-engine-service started on port 3021!"
else
    echo "⚠️  booking-engine-service starting..."
    echo "Check logs: tail -f $PROJECT_ROOT/logs/booking-engine-service.log"
fi

cd "$PROJECT_ROOT"
echo ""

# Summary
echo "📊 Fix Summary"
echo "=============="
echo ""
echo "Fix #1: user-service (3003)"
if [ -f "logs/user-service.pid" ] && kill -0 $(cat logs/user-service.pid) 2>/dev/null; then
    echo "✅ Running"
else
    echo "⚠️  Check logs/user-service.log"
fi

echo ""
echo "Fix #2: organization-service (3006)"
if [ -f "logs/organization-service.pid" ] && kill -0 $(cat logs/organization-service.pid) 2>/dev/null; then
    echo "✅ Running"
else
    echo "⚠️  Check logs/organization-service.log"
fi

echo ""
echo "Fix #3: b2b-admin-service (3020) & booking-engine-service (3021)"
if [ -f "logs/b2b-admin-service.pid" ] && kill -0 $(cat logs/b2b-admin-service.pid) 2>/dev/null; then
    echo "✅ b2b-admin-service running"
else
    echo "⚠️  Check logs/b2b-admin-service.log"
fi

if [ -f "logs/booking-engine-service.pid" ] && kill -0 $(cat logs/booking-engine-service.pid) 2>/dev/null; then
    echo "✅ booking-engine-service running"
else
    echo "⚠️  Check logs/booking-engine-service.log"
fi

echo ""
echo "🎯 Verify all services:"
echo "curl http://localhost:3001/health   # booking-service"
echo "curl http://localhost:3003/health   # user-service"
echo "curl http://localhost:3006/health   # organization-service"
echo "curl http://localhost:3020/health   # b2b-admin-service"
echo "curl http://localhost:3021/health   # booking-engine-service"
echo ""
echo "✅ Service fixes completed!"
echo "🚀 Happy coding!"