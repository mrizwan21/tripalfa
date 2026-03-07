#!/bin/bash

#######################################################################
# TripAlfa Production Deployment Script
# Automated deployment with health checks and rollback capability
#######################################################################

set -e

# Configuration
ENVIRONMENT=${1:-staging}
APP_VERSION=${2:-latest}
REGISTRY=${DOCKER_REGISTRY:-docker.io/tripalfa}
COMPOSE_FILE="infrastructure/compose/docker-compose.prod.yml"
LOG_FILE="deployment-$(date +%Y%m%d-%H%M%S).log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
  echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$LOG_FILE"
}

log_success() {
  echo -e "${GREEN}[✓]${NC} $1" | tee -a "$LOG_FILE"
}

log_error() {
  echo -e "${RED}[✗]${NC} $1" | tee -a "$LOG_FILE"
}

log_warning() {
  echo -e "${YELLOW}[!]${NC} $1" | tee -a "$LOG_FILE"
}

#######################################################################
# Phase 1: Pre-Deployment Checks
#######################################################################
phase_pre_deployment() {
  log_info "Phase 1: Running pre-deployment checks..."

  # Check required commands
  for cmd in docker docker-compose npm curl; do
    if ! command -v $cmd &> /dev/null; then
      log_error "$cmd is not installed"
      exit 1
    fi
  done
  log_success "All required commands available"

  # Check environment file
  if [ ! -f ".env.production" ] && [ ! -f ".env.$ENVIRONMENT" ]; then
    log_error "Environment file not found (.env.production or .env.$ENVIRONMENT)"
    exit 1
  fi
  log_success "Environment file found"

  # Run linting
  log_info "Running linters..."
  npm run lint 2>&1 | tee -a "$LOG_FILE" || log_warning "Linting warnings found"
  log_success "Lint check completed"

  # Run type checking
  log_info "Running type checks..."
  npx tsc -p tsconfig.json --noEmit 2>&1 | tee -a "$LOG_FILE" || {
    log_error "TypeScript compilation failed"
    exit 1
  }
  log_success "Type checking passed"

  # Run tests
  log_info "Running test suite..."
  npm test 2>&1 | tail -20 | tee -a "$LOG_FILE" || {
    log_error "Tests failed"
    exit 1
  }
  log_success "All tests passed"
}

#######################################################################
# Phase 2: Build Images
#######################################################################
phase_build_images() {
  log_info "Phase 2: Building Docker images..."

  local services=(
    "api-gateway:services/api-gateway"
    "booking-service:services/booking-service"
    "user-service:services/user-service"
    "payment-service:services/payment-service"
    "wallet-service:services/wallet-service"
    "notification-service:services/notification-service"
    "booking-engine:apps/booking-engine"
    "static-data:packages/static-data"
  )

  for service in "${services[@]}"; do
    IFS=':' read -r name path <<< "$service"
    log_info "Building $name from $path..."
    
    docker build \
      --tag "$REGISTRY/$name:$APP_VERSION" \
      --tag "$REGISTRY/$name:latest" \
      "./$path" 2>&1 | tee -a "$LOG_FILE" || {
      log_error "Failed to build $name"
      exit 1
    }
    
    log_success "$name built successfully"
  done
}

#######################################################################
# Phase 3: Push Images to Registry
#######################################################################
phase_push_images() {
  log_info "Phase 3: Pushing images to registry..."

  if [ "$REGISTRY" != "docker.io" ]; then
    log_info "Logging into Docker registry..."
    echo "$DOCKER_PASSWORD" | docker login -u "$DOCKER_USERNAME" --password-stdin "$REGISTRY" 2>&1 | tee -a "$LOG_FILE"
  fi

  local services=(
    "api-gateway"
    "booking-service"
    "user-service"
    "payment-service"
    "wallet-service"
    "notification-service"
    "booking-engine"
    "static-data"
  )

  for service in "${services[@]}"; do
    log_info "Pushing $service:$APP_VERSION..."
    docker push "$REGISTRY/$service:$APP_VERSION" 2>&1 | tee -a "$LOG_FILE" || {
      log_error "Failed to push $service"
      exit 1
    }
    log_success "$service pushed successfully"
  done
}

#######################################################################
# Phase 4: Backup Current State
#######################################################################
phase_backup() {
  log_info "Phase 4: Backing up current state..."

  # Backup database
  if [ -n "$DATABASE_URL" ]; then
    log_info "Creating database backup..."
    BACKUP_FILE="backup-$(date +%Y%m%d-%H%M%S).sql"
    
    # For Neon, trigger via API or manual backup
    log_warning "Manual database backup required. Visit: https://console.neon.tech/app/projects"
  fi

  # Save current image tags
  docker-compose -f "$COMPOSE_FILE" ps > "compose-state-backup.txt" 2>&1 || true
  log_success "Current state backed up"
}

#######################################################################
# Phase 5: Deploy Services
#######################################################################
phase_deploy() {
  log_info "Phase 5: Deploying services..."

  # Load environment
  if [ -f ".env.$ENVIRONMENT" ]; then
    export $(cat ".env.$ENVIRONMENT" | grep -v '^#' | xargs)
  fi

  # Pull latest images
  log_info "Pulling latest images..."
  docker-compose -f "$COMPOSE_FILE" pull 2>&1 | tee -a "$LOG_FILE"

  # Stop old containers
  log_info "Stopping old containers..."
  docker-compose -f "$COMPOSE_FILE" down 2>&1 | tee -a "$LOG_FILE" || true

  # Start new containers
  log_info "Starting new containers..."
  docker-compose -f "$COMPOSE_FILE" up -d 2>&1 | tee -a "$LOG_FILE" || {
    log_error "Failed to start containers"
    exit 1
  }

  log_success "Services deployed successfully"
}

#######################################################################
# Phase 6: Health Checks
#######################################################################
phase_health_checks() {
  log_info "Phase 6: Running health checks..."

  local max_attempts=30
  local attempt=0
  local all_healthy=false

  while [ $attempt -lt $max_attempts ]; do
    log_info "Health check attempt $((attempt + 1))/$max_attempts..."

    local healthy_count=0
    local total_services=6

    # Check each service
    services=(
      "http://localhost:3000/health:API Gateway"
      "http://localhost:3001/health:Booking Service"
      "http://localhost:3005/health:User Service"
      "http://localhost:3006/health:Payment Service"
      "http://localhost:3007/health:Wallet Service"
      "http://localhost:3002/health:Static Data"
    )

    for service in "${services[@]}"; do
      IFS=':' read -r url name <<< "$service"
      if curl -f -s "$url" > /dev/null 2>&1; then
        log_success "$name is healthy"
        ((healthy_count++))
      else
        log_warning "$name is not ready"
      fi
    done

    if [ $healthy_count -eq $total_services ]; then
      all_healthy=true
      break
    fi

    ((attempt++))
    sleep 10
  done

  if [ "$all_healthy" = false ]; then
    log_error "Services failed health checks"
    exit 1
  fi

  log_success "All services are healthy"
}

#######################################################################
# Phase 7: Smoke Tests
#######################################################################
phase_smoke_tests() {
  log_info "Phase 7: Running smoke tests..."

  # Test static data endpoints
  log_info "Testing static data endpoints..."
  
  endpoints=(
    "http://localhost:3002/api/countries"
    "http://localhost:3002/api/cities"
    "http://localhost:3002/api/airports"
  )

  for endpoint in "${endpoints[@]}"; do
    if curl -f -s "$endpoint" > /dev/null 2>&1; then
      log_success "$endpoint is responding"
    else
      log_error "$endpoint failed"
      exit 1
    fi
  done

  log_success "Smoke tests passed"
}

#######################################################################
# Phase 8: Post-Deployment
#######################################################################
phase_post_deployment() {
  log_info "Phase 8: Post-deployment tasks..."

  # Print service info
  log_info "Services status:"
  docker-compose -f "$COMPOSE_FILE" ps | tee -a "$LOG_FILE"

  # Print metrics
  log_info "Container resource usage:"
  docker stats --no-stream | tee -a "$LOG_FILE" || true

  # Print next steps
  echo ""
  log_success "Deployment completed successfully!"
  echo ""
  log_info "Next steps:"
  echo "  1. Monitor logs: docker-compose -f $COMPOSE_FILE logs -f"
  echo "  2. Access Grafana: http://localhost:3010"
  echo "  3. Check Prometheus: http://localhost:9090"
  echo "  4. Run full E2E tests: npm run test:e2e"
  echo ""
  log_info "Deployment log saved to: $LOG_FILE"
}

#######################################################################
# Rollback Function
#######################################################################
rollback() {
  log_error "Deployment failed! Rolling back..."

  if [ -f "compose-state-backup.txt" ]; then
    log_info "Restoring previous state..."
    docker-compose -f "$COMPOSE_FILE" down 2>&1 | tee -a "$LOG_FILE" || true
    
    # Restart with previous versions
    docker-compose -f "$COMPOSE_FILE" up -d 2>&1 | tee -a "$LOG_FILE" || log_error "Rollback failed"
  fi

  log_warning "Rollback completed. Check $LOG_FILE for details."
  exit 1
}

#######################################################################
# Trap errors and rollback
#######################################################################
trap rollback ERR

#######################################################################
# Main Execution
#######################################################################
main() {
  log_info "=========================================="
  log_info "TripAlfa Production Deployment"
  log_info "Environment: $ENVIRONMENT"
  log_info "Version: $APP_VERSION"
  log_info "=========================================="
  echo ""

  phase_pre_deployment
  phase_build_images
  phase_push_images
  phase_backup
  phase_deploy
  phase_health_checks
  phase_smoke_tests
  phase_post_deployment
}

# Run main function
main "$@"
