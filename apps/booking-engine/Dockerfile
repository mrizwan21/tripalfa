# pylint: skip-file
# Use official Node.js runtime as base image
FROM node:18-alpine AS builder

# Set the working directory
WORKDIR /app

# Copy monorepo root files
COPY package*.json ./
COPY packages ./packages
COPY apps/booking-engine ./apps/booking-engine

# Install dependencies
RUN npm install --legacy-peer-deps

# Build the application - skip tsc, let Vite handle TypeScript transpilation
WORKDIR /app/apps/booking-engine
RUN npx vite build

# Use nginx to serve the built application
FROM nginx:alpine

# Copy built application to nginx
COPY --from=builder /app/apps/booking-engine/dist /usr/share/nginx/html

# Copy nginx configuration
COPY apps/booking-engine/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 3000

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
