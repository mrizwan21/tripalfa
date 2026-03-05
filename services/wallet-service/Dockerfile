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

# Enable corepack and pnpm for recreating symlinks, install dumb-init and curl
RUN corepack enable && \
    corepack prepare pnpm@latest --activate && \
    apk add --no-cache dumb-init curl

WORKDIR /app

# Copy configuration files needed for pnpm to recreate node_modules structure
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY tsconfig.json tsconfig.base.json ./

# Copy workspace package directories (preserves structure for pnpm workspace detection)
# We only need the package.json and dist files, not source code
COPY services/wallet-service/package.json ./services/wallet-service/package.json
COPY packages/shared-database/package.json ./packages/shared-database/package.json
COPY packages/shared-types/package.json ./packages/shared-types/package.json

# Copy entire node_modules from builder (includes .pnpm directory with all packages)
COPY --from=builder /app/node_modules ./node_modules/

# Copy built dist from builder
COPY --from=builder /app/services/wallet-service/dist ./services/wallet-service/dist

# Copy database schema for reference
COPY database ./database/

# Copy only the dist directory from shared-database (not the entire package)
# This is more efficient than copying the whole package and cleaning up
COPY packages/shared-database/dist/ ./packages/shared-database/dist/
COPY packages/shared-database/package.json ./packages/shared-database/

# Recreate pnpm's node_modules symlinks for monorepo workspaces
# Use pnpm install --filter to specifically handle wallet-service's dependencies
RUN cd /app && \
    pnpm install --filter wallet-service --prefer-offline 2>/dev/null || \
    pnpm install --filter wallet-service && \
    \
    # Add shared packages to wallet-service node_modules  
    mkdir -p services/wallet-service/node_modules/@tripalfa && \
    ln -sf /app/packages/shared-database services/wallet-service/node_modules/@tripalfa/shared-database && \
    \
    # Clean up source files from packages (keep only dist and package.json)
    find ./packages -type d \
      \( -name "src" -o -name "test" -o -name "tests" -o -name "__tests__" \) \
      -exec rm -rf {} + 2>/dev/null || true && \
    find ./packages \( -name "*.ts" -o -name "*.tsx" -o -name "tsconfig.json" \) \
      ! -path "*/dist/*" -delete 2>/dev/null || true && \
    # Verify dist directory exists after cleanup
    [ -d ./packages/shared-database/dist ] || (echo "ERROR: shared-database dist not found" && exit 1)

WORKDIR /app/services/wallet-service

EXPOSE 3008

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3008/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "--enable-source-maps", "dist/app.js"]
