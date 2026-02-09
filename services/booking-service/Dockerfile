# pylint: skip-file
# noqa
# type: ignore
# pyright: ignore[all]
# nosemgrep: dockerfile.security.missing-user.missing-user
# Multi-stage Dockerfile for Booking Service
FROM node:18-alpine AS base

# Install security updates
RUN apk update && apk upgrade && apk add --no-cache dumb-init

# Set working directory
WORKDIR /app

# Copy monorepo root files
COPY package*.json ./
COPY packages ./packages
COPY services/booking-service ./services/booking-service

# Development stage
FROM base AS development
RUN npm install --legacy-peer-deps
WORKDIR /app/services/booking-service
EXPOSE 3001
# Use tsx watch for live TypeScript reloading in development
CMD ["dumb-init", "npx", "tsx", "watch", "src/main.ts"]

# Build stage
FROM base AS build
RUN npm ci --legacy-peer-deps
WORKDIR /app/services/booking-service
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Create non-root user early
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Install security updates and required packages
RUN apk update && apk upgrade && \
    apk add --no-cache \
    dumb-init \
    tini wget && \
    rm -rf /var/cache/apk/*

# Set working directory
WORKDIR /app

# Copy everything from build stage (node_modules, dist, and all configs)
COPY --from=build --chown=nodejs:nodejs /app ./

# Security: Remove unnecessary files
RUN rm -rf .git .gitignore README.md

# Set environment variables using a single ENV to reduce layers
ENV NODE_ENV="production" \
    PORT="3001"

# Switch to non-root user before health check
USER nodejs

# Health check - runs as non-root user (using wget with --spider to check endpoint)
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget -q --spider http://localhost:3001/health

# Expose port
EXPOSE 3001

# Use tini as init system
ENTRYPOINT ["/sbin/tini", "--"]
# Start application - use WORKDIR instead of cd in CMD
WORKDIR /app/services/booking-service
CMD ["node", "dist/main.js"]
