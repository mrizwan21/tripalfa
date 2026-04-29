#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
KONG_BIN="${KONG_BIN:-kong}"
KONG_ADMIN_URL="${KONG_ADMIN_URL:-http://localhost:8001}"

echo "[gateway] Running local preflight checks..."

if ! command -v "$KONG_BIN" >/dev/null 2>&1; then
  echo "[gateway] FAIL: Kong binary not found in PATH."
  echo "[gateway] Hint: install Kong Gateway locally and ensure 'kong' is available."
  exit 1
fi

echo "[gateway] PASS: Kong binary found: $(command -v "$KONG_BIN")"

echo "[gateway] Building Kong config from Wicked definitions..."
node "$ROOT_DIR/tools/scripts/gateway/build-kong-from-wicked.mjs" >/dev/null
echo "[gateway] PASS: Declarative config generated."

echo "[gateway] Verifying route coverage..."
node "$ROOT_DIR/tools/scripts/gateway/verify-route-coverage.mjs" >/dev/null
echo "[gateway] PASS: Route coverage complete."

if curl -fsS "${KONG_ADMIN_URL}/" >/dev/null; then
  echo "[gateway] PASS: Kong Admin API reachable at ${KONG_ADMIN_URL}"
else
  echo "[gateway] WARN: Kong Admin API is not reachable at ${KONG_ADMIN_URL}"
  echo "[gateway] Hint: start Kong locally, then run: pnpm gateway:sync"
fi

echo "[gateway] Preflight completed."
