#!/usr/bin/env bash

set -euo pipefail

KONG_BIN="${KONG_BIN:-kong}"
KONG_CONF="${KONG_CONF:-./infrastructure/kong/kong.conf}"

if ! command -v "$KONG_BIN" >/dev/null 2>&1; then
  echo "[gateway] Kong binary not found."
  exit 1
fi

"$KONG_BIN" health -c "$KONG_CONF"
