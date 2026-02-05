#!/bin/bash

# TripAlfa API Integration Test Runner
# This script provides a convenient way to run API tests with different options

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if required dependencies are installed
check_dependencies() {
    print_info "Checking dependencies..."
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js first."
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm first."
        exit 1
    fi
    
    if ! command -v ts-node &> /dev/null; then
        print_warning "ts-node is not installed. Installing..."
        npm install -g ts-node
    fi
    
    print_success "Dependencies check completed"
}

# Function to install project dependencies
install_dependencies() {
    print_info "Installing project dependencies..."
    npm install
    print_success "Dependencies installed"
}

# Function to run all API tests
run_all_tests() {
    print_info "Running all API integration tests..."
    npm run test:api
}

# Function to run specific API tests
run_specific_tests() {
    case $1 in
        "hotelston")
            print_info "Running Hotelston API tests..."
            npm run test:api:hotelston
            ;;
        "innstant")
            print_info "Running Innstant Travel API tests..."
            npm run test:api:innstant
            ;;
        "duffel")
            print_info "Running Duffel API tests..."
            npm run test:api:duffel
            ;;
        "amadeus")
            print_info "Running Amadeus API tests..."
            npm run test:api:amadeus
            ;;
        *)
            print_error "Unknown API test: $1"
            print_info "Available options: hotelston, innstant, duffel, amadeus"
            exit 1
            ;;
    esac
}

# Function to validate environment configuration
validate_env() {
    print_info "Validating environment configuration..."
    
    # Check if .env file exists
    if [ ! -f .env ]; then
        print_warning ".env file not found. Creating a sample .env file..."
        create_sample_env
    fi
    
    # Check for required environment variables
    local missing_vars=()
    
    if [ -z "$HOTELSTON_USERNAME" ]; then
        missing_vars+=("HOTELSTON_USERNAME")
    fi
    
    if [ -z "$HOTELSTON_PASSWORD" ]; then
        missing_vars+=("HOTELSTON_PASSWORD")
    fi
    
    if [ ${#missing_vars[@]} -gt 0 ]; then
        print_warning "Missing environment variables: ${missing_vars[*]}"
        print_info "Please set these variables in your .env file or environment"
    else
        print_success "Environment configuration validated"
    fi
}

# Function to create a sample .env file
create_sample_env() {
    cat > .env << EOF
# Hotelston API
HOTELSTON_USERNAME=your_hotelston_username
HOTELSTON_PASSWORD=your_hotelston_password

# Innstant Travel API
INNSTANT_API_KEY=your_innstant_api_key

# Duffel API
DUFFEL_API_KEY=your_duffel_api_key

# Amadeus API
AMADEUS_API_KEY=your_amadeus_api_key
AMADEUS_API_SECRET=your_amadeus_api_secret

# Payment Gateways
STRIPE_API_KEY=your_stripe_api_key
PAYPAL_API_KEY=your_paypal_api_key

# Notification Services
EMAIL_API_KEY=your_email_api_key
SMS_API_KEY=your_sms_api_key
EOF
    
    print_success "Sample .env file created. Please update with your actual API keys."
}

# Function to display help
show_help() {
    echo "TripAlfa API Integration Test Runner"
    echo ""
    echo "Usage: $0 [OPTIONS] [API_NAME]"
    echo ""
    echo "OPTIONS:"
    echo "  -h, --help          Show this help message"
    echo "  -i, --install       Install dependencies"
    echo "  -v, --validate      Validate environment configuration"
    echo "  -d, --debug         Enable debug mode"
    echo "  -c, --config        Show configuration"
    echo ""
    echo "API_NAME (optional):"
    echo "  hotelston           Run only Hotelston API tests"
    echo "  innstant            Run only Innstant Travel API tests"
    echo "  duffel              Run only Duffel API tests"
    echo "  amadeus             Run only Amadeus API tests"
    echo ""
    echo "EXAMPLES:"
    echo "  $0                  Run all API tests"
    echo "  $0 hotelston        Run only Hotelston API tests"
    echo "  $0 -i -v            Install dependencies and validate environment"
    echo "  $0 -d amadeus       Run Amadeus API tests in debug mode"
    echo ""
}

# Function to show configuration
show_config() {
    print_info "Current configuration:"
    echo ""
    echo "Environment Variables:"
    echo "  HOTELSTON_USERNAME: ${HOTELSTON_USERNAME:-Not set}"
    echo "  HOTELSTON_PASSWORD: ${HOTELSTON_PASSWORD:-Not set}"
    echo "  INNSTANT_API_KEY: ${INNSTANT_API_KEY:-Not set}"
    echo "  DUFFEL_API_KEY: ${DUFFEL_API_KEY:-Not set}"
    echo "  AMADEUS_API_KEY: ${AMADEUS_API_KEY:-Not set}"
    echo "  AMADEUS_API_SECRET: ${AMADEUS_API_SECRET:-Not set}"
    echo ""
    echo "Configuration Files:"
    echo "  API Config: scripts/api-test-config.json"
    echo "  Test Suite: scripts/comprehensive-api-testing.ts"
    echo "  Documentation: docs/API_INTEGRATION_TESTING_GUIDE.md"
    echo ""
}

# Parse command line arguments
INSTALL_DEPS=false
VALIDATE_ENV=false
DEBUG_MODE=false
SHOW_CONFIG=false
API_NAME=""

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -i|--install)
            INSTALL_DEPS=true
            shift
            ;;
        -v|--validate)
            VALIDATE_ENV=true
            shift
            ;;
        -d|--debug)
            DEBUG_MODE=true
            shift
            ;;
        -c|--config)
            SHOW_CONFIG=true
            shift
            ;;
        hotelston|innstant|duffel|amadeus)
            API_NAME=$1
            shift
            ;;
        *)
            print_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Main execution
main() {
    print_info "TripAlfa API Integration Test Runner"
    print_info "===================================="
    
    # Check dependencies
    check_dependencies
    
    # Install dependencies if requested
    if [ "$INSTALL_DEPS" = true ]; then
        install_dependencies
    fi
    
    # Validate environment if requested
    if [ "$VALIDATE_ENV" = true ]; then
        validate_env
    fi
    
    # Show configuration if requested
    if [ "$SHOW_CONFIG" = true ]; then
        show_config
    fi
    
    # Enable debug mode if requested
    if [ "$DEBUG_MODE" = true ]; then
        export DEBUG=1
        print_info "Debug mode enabled"
    fi
    
    # Run tests
    if [ -n "$API_NAME" ]; then
        run_specific_tests "$API_NAME"
    else
        run_all_tests
    fi
    
    print_success "API tests completed successfully!"
}

# Run main function
main "$@"