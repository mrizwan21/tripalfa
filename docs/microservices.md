# Travel Kingdom Microservices Architecture

## 🏗️ Architecture Overview

Travel Kingdom has been successfully transitioned from a monolithic architecture to a modern microservices architecture, providing improved scalability, maintainability, and development velocity.

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
**Port**: 3001 | **Language**: JavaScript/Express.js
- Flight, hotel, and package bookings
- Booking lifecycle management
- Integration with payment and inventory services

### 3. Inventory Service
**Port**: 3002 | **Language**: JavaScript/Express.js
- Real-time flight and hotel inventory
- Supplier integrations (Duffel, Amadeus, LITEAPI)
- Availability and rate management

### 4. Payment Service
**Port**: 3003 | **Language**: JavaScript/Express.js
- Payment processing and refunds
- Multiple payment gateway support
- Financial transaction management

### 5. User Service
**Port**: 3004 | **Language**: JavaScript/Express.js
- User registration and authentication
- Profile management and RBAC
- JWT token management with Redis caching

### 6. Notification Service
**Port**: 3005 | **Language**: TypeScript/NestJS
- Email and SMS notifications
- Booking confirmations and updates
- Marketing communications

### 7. Analytics Service
**Port**: 3006 | **Language**: TypeScript/NestJS
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
cd travel-kingdom-microservices

# Run the setup script
./setup-microservices.sh
```

### 2. Manual Setup
```bash
# Create environment file
cp .env.example .env
# Edit .env with your configuration

# Install dependencies for all services
./scripts/install-dependencies.sh

# Build and start all services
docker-compose -f docker-compose.microservices.yml up -d
```

### 3. Verify Installation
```bash
# Check service health
curl http://localhost:3000/health
curl http://localhost:3001/health
curl http://localhost:3002/health
# ... check all services

# Access API documentation
open http://localhost:3000/api/docs
```

## 🛠️ Development

### Running Individual Services

#### Booking Service
```bash
cd microservices/booking-service
npm install
npm run dev
# Service available at http://localhost:3001
```

#### Inventory Service
```bash
cd microservices/inventory-service
npm install
npm run dev
# Service available at http://localhost:3002
```

#### Payment Service
```bash
cd microservices/payment-service
npm install
npm run dev
# Service available at http://localhost:3003
```

#### User Service
```bash
cd microservices/user-service
npm install
npm run dev
# Service available at http://localhost:3004
```

### Testing
```bash
# Run tests for all services
./scripts/run-tests.sh

# Run tests for specific service
cd microservices/booking-service
npm test

# Run tests with coverage
npm run test:cov
```

### Code Quality
```bash
# Lint all services
./scripts/lint-all.sh

# Fix linting issues
./scripts/lint-fix.sh

# Type checking
./scripts/type-check.sh
```

## 🚢 Deployment

### Local Development
```bash
# Start all services
docker-compose -f docker-compose.microservices.yml up -d

# View logs
docker-compose -f docker-compose.microservices.yml logs -f

# Stop services
docker-compose -f docker-compose.microservices.yml down
```

### Production Deployment
```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Deploy to production
docker-compose -f docker-compose.prod.yml up -d

# Monitor deployment
docker-compose -f docker-compose.prod.yml logs -f
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
- **RabbitMQ**: http://localhost:15672 (admin/password)

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
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_NAME=service_name_db

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
const BOOKING_SERVICE_URL = process.env.BOOKING_SERVICE_URL || 'http://booking-service:3001';
const INVENTORY_SERVICE_URL = process.env.INVENTORY_SERVICE_URL || 'http://inventory-service:3002';
```

## 🧪 Testing

### Test Structure
```
microservices/
├── booking-service/
│   ├── src/
│   ├── test/
│   │   ├── booking.controller.spec.ts
│   │   ├── booking.service.spec.ts
│   │   └── integration/
│   └── jest.config.js
├── inventory-service/
├── payment-service/
└── user-service/
```

### Running Tests
```bash
# Unit tests
npm test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Test with coverage
npm run test:cov
```

### Test Data Management
```bash
# Seed test data
npm run db:seed:test

# Reset test database
npm run db:reset:test

# Run migrations
npm run db:migrate
```

## 📚 Documentation

### API Documentation
- **Swagger UI**: http://localhost:3000/api/docs
- **Individual Service Docs**:
  - Booking Service: http://localhost:3001/api/docs
  - Inventory Service: http://localhost:3002/api/docs
  - Payment Service: http://localhost:3003/api/docs

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

## 🐛 Troubleshooting

### Common Issues

#### Service Won't Start
```bash
# Check logs
docker-compose logs service-name

# Check environment variables
docker-compose exec service-name env

# Verify database connection
docker-compose exec service-name psql -h postgres -U postgres -c "SELECT 1;"
```

#### Database Migration Issues
```bash
# Check migration status
npm run db:migrate:status

# Run pending migrations
npm run db:migrate

# Reset and re-migrate
npm run db:reset
npm run db:migrate
```

#### Network Connectivity
```bash
# Test service connectivity
docker-compose exec api-gateway curl http://booking-service:3001/health

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

- **NestJS**: For the excellent framework
- **Docker**: For containerization
- **PostgreSQL**: For reliable data storage
- **Redis**: For caching and session management
- **RabbitMQ**: For message queuing
- **Prometheus/Grafana**: For monitoring and observability

---

**Built with ❤️ by the Travel Kingdom Team**

For more information, visit our [main documentation](./README.md) or check out our [architecture diagrams](./docs/architecture/).
