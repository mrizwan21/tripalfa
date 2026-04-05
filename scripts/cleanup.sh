#!/bin/bash
# TripAlfa Cleanup Script
# Removes cache, build artifacts, duplicates, and unused files

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

echo "========================================="
echo "  TripAlfa Project Cleanup"
echo "========================================="

# Step 1: Remove all node_modules
echo ""
echo "[1/5] Removing all node_modules directories..."
pnpm -r exec -- rm -rf node_modules 2>/dev/null || true
rm -rf "$ROOT_DIR/node_modules"
echo "✅ node_modules removed"

# Step 2: Remove all dist/build directories
echo ""
echo "[2/5] Removing all dist/build directories..."
find "$ROOT_DIR" -type d -name "dist" -not -path "*/node_modules/*" -exec rm -rf {} + 2>/dev/null || true
find "$ROOT_DIR" -type d -name "build" -not -path "*/node_modules/*" -exec rm -rf {} + 2>/dev/null || true
find "$ROOT_DIR" -type d -name ".cache" -not -path "*/node_modules/*" -exec rm -rf {} + 2>/dev/null || true
echo "✅ dist/build/.cache directories removed"

# Step 3: Remove duplicate documentation files
echo ""
echo "[3/5] Removing duplicate documentation files..."
DOCS_DIR="$ROOT_DIR/docs"

# Remove duplicate audit reports (keeping the most comprehensive one)
rm -f "$DOCS_DIR/booking-engine-audit-report.md"  # Duplicate of BOOKING_ENGINE_COMPREHENSIVE_AUDIT.md
rm -f "$ROOT_DIR/BOOKING_ENGINE_AUDIT_REPORT.json"  # JSON version (redundant)
rm -f "$DOCS_DIR/AUDIT_SUMMARY.md"  # Overlaps with EXECUTIVE_SUMMARY.md
rm -f "$DOCS_DIR/DELIVERY_SUMMARY.md"  # Overlaps with EXECUTIVE_SUMMARY.md

# Remove redundant phase documentation
rm -f "$DOCS_DIR/PHASE_2_COMPLETION.md"  # Covered by PHASE2_STAGING_VERIFICATION.md
rm -f "$DOCS_DIR/STAGING_TEST_PLAN_PHASE2.md"  # Overlaps with PHASE2_STAGING_VERIFICATION.md
echo "✅ Duplicate documentation removed"

# Step 4: Remove unused .turbo directories
echo ""
echo "[4/5] Removing .turbo and other build caches..."
find "$ROOT_DIR" -type d -name ".turbo" -exec rm -rf {} + 2>/dev/null || true
find "$ROOT_DIR" -type d -name ".vite" -exec rm -rf {} + 2>/dev/null || true
find "$ROOT_DIR" -type d -name ".swc" -exec rm -rf {} + 2>/dev/null || true
find "$ROOT_DIR" -type d -name "coverage" -not -path "*/node_modules/*" -exec rm -rf {} + 2>/dev/null || true
find "$ROOT_DIR" -type d -name ".eslintcache" -exec rm -rf {} + 2>/dev/null || true
echo "✅ Build caches removed"

# Step 5: Clean pnpm store and stale dependencies
echo ""
echo "[5/5] Cleaning pnpm dependency cache..."
pnpm store prune 2>/dev/null || true
echo "✅ pnpm store cleaned"

echo ""
echo "========================================="
echo "  Cleanup Complete!"
echo "========================================="
echo ""
echo "Removed:"
echo "  - All node_modules directories"
echo "  - All dist/build directories"
echo "  - Cache directories (.cache, .turbo, .vite, .swc, coverage)"
echo "  - Duplicate documentation files"
echo ""
echo "Run 'pnpm install' to reinstall dependencies"