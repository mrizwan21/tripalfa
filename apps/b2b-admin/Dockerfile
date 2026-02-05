FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files for caching
COPY package.json ./
COPY apps/b2b-admin/package.json ./apps/b2b-admin/
COPY apps/b2b-admin/server/package.json ./apps/b2b-admin/server/
COPY packages/shared-utils/package.json ./packages/shared-utils/
COPY packages/ui-components/package.json ./packages/ui-components/
COPY packages/shared-types/package.json ./packages/shared-types/

# Install dependencies (include workspace devDependencies so app-local types are available)
RUN npm install --include=dev

# Copy source
COPY . .

# Build the frontend (Admin SPA)
WORKDIR /app/apps/b2b-admin

RUN npm run build

# Build the backend (Express Server)
WORKDIR /app/apps/b2b-admin/server
RUN npm run build

# Final stage
FROM node:20-alpine

WORKDIR /app



# Copy the built frontend and server dist
COPY --from=builder /app/apps/b2b-admin/dist /app/apps/b2b-admin/dist
COPY --from=builder /app/apps/b2b-admin/server/dist /app/apps/b2b-admin/server/dist

# Copy root package.json and lockfile for workspace install
COPY --from=builder /app/package.json /app/package.json
COPY --from=builder /app/package-lock.json /app/package-lock.json
COPY --from=builder /app/apps/b2b-admin/server/package.json /app/apps/b2b-admin/server/package.json

# Install only production dependencies for the server workspace
RUN npm install --omit=dev --workspace=@tripalfa/server

WORKDIR /app/apps/b2b-admin/server

# Use the production environment and listen on port 3000 to match compose mapping
EXPOSE 3000

ENV NODE_ENV=production
ENV ADMIN_DIST_PATH=/app/apps/b2b-admin/dist
ENV PORT=3000

CMD ["node", "dist/index.js"]
