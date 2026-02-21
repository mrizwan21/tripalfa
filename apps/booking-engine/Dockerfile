# Dockerfile for booking-engine - Frontend App
# This Dockerfile follows the shared template at infrastructure/templates/app.Dockerfile.template
# Parameters: APP_NAME=booking-engine, PORT=3000

# Build stage
FROM node:20-alpine AS builder

# Enable corepack and pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Set the working directory
WORKDIR /app

# Copy monorepo root files
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY tsconfig.json tsconfig.base.json ./
COPY packages ./packages
COPY scripts ./scripts
COPY apps/booking-engine ./apps/booking-engine

# Clean up build info files from the host
RUN find . -name "*.tsbuildinfo" -delete

# Install dependencies using pnpm with cache mount
# Using --fetch-timeout for better handling of slow connections
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile --fetch-timeout=300000

# Build workspace dependencies
RUN pnpm --filter @tripalfa/shared-types build
RUN pnpm --filter @tripalfa/shared-utils build
RUN pnpm --filter @tripalfa/api-clients build
RUN pnpm --filter @tripalfa/static-data build
RUN pnpm --filter @tripalfa/ui-components build

# Build the application
WORKDIR /app/apps/booking-engine
RUN pnpm build

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
