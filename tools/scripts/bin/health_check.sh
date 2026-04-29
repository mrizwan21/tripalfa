#!/bin/bash
set -euo pipefail

check() {
  local name="$1"
  local url="$2"
  if curl -fsS "$url" >/dev/null; then
    echo "ok   $name ($url)"
  else
    echo "down $name ($url)"
  fi
}

check "booking-service" "http://localhost:3001/health"
check "booking-engine-service" "http://localhost:3021/health"
