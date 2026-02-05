#!/bin/bash

# Function to kill all child processes on exit
trap 'kill $(jobs -p)' EXIT

echo "Starting Travel Kingdom Backend Services..."

# Start API Gateway
echo "Starting API Gateway (Port 3000)..."
cd api-gateway && npm install && npm start &
cd ..

# Start Booking Service
echo "Starting Booking Service (Port 3001)..."
cd microservices/booking-service && npm install && npm start &
cd ../..

# Start Inventory Service
echo "Starting Inventory Service (Port 3002)..."
cd microservices/inventory-service && npm install && npm start &
cd ../..

# Start User Service
echo "Starting User Service (Port 3003)..."
cd microservices/user-service && npm install && npm start &
cd ../..

# Start Payment Service
echo "Starting Payment Service (Port 3004)..."
cd microservices/payment-service && npm install && npm start &
cd ../..

# Start Analytics Service
echo "Starting Analytics Service (Port 3005)..."
cd microservices/analytics-service && npm install && npm start &
cd ../..

echo "All services started. Press Ctrl+C to stop."
wait
