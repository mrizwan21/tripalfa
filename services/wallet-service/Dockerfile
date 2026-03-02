# Dockerfile for wallet-service
# This Dockerfile follows the shared template at infrastructure/templates/service.Dockerfile.template
# Parameters: SERVICE_NAME=wallet-service, WORKSPACE_NAME=wallet-service, PORT=3008, HEALTH_PATH=health

FROM node:20-alpine AS builder

# Enable corepack and pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy npm configuration for network retry settings
COPY .npmrc ./

# Copy lockfile and workspace config first for layer caching
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY tsconfig.json tsconfig.base.json ./

# Copy all project files
COPY services ./services/
COPY packages ./packages/
COPY database ./database/

# Install dependencies using pnpm with cache mount
# Using --fetch-timeout for better handling of slow connections
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile --ignore-scripts --fetch-timeout=300000

# Generate Prisma client
RUN pnpm --filter @tripalfa/shared-database generate

# Build all packages including shared-database
RUN pnpm --filter @tripalfa/shared-database build
RUN pnpm --filter @tripalfa/shared-types build

# Build the service
RUN pnpm --filter wallet-service build

# Clean up build info files from the host (AFTER building everything)
RUN find . -name "*.tsbuildinfo" -delete

# Production stage
FROM node:20-alpine

# Install dumb-init and curl for health checks
RUN apk add --no-cache dumb-init curl

WORKDIR /app

# Copy entire node_modules from builder with all symlinks and .pnpm structure
COPY --from=builder /app/node_modules ./node_modules/

# Copy service package.json for reference
COPY services/wallet-service/package.json ./services/wallet-service/

# Copy built dist from builder
COPY --from=builder /app/services/wallet-service/dist ./services/wallet-service/dist

# Since Docker builder doesn't create shared-database dist properly, copy from the build context
# This copies the locally pre-built shared-database dist files
COPY packages/shared-database/dist/ ./packages/shared-database/dist/

# Create workspace package node_modules directories with symlinks to shared packages and remove source files
RUN mkdir -p services/wallet-service/node_modules/@tripalfa && \
    ln -s ../../../../packages/shared-database services/wallet-service/node_modules/@tripalfa/shared-database && \
    find /app/packages -type d -name "src" ! -path "*/node_modules/*" -exec rm -rf {} + 2>/dev/null || true

WORKDIR /app/services/wallet-service

EXPOSE 3008

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3008/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "--enable-source-maps", "dist/app.js"]
