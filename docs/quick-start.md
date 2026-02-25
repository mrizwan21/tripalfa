# Travel Kingdom - Quick Start Guide

Get up and running with Travel Kingdom in minutes!

## 🚀 5-Minute Quick Start

### Prerequisites

- Docker (20.10+)
- Docker Compose (2.0+)

### 1. Clone and Deploy

```bash
# Clone the repository
git clone <repository-url>
cd <repository-name>

# Deploy development environment
./deploy.sh deploy development
```

### 2. Wait for Services

```bash
# Check status (should show all services as healthy)
./deploy.sh status
```

### 3. Access Applications

- **API Gateway**: <http://localhost:3000>
- **Booking Engine**: <http://localhost:3008>
- **B2B Panel**: <http://localhost:3009>
- **Admin Panel**: <http://localhost:3010>
- **Monitoring**: <http://localhost:3007> (admin/admin123)

## 📋 Service Overview

| Service | Port | Purpose |
| --- | --- | --- |
| API Gateway | 3000 | Main entry point |
| Booking Service | 3001 | Flight/hotel bookings |
| Inventory Service | 3002 | Flight/hotel inventory |
| Payment Service | 3003 | Payment processing |
| User Service | 3004 | User management |
| Notification Service | 3009 | Email/SMS notifications |
| Analytics Service | 3006 | Business analytics |

## 🛠️ Common Commands

```bash
# View all services
./deploy.sh status

# View logs
./deploy.sh logs

# View specific service logs
./deploy.sh logs booking-service

# Restart services
./deploy.sh restart

# Stop services
./deploy.sh stop

# Clean up everything
./deploy.sh clean
```

## 🔧 Configuration

### Environment Variables

All services use environment variables for configuration. Key variables:

```bash
# Database
DATABASE_URL=postgresql://postgres:postgres123@postgres:5432/travel_kingdom

# Cache
REDIS_URL=redis://redis:6379

# Message Queue
RABBITMQ_URL=amqp://admin:admin123@rabbitmq:5672

# External APIs (update with your keys)
DUFFEL_API_KEY=your-duffel-key
AMADEUS_API_KEY=your-amadeus-key
STRIPE_SECRET_KEY=your-stripe-key
```

### Secrets (Production)

For production, use the secrets directory:

```bash
secrets/
├── postgres_password.txt
├── jwt_secret.txt
├── duffel_api_key.txt
├── amadeus_api_key.txt
└── stripe_secret_key.txt
```

## 📊 Monitoring

### Health Checks

All services provide health endpoints:

- `GET /health` - Service health
- `GET /metrics` - Prometheus metrics
- `GET /ready` - Readiness probe

### Monitoring Stack

- **Grafana**: <http://localhost:3007> (admin/admin123)
- **Prometheus**: <http://localhost:9090>
- **Jaeger**: <http://localhost:16686>

## 🚨 Troubleshooting

### Services Not Starting

```bash
# Check Docker resources
docker system df

# View service logs
./deploy.sh logs [service-name]

# Check network connectivity
docker-compose -f infrastructure/compose/docker-compose.yml exec [service-name] ping postgres
```

### Database Issues

```bash
# Check PostgreSQL health
docker-compose -f infrastructure/compose/docker-compose.yml exec postgres pg_isready -U postgres

# Access database
docker-compose -f infrastructure/compose/docker-compose.yml exec postgres psql -U postgres -d travel_kingdom
```

### High Memory Usage

```bash
# Check resource usage
docker stats

# Restart specific service
./deploy.sh restart [service-name]
```

## 🏭 Production Deployment

### Quick Production Deploy

```bash
# Deploy production environment
./deploy.sh deploy production

# Configure secrets (update with your keys)
nano secrets/duffel_api_key.txt
nano secrets/amadeus_api_key.txt
# ... etc
```

### Production Features

- SSL/TLS with Let's Encrypt
- High availability (multiple replicas)
- Automated backups
- Full monitoring stack
- Security hardening

## 📚 API Documentation

### API Gateway

- **Health**: `GET http://localhost:3000/health`
- **Docs**: `GET http://localhost:3000/docs`
- **Metrics**: `GET http://localhost:3000/metrics`

### Service APIs

Each service provides its own documentation:

- **Bookings**: `GET http://localhost:3000/api/v1/bookings/docs`
- **Inventory**: `GET http://localhost:3000/api/v1/inventory/docs`
- **Payments**: `GET http://localhost:3000/api/v1/payments/docs`
- **Users**: `GET http://localhost:3000/api/v1/users/docs`

## 🔒 Security Notes

### Development

- Default passwords are used
- No SSL/TLS
- All services accessible locally

### Production

- Strong passwords required
- SSL/TLS enforced
- Secrets management
- Network isolation

## 📞 Support

### Getting Help

1. Check this quick start guide
2. View service logs: `./deploy.sh logs`
3. Check monitoring: <http://localhost:3007>
4. Create GitHub issue for bugs

### Emergency Commands

```bash
# Service outage
./deploy.sh restart

# Database backup
./scripts/backup.sh

# Full cleanup
./deploy.sh clean
```

## 🎯 Next Steps

1. **Explore APIs**: Visit <http://localhost:3000/docs>
2. **Monitor Services**: Check <http://localhost:3007>
3. **Customize**: Update environment variables
4. **Scale**: Use `docker-compose -f infrastructure/compose/docker-compose.yml up --scale [service]=N`
5. **Deploy**: Use `./deploy.sh deploy production` for production

---

**🎉 You're all set! Visit <http://localhost:3008> to start booking flights and hotels!**
