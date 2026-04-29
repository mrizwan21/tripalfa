#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
KONG_ADMIN_URL="${KONG_ADMIN_URL:-http://localhost:8001}"
KONG_CONFIG_FILE="${KONG_CONFIG_FILE:-$ROOT_DIR/infrastructure/kong/kong.yml}"

if [[ ! -f "$KONG_CONFIG_FILE" ]]; then
  echo "[gateway] Missing config file: $KONG_CONFIG_FILE"
  echo "[gateway] Run: pnpm gateway:build"
  exit 1
fi

echo "[gateway] Checking Kong Admin API at ${KONG_ADMIN_URL}"
curl -fsS "${KONG_ADMIN_URL}/" >/dev/null

echo "[gateway] Loading declarative config into Kong (DB-less /config)"
if curl -fsS -X POST "${KONG_ADMIN_URL}/config?check_hash=1" \
  -H "Content-Type: application/yaml" \
  --data-binary "@${KONG_CONFIG_FILE}" >/dev/null; then
  echo "[gateway] Config loaded via raw YAML payload."
else
  echo "[gateway] Raw YAML upload failed, trying multipart upload..."
  curl -fsS -X POST "${KONG_ADMIN_URL}/config?check_hash=1" \
    -F "config=@${KONG_CONFIG_FILE}" >/dev/null
  echo "[gateway] Config loaded via multipart payload."
fi

echo "[gateway] Sync complete."
echo "[gateway] Proxy URL should be available on your local Kong proxy port."
