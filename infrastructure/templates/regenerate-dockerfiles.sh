#!/bin/bash

# Script to regenerate service and app Dockerfiles from shared templates
# Usage: ./regenerate-dockerfiles.sh

set -e

SERVICE_TEMPLATE_FILE="infrastructure/templates/service.Dockerfile.template"
APP_TEMPLATE_FILE="infrastructure/templates/app.Dockerfile.template"

SERVICES=(
  "api-gateway:3000:@tripalfa/api-gateway"
  "booking-service:3001:@tripalfa/booking-service"
  "payment-service:3007:@tripalfa/payment-service"
  "user-service:3004:@tripalfa/user-service"
  "notification-service:3005:@tripalfa/notification-service"
  "organization-service:3006:@tripalfa/organization-service"
  "rule-engine-service:3010:@tripalfa/rule-engine-service"
  "kyc-service:3011:@tripalfa/kyc-service"
  "marketing-service:3012:@tripalfa/marketing-service"
)

APPS=(
  "b2b-admin:3000"
  "booking-engine:3000"
)

echo "Regenerating service Dockerfiles from template..."

for service_info in "${SERVICES[@]}"; do
  IFS=':' read -r service_name port workspace_name <<< "$service_info"
  dockerfile_path="services/$service_name/Dockerfile"

  # Generate Dockerfile content using pipes to avoid sed -i issues
  (
    echo "# Dockerfile for $service_name - NEON Database Support"
    echo "# This Dockerfile follows the shared template at infrastructure/templates/service.Dockerfile.template"
    echo "# Parameters: SERVICE_NAME=$service_name, WORKSPACE_NAME=$workspace_name, PORT=$port, HEALTH_PATH=health"
    echo ""
    tail -n +9 "$SERVICE_TEMPLATE_FILE" | \
    sed "s|SERVICE_NAME|$service_name|g" | \
    sed "s|WORKSPACE_NAME|$workspace_name|g" | \
    sed "s|PORT|$port|g" | \
    sed "s|HEALTH_PATH|health|g"
  ) > "$dockerfile_path"

  echo "✓ Generated $dockerfile_path"
done

echo "Regenerating app Dockerfiles from template..."

for app_info in "${APPS[@]}"; do
  IFS=':' read -r app_name port <<< "$app_info"
  dockerfile_path="apps/$app_name/Dockerfile"

  # Generate Dockerfile content using pipes to avoid sed -i issues
  (
    echo "# Dockerfile for $app_name - Frontend App"
    echo "# This Dockerfile follows the shared template at infrastructure/templates/app.Dockerfile.template"
    echo "# Parameters: APP_NAME=$app_name, PORT=$port"
    echo ""
    tail -n +9 "$APP_TEMPLATE_FILE" | \
    sed "s|APP_NAME|$app_name|g" | \
    sed "s|PORT|$port|g"
  ) > "$dockerfile_path"

  echo "✓ Generated $dockerfile_path"
done

echo "All Dockerfiles regenerated successfully!"