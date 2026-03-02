# TripAlfa - Deployment Guide

This guide provides comprehensive instructions for deploying the TripAlfa microservices architecture in both development and production environments.

## 🚀 Quick Start

### Prerequisites

- **Docker** (version 20.10 or higher)
- **Docker Compose** (version 2.0 or higher)
- **Node.js** (version 18 or higher) - for local development
- **Git** (for cloning the repository)

### Quick Deployment

```bash
# Clone the repository
git clone <repository-url>
cd "TripAlfa - Node"

# Deploy for development (default)
./deploy.sh deploy development

# Deploy for production
./deploy.sh deploy production
```

## 📋 Table of Contents

- [Architecture Overview](#architecture-overview)
- [Service Components](#service-components)
- [Development Environment](#development-environment)
- [Production Environment](#production-environment)
- [Configuration](#configuration)
- [Monitoring & Observability](#monitoring--observability)
- [API Documentation](#api-documentation)
- [Troubleshooting](#troubleshooting)
- [Security](#security)
- [Scaling](#scaling)

## 🏗️ Architecture Overview {#architecture-overview}

Travel Kingdom is built as a microservices architecture with the following key components:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Load Balancer │    │   API Gateway   │
│    (Nginx)      │───▶│   (Express.js)  │
└─────────────────┘    └─────────────────┘
                                │
                                ▼
                    ┌─────────────────────────────────────────┐
                    │           Microservices                 │
                    ├─────────────────┬───────────────────────┤
                    │   Booking Svc   │   Inventory Svc       │
                    │   Payment Svc   │   User Svc            │
                    │   Notification  │   Analytics Svc       │
                    └─────────────────┴───────────────────────┘
                                │
                                ▼
                    ┌─────────────────────────────────────────┐
                    │              Data Layer                 │
                    ├─────────────────┬───────────────────────┤
                    │   PostgreSQL    │   Redis Cache         │
                    │   (Primary DB)  │   (Session Cache)     │
                    │                 │                       │
                    │   RabbitMQ      │   Elasticsearch       │
                    │   (Message Q)   │   (Logging)           │
                    └─────────────────┴───────────────────────┘
```

## 🧩 Service Components (16 Total) {#service-components}

### Backend Services (14)

| #   | Service                    | Port | Database      | Status   | Health Check |
| --- | -------------------------- | ---- | ------------- | -------- | ------------ |
| 1   | **API Gateway**            | 3000 | Neon neondb   | ✅ Neon  | `/health`    |
| 2   | **Booking Service**        | 3001 | Neon neondb   | ✅ Neon  | `/health`    |
| 3   | **User Service**           | 3004 | Neon neondb   | ✅ Neon  | `/health`    |
| 4   | **Organization Service**   | 3008 | Neon neondb   | ✅ Neon  | `/health`    |
| 5   | **Payment Service**        | 3003 | Neon neondb   | ✅ Neon  | `/health`    |
| 6   | **Wallet Service**         | 3008 | Neon neondb   | ✅ Neon  | `/health`    |
| 7   | **Notification Service**   | 3009 | Neon neondb   | ✅ Neon  | `/health`    |
| 8   | **Rule Engine Service**    | 3010 | Neon neondb   | ✅ Neon  | `/health`    |
| 9   | **KYC Service**            | 3005 | Neon neondb   | ✅ Neon  | `/health`    |
| 10  | **Marketing Service**      | 3007 | Neon neondb   | ✅ Neon  | `/health`    |
| 11  | **B2B Admin Service**      | 3020 | Neon neondb   | ✅ Neon  | `/health`    |
| 12  | **Booking Engine Service** | 3021 | Neon neondb   | ✅ Neon  | `/health`    |
| 13  | **Static Data Service**    | 3002 | Local PG:5433 | ✅ Local | `/health`    |
| 14  | **Ingest Service**         | 3006 | Neon neondb   | ✅ Neon  | `/health`    |

### Frontend Applications (2)

| #   | Application        | Port | Technology   | Status     |
| --- | ------------------ | ---- | ------------ | ---------- |
| 15  | **Booking Engine** | 5176 | Vite + React | ✅ Running |
| 16  | **B2B Admin**      | 5173 | Vite + React | ✅ Running |

### Infrastructure Services

| Service                 | Port       | Description                               |
| ----------------------- | ---------- | ----------------------------------------- |
| **Neon PostgreSQL**     | Cloud      | Primary application database (`neondb`)   |
| **PostgreSQL (Static)** | 5433       | Static reference data DB (flight + hotel) |
| **Redis**               | 6379       | Caching and session storage               |
| **RabbitMQ**            | 5672/15672 | Message queuing                           |
| **Grafana**             | 3007       | Monitoring dashboards                     |
| **Prometheus**          | 9090       | Metrics collection                        |
| **Jaeger**              | 16686      | Distributed tracing                       |

## 🛠️ Development Environment {#development-environment}

### Local Development Setup

1. **Clone and Navigate**

   ```bash
   git clone <repository-url>
   cd "TripAlfa - Node"
   ```

2. **Start Development Environment**

   ```bash
   ./deploy.sh deploy development
   ```

3. **Access Services**
   - API Gateway: <http://localhost:3000>
   - Booking Engine: <http://localhost:5176>
   - B2B Admin: <http://localhost:5173>
   - Grafana: <http://localhost:3007> (admin/admin)
   - Prometheus: <http://localhost:9090>
   - Jaeger: <http://localhost:16686>

### Development Commands

```bash
# View all services
./deploy.sh status

# View logs for a specific service
./deploy.sh logs booking-service

# Restart all services
./deploy.sh restart

# Stop all services
./deploy.sh stop

# Clean up (stop and remove containers/volumes)
./deploy.sh clean

# Install dependencies
pnpm install
```

### Local Development Tips

- **Hot Reload**: Services support hot reloading for faster development
- **Volume Mounts**: Source code is mounted as volumes for live updates
- **Debug Mode**: Services run in development mode with verbose logging
- **Database**: Uses Neon `neondb` for application data and local `staticdatabase` on port 5433 for static reference data

## 🏭 Production Environment {#production-environment}

### Production Deployment

1. **Prerequisites**
   - Production server with Docker and Docker Compose
   - SSL certificates (Let's Encrypt or custom)
   - Domain names configured
   - External secrets management (optional)

2. **Configure Environment Variables**

   ```bash
   # Copy the example environment file
   cp .env.example .env

   # Edit with your actual credentials
   nano .env

   # Key sections to update:
   # - Database credentials (NEON_DATABASE_URL, STATIC_DATABASE_URL, POSTGRES_PASSWORD)
   # - External API keys (DUFFEL_API_KEY, AMADEUS_API_KEY, STRIPE_SECRET_KEY, etc.)
   # - JWT secrets (JWT_SECRET)
   # - Service configurations
   # - Production settings (NODE_ENV=production)
   ```

3. **Deploy Production**

   ```bash
   ./deploy.sh deploy production
   ```

### Production Features

- **High Availability**: Multiple replicas for critical services
- **SSL/TLS**: Automatic SSL termination with Let's Encrypt
- **Monitoring**: Full observability stack with Grafana/Prometheus
- **Logging**: Centralized logging with Elasticsearch/Kibana
- **Backup**: Automated database backups
- **Security**: Secrets management and network isolation

### Production URLs

- **API Gateway**: <https://api.tripalfa.com>
- **Booking Engine**: <https://booking.tripalfa.com>
- **B2B Admin**: <https://b2b.tripalfa.com>
- **Monitoring**: <https://monitoring.tripalfa.com>
- **Tracing**: <https://tracing.tripalfa.com>

## ⚙️ Configuration {#configuration}

### Environment Variables

Each service can be configured using environment variables. Key configurations include:

#### Database Configuration

**Golden Rule:**

```
Neon (Production)  → ALL backend services + application data
Local PostgreSQL   → ONLY static reference data (airports, hotels, airlines)
```

**Neon Configuration (Primary):**

```bash
# Direct connection (for transaction support)
DIRECT_NEON_DATABASE_URL="postgresql://user:password@host:5432/neondb?sslmode=require"

# Pooled connection (for standard queries)
NEON_DATABASE_URL="postgresql://user:password@host:5432/neondb?sslmode=require&pgbouncer=true&connection_limit=20"

# Static reference data in local Docker PostgreSQL (flight + hotel)
STATIC_DATABASE_URL="postgresql://postgres:postgres@postgres-static:5432/staticdatabase"

# IMPORTANT: Never commit real credentials to version control!
# Use environment variables or .env files (already in .gitignore)
```

**Local PostgreSQL (Development - Static Data Only):**

```bash
STATIC_DATABASE_URL_LOCAL="postgresql://postgres:postgres@localhost:5432/staticdatabase?sslmode=disable"
```

#### Redis Configuration

```bash
REDIS_URL=redis://redis:6379
```

#### Message Queue Configuration

```bash
RABBITMQ_URL=amqp://admin:password@rabbitmq:5672
```

#### External API Keys

```bash
DUFFEL_API_KEY=your-duffel-api-key
AMADEUS_API_KEY=your-amadeus-api-key
STRIPE_SECRET_KEY=your-stripe-secret-key
```

### Secrets Management

Production secrets are managed through Docker secrets:

```bash
# View available secrets
docker secret ls

# Create new secret
echo "secret-value" | docker secret create new_secret -
```

### Custom Configuration

- **Nginx**: `./infrastructure/nginx/nginx.conf` (development) | `./infrastructure/nginx/nginx.prod.conf` (production)
- **Prometheus**: `./infrastructure/monitoring/prometheus/prometheus.yml`
- **Grafana**: `./infrastructure/monitoring/grafana/provisioning/`

## 📊 Monitoring & Observability {#monitoring--observability}

### Health Checks

All services provide health check endpoints:

- `/health` - Basic health status
- `/metrics` - Prometheus metrics (where available)
- `/ready` - Readiness probe
- `/live` - Liveness probe

### Monitoring Stack

1. **Prometheus** (Port 9090)
   - Metrics collection
   - Service discovery
   - Alerting rules

2. **Grafana** (Port 3007)
   - Dashboards for all services
   - Custom alerts
   - Data visualization

3. **Jaeger** (Port 16686)
   - Distributed tracing
   - Performance analysis
   - Request flow visualization

4. **Elasticsearch + Kibana** (Port 5601)
   - Centralized logging
   - Log analysis
   - Search capabilities

### Key Metrics to Monitor

- **API Gateway**: Request rate, response time, error rate
- **Booking Service**: Booking success rate, processing time
- **Database**: Connection pool, query performance
- **Cache**: Hit rate, memory usage
- **Message Queue**: Queue depth, processing rate

## 📚 API Documentation

### API Gateway Endpoints

- **Health Check**: `GET /health`
- **API Documentation**: `GET /api/docs`
- **Metrics**: `GET /metrics`

### Service APIs

Each microservice provides its own API documentation:

- **Booking Service**: `GET /api/v1/bookings/docs`
- **Payment Service**: `GET /api/v1/payments/docs`
- **User Service**: `GET /api/v1/users/docs`
- **Notification Service**: `GET /api/v1/notifications/docs`

### API Gateway Features

- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Authentication**: JWT-based authentication
- **Caching**: Redis-based response caching
- **Load Balancing**: Round-robin distribution
- **Circuit Breaker**: Automatic failover

## 🔧 Troubleshooting {#troubleshooting}

### Common Issues

#### 1. Services Not Starting

```bash
# Check service status
./deploy.sh status

# View logs
./deploy.sh logs [service-name]

# Check Docker resources
docker system df
```

#### 2. Database Connection Issues

**For Neon connections:**

```bash
# Test direct connection to Neon (use your credentials from .env)
psql "$DIRECT_NEON_DATABASE_URL"

# List databases
SELECT datname FROM pg_database;
```

**For local PostgreSQL (static data only):**

```bash
# Check local PostgreSQL health
docker compose -f docker-compose.local.yml exec postgres-static pg_isready -U postgres

# Connect to staticdatabase
psql -U postgres -d staticdatabase -h localhost -p 5432
```

**Verify environment variables are loaded:**

```bash
# Check if services see the NEON_DATABASE_URL
echo $NEON_DATABASE_URL
echo $DIRECT_NEON_DATABASE_URL
```

#### 3. High Memory Usage

```bash
# Check resource usage
docker stats

# Restart specific service
./deploy.sh restart [service-name]
```

#### 4. SSL Certificate Issues (Production)

```bash
# Check certificate status
docker compose -f docker-compose.prod.yml logs nginx

# Renew certificates
./scripts/renew-certificates.sh
```

### Debug Commands

```bash
# Enter service container
docker compose -f infrastructure/compose/docker-compose.yml exec [service-name] bash

# Check network connectivity
docker compose -f infrastructure/compose/docker-compose.yml exec [service-name] ping [other-service]

# View environment variables
docker compose -f infrastructure/compose/docker-compose.yml exec [service-name] env

# Check Docker events
docker events --since 1h
```

### Log Analysis

```bash
# View all logs
./deploy.sh logs

# Follow logs in real-time
./deploy.sh logs -f

# View logs from specific time
./deploy.sh logs --since="2023-01-01" --until="2023-01-02"

# Export logs
./deploy.sh logs > deployment.log
```

## 🔒 Security {#security}

### Security Best Practices

1. **Secrets Management**
   - Use Docker secrets in production
   - Rotate API keys regularly
   - Never commit secrets to version control

2. **Network Security**
   - Use internal Docker networks
   - Restrict external access to databases
   - Enable SSL/TLS for all external traffic

3. **Application Security**
   - Keep dependencies updated
   - Use security headers
   - Implement proper input validation

4. **Monitoring Security**
   - Secure Grafana with strong passwords
   - Restrict access to monitoring endpoints
   - Enable audit logging

### Security Configuration

- **JWT Tokens**: 24-hour expiration, refresh tokens
- **Rate Limiting**: 100 requests per 15 minutes
- **CORS**: Configured for trusted domains only
- **HTTPS**: Enforced in production
- **Database**: Password authentication required

## 📈 Scaling {#scaling}

### Horizontal Scaling

Scale individual services based on load:

```bash
# Scale booking service to 3 replicas
docker compose -f infrastructure/compose/docker-compose.yml up -d --scale booking-service=3

# Scale in production
docker compose -f docker-compose.prod.yml up -d --scale booking-service=3
```

### Auto-scaling (Production)

Configure auto-scaling in production:

```yaml
# In docker-compose.prod.yml
deploy:
  replicas: 2
  resources:
    limits:
      memory: 512M
  restart_policy:
    condition: on-failure
    delay: 5s
    max_attempts: 3
```

**Note**: Docker Compose doesn't support true auto-scaling. For production auto-scaling, consider using Kubernetes or Docker Swarm.

### Performance Tuning

1. **Database Optimization**
   - Connection pooling
   - Index optimization
   - Query optimization

2. **Cache Optimization**
   - Redis memory allocation
   - Cache invalidation strategies
   - TTL configuration

3. **Load Balancing**
   - Health check intervals
   - Session affinity
   - Circuit breaker thresholds

## 🤝 Contributing

### Development Workflow

1. **Fork and Clone**

   ```bash
   git clone <your-fork>
   cd "TripAlfa - Node"
   ```

2. **Create Feature Branch**

   ```bash
   git checkout -b feature/your-feature
   ```

3. **Make Changes**
   - Follow existing code style
   - Add tests for new functionality
   - Update documentation

4. **Test Changes**

   ```bash
   ./deploy.sh deploy development
   # Run tests
   pnpm test
   ```

5. **Submit Pull Request**
   - Include detailed description
   - Reference related issues
   - Update changelog

### Code Style

- **JavaScript/Node.js**: ESLint + Prettier
- **Docker**: Multi-stage builds
- **Documentation**: Markdown with proper formatting

### Testing

```bash
# Run all tests
pnpm test

# Run specific service tests
cd services/booking-service
pnpm test

# Run integration tests
pnpm run test:integration
```

## 📞 Support

### Getting Help

1. **Documentation**: Check this README and service-specific docs
2. **Issues**: Create GitHub issues for bugs and feature requests
3. **Logs**: Check service logs for error details
4. **Monitoring**: Use Grafana dashboards for system health

### Emergency Procedures

1. **Service Outage**

   ```bash
   ./deploy.sh restart
   ./deploy.sh logs [affected-service]
   ```

2. **Database Issues**

   ```bash
   ./scripts/backup.sh
   ./scripts/restore.sh [backup-file]
   ```

3. **Security Incident**
   - Change all API keys immediately
   - Review access logs
   - Update secrets
   - Notify security team

### Common Docker Commands

```bash
# View all running containers
docker ps

# View all containers (including stopped)
docker ps -a

# View container logs
docker logs [container-name]

# View Docker system information
docker system info

# Clean up unused Docker resources
docker system prune
```

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Docker Community**: For containerization technology
- **Node.js Team**: For the runtime environment
- **PostgreSQL**: For the database
- **Redis Team**: For caching solutions
- **Prometheus/Grafana**: For monitoring stack

---

**For more information, visit our [main documentation](./README.md) or contact the development team.**
