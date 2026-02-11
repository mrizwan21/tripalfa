# Document Service - Production Build Stage
FROM node:20-alpine AS builder

WORKDIR /build

# Copy monorepo root files
COPY package.json package-lock.json ./
COPY tsconfig.json ./
COPY jest.config.js ./

# Copy workspace files
COPY services/document-service ./services/document-service
COPY packages ./packages

# Install dependencies
RUN npm ci

# Build document service
RUN npm run build --workspace=@tripalfa/document-service

# ===== RUNTIME STAGE =====
FROM node:20-alpine

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Copy package files
COPY package.json package-lock.json ./

# Copy built application
COPY --from=builder /build/services/document-service/dist ./
COPY --from=builder /build/services/document-service/package.json ./package.json

# Copy prisma schema and migrations
COPY --from=builder /build/database/prisma ./prisma

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3004/health', (r) => {if (r.statusCode !== 200) throw new Error('unhealthy')})"

# Expose port
EXPOSE 3004

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["node", "src/index.js"]
