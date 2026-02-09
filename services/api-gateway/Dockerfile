FROM node:18-alpine

WORKDIR /app

# Copy monorepo root files
COPY package*.json ./

# Copy packages for workspace dependencies
COPY packages ./packages

# Copy api-gateway service
COPY services/api-gateway ./services/api-gateway

# Install dependencies with workspace support
RUN npm install --legacy-peer-deps

# Build TypeScript to JavaScript
WORKDIR /app/services/api-gateway
RUN npm run build

# Final stage
FROM node:18-alpine

RUN apk add --no-cache dumb-init tini

WORKDIR /app

# Copy monorepo files
COPY package*.json ./
COPY packages ./packages

# Copy built app and node_modules from builder
COPY --from=0 /app/node_modules ./node_modules
COPY --from=0 /app/services/api-gateway/dist ./services/api-gateway/dist
COPY --from=0 /app/services/api-gateway/package*.json ./services/api-gateway/

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
USER nodejs

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })" || exit 1

# Start the app
CMD ["node", "services/api-gateway/dist/services/api-gateway/src/index.js"]
