#!/bin/bash

echo "======================================"
echo "TripAlfa E2E Tests - Fixed Version"
echo "======================================"
echo ""
echo "Starting tests at: $(date)"
echo ""

cd "$(git rev-parse --show-toplevel)/apps/booking-engine"

# Run the tests
npm run test:e2e

echo ""
echo "Tests completed at: $(date)"
echo ""
echo "To view the report, run:"
echo "  npx playwright show-report"
