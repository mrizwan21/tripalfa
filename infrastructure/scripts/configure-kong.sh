#!/bin/bash

# Configuration for Kong Admin API
KONG_ADMIN="http://localhost:8001"
HOST_INTERNAL="host.docker.internal"

echo "🚀 Starting Final Enhanced Kong Configuration..."

# Helper function to create/update a service
setup_service() {
  local name=$1
  local url=$2
  echo "Setting up service: $name at $url"
  
  res=$(curl -s -o /dev/null -w "%{http_code}" -X POST "${KONG_ADMIN}/services" \
    --data "name=${name}" \
    --data "url=${url}")
    
  if [ "$res" != "201" ]; then
    curl -s -X PATCH "${KONG_ADMIN}/services/${name}" \
      --data "url=${url}" > /dev/null
  fi
}

# Helper function to create/update a route
setup_route() {
  local service_name=$1
  local route_name=$2
  local paths=$3
  local strip_path=${4:-false}
  echo "Setting up route: $route_name for $service_name on paths: $paths"
  
  res=$(curl -s -o /dev/null -w "%{http_code}" "${KONG_ADMIN}/routes/${route_name}")
  
  if [ "$res" == "200" ]; then
    curl -s -X PATCH "${KONG_ADMIN}/routes/${route_name}" \
      --data "paths[]=${paths}" \
      --data "strip_path=${strip_path}" \
      --data "preserve_host=true" > /dev/null
  else
    curl -s -X POST "${KONG_ADMIN}/services/${service_name}/routes" \
      --data "name=${route_name}" \
      --data "paths[]=${paths}" \
      --data "strip_path=${strip_path}" \
      --data "preserve_host=true" > /dev/null
  fi
}

# 1. SETUP SERVICES
setup_service "inventory-service" "http://${HOST_INTERNAL}:3002"
setup_service "user-service" "http://${HOST_INTERNAL}:3004"
setup_service "booking-service" "http://${HOST_INTERNAL}:3007"
setup_service "payment-service" "http://${HOST_INTERNAL}:3003"
setup_service "analytics-service" "http://${HOST_INTERNAL}:3006"
# Point superadmin-api service directly to the v1 prefix
setup_service "superadmin-api" "http://${HOST_INTERNAL}:4000/v1"
setup_service "b2b-admin-server" "http://${HOST_INTERNAL}:5000"

# 2. SETUP ROUTES

# Inventory
setup_route "inventory-service" "inventory-search" "/search"
setup_route "inventory-service" "inventory-vendors" "/api-vendors"
setup_route "inventory-service" "inventory-suppliers" "/suppliers"
setup_route "inventory-service" "inventory-legacy-vendors" "/api/v1/admin/api-vendors" true
setup_route "inventory-service" "inventory-legacy-suppliers" "/api/v1/admin/suppliers" true
setup_route "inventory-service" "inventory-legacy-hotels" "/api/inventory/hotels" true

# User Service
setup_route "user-service" "user-auth" "/auth"
setup_route "user-service" "user-profile" "/user"
setup_route "user-service" "user-admin" "/admin"
setup_route "user-service" "user-legacy-auth" "/api/auth" true
setup_route "user-service" "user-legacy-roles" "/api/roles" true
setup_route "user-service" "user-legacy-profile" "/api/user" true
setup_route "user-service" "user-legacy-branches" "/api/branches" true

# Booking Service
setup_route "booking-service" "booking-main" "/bookings"
setup_route "booking-service" "booking-single" "/booking"
setup_route "booking-service" "booking-legacy-admin" "/api/admin" false
setup_route "booking-service" "booking-legacy-bookings" "/api/bookings" false

# SuperAdmin & Notifications
setup_route "superadmin-api" "super-tenants" "/tenants" # Note: service URL has /v1
setup_route "superadmin-api" "super-notifs" "/notifications"
setup_route "superadmin-api" "super-legacy-notifs" "/api/notifications" true # /api/notifications -> /notifications on service (:4000/v1)

# B2B Admin Server
setup_route "b2b-admin-server" "b2b-legacy-staff" "/api/b2b/staff" false

echo ""
echo "✅ Kong Gateway Integrated with Legacy & Versioned Paths!"
echo "----------------------------------------------------"
echo "Total Services: $(curl -s ${KONG_ADMIN}/services | jq '.data | length')"
echo "Total Routes:   $(curl -s ${KONG_ADMIN}/routes | jq '.data | length')"
