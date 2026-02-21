# Rule Management System - Deployment Guide

This guide provides comprehensive instructions for deploying the Rule Management System in your TripAlfa B2B Admin application.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [File Structure](#file-structure)
3. [Installation Steps](#installation-steps)
4. [Configuration](#configuration)
5. [Testing](#testing)
6. [Deployment](#deployment)
7. [Security Considerations](#security-considerations)
8. [Monitoring and Maintenance](#monitoring-and-maintenance)
9. [Troubleshooting](#troubleshooting)

## Prerequisites

Before deploying the Rule Management System, ensure you have:

- Node.js 18+ installed
- React 18+ with TypeScript
- React Query for state management
- Tailwind CSS for styling
- Prisma ORM for database operations
- Existing TripAlfa B2B Admin application structure
- User authentication and authorization system in place

## File Structure

The Rule Management System consists of the following files:

```
apps/b2b-admin/src/
├── types/
│   └── ruleManagement.ts          # Rule management type definitions
│   └── rulePermissions.ts         # Permission type definitions
├── hooks/
│   └── useRulePermissions.ts      # Permission hook implementation
├── utils/
│   ├── rulePermissions.ts         # Permission utility functions
│   └── ruleSecurity.ts           # Security validation utilities
├── components/
│   └── RulePermissionGuard.tsx   # Permission-based component wrapper
├── features/rules/
│   ├── RuleManagementPage.tsx    # Main rule management interface
│   ├── RuleCategorySelector.tsx  # Category selection component
│   ├── RuleList.tsx              # Rule listing and filtering
│   ├── RuleForm.tsx              # Rule creation and editing
│   ├── RuleAnalytics.tsx         # Rule performance analytics
│   └── RuleAuditLog.tsx          # Audit trail for rule changes
└── __tests__/
    └── rulePermissions.test.ts   # Permission system tests
```

## Installation Steps

### 1. Copy Files to Your Project

Copy all the rule management files to your TripAlfa B2B Admin application:

```bash
# Copy type definitions
cp ruleManagement.ts apps/b2b-admin/src/types/
cp rulePermissions.ts apps/b2b-admin/src/types/

# Copy hooks
cp useRulePermissions.ts apps/b2b-admin/src/hooks/

# Copy utilities
cp rulePermissions.ts apps/b2b-admin/src/utils/
cp ruleSecurity.ts apps/b2b-admin/src/utils/

# Copy components
cp RulePermissionGuard.tsx apps/b2b-admin/src/components/

# Copy feature components
mkdir -p apps/b2b-admin/src/features/rules
cp RuleManagementPage.tsx apps/b2b-admin/src/features/rules/
cp RuleCategorySelector.tsx apps/b2b-admin/src/features/rules/
cp RuleList.tsx apps/b2b-admin/src/features/rules/
cp RuleForm.tsx apps/b2b-admin/src/features/rules/
cp RuleAnalytics.tsx apps/b2b-admin/src/features/rules/
cp RuleAuditLog.tsx apps/b2b-admin/src/features/rules/

# Copy tests
mkdir -p apps/b2b-admin/src/__tests__
cp rulePermissions.test.ts apps/b2b-admin/src/__tests__/
```

### 2. Install Required Dependencies

Ensure you have the following dependencies in your `package.json`:

```json
{
  "dependencies": {
    "@hookform/resolvers": "^3.3.2",
    "react-hook-form": "^7.48.2",
    "react-query": "^3.39.3",
    "zod": "^3.22.4",
    "lucide-react": "^0.294.0",
    "sonner": "^1.3.1"
  }
}
```

Install dependencies:

```bash
cd apps/b2b-admin
npm install
```

### 3. Update Your Main Application

Add the Rule Management Page to your main application routing:

```typescript
// In your main App.tsx or routing configuration
import RuleManagementPage from './features/rules/RuleManagementPage';

// Add route
<Route path="/rules" element={<RuleManagementPage />} />
```

### 4. Database Schema Updates

Add rule management tables to your Prisma schema:

```prisma
// In your schema.prisma file
model Rule {
  id          String   @id @default(cuid())
  name        String
  description String?
  category    String
  conditions  Json
  actions     Json
  priority    Int      @default(0)
  isActive    Boolean  @default(true)
  companyId   String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  company Company @relation(fields: [companyId], references: [id])
}

model RuleAudit {
  id        String   @id @default(cuid())
  ruleId    String
  action    String   // 'created', 'updated', 'deleted'
  changes   Json
  userId    String?
  timestamp DateTime @default(now())
  ipAddress String?
  userAgent String?

  rule Rule @relation(fields: [ruleId], references: [id])
}
```

Run database migrations:

```bash
npx prisma migrate dev --name add_rule_management
```

## Configuration

### 1. Environment Variables

Add the following environment variables to your `.env` file:

```env
# Rule Management Configuration
RULE_MAX_PRIORITY=1000
RULE_DEFAULT_PRIORITY=100
RULE_CONDITION_MAX_DEPTH=5
RULE_ACTION_MAX_COUNT=10
AUDIT_LOG_RETENTION_DAYS=365
```

### 2. Permission Configuration

Configure rule management permissions in your permission system:

```typescript
// In your permission configuration
const RULE_PERMISSIONS = {
  VIEW_RULES: 'rules.view',
  CREATE_RULES: 'rules.create',
  EDIT_RULES: 'rules.edit',
  DELETE_RULES: 'rules.delete',
  VIEW_ANALYTICS: 'rules.analytics',
  VIEW_AUDIT_LOG: 'rules.audit',
  MANAGE_CATEGORIES: 'rules.categories.manage'
};
```

### 3. API Endpoints

Set up the following API endpoints in your backend:

```typescript
// Rule Management API Endpoints
GET /api/rules?category=&status=&search=     // List rules with filtering
POST /api/rules                              // Create new rule
PUT /api/rules/:id                           // Update rule
DELETE /api/rules/:id                        // Delete rule
GET /api/rules/:id/analytics                 // Get rule analytics
GET /api/rules/:id/audit                     // Get rule audit log
GET /api/rules/categories                    // Get available categories
```

## Testing

### 1. Run Unit Tests

```bash
cd apps/b2b-admin
npm test -- --testPathPattern=rulePermissions
```

### 2. Run Type Checking

```bash
npm run typecheck
```

### 3. Manual Testing Checklist

- [ ] Rule creation form validation works correctly
- [ ] Permission guards prevent unauthorized access
- [ ] Rule filtering and search functionality works
- [ ] Analytics charts display correctly
- [ ] Audit log records all changes
- [ ] Category selector works with all rule types
- [ ] Form validation prevents invalid rule creation
- [ ] Security measures prevent injection attacks

## Deployment

### 1. Build the Application

```bash
cd apps/b2b-admin
npm run build
```

### 2. Deploy to Production

Deploy your application using your preferred method (Vercel, Netlify, etc.):

```bash
# Example for Vercel
vercel --prod
```

### 3. Database Migration

Run migrations in production:

```bash
npx prisma migrate deploy
```

### 4. Environment Configuration

Ensure all environment variables are set in your production environment:

```bash
# Set environment variables in your deployment platform
RULE_MAX_PRIORITY=1000
RULE_DEFAULT_PRIORITY=100
RULE_CONDITION_MAX_DEPTH=5
RULE_ACTION_MAX_COUNT=10
AUDIT_LOG_RETENTION_DAYS=365
```

## Security Considerations

### 1. Input Validation

- All rule conditions and actions are validated using Zod schemas
- SQL injection protection through parameterized queries
- XSS prevention through proper escaping

### 2. Permission Controls

- Role-based access control for all rule operations
- Permission guards on all sensitive operations
- Audit logging for all rule changes

### 3. Data Protection

- Sensitive rule data is encrypted at rest
- Audit logs are immutable and tamper-proof
- Regular security audits recommended

### 4. Rate Limiting

Implement rate limiting on rule management endpoints:

```typescript
// Example rate limiting configuration
const RULE_API_RATE_LIMIT = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many rule operations from this IP'
};
```

## Monitoring and Maintenance

### 1. Performance Monitoring

Monitor the following metrics:

- Rule evaluation performance
- API response times
- Database query performance
- Memory usage for rule processing

### 2. Regular Maintenance

- Review and clean up old audit logs monthly
- Monitor rule effectiveness and update as needed
- Review permission assignments quarterly
- Update rule categories as business needs evolve

### 3. Backup Strategy

Ensure rule data is included in your regular backup strategy:

```bash
# Example backup command
pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME -t rules -t rule_audit > rule_backup.sql
```

## Troubleshooting

### Common Issues

#### 1. Permission Errors
**Problem**: Users can't access rule management features
**Solution**: Check user role assignments and permission configuration

#### 2. Database Migration Failures
**Problem**: Prisma migrations fail during deployment
**Solution**: 
- Check database connection
- Verify schema syntax
- Run migrations in development first

#### 3. API Endpoint Not Found
**Problem**: Frontend can't connect to rule management APIs
**Solution**: 
- Verify API endpoints are implemented
- Check CORS configuration
- Ensure authentication is properly configured

#### 4. Performance Issues
**Problem**: Rule evaluation is slow
**Solution**: 
- Review rule complexity
- Add database indexes on frequently queried fields
- Consider caching frequently accessed rules

### Debug Mode

Enable debug logging for troubleshooting:

```typescript
// In your environment configuration
DEBUG_RULES=true
DEBUG_PERMISSIONS=true
```

### Support

For additional support:

1. Check the application logs for error details
2. Verify all dependencies are properly installed
3. Ensure database connections are working
4. Review the permission configuration
5. Check the API endpoint implementations

## Next Steps

After successful deployment:

1. **User Training**: Train administrators on using the rule management system
2. **Documentation**: Create user guides for different user roles
3. **Monitoring**: Set up monitoring and alerting for the rule management system
4. **Feedback**: Collect user feedback for future improvements
5. **Integration**: Consider integrating with other TripAlfa systems

## Version History

- **v1.0.0**: Initial rule management system release
- **v1.1.0**: Added advanced analytics and audit logging
- **v1.2.0**: Enhanced security measures and permission controls