FROM node:18-alpine

# Work from repo root so we can access shared packages
WORKDIR /usr/src/app

# Copy the service package.json and install service deps
COPY services/superadmin-api/package.json services/superadmin-api/package-lock.json* ./services/superadmin-api/
# Use npm ci for reproducible installs (includes devDependencies during build)
RUN cd services/superadmin-api && (npm ci --unsafe-perm || npm install --unsafe-perm)

# Copy service source and shared packages
COPY services/superadmin-api ./services/superadmin-api
# Ensure shared-types is available to tsc during build
COPY packages/shared-types ./packages/shared-types

# Build the service
WORKDIR /usr/src/app/services/superadmin-api
RUN npm run build

# Remove dev dependencies to keep image small
RUN npm prune --production

EXPOSE 4000

CMD ["node", "dist/index.js"]
