#!/bin/bash
#
# One-Click Autonomous E2E Test Runner
# This script runs all E2E tests in fully autonomous YOLO mode
# No human intervention required - runs without seeking permissions
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/apps/booking-engine"

echo "🚀 Starting Autonomous E2E Test Execution"
echo "=========================================="
echo ""
echo "Mode: YOLO (You Only Live Once)"
echo "Status: Fully Autonomous"
echo "Intervention: None Required"
echo ""
echo "Running tests for all 12 modules:"
echo "  • auth (Authentication)"
echo "  • flights (Flight Booking)"
echo "  • hotels (Hotel Booking)"
echo "  • bookings (Booking Management)"
echo "  • profile (User Profile)"
echo "  • dashboard (Dashboard)"
echo "  • loyalty (Loyalty Program)"
echo "  • wallet (Wallet & Payments)"
echo "  • navigation (Navigation)"
echo "  • forms (Form Validation)"
echo "  • components (Interactive Components)"
echo "  • api (API Integration)"
echo ""
echo "=========================================="
echo ""

# Run in YOLO mode - fully autonomous
pnpm test:e2e:yolo

echo ""
echo "=========================================="
echo "✅ Autonomous test execution completed!"
echo "=========================================="
echo ""
echo "📊 View Results:"
echo "  HTML Report: pnpm test:e2e:report"
echo "  JSON: test-results/result.json"
echo ""
