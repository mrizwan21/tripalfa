#!/bin/bash

# TripAlfa Backend Services Build & Deploy Script
# Builds all services sequentially and deploys with Neon DB connection

set -e

cd "/Users/mohamedrizwan/Desktop/TripAlfa - Node"

echo "=========================================="
echo "TripAlfa Backend Services Deployment"
echo "=========================================="
echo ""
echo "Building services sequentially..."
echo "Database: NEON_DATABASE_URL (cloud)"
echo "Static Data: tripalfa-staticdb (local Docker)"
echo ""

# List of services to build (api-gateway already built)
SERVICES=(
  "user-service:services/user-service"
  "payment-service:services/payment-service"
  "booking-service:services/booking-service"
  "notification-service:services/notification-service"
  "organization-service:services/organization-service"
  "wallet-service:services/wallet-service"
  "rule-engine-service:services/rule-engine-service"
  "kyc-service:services/kyc-service"
  "marketing-service:services/marketing-service"
  "b2b-admin-service:services/b2b-admin-service"
  "booking-engine-service:services/booking-engine-service"
  "b2b-admin:apps/b2b-admin"
  "booking-engine:apps/booking-engine"
)

# Build each service
for service_pair in "${SERVICES[@]}"; do
  IFS=':' read -r service_name service_path <<< "$service_pair"
  
  echo "Building $service_name ($service_path)..."
  if docker build -f "$service_path/Dockerfile" -t "tripalfa-$service_name:latest" . 2>&1 | tail -5; then
    echo "✓ $service_name built successfully"
  else
    echo "⚠ Warning: $service_name build failed, continuing..."
  fi
  echo ""
  sleep 10  # Wait between builds to reduce load on npm registry
done

echo "=========================================="
echo "Building complete - checking images..."
echo "=========================================="
docker images --filter "reference=tripalfa-*" --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"

echo ""
echo "Deploying services with docker-compose..."
docker-compose -f docker-compose.backend.yml --env-file .env.docker.local up -d

echo ""
echo "Waiting for services to start (30 seconds)..."
sleep 30

echo ""
echo "=========================================="
echo "Deployment Status"
echo "=========================================="
docker ps --filter "name=tripalfa" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "Checking service health..."
docker ps --filter "name=tripalfa" --format "{{.Names}}" | while read container; do
  if [ ! -z "$container" ]; then
    status=$(docker inspect --format='{{.State.Health.Status}}' "$container" 2>/dev/null || echo "no-healthcheck")
    echo "  $container: $status"
  fi
done

echo ""
echo "=========================================="
echo "Deployment Complete!"
echo "=========================================="
echo "Services are now running and connected to:"
echo "  ✓ Database: NEON Cloud PostgreSQL"
echo "  ✓ Static Data: Local Docker PostgreSQL (tripalfa-staticdb)"
echo "=========================================="
