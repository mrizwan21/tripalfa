# TripAlfa Microservices Architecture

## 🏗️ Architecture Overview

TripAlfa has been successfully transitioned from a monolithic architecture to a modern microservices architecture, providing improved scalability, maintainability, and development velocity.

## 📋 Table of Contents

- [Architecture Overview](#architecture-overview)
- [Services](#services)
- [Quick Start](#quick-start)
- [Development](#development)
- [Deployment](#deployment)
- [Monitoring](#monitoring)
- [Contributing](#contributing)

## 🏗️ Architecture Overview

### Core Principles

- **Domain-Driven Design**: Each service owns a specific business domain
- **Loose Coupling**: Services communicate through well-defined APIs
- **High Cohesion**: Related functionality grouped within services
- **Independent Deployment**: Each service can be deployed independently

### Service Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   API Gateway   │    │   Monitoring    │    │   Message       │
│                 │    │                 │    │   Queue         │
│ • Routing       │    │ • Prometheus    │    │ • RabbitMQ      │
│ • Auth          │    │ • Grafana       │    │ • Event-driven  │
│ • Rate Limiting │    │ • Jaeger        │    │   communication │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
          ┌──────────────────────┼──────────────────────┐
          │                      │                      │
┌─────────▼───────┐    ┌─────────▼───────┐    ┌─────────▼───────┐
│   Booking       │    │   Inventory     │    │   Payment       │
│   Service       │    │   Service       │    │   Service       │
│                 │    │                 │    │                 │
│ • Flight/Htl    │    │ • Real-time     │    │ • Stripe/PayPal │
│ • Booking Mgmt  │    │ • Supplier      │    │ • Refunds       │
│ • Lifecycle     │    │ • Availability  │    │ • Transactions  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
          │                      │                      │
┌─────────▼───────┐    ┌─────────▼───────┐    ┌─────────▼───────┐
│   User          │    │   Notification  │    │   Analytics     │
│   Service       │    │   Service       │    │   Service       │
│                 │    │                 │    │                 │
│ • Auth & Authz  │    │ • Email/SMS     │    │ • Business      │
│ • Profile Mgmt  │    │ • Multi-channel │    │ • Performance   │
│ • RBAC          │    │ • Templates     │    │ • Metrics       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📦 Services

### 1. API Gateway

**Port**: 3000 | **Language**: Node.js/Express

- Single entry point for all client requests
- Request routing and load balancing
- Authentication and authorization
- Rate limiting and security

### 2. Booking Service

**Port**: 3001 | **Language**: Node.js/Express

- Flight, hotel, and package bookings
- Booking lifecycle management
- Integration with payment and inventory services

### 3. Payment Service

**Port**: 3003 | **Language**: Node.js/Express

- Payment processing and refunds
- Multiple payment gateway support
- Financial transaction management

### 4. User Service

**Port**: 3004 | **Language**: Node.js/Express

- User registration and authentication
- Profile management and RBAC
- JWT token management with Redis caching

### 5. Notification Service

**Port**: 3009 | **Language**: Node.js/Express

- Email and SMS notifications
- Booking confirmations and updates
- Marketing communications

### 6. KYC Service

**Port**: 3005 | **Language**: Node.js/Express

- Identity verification
- Document validation
- Compliance checks

### 7. Marketing Service

**Port**: 3007 | **Language**: Node.js/Express

- Campaign management
- Promotions and discounts
- Marketing analytics

### 8. Organization Service

**Port**: 3008 | **Language**: Node.js/Express

- Enterprise/B2B management
- Organization profiles
- User management for organizations

### 9. Rule Engine Service

**Port**: 3010 | **Language**: Node.js/Express

- Dynamic business rules
- Commission management
- Markup rules

### 10. Analytics Service

**Port**: 3006 | **Language**: Node.js/Express

- Business intelligence and reporting
- User behavior analysis
- Performance metrics and KPIs

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 18+
- npm or yarn

### 1. Environment Setup

```bash
# Clone the repository
git clone <repository-url>
cd TripAlfa - Node

# Run the setup script
./setup-microservices.sh
```

### 2. Manual Setup

```bash
# Create environment file
cp .env.example .env
# Edit .env with your configuration

# Install dependencies for all services
pnpm install

# Build and start all services
docker compose -f docker-compose.microservices.yml up -d
```

### 3. Verify Installation

```bash
# Check service health
curl http://localhost:3000/health
curl http://localhost:3001/health
curl http://localhost:3003/health
# ... check all services

# Access API documentation
open http://localhost:3000/api/docs
```

## 🛠️ Development

### Running Individual Services

#### Booking Service

```bash
cd services/booking-service
pnpm install
pnpm run dev
# Service available at http://localhost:3001
```

#### Payment Service

```bash
cd services/payment-service
pnpm install
pnpm run dev
# Service available at http://localhost:3003
```

#### User Service

```bash
cd services/user-service
pnpm install
pnpm run dev
# Service available at http://localhost:3004
```

### Testing

```bash
# Run tests for all services
pnpm test

# Run tests for specific service
cd services/booking-service
pnpm test

# Run tests with coverage
pnpm run test:cov
```

### Code Quality

```bash
# Lint all services
pnpm run lint

# Fix linting issues
pnpm run lint:fix

# Type checking
pnpm run typecheck
```

## 🚢 Deployment

### Local Development

```bash
# Start all services
docker compose -f docker-compose.microservices.yml up -d

# View logs
docker compose -f docker-compose.microservices.yml logs -f

# Stop services
docker compose -f docker-compose.microservices.yml down
```

### Production Deployment

```bash
# Build production images
docker compose -f docker-compose.prod.yml build

# Deploy to production
docker compose -f docker-compose.prod.yml up -d

# Monitor deployment
docker compose -f docker-compose.prod.yml logs -f
```

### Kubernetes Deployment

```bash
# Apply Kubernetes manifests
kubectl apply -f k8s/

# Check deployment status
kubectl get pods
kubectl get services

# Port forward for local access
kubectl port-forward service/api-gateway 3000:80
```

## 📊 Monitoring

### Access Monitoring Tools

- **Grafana**: http://localhost:3007 (admin/admin)
- **Prometheus**: http://localhost:9090
- **Jaeger**: http://localhost:16686
- **RabbitMQ**: http://localhost:15672 (admin/admin)

### Key Metrics to Monitor

- **Service Health**: Response times, error rates, availability
- **Database Performance**: Query times, connection pools, deadlocks
- **Message Queue**: Queue length, processing rates, failed messages
- **Business Metrics**: Booking rates, payment success rates, user activity

### Setting Up Alerts

```bash
# Configure Prometheus alerts
cp monitoring/alerts.yml.example monitoring/alerts.yml
# Edit alerts.yml with your alert rules

# Configure Grafana dashboards
cp monitoring/dashboards/* grafana/provisioning/dashboards/
```

## 🔧 Configuration

### Environment Variables

Each service has its own set of environment variables defined in `.env` files:

```bash
# Database configuration
NEON_DATABASE_URL=postgresql://user:password@host:5432/neondb?sslmode=require
STATIC_DATABASE_URL=postgresql://postgres:postgres@postgres-static:5432/staticdatabase

# Service-specific configuration
JWT_SECRET=your_jwt_secret
REDIS_URL=redis://localhost:6379
RABBITMQ_URL=amqp://localhost:5672

# External service keys
STRIPE_SECRET_KEY=your_stripe_key
DUFFEL_API_KEY=your_duffel_key
```

### Service Discovery

Services use environment variables and Docker service names for discovery:

```javascript
const BOOKING_SERVICE_URL =
  process.env.BOOKING_SERVICE_URL || "http://booking-service:3001";
const PAYMENT_SERVICE_URL =
  process.env.PAYMENT_SERVICE_URL || "http://payment-service:3003";
```

## 🧪 Testing

### Test Structure

```
services/
├── booking-service/
│   ├── src/
│   ├── tests/
│   │   ├── booking.controller.spec.ts
│   │   ├── booking.service.spec.ts
│   │   └── integration/
│   └── jest.config.js
├── payment-service/
├── user-service/
└── notification-service/
```

### Running Tests

```bash
# Unit tests
pnpm test

# Integration tests
pnpm run test:integration

# E2E tests
pnpm run test:e2e

# Test with coverage
pnpm run test:cov
```

### Test Data Management

```bash
# Seed test data
pnpm run db:seed:test

# Reset test database
pnpm run db:reset:test

# Run migrations
pnpm run db:migrate
```

## 📚 Documentation

### API Documentation

- **Swagger UI**: http://localhost:3000/api/docs
- **Individual Service Docs**:
  - Booking Service: http://localhost:3001/api/docs
  - Payment Service: http://localhost:3003/api/docs
  - User Service: http://localhost:3004/api/docs

### Architecture Documentation

- [System Architecture](./SYSTEM_ARCHITECTURE_MICROSERVICES.md)
- [API Gateway](./API_GATEWAY.md)
- [Migration Guide](./MICROSERVICES_MIGRATION_GUIDE.md)

## 🤝 Contributing

### Development Workflow

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/AmazingFeature`
3. **Make** your changes
4. **Run** tests: `npm test`
5. **Commit** your changes: `git commit -m 'Add some AmazingFeature'`
6. **Push** to the branch: `git push origin feature/AmazingFeature`
7. **Open** a Pull Request

### Code Style

- Follow TypeScript/JavaScript best practices
- Use meaningful variable and function names
- Write comprehensive tests
- Update documentation for new features
- Follow the existing code style and patterns

### Service Development Guidelines

1. **Single Responsibility**: Each service should have one primary responsibility
2. **API Design**: Use RESTful principles and consistent naming conventions
3. **Error Handling**: Implement proper error handling and logging
4. **Security**: Follow security best practices for authentication and authorization
5. **Performance**: Optimize database queries and implement caching where appropriate
6. **Package Manager**: Use pnpm for all dependency management

## 🐛 Troubleshooting

### Common Issues

#### Service Won't Start

```bash
# Check logs
docker compose logs service-name

# Check environment variables
docker compose exec service-name env

# Verify database connection
docker compose exec service-name psql -h postgres -U postgres -c "SELECT 1;"
```

#### Database Migration Issues

```bash
# Check migration status
pnpm run db:migrate:status

# Run pending migrations
pnpm run db:migrate

# Reset and re-migrate
pnpm run db:reset
pnpm run db:migrate
```

#### Network Connectivity

```bash
# Test service connectivity
docker compose exec api-gateway curl http://booking-service:3001/health

# Check Docker network
docker network ls
docker network inspect bridge
```

### Getting Help

- **Issues**: Report bugs and feature requests on GitHub
- **Discussions**: Join our community discussions
- **Documentation**: Check the comprehensive documentation

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Node.js**: For the runtime environment
- **Docker**: For containerization
- **PostgreSQL**: For reliable data storage
- **Redis**: For caching and session management
- **RabbitMQ**: For message queuing
- **Prometheus/Grafana**: For monitoring and observability

---

**Built with ❤️ by the TripAlfa Team**

For more information, visit our [main documentation](./README.md) or check out our [architecture diagrams](./docs/architecture/).
