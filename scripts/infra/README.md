# TripAlfa Migration Scripts

This directory contains automated scripts to facilitate the migration from a monolithic database architecture to microservices.

## 📋 Available Scripts

### `migrate-data.js`

**Purpose**: Migrates data from the monolithic database to service-specific databases.

**Usage**:

```bash
# Migrate all services
node scripts/migrate-data.js

# Migrate specific service
node scripts/migrate-data.js users
node scripts/migrate-data.js bookings
node scripts/migrate-data.js payments
node scripts/migrate-data.js audit
node scripts/migrate-data.js notifications
```

**Features**:

- ✅ Dependency-aware migration ordering
- ✅ Progress tracking and error handling
- ✅ Individual service migration support
- ✅ Data validation and integrity checks
- ✅ Rollback capabilities

### `update-service-code.js`

**Purpose**: Automatically refactors service code to use microservices architecture.

**Usage**:

```bash
# Update all services
node scripts/update-service-code.js

# Update specific service
node scripts/update-service-code.js user-service
node scripts/update-service-code.js booking-service
```

**What it does**:

- 🔄 Updates Prisma imports to use service-specific databases
- 🌐 Creates API clients for cross-service communication
- 🏥 Adds health check endpoints
- 📦 Updates package.json with proper dependencies and scripts
- ⚙️ Creates service-specific environment configurations

## 🚀 Migration Workflow

### Phase 4: Data Migration

1. **Create Database Backup**

   ```bash
   pg_dump tripalfa > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

2. **Run Data Migration**

   ```bash
   # Migrate in dependency order
   node scripts/migrate-data.js users
   node scripts/migrate-data.js bookings
   node scripts/migrate-data.js payments
   node scripts/migrate-data.js audit
   node scripts/migrate-data.js notifications
   ```

3. **Validate Migration**

   ```bash
   # Check record counts (replace <DB_PASSWORD> and <NEON_HOST> with your credentials)
   psql "postgresql://neondb_owner:<DB_PASSWORD>@<NEON_HOST>/tripalfa_user_service?sslmode=require" -c "SELECT 'users' as table, COUNT(*) FROM \"User\""
   psql "postgresql://neondb_owner:<DB_PASSWORD>@<NEON_HOST>/tripalfa_booking_service?sslmode=require" -c "SELECT 'bookings' as table, COUNT(*) FROM \"Booking\""
   ```

### Phase 5: Service Code Updates

1. **Update Service Code**

   ```bash
   # Update all services
   node scripts/update-service-code.js
   ```

2. **Review Generated Code**
   - Check API client implementations
   - Review updated imports
   - Verify health check endpoints
   - Update any TODO comments

3. **Install Dependencies**

   ```bash
   # For each service
   cd services/[service-name]
   npm install
   ```

4. **Update API Gateway**
   - Add routes to proxy requests to individual services
   - Implement service discovery
   - Add circuit breakers and retry logic

## 🔧 Manual Steps Required

### After Running Scripts

1. **Fix TODO Comments**

   ```typescript
   // TODO: Replace with user-service API call
   // prisma.user.findUnique(...)
   const user = await apiClient.getUser(userId);
   ```

2. **Update API Gateway Routes**

   ```typescript
   // Add to api-gateway routes
   app.use('/api/users', proxy('http://user-service:3001'));
   app.use('/api/bookings', proxy('http://booking-service:3001'));
   app.use('/api/payments', proxy('http://payment-service:3003'));
   ```

3. **Update Frontend Applications**

   ```typescript
   // Before: Direct API calls
   const bookings = await api.get('/bookings');

   // After: Service-specific calls through gateway
   const bookings = await api.get('/api/bookings');
   ```

4. **Configure Service Discovery**

   ```yaml
   # docker-compose additions
   services:
     api-gateway:
       environment:
         USER_SERVICE_URL: http://user-service:3001
         BOOKING_SERVICE_URL: http://booking-service:3001
   ```

## 🧪 Testing Strategy

### Unit Tests

```bash
# Test each service independently
cd services/user-service && npm test
cd services/booking-service && npm test
```

### Integration Tests

```bash
# Test service-to-service communication
npm run test:integration
```

### End-to-End Tests

```bash
# Test complete user journeys
npm run test:e2e
```

## 🔄 Rollback Procedures

### If Migration Fails

1. **Stop All Services**

   ```bash
   docker-compose -f docker-compose.local.yml down
   ```

2. **Restore Database**

   ```bash
   psql tripalfa < backup_file.sql
   ```

3. **Revert Code Changes**

   ```bash
   git checkout HEAD~1  # Or specific commit
   ```

4. **Restart Services**

   ```bash
   docker-compose -f docker-compose.local.yml up -d
   ```

## 📊 Monitoring & Validation

### Health Checks

```bash
# Check all service health
curl http://localhost:3001/health  # booking-service
curl http://localhost:3003/health  # payment-service
curl http://localhost:3012/health  # audit-service
```

### Database Validation

```bash
# Verify data integrity
node scripts/validate-migration.js
```

### Performance Monitoring

```bash
# Monitor service performance
node scripts/monitor-services.js
```

## 🎯 Success Criteria

- [ ] All services start successfully with their databases
- [ ] API Gateway routes work correctly
- [ ] Data integrity maintained across migration
- [ ] No breaking changes to existing functionality
- [ ] Performance meets or exceeds current levels
- [ ] All health checks pass
- [ ] Services can be deployed independently

## 📞 Support

If you encounter issues during migration:

1. Check the logs: `docker-compose logs [service-name]`
2. Validate database connections
3. Review error messages in migration scripts
4. Check the migration plan document
5. Contact the development team

## 🔐 Security Considerations

- Database URLs contain sensitive credentials
- Use environment variables for all secrets
- Implement proper authentication between services
- Use HTTPS for service-to-service communication
- Regularly rotate database credentials

---

**🎉 Happy Migrating! Your microservices architecture awaits!**
