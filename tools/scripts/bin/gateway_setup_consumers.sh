#!/usr/bin/env bash
# Kong Consumer Setup Script for API Gateway Policy Compliance
# Creates consumers and API keys for key-auth plugin

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
KONG_ADMIN_URL="${KONG_ADMIN_URL:-http://localhost:8001}"

echo "[gateway] Setting up Kong consumers for key-auth..."

# Check if Kong Admin API is reachable
if ! curl -fsS "${KONG_ADMIN_URL}/" >/dev/null; then
  echo "[gateway] ERROR: Kong Admin API not reachable at ${KONG_ADMIN_URL}"
  echo "[gateway] Start Kong first: pnpm gateway:start"
  exit 1
fi

# Create consumers for each service
CONSUMERS=(
  "booking-engine:Booking Engine Service"
  "booking-service:Booking Service"
  "b2b-portal:B2B Portal Service"
  "call-center:Call Center Service"
  "super-admin:Super Admin Service"
)

for entry in "${CONSUMERS[@]}"; do
  IFS=':' read -r consumer_name description <<< "$entry"
  
  echo "[gateway] Creating consumer: $consumer_name ($description)"
  
  # Create consumer
  curl -fsS -X PUT "${KONG_ADMIN_URL}/consumers/${consumer_name}" \
    -d "username=${consumer_name}" \
    -d "custom_id=${consumer_name}-service" \
    >/dev/null
  
  # Create API key credential
  response=$(curl -fsS -X POST "${KONG_ADMIN_URL}/consumers/${consumer_name}/key-auth")
  api_key=$(echo "$response" | grep -o '"key":"[^"]*"' | cut -d'"' -f4)
  
  echo "[gateway]   API Key: $api_key"
  echo "$consumer_name:$api_key" >> "$ROOT_DIR/infrastructure/kong/.runtime/consumer_keys.txt"
done

echo "[gateway] Consumer setup complete."
echo "[gateway] API keys saved to: infrastructure/kong/.runtime/consumer_keys.txt"
echo ""
echo "[gateway] Usage: Include 'apikey: <key>' header in requests"
echo "[gateway] Example: curl -H 'apikey: <key>' http://localhost:8000/api/..."
