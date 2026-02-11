# Document Service - Quick Start Guide

## Running the Service

### Prerequisites

- Node.js 20+
- PostgreSQL 14+
- Redis 7+ (optional, for caching)
- Docker (optional, for containerized setup)

### Local Development

#### 1. Setup Environment

```bash
# Navigate to document service
cd services/document-service

# Copy environment template
cp .env.example .env

# Update .env with your settings:
# - DATABASE_URL=postgresql://user:password@localhost:5432/tripalfa
# - REDIS_URL=redis://localhost:6379
# - JWT_SECRET=your_secret_key
# - NODE_ENV=development
```

#### 2. Install Dependencies

```bash
# From root of monorepo
npm install

# Or from document-service workspace
npm install --workspace=@tripalfa/document-service
```

#### 3. Setup Database

```bash
# From monorepo root
npm run db:migrate
npm run db:generate
```

#### 4. Start the Service

```bash
# Development mode (with file watching)
npm run dev --workspace=@tripalfa/document-service

# Production mode
npm run build --workspace=@tripalfa/document-service
npm start --workspace=@tripalfa/document-service
```

The service will start on `http://localhost:3004` (or configured port).

#### 5. Verify Service

```bash
# Health check
curl http://localhost:3004/health

# Response:
# {
#   "success": true,
#   "status": "healthy",
#   "service": "document-service",
#   "version": "1.0.0",
#   "timestamp": "2025-02-10T10:30:45.123Z"
# }
```

### Docker Setup

#### 1. Build Image

```bash
docker build -t tripalfa-document-service:latest services/document-service
```

#### 2. Start with Docker Compose

```bash
# From monorepo root
docker-compose -f docker-compose.local.yml up document-service

# This starts:
# - PostgreSQL database
# - Redis cache
# - Document Service
# - Adminer (database UI)
# - Redis Commander (Redis UI)
```

#### 3. Access Services

- Document Service: `http://localhost:3004`
- Health: `http://localhost:3004/health`
- Adminer: `http://localhost:8080`
- Redis Commander: `http://localhost:8081`

## Testing Endpoints

### 1. Generate Authentication Token

```bash
# Using Node.js
node -e "
const jwt = require('jsonwebtoken');
const token = jwt.sign(
  { userId: 'test-user', isAdmin: false },
  process.env.JWT_SECRET || 'test-secret',
  { expiresIn: '24h' }
);
console.log('Token:', token);
"

# Or use curl with automatic token creation
```

### 2. Test Basic Endpoints

#### Health Check (no auth required)

```bash
curl http://localhost:3004/health
```

#### Service Info (no auth required)

```bash
curl http://localhost:3004/api/v1/info
```

#### List Documents

```bash
# Set your token
export TOKEN="your_jwt_token"

curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3004/api/v1/documents
```

#### Generate Document

```bash
curl -X POST http://localhost:3004/api/v1/documents/generate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "BOOKING_CONFIRMATION",
    "context": {
      "booking": {
        "reference": "BK-001",
        "date": "2025-02-15"
      }
    },
    "format": "PDF"
  }'
```

#### List Templates

```bash
curl http://localhost:3004/api/v1/templates
```

#### Get Statistics

```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3004/api/v1/documents/stats/summary
```

### 3. Using Postman

1. Import the Postman collection:
   ```bash
   # Check if collection exists
   ls EMAIL_TEMPLATE_TESTING.postman_collection.json
   ```

2. Create environment with variables:
   ```json
   {
     "base_url": "http://localhost:3004",
     "token": "your_jwt_token"
   }
   ```

3. Use `{{base_url}}` and `{{token}}` in requests

## Running Tests

### Unit Tests

```bash
npm test --workspace=@tripalfa/document-service -- --testPathPattern=unit
```

### Integration Tests

```bash
npm test --workspace=@tripalfa/document-service -- --testPathPattern=integration
```

### All Tests

```bash
npm test --workspace=@tripalfa/document-service
```

### With Coverage

```bash
npm test --workspace=@tripalfa/document-service -- --coverage
```

## Debugging

### Enable Debug Logging

```bash
LOG_LEVEL=debug npm run dev --workspace=@tripalfa/document-service
```

### View Logs

```bash
# Follow logs from service
docker logs -f document-service

# Or from local run (appears in console)
```

### Container Debugging

```bash
# Connect to database
docker exec -it tripalfa_db psql -U postgres -d tripalfa

# View Redis data
docker exec -it tripalfa_redis redis-cli

# Execute commands in container
docker exec -it tripalfa-document-service sh
```

## Environment Variables

### Core Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | development | Application environment |
| `PORT` | 3004 | Service port |
| `HOST` | 0.0.0.0 | Bind address |

### Database

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `DB_POOL_MIN` | Minimum pool size (default: 2) |
| `DB_POOL_MAX` | Maximum pool size (default: 10) |

### Cache

| Variable | Default | Description |
|----------|---------|-------------|
| `REDIS_URL` | redis://localhost:6379 | Redis connection |
| `CACHE_ENABLED` | true | Enable/disable caching |
| `CACHE_TTL` | 3600 | Cache timeout in seconds |

### JWT

| Variable | Description |
|----------|-------------|
| `JWT_SECRET` | Secret key for signing tokens |
| `JWT_EXPIRY` | Token expiration time (default: 86400s) |

### Storage

| Variable | Default | Description |
|----------|---------|-------------|
| `STORAGE_TYPE` | local | Storage provider (local, s3) |
| `STORAGE_PATH` | ./storage | Local storage path |
| `MAX_FILE_SIZE` | 52428800 | Max file size (50MB) |

### PDF Generation

| Variable | Default | Description |
|----------|---------|-------------|
| `PDF_TIMEOUT_MS` | 30000 | PDF generation timeout |
| `MAX_CONCURRENT_PDF_GENERATIONS` | 5 | Concurrent PDF limit |

## Troubleshooting

### Service won't start

**Check:**
1. Port 3004 is available: `lsof -i :3004`
2. Database is running: `pg_isready`
3. Environment variables set correctly

**Solution:**
```bash
# Kill process using port
lsof -ti:3004 | xargs kill -9

# Restart service
npm run dev --workspace=@tripalfa/document-service
```

### 401 Unauthorized errors

**Cause:** Missing or invalid JWT token

**Solution:**
```bash
# Generate valid token
export TOKEN=$(node -e "
  const jwt = require('jsonwebtoken');
  const token = jwt.sign(
    { userId: 'user-123', isAdmin: false },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '24h' }
  );
  console.log(token);
")

# Use token in request
curl -H "Authorization: Bearer $TOKEN" http://localhost:3004/api/v1/documents
```

### 403 Forbidden errors

**Cause:** Admin access required but user is not admin

**Solution:**
```bash
# Generate admin token
export ADMIN_TOKEN=$(node -e "
  const jwt = require('jsonwebtoken');
  const token = jwt.sign(
    { userId: 'admin-user', isAdmin: true },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '24h' }
  );
  console.log(token);
")

# Use admin token for admin endpoints
curl -X POST http://localhost:3004/api/v1/templates \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ ... }'
```

### Database connection errors

**Cause:** PostgreSQL not running or wrong connection string

**Solution:**
```bash
# Start PostgreSQL with Docker
docker run -d --name postgres \
  -e POSTGRES_PASSWORD=password \
  postgres:14

# Update DATABASE_URL in .env
DATABASE_URL="postgresql://postgres:password@localhost:5432/tripalfa"

# Run migrations
npm run db:migrate
```

### Redis connection warnings

**Note:** Redis is optional for caching. If Redis is not available:
- Set `CACHE_ENABLED=false` in .env
- Service will run without caching
- Performance may be slower for frequent queries

## Performance Monitoring

### Check Request Times

```bash
# Enable request logging
LOG_LEVEL=info npm run dev --workspace=@tripalfa/document-service

# Watch output for timing information
```

### Monitor Database

```bash
# Connect to database
docker exec -it tripalfa_db psql -U postgres -d tripalfa

# Check active queries
SELECT * FROM pg_stat_activity;

# View slow queries
SELECT query, calls, total_time FROM pg_stat_statements ORDER BY total_time DESC;
```

### Monitor Cache

```bash
# Check Redis stats
docker exec -it tripalfa_redis redis-cli INFO

# View cached keys
docker exec -it tripalfa_redis redis-cli KEYS '*'
```

## Next Steps

1. **Add your custom templates** - See `CONTROLLERS_GUIDE.md`
2. **Implement additional endpoints** - Extend controllers as needed
3. **Deploy to production** - Use Docker and Kubernetes
4. **Monitor in production** - Setup logging and metrics
5. **Integrate with booking service** - Connect to booking system

## Resources

- **API Documentation:** [API_SPECIFICATION.md](API_SPECIFICATION.md)
- **Controllers Guide:** [CONTROLLERS_GUIDE.md](CONTROLLERS_GUIDE.md)
- **Development Guide:** [DEVELOPMENT.md](DEVELOPMENT.md)
- **Implementation Checklist:** [IMPLEMENTATION_CHECKLIST.md](IMPLEMENTATION_CHECKLIST.md)

## Support

For issues or questions:
1. Check logs: `docker logs document-service`
2. Review error trace in response
3. Enable debug logging: `LOG_LEVEL=debug`
4. Consult [DEVELOPMENT.md](DEVELOPMENT.md) for detailed debugging

Happy coding! 🚀
