# Production Deployment Guide

## Overview

This guide provides comprehensive instructions for deploying the Static Data API to production environments.

## Prerequisites

### System Requirements
- Node.js 18.0.0 or higher
- PostgreSQL 12.0 or higher
- 2GB RAM minimum (4GB recommended)
- 10GB disk space minimum

### Environment Variables

Create a `.env` file in the `packages/static-data` directory:

```bash
# Database Configuration
STATIC_DATABASE_URL=postgresql://username:password@hostname:port/database_name

# Server Configuration
STATIC_DATA_PORT=3002
NODE_ENV=production

# CORS Configuration
CORS_ORIGIN=https://your-frontend-domain.com

# Security
API_KEY=your-api-key-here (optional for production)

# Logging
LOG_LEVEL=info
```

## Installation

### 1. Install Dependencies

```bash
cd packages/static-data
npm install
```

### 2. Build the Application

```bash
npm run build
```

### 3. Run Database Migrations (if needed)

```bash
# If you need to create the database schema
psql -d your_database -f database/schema.sql
```

## Deployment Options

### Option 1: Direct Node.js Deployment

#### Start the Server

```bash
# Production mode
npm start

# Development mode with hot reload
npm run dev:watch
```

#### Process Management

Use PM2 for production process management:

```bash
# Install PM2 globally
npm install -g pm2

# Start the application
pm2 start dist/server.js --name "static-data-api"

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup
```

### Option 2: Docker Deployment

#### Create Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist/ ./dist/
COPY node_modules/ ./node_modules/

EXPOSE 3002

CMD ["node", "dist/server.js"]
```

#### Build and Run

```bash
# Build the image
docker build -t static-data-api .

# Run the container
docker run -d \
  --name static-data-api \
  -p 3002:3002 \
  -e STATIC_DATABASE_URL=your_database_url \
  -e NODE_ENV=production \
  static-data-api
```

### Option 3: Kubernetes Deployment

#### Create Kubernetes Manifest

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: static-data-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: static-data-api
  template:
    metadata:
      labels:
        app: static-data-api
    spec:
      containers:
      - name: static-data-api
        image: static-data-api:latest
        ports:
        - containerPort: 3002
        env:
        - name: STATIC_DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: database-url
        - name: NODE_ENV
          value: "production"
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: static-data-api-service
spec:
  selector:
    app: static-data-api
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3002
  type: LoadBalancer
```

## Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `STATIC_DATABASE_URL` | PostgreSQL connection string | - | Yes |
| `STATIC_DATA_PORT` | Server port | 3002 | No |
| `NODE_ENV` | Environment mode | development | No |
| `CORS_ORIGIN` | CORS allowed origins | * | No |
| `LOG_LEVEL` | Logging level | info | No |

### Database Configuration

Ensure your PostgreSQL database has:

1. **Required Extensions**:
   ```sql
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
   ```

2. **Performance Settings**:
   ```sql
   -- Increase connection pool size
   ALTER SYSTEM SET max_connections = 200;
   
   -- Optimize for read-heavy workloads
   ALTER SYSTEM SET shared_buffers = '256MB';
   ALTER SYSTEM SET effective_cache_size = '1GB';
   ```

3. **Indexes**: Ensure proper indexes are created for optimal query performance.

### Security Configuration

1. **HTTPS**: Use a reverse proxy (Nginx, Apache) with SSL/TLS
2. **API Keys**: Implement API key authentication for production
3. **Firewall**: Configure firewall rules to restrict access
4. **Database Security**: Use strong passwords and limit database access

## Monitoring and Logging

### Health Checks

The API provides health check endpoints:

- **Application Health**: `GET /health`
- **Database Health**: `GET /api/health/database`

### Metrics

Monitor these key metrics:

- **Response Time**: 95th percentile should be < 500ms
- **Error Rate**: Should be < 1%
- **Database Connections**: Monitor connection pool usage
- **Memory Usage**: Should be stable with no leaks

### Logging

Configure structured logging:

```javascript
// Example Winston configuration
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});
```

## Performance Optimization

### Database Optimization

1. **Connection Pooling**: Configure appropriate pool sizes
2. **Query Optimization**: Use indexes and optimize slow queries
3. **Caching**: Implement Redis caching for frequently accessed data
4. **Read Replicas**: Use read replicas for read-heavy workloads

### Application Optimization

1. **Compression**: Enable gzip compression
2. **Caching**: Implement response caching
3. **CDN**: Use CDN for static assets
4. **Load Balancing**: Distribute load across multiple instances

### Monitoring Tools

Recommended monitoring tools:

- **Application**: New Relic, Datadog, or Prometheus
- **Database**: pgAdmin, pg_stat_statements
- **Infrastructure**: Grafana, Nagios

## Backup and Recovery

### Database Backups

```bash
# Daily backup script
#!/bin/bash
pg_dump -h hostname -U username -d database_name > backup_$(date +%Y%m%d).sql

# Automated backup with cron
0 2 * * * /path/to/backup_script.sh
```

### Application Backups

1. **Code**: Use Git for version control
2. **Configuration**: Store configuration in version control
3. **Dependencies**: Lock dependency versions in package-lock.json

## Troubleshooting

### Common Issues

1. **Database Connection Errors**:
   - Check connection string
   - Verify database is running
   - Check firewall settings

2. **High Memory Usage**:
   - Monitor for memory leaks
   - Optimize query performance
   - Increase server resources

3. **Slow Response Times**:
   - Check database performance
   - Review query optimization
   - Monitor server resources

### Debug Mode

Enable debug mode for troubleshooting:

```bash
DEBUG=static-data-api:* npm start
```

### Log Analysis

Common log patterns to monitor:

```bash
# Check for errors
grep "ERROR" logs/combined.log

# Check response times
grep "response_time" logs/combined.log

# Check database queries
grep "SELECT" logs/combined.log
```

## Scaling

### Horizontal Scaling

1. **Load Balancer**: Distribute traffic across multiple instances
2. **Database**: Use read replicas and connection pooling
3. **Caching**: Implement distributed caching with Redis

### Vertical Scaling

1. **CPU**: Increase CPU cores for compute-heavy operations
2. **Memory**: Increase RAM for better caching
3. **Storage**: Use SSD for better I/O performance

## Security Best Practices

### Authentication and Authorization

1. **API Keys**: Implement API key authentication
2. **Rate Limiting**: Configure appropriate rate limits
3. **CORS**: Restrict CORS to trusted domains

### Data Protection

1. **Encryption**: Use HTTPS for all communications
2. **Database Security**: Encrypt sensitive data
3. **Access Control**: Limit database access

### Regular Security Audits

1. **Dependency Updates**: Keep dependencies updated
2. **Security Scanning**: Use tools like Snyk or npm audit
3. **Penetration Testing**: Regular security assessments

## Deployment Checklist

### Pre-Deployment

- [ ] Environment variables configured
- [ ] Database schema created
- [ ] Dependencies installed
- [ ] Application built
- [ ] Tests passed
- [ ] Security configuration reviewed

### Deployment

- [ ] Application deployed
- [ ] Health checks passing
- [ ] Database connections working
- [ ] Logs configured
- [ ] Monitoring set up

### Post-Deployment

- [ ] Smoke tests passed
- [ ] Performance metrics reviewed
- [ ] Security checks completed
- [ ] Documentation updated
- [ ] Team notified

## Support

For production support:

1. **Documentation**: Review this deployment guide
2. **Logs**: Check application and system logs
3. **Monitoring**: Review monitoring dashboards
4. **Team**: Contact the development team

## Emergency Procedures

### Service Outage

1. **Check Health**: Verify service health
2. **Check Logs**: Review error logs
3. **Check Resources**: Monitor system resources
4. **Restart Service**: If needed, restart the service
5. **Rollback**: If issue persists, rollback to previous version

### Database Issues

1. **Check Connection**: Verify database connectivity
2. **Check Performance**: Monitor query performance
3. **Check Backups**: Verify backup integrity
4. **Restore**: If needed, restore from backup

### Security Incidents

1. **Isolate**: Isolate affected systems
2. **Investigate**: Investigate the incident
3. **Notify**: Notify security team
4. **Remediate**: Apply security fixes
5. **Review**: Review security measures