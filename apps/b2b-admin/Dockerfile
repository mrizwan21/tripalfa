# Dockerfile for b2b-admin - Frontend App
# This Dockerfile follows the shared template at infrastructure/templates/app.Dockerfile.template
# Parameters: APP_NAME=b2b-admin, PORT=3000

# Build stage
FROM node:20-alpine AS builder

# Enable corepack and pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Set the working directory
WORKDIR /app

# Copy monorepo root files
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY tsconfig.json tsconfig.base.json ./
COPY tsconfig.json tsconfig.base.json ./
COPY packages ./packages
COPY scripts ./scripts
COPY apps/b2b-admin ./apps/b2b-admin

# Install dependencies using pnpm with cache mount
# Using --fetch-timeout for better handling of slow connections
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile --fetch-timeout=300000

# Build shared-types first
RUN find . -name "*.tsbuildinfo" -delete
RUN pnpm --filter @tripalfa/shared-types build

# Build shared-utils which depends on shared-types
RUN pnpm --filter @tripalfa/shared-utils build

# Build api-clients which depends on shared-types
RUN pnpm --filter @tripalfa/api-clients build

# Reinstall to link built packages
# Using --fetch-timeout for better handling of slow connections
RUN pnpm install --frozen-lockfile --fetch-timeout=300000

# Build the application (skip type check in Docker - vite will handle it)
WORKDIR /app/apps/b2b-admin
RUN npx vite build

# Use nginx to serve the built application
FROM nginx:alpine

# Copy built application to nginx
COPY --from=builder /app/apps/b2b-admin/dist /usr/share/nginx/html

# Copy nginx configuration
COPY apps/b2b-admin/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 3000

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
