# TripAlfa Infrastructure Templates

This directory contains shared templates and scripts for maintaining consistent infrastructure across the TripAlfa monorepo.

## Dockerfile Templates

### Service Dockerfile Template (`Dockerfile.service`)

Used for all backend services in the `services/` directory. Features:

- Multi-stage build with Node.js 20 Alpine
- pnpm monorepo support (Frozen lockfile)
- PostgreSQL database support
- Health check endpoints
- Workspace-specific builds using --filter

**Parameters:**

- `SERVICE_NAME`: Service directory name (e.g., `booking-service`)
- `SERVICE_PORT`: Service port (e.g., `3001`)

### App Dockerfile Template (`app.Dockerfile.template`)

Used for frontend applications in the `apps/` directory. Features:

- Single-stage build optimized for frontend apps
- Vite build process

- Nginx serving for production

**Parameters:**

- `APP_NAME`: App directory name (e.g., `booking-engine`)
- `PORT`: App port (e.g., `3000`)

## Regeneration Script

The `regenerate-dockerfiles.sh` script automatically generates Dockerfiles for all services and apps using the templates. It:

1. Reads service/app configurations from the script
2. Applies templates with correct parameters
3. Adds header comments indicating template usage
4. Maintains consistency across all Dockerfiles

**Usage:**

```bash
./regenerate-dockerfiles.sh
```

## Current Services and Apps

**Services:**

- api-gateway (port 3000)
- booking-service (port 3001)
- user-service (port 3004)
- payment-service (port 3002)
- notification-service (port 3005)
- organization-service (port 3008)
- rule-engine-service (port 3009)

**Apps:**

- booking-engine (port 3000)

## Special Cases

- `apps/b2b-admin/Dockerfile`: Custom Dockerfile for SSR requirements (not using template)

## Maintenance

When adding new services or apps:

1. Add the service/app configuration to the appropriate array in `regenerate-dockerfiles.sh`
2. Run the regeneration script
3. Test the generated Dockerfile

When updating templates:

1. Modify the template files
2. Run the regeneration script to update all Dockerfiles
3. Test builds across affected services/apps

## Benefits

- **Consistency**: All services use the same base configuration
- **Maintainability**: Updates to the template automatically apply to all services
- **Security**: Standardized base images and security practices
- **Performance**: Optimized multi-stage builds and layer caching
