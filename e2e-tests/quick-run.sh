#!/bin/bash
# Quick run all tests
cd e2e-tests
echo "Running all autonomous tests..."
npx playwright test agents/*.ts --config=playwright.config.ts --reporter=list --timeout=30000
