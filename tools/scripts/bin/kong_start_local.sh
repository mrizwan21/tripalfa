#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
KONG_BIN="${KONG_BIN:-kong}"
KONG_CONF="${KONG_CONF:-$ROOT_DIR/infrastructure/kong/kong.conf}"

if ! command -v "$KONG_BIN" >/dev/null 2>&1; then
  echo "[gateway] Kong binary not found."
  echo "[gateway] Install Kong Gateway locally, then re-run this script."
  exit 1
fi

mkdir -p "$ROOT_DIR/infrastructure/kong/.runtime/logs"

echo "[gateway] Building Kong config from Wicked catalog"
node "$ROOT_DIR/tools/scripts/gateway/build-kong-from-wicked.mjs"

echo "[gateway] Starting Kong with $KONG_CONF"
"$KONG_BIN" start -c "$KONG_CONF"

echo "[gateway] Kong started."
echo "[gateway] Proxy: http://localhost:3030"
echo "[gateway] Admin: http://localhost:8001"
