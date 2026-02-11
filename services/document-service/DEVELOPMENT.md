# Document Service - Development Guide

## Overview

The Document Service is a microservice responsible for managing document generation, storage, retrieval, and distribution within the TripAlfa ecosystem. It handles various document types including booking confirmations, invoices, itineraries, receipts, and amendments.

**Service Port:** 3004  
**Database:** PostgreSQL (Prisma ORM)  
**Cache:** Redis  
**Documentation Format:** HTML, PDF

## Quick Start

### Prerequisites

- Node.js 20.x or higher
- PostgreSQL 14+
- Redis 7+
- npm or yarn

### Installation

```bash
# Install dependencies (from project root)
npm install

# Set up environment
cp services/document-service/.env.example services/document-service/.env

# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate
```

### Development Server

```bash
# Start document service with watch mode
npm run dev --workspace=@tripalfa/document-service

# Or with specific port
PORT=3004 npm run dev --workspace=@tripalfa/document-service

# With debug logging
DEBUG=tripalfa:* npm run dev --workspace=@tripalfa/document-service
```

### Docker Development

```bash
# Start all services with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f document-service

# Stop services
docker-compose down

# Reset database
docker-compose down -v
```

## Project Structure

```
document-service/
├── src/
│   ├── index.ts           # Application entry point
│   ├── config/
│   │   ├── database.ts    # Database configuration
│   │   ├── cache.ts       # Redis configuration
│   │   └── logger.ts      # Logging setup
│   ├── controllers/       # HTTP request handlers
│   ├── services/          # Business logic
│   ├── models/            # Type definitions
│   ├── middleware/        # Express middleware
│   ├── utils/             # Helper utilities
│   └── routes/            # API routes
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── migrations/        # Database migrations
├── tests/
│   ├── integration/       # Integration tests
│   ├── unit/             # Unit tests
│   ├── migration/        # Migration tests
│   └── performance/      # Load testing
├── docker-compose.yml     # Docker development setup
├── Dockerfile            # Production Docker image
├── .env.example          # Environment template
├── package.json          # Dependencies
└── README.md            # Quick reference
```

## Key APIs

### Document Management

#### Generate Document
```bash
POST /documents/generate
Authorization: Bearer {token}

Request:
{
  "type": "BOOKING_CONFIRMATION",
  "context": { ... },
  "format": "PDF"
}

Response:
{
  "success": true,
  "document": {
    "id": "doc-123",
    "type": "BOOKING_CONFIRMATION",
    "status": "GENERATED",
    "url": "/documents/doc-123/download"
  }
}
```

#### Retrieve Document
```bash
GET /documents/{id}
Authorization: Bearer {token}

Response:
{
  "success": true,
  "document": { ... }
}
```

#### List Documents
```bash
GET /documents?page=1&pageSize=20&type=BOOKING_CONFIRMATION
Authorization: Bearer {token}

Response:
{
  "success": true,
  "items": [ ... ],
  "page": 1,
  "pageSize": 20,
  "total": 100
}
```

#### Download Document
```bash
GET /documents/{id}/download
Authorization: Bearer {token}

Response: Binary PDF/HTML file
```

### Template Management

#### List Templates
```bash
GET /templates?type=BOOKING_CONFIRMATION

Response:
{
  "success": true,
  "templates": [ ... ],
  "count": 5
}
```

#### Validate Template
```bash
POST /templates/validate

Request:
{
  "content": "<h1>{{booking.reference}}</h1>"
}

Response:
{
  "valid": true,
  "errors": []
}
```

#### Preview Template
```bash
POST /templates/preview

Request:
{
  "templateId": "tpl-123",
  "context": { ... }
}

Response:
{
  "success": true,
  "html": "<h1>BK-001</h1>",
  "length": 18
}
```

## Environment Configuration

```bash
# Core
NODE_ENV=development
SERVICE_PORT=3004
LOG_LEVEL=debug

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/document_service
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# Cache
REDIS_URL=redis://localhost:6379
CACHE_TTL=3600

# Authentication
JWT_SECRET=your-secret-key
JWT_EXPIRY=86400

# File Storage
STORAGE_TYPE=local  # or 's3'
STORAGE_PATH=./uploads
MAX_FILE_SIZE=50m

# Document Processing
TEMPLATE_CACHE_ENABLED=true
DOCUMENT_RETENTION_DAYS=90
AUTO_CLEANUP_ENABLED=true

# External Services
API_GATEWAY_URL=http://localhost:3000
NOTIFICATION_SERVICE_URL=http://localhost:3005
```

## Testing

### Run All Tests
```bash
npm test --workspace=@tripalfa/document-service
```

### Run Specific Test Suite
```bash
# Integration tests
npm run test:integration --workspace=@tripalfa/document-service

# Unit tests
npm run test:unit --workspace=@tripalfa/document-service

# Migration tests
npm run test:migration --workspace=@tripalfa/document-service

# Performance tests
npm run test:performance --workspace=@tripalfa/document-service
```

### Test Coverage
```bash
npm run test:coverage --workspace=@tripalfa/document-service
```

## Database Management

### Create Migration
```bash
# Create an empty migration after schema changes
npm run db:migrate:create -- --name add_new_column

# Review the migration file and edit if needed
nano database/prisma/migrations/[timestamp]_add_new_column/migration.sql
```

### Apply Migrations
```bash
# Apply pending migrations
npm run db:migrate

# Re-run all migrations (development only)
npm run db:migrate:reset
```

### Prisma Studio
```bash
# Open visual database editor
npm run db:studio
```

### Generate Updated Client
```bash
# After schema changes, regenerate Prisma client
npm run db:generate
```

## Debugging

### Enable Debug Logging
```bash
DEBUG=tripalfa:* npm run dev --workspace=@tripalfa/document-service
```

### VS Code Debugging

Add to `.vscode/launch.json`:
```json
{
  "type": "node",
  "request": "launch",
  "name": "Document Service",
  "skipFiles": ["<node_internals>/**"],
  "program": "${workspaceFolder}/services/document-service/src/index.ts",
  "preLaunchTask": "npm: build",
  "outFiles": [
    "${workspaceFolder}/services/document-service/dist/**/*.js"
  ]
}
```

### Common Issues

#### Connection Pool Errors
```bash
# Increase pool size
DATABASE_POOL_MAX=20 npm run dev

# Check active connections
SELECT count(*) FROM pg_stat_activity;
```

#### Redis Connection Issues
```bash
# Test Redis connection
redis-cli ping
# Expected output: PONG
```

#### Template Rendering Errors
- Check Handlebars syntax in templates
- Verify context object structure matches template variables
- Use `/templates/validate` endpoint to validate syntax

## Deployment

### Build Docker Image
```bash
docker build -t tripalfa/document-service:latest .
```

### Push to Registry
```bash
docker tag tripalfa/document-service:latest registry.example.com/document-service:latest
docker push registry.example.com/document-service:latest
```

### Kubernetes Deployment

See `k8s/` folder for manifests:
```bash
kubectl apply -f k8s/document-service/
```

## Performance Optimization

### Query Optimization
- Use index on frequently queried columns
- Batch document retrievals
- Implement pagination with cursor-based approach

### Caching Strategy
- Cache template definitions in Redis (TTL: 1 hour)
- Cache frequently generated documents (TTL: 24 hours)
- Use cache invalidation on template updates

### Document Generation
- Use async generation for large documents
- Implement queue system for batch operations
- Consider PDF generation service for large volumes

## Monitoring & Logging

### Metrics to Monitor
- Document generation time
- Template rendering performance
- API response times
- Database query performance
- Cache hit/miss ratio

### Log Format
```
[timestamp] [level] [service] [requestId] message
2025-02-10T10:30:45.123Z INFO tripalfa:document-service req-123 Document generated successfully
```

### Health Check
```bash
curl http://localhost:3004/health

# Response:
{
  "status": "healthy",
  "service": "document-service",
  "timestamp": "2025-02-10T10:30:45.123Z"
}
```

## Contributing

### Code Style
- Use ESLint and Prettier configurations from project root
- Follow TypeScript strict mode
- Write tests for all new features

### Commit Messages
```
feat(documents): add new document type AMENDMENT
fix(templates): resolve rendering issue with nested variables
test(integration): add comprehensive API tests
docs(service): update development guide
```

## Resources

- [Prisma Documentation](https://www.prisma.io/docs/)
- [Handlebars.js](https://handlebarsjs.com/)
- [Express.js](https://expressjs.com/)
- [Redis Documentation](https://redis.io/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review recent logs in `/logs/`
3. Run diagnostic scripts in `/scripts/test-*.ts`
4. Contact the dev team on Slack #tripalfa-dev
