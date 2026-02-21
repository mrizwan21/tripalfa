#!/bin/bash

# TripAlfa Microservices Database Setup Script
# This script creates separate databases for each microservice

set -e

echo "🚀 Setting up TripAlfa microservices databases..."

# Database configuration
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_USER=${DB_USER:-postgres}
DB_PASSWORD=${DB_PASSWORD:-password}

# Service databases to create
SERVICES=(
    "user_service"
    "audit_service"
    "payment_service"
    "booking_service"
    "notification_service"
    "shared_data"
)

# Function to create database
create_database() {
    local db_name=$1
    echo "📦 Creating database: tripalfa_${db_name}"

    # Check if database already exists
    if psql -h $DB_HOST -p $DB_PORT -U $DB_USER -lqt | cut -d \| -f 1 | grep -qw "tripalfa_${db_name}"; then
        echo "⚠️  Database tripalfa_${db_name} already exists, skipping..."
        return 0
    fi

    # Create database
    createdb -h $DB_HOST -p $DB_PORT -U $DB_USER "tripalfa_${db_name}"
    echo "✅ Created database: tripalfa_${db_name}"
}

# Function to generate environment variables
generate_env_vars() {
    echo "📝 Generating environment variables..."

    cat > .env.services << EOF
# TripAlfa Microservices Database URLs
# Copy these to your service-specific .env files

USER_SERVICE_DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/tripalfa_user_service"
AUDIT_SERVICE_DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/tripalfa_audit_service"
PAYMENT_SERVICE_DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/tripalfa_payment_service"
BOOKING_SERVICE_DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/tripalfa_booking_service"
NOTIFICATION_SERVICE_DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/tripalfa_notification_service"
SHARED_DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/tripalfa_shared_data"
EOF

    echo "✅ Environment variables saved to .env.services"
}

# Function to run Prisma migrations for each service
run_migrations() {
    echo "🔄 Running Prisma migrations for all services..."

    for service in "${SERVICES[@]}"; do
        if [ "$service" = "shared_data" ]; then
            service_dir="packages/shared-database"
        else
            service_dir="services/${service}"
        fi

        if [ -d "$service_dir" ]; then
            echo "📦 Running migrations for ${service}..."
            cd "$service_dir"

            # Generate Prisma client
            npx prisma generate

            # Run migrations
            npx prisma migrate dev --name init --skip-generate

            cd - > /dev/null
            echo "✅ Completed migrations for ${service}"
        else
            echo "⚠️  Service directory not found: $service_dir"
        fi
    done
}

# Main execution
echo "🔧 Database Configuration:"
echo "  Host: $DB_HOST"
echo "  Port: $DB_PORT"
echo "  User: $DB_USER"
echo ""

# Create databases
echo "🏗️  Creating service databases..."
for service in "${SERVICES[@]}"; do
    create_database "$service"
done

echo ""

# Generate environment variables
generate_env_vars

echo ""

# Ask user if they want to run migrations
read -p "🤔 Do you want to run Prisma migrations now? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    run_migrations
else
    echo "⏭️  Skipping migrations. You can run them later with:"
    echo "   cd services/[service-name] && npx prisma migrate dev --name init"
fi

echo ""
echo "🎉 Database setup completed!"
echo ""
echo "📋 Next steps:"
echo "1. Copy database URLs from .env.services to your service .env files"
echo "2. Update your docker-compose files to include the new databases"
echo "3. Run data migration scripts to populate the new databases"
echo "4. Update service code to use the new database connections"
echo ""
echo "📚 See database/migration-plan.md for detailed migration instructions"