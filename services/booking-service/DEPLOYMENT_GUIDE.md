# Booking Service Deployment Guide

## Overview

This guide provides comprehensive instructions for deploying the Booking Service in different environments, including local development with static data and production with NEON PostgreSQL.

## 🚀 Quick Start

### Local Development (Static Data)

1. **Clone and Setup**
   ```bash
   git clone <repository-url>
   cd services/booking-service
   npm install
   ```

2. **Start Static Data Environment**
   ```bash
   npm run docker:static
   ```

3. **Seed Static Data**
   ```bash
   npm run seed:static
   ```

4. **Start Development Server**
   ```bash
   npm run dev:static
   ```

5. **Access the Application**
   - API: http://localhost:3001
   - Health Check: http://localhost:3001/health

### Production Deployment (NEON)

1. **Configure Environment**
   ```bash
   cp .env.example .env.production
   # Edit .env.production with your NEON credentials
   ```

2. **Build and Deploy**
   ```bash
   npm run build
   docker build -t booking-service:latest .
   docker push your-registry/booking-service:latest
   ```

3. **Deploy to Kubernetes**
   ```bash
   kubectl apply -f k8s/
   ```

## 📋 Prerequisites

### Development Environment
- Node.js 18+
- Docker and Docker Compose
- npm or yarn
- PostgreSQL client (optional)

### Production Environment
- Kubernetes cluster
- NEON PostgreSQL account
- Docker registry access
- Redis instance
- Load balancer/Ingress controller

## 🏗️ Environment Configuration

### Local Development (.env.static-data)

```env
# Environment
NODE_ENV=development
PORT=3000

# Database (PostgreSQL in Docker)
DATABASE_URL="postgresql://postgres:password@postgres-static:5432/static_data"
POSTGRES_DB=static_data
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password

# Redis (in Docker)
REDIS_URL="redis://redis-static:6379"
REDIS_HOST=redis-static
REDIS_PORT=6379

# Authentication
JWT_SECRET="static-data-secret-key"
JWT_EXPIRES_IN=24h

# Logging
LOG_LEVEL=debug
LOG_FILE_PATH=./logs/static-data.log

# Monitoring
METRICS_ENABLED=true
HEALTH_CHECK_INTERVAL=30000
```

### Production (.env.production)

```env
# Environment
NODE_ENV=production
PORT=3000

# Database (NEON PostgreSQL)
DATABASE_URL="postgresql://user:password@ep-xyz.us-east-1.aws.neon.tech/booking_service?sslmode=require"
NEON_PROJECT_ID="your-project-id"
NEON_API_KEY="your-neon-api-key"
NEON_POOL_TIMEOUT=30000
NEON_CONNECTION_LIMIT=20

# Redis
REDIS_URL="redis://your-redis-host:6379"
REDIS_PASSWORD="your-redis-password"

# Authentication
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN=24h

# Security
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
LOG_FILE_PATH=/app/logs/app.log

# Monitoring
METRICS_ENABLED=true
HEALTH_CHECK_INTERVAL=60000

# External Services
STRIPE_SECRET_KEY="your-stripe-secret-key"
AMADEUS_API_KEY="your-amadeus-api-key"
PAYPAL_CLIENT_ID="your-paypal-client-id"
```

## 🐳 Docker Deployment

### Local Development with Static Data

```bash
# Start all services
npm run docker:static

# View logs
npm run docker:static-logs

# Stop services
npm run docker:static-down

# Clean up everything
docker-compose -f docker-compose.static-data.yml down -v
```

### Production Docker

```bash
# Build production image
docker build -t booking-service:latest .

# Run locally with production config
docker run -p 3000:3000 \
  -e NODE_ENV=production \
  -e DATABASE_URL="postgresql://user:password@ep-xyz.us-east-1.aws.neon.tech/booking_service?sslmode=require" \
  booking-service:latest
```

## ☸️ Kubernetes Deployment

### Prerequisites

1. **Create Secrets**
   ```bash
   kubectl create secret generic neon-secrets \
     --from-literal=database-url="postgresql://user:password@ep-xyz.us-east-1.aws.neon.tech/booking_service?sslmode=require" \
     --from-literal=project-id="your-project-id" \
     --from-literal=api-key="your-neon-api-key"

   kubectl create secret generic app-secrets \
     --from-literal=jwt-secret="your-super-secret-jwt-key"

   kubectl create secret generic redis-secrets \
     --from-literal=redis-url="redis://user:password@redis-service:6379"
   ```

2. **Deploy Application**
   ```bash
   kubectl apply -f k8s/deployment.yaml
   kubectl apply -f k8s/service.yaml
   kubectl apply -f k8s/ingress.yaml
   ```

3. **Verify Deployment**
   ```bash
   kubectl get pods
   kubectl get services
   kubectl get ingress
   ```

### Kubernetes Configuration Files

#### 1. Deployment (k8s/deployment.yaml)
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: booking-service
  labels:
    app: booking-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: booking-service
  template:
    metadata:
      labels:
        app: booking-service
    spec:
      containers:
      - name: booking-service
        image: booking-service:latest
        ports:
        - containerPort: 3000
        envFrom:
        - secretRef:
            name: neon-secrets
        - secretRef:
            name: app-secrets
        - secretRef:
            name: redis-secrets
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
```

#### 2. Service (k8s/service.yaml)
```yaml
apiVersion: v1
kind: Service
metadata:
  name: booking-service
  labels:
    app: booking-service
spec:
  selector:
    app: booking-service
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: ClusterIP
```

#### 3. Ingress (k8s/ingress.yaml)
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: booking-service-ingress
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/rate-limit: "100"
    nginx.ingress.kubernetes.io/rate-limit-window: "1m"
spec:
  tls:
  - hosts:
    - api.booking-service.example.com
    secretName: booking-service-tls
  rules:
  - host: api.booking-service.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: booking-service
            port:
              number: 80
```

## 🔧 Configuration Management

### Environment Variables

#### Database Configuration
- `DATABASE_URL`: PostgreSQL connection string
- `NEON_PROJECT_ID`: NEON project identifier
- `NEON_API_KEY`: NEON API authentication key

#### Application Configuration
- `NODE_ENV`: Environment (development/production)
- `PORT`: Application port
- `JWT_SECRET`: JWT signing secret
- `JWT_EXPIRES_IN`: JWT expiration time

#### Security Configuration
- `RATE_LIMIT_WINDOW_MS`: Rate limiting window
- `RATE_LIMIT_MAX_REQUESTS`: Maximum requests per window
- `CORS_ORIGIN`: Allowed CORS origins

#### External Services
- `STRIPE_SECRET_KEY`: Stripe payment processing
- `AMADEUS_API_KEY`: Amadeus flight API
- `PAYPAL_CLIENT_ID`: PayPal integration
- `REDIS_URL`: Redis connection string

### Configuration Files

#### 1. Prisma Configuration (prisma/prisma.config.ts)
```typescript
import { defineConfig } from '@prisma/client'

export default defineConfig({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
      directUrl: process.env.DATABASE_URL,
      shadowDatabaseUrl: process.env.SHADOW_DATABASE_URL,
    },
  },
  generator: {
    client: {
      provider: 'prisma-client-js',
      previewFeatures: ['driverAdapters'],
    },
  },
})
```

#### 2. Database Schema (prisma/schema.prisma)
```prisma
generator client {
  provider = "prisma-client-js"
  output   = "../src/generated/client"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  connectionLimit = 20
  maxConnections = 100
  idleTimeout = 30000
}
```

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy Booking Service

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v3
      
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Run tests
      run: npm test
      
    - name: Build application
      run: npm run build
      
    - name: Build Docker image
      run: docker build -t booking-service:${{ github.sha }} .
      
    - name: Push to registry
      run: |
        echo ${{ secrets.DOCKER_PASSWORD }} | docker login -u ${{ secrets.DOCKER_USERNAME }} --password-stdin
        docker tag booking-service:${{ github.sha }} ${{ secrets.REGISTRY_URL }}/booking-service:${{ github.sha }}
        docker push ${{ secrets.REGISTRY_URL }}/booking-service:${{ github.sha }}
        
    - name: Deploy to Kubernetes
      run: |
        kubectl config use-context ${{ secrets.K8S_CONTEXT }}
        kubectl set image deployment/booking-service booking-service=${{ secrets.REGISTRY_URL }}/booking-service:${{ github.sha }}
        kubectl rollout status deployment/booking-service
```

### Deployment Scripts

#### 1. Build Script (scripts/build.sh)
```bash
#!/bin/bash

set -e

echo "🏗️ Building Booking Service..."

# Install dependencies
npm ci

# Run tests
npm test

# Build application
npm run build

# Build Docker image
docker build -t booking-service:latest .

echo "✅ Build completed successfully!"
```

#### 2. Deploy Script (scripts/deploy.sh)
```bash
#!/bin/bash

set -e

ENVIRONMENT=${1:-production}
IMAGE_TAG=${2:-latest}

echo "🚀 Deploying to $ENVIRONMENT environment..."

# Apply Kubernetes manifests
kubectl apply -f k8s/

# Update image
kubectl set image deployment/booking-service booking-service=booking-service:$IMAGE_TAG

# Wait for rollout
kubectl rollout status deployment/booking-service

# Verify deployment
kubectl get pods -l app=booking-service

echo "✅ Deployment completed successfully!"
```

## 📊 Monitoring and Observability

### Health Checks

#### Application Health
```bash
# Check application health
curl http://localhost:3000/health

# Check readiness
curl http://localhost:3000/ready
```

#### Database Health
```bash
# Check database connectivity
curl http://localhost:3000/health/database
```

#### NEON Health (Production)
```bash
# Check NEON project status
curl -H "Authorization: Bearer $NEON_API_KEY" \
  "https://console.neon.tech/api/v2/projects/$NEON_PROJECT_ID"
```

### Metrics Collection

#### Application Metrics
- Response time metrics
- Error rate tracking
- Request volume monitoring
- Database connection metrics

#### NEON Metrics
- CPU usage
- Memory usage
- Storage usage
- Active connections
- Branch information

### Logging

#### Log Levels
- `error`: Error conditions
- `warn`: Warning conditions
- `info`: General information
- `debug`: Debug information

#### Log Aggregation
```bash
# View application logs
kubectl logs -f deployment/booking-service

# View logs from specific pod
kubectl logs -f pod-name

# View logs with labels
kubectl logs -l app=booking-service -f
```

## 🔒 Security Considerations

### Secrets Management
- Use Kubernetes secrets for sensitive data
- Rotate secrets regularly
- Use different secrets for different environments

### Network Security
- Use HTTPS for all communications
- Configure proper CORS settings
- Implement rate limiting
- Use security headers

### Database Security
- Use SSL connections
- Implement proper authentication
- Regular security audits
- Backup encryption

## 🚨 Troubleshooting

### Common Issues

#### 1. Database Connection Issues
```bash
# Check database connectivity
kubectl exec -it pod-name -- nc -zv postgres-host 5432

# Check environment variables
kubectl exec -it pod-name -- env | grep DATABASE_URL
```

#### 2. Redis Connection Issues
```bash
# Check Redis connectivity
kubectl exec -it pod-name -- redis-cli ping

# Check Redis configuration
kubectl exec -it pod-name -- env | grep REDIS
```

#### 3. Application Startup Issues
```bash
# Check application logs
kubectl logs pod-name

# Check pod status
kubectl describe pod pod-name
```

### Debug Commands

#### Kubernetes Debugging
```bash
# Get pod information
kubectl get pods -o wide

# Describe pod
kubectl describe pod pod-name

# Execute commands in pod
kubectl exec -it pod-name -- /bin/sh

# Port forward for local testing
kubectl port-forward pod-name 3000:3000
```

#### Docker Debugging
```bash
# View container logs
docker logs container-name

# Execute commands in container
docker exec -it container-name /bin/sh

# Check container status
docker ps

# View container details
docker inspect container-name
```

## 📈 Performance Optimization

### Database Optimization
- Use connection pooling
- Implement proper indexing
- Monitor query performance
- Use read replicas for read-heavy workloads

### Application Optimization
- Implement caching strategies
- Use compression for responses
- Optimize image processing
- Implement proper error handling

### Infrastructure Optimization
- Use auto-scaling
- Implement load balancing
- Monitor resource usage
- Use CDN for static assets

## 🔄 Backup and Recovery

### Database Backups
```bash
# Create backup
npm run backup:neon

# Restore from backup
npm run restore:neon -- --backup-id=backup-id
```

### Application Backups
- Configuration backups
- Code repository backups
- Container image backups

### Disaster Recovery
- Multi-region deployment
- Automated failover
- Data replication
- Recovery testing

## 📚 Additional Resources

- [NEON Documentation](https://neon.tech/docs)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Docker Documentation](https://docs.docker.com/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Express.js Documentation](https://expressjs.com/)

This deployment guide provides comprehensive instructions for deploying the Booking Service in various environments, from local development with static data to production with NEON PostgreSQL and Kubernetes.