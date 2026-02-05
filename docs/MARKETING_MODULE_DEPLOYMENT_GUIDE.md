# Marketing Module Deployment Guide

## Overview

This guide provides comprehensive instructions for deploying and integrating the enhanced marketing module into the TripAlfa B2B Admin application.

## Prerequisites

### Development Environment
- Node.js 18+ 
- npm 8+ or yarn 1.22+
- TypeScript 5.0+
- React 18+
- TanStack Query 5.0+

### Required Dependencies
```json
{
  "dependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "typescript": "^5.0.0",
    "@tanstack/react-query": "^5.0.0",
    "zod": "^3.22.0",
    "react-hook-form": "^7.45.0",
    "lucide-react": "^0.263.1",
    "tailwindcss": "^3.3.0"
  },
  "devDependencies": {
    "@testing-library/react": "^13.4.0",
    "@testing-library/jest-dom": "^5.16.5",
    "@testing-library/user-event": "^14.4.3",
    "jest": "^29.6.0",
    "jest-environment-jsdom": "^29.6.0"
  }
}
```

## Installation Steps

### 1. Install Dependencies
```bash
cd apps/b2b-admin
npm install
```

### 2. Configure Environment Variables
Create or update `.env.local` file:
```env
# Marketing Module Configuration
NEXT_PUBLIC_MARKETING_API_URL=/api/marketing
NEXT_PUBLIC_PERMISSION_API_URL=/api/permissions

# Feature Flags
NEXT_PUBLIC_ENABLE_MARKETING_MODULE=true
NEXT_PUBLIC_ENABLE_BANNER_MANAGEMENT=true
NEXT_PUBLIC_ENABLE_SEO_MANAGEMENT=true
NEXT_PUBLIC_ENABLE_SOCIAL_MEDIA_MANAGEMENT=true

# Validation Settings
NEXT_PUBLIC_MAX_BANNER_SIZE=5242880  # 5MB
NEXT_PUBLIC_ALLOWED_IMAGE_FORMATS=jpg,jpeg,png,gif,webp,svg
NEXT_PUBLIC_MAX_BANNER_TITLE_LENGTH=100
NEXT_PUBLIC_MAX_BANNER_DESCRIPTION_LENGTH=500
```

### 3. Database Setup
Ensure your database has the required tables for marketing features:

```sql
-- Banner Management Table
CREATE TABLE banners (
  id SERIAL PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  status VARCHAR(20) DEFAULT 'draft',
  position VARCHAR(20) NOT NULL,
  image_url TEXT NOT NULL,
  target_url TEXT,
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  alt_text VARCHAR(200),
  priority INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- SEO Management Table
CREATE TABLE seo_settings (
  id SERIAL PRIMARY KEY,
  page_type VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(60) NOT NULL,
  description VARCHAR(160) NOT NULL,
  keywords TEXT,
  canonical_url TEXT,
  robots_index BOOLEAN DEFAULT true,
  robots_follow BOOLEAN DEFAULT true,
  structured_data JSONB,
  open_graph_title VARCHAR(100),
  open_graph_description VARCHAR(200),
  open_graph_image TEXT,
  twitter_card VARCHAR(20),
  twitter_site VARCHAR(50),
  schema_org_type VARCHAR(50),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Social Media Management Table
CREATE TABLE social_media_platforms (
  id SERIAL PRIMARY KEY,
  name VARCHAR(20) UNIQUE NOT NULL,
  enabled BOOLEAN DEFAULT false,
  username VARCHAR(50),
  url TEXT,
  api_key_encrypted TEXT,
  followers INTEGER DEFAULT 0,
  engagement_rate DECIMAL(5,2) DEFAULT 0,
  last_post_date TIMESTAMP,
  settings JSONB,
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 4. API Integration
Configure API endpoints in your backend:

```javascript
// Example Express.js routes
app.use('/api/marketing/banners', bannerRoutes);
app.use('/api/marketing/seo', seoRoutes);
app.use('/api/marketing/social-media', socialMediaRoutes);
app.use('/api/permissions', permissionRoutes);
```

## Configuration

### 1. Permission Configuration
Update your permission system to include marketing permissions:

```javascript
// permissions.js
const MARKETING_PERMISSIONS = {
  // Banner Management
  'marketing:banner:banner_management:view': 'View banner management',
  'marketing:banner:banner_management:create': 'Create banners',
  'marketing:banner:banner_management:update': 'Update banners',
  'marketing:banner:banner_management:delete': 'Delete banners',
  
  // SEO Management
  'marketing:seo:seo_management:view': 'View SEO settings',
  'marketing:seo:seo_management:update': 'Update SEO settings',
  
  // Social Media Management
  'marketing:social_media:social_media_settings:view': 'View social media settings',
  'marketing:social_media:social_media_settings:update': 'Update social media settings',
  'marketing:social_media:analytics:view': 'View analytics',
  'marketing:social_media:analytics:update': 'Update analytics settings',
  'marketing:social_media:scheduling:manage': 'Manage posting schedules',
  'marketing:social_media:posts:manage': 'Manage social media posts'
};
```

### 2. Context Provider Setup
Ensure the PermissionProvider is wrapped around your application:

```jsx
// _app.tsx or main App component
import { PermissionProvider } from '@/contexts/PermissionContext';

function App({ children }) {
  return (
    <PermissionProvider>
      {children}
    </PermissionProvider>
  );
}
```

### 3. Styling Configuration
Add marketing-specific styles to your Tailwind configuration:

```javascript
// tailwind.config.js
module.exports = {
  content: [
    './apps/b2b-admin/src/**/*.{js,ts,jsx,tsx}',
    // ... other paths
  ],
  theme: {
    extend: {
      colors: {
        marketing: {
          primary: '#3b82f6',
          secondary: '#10b981',
          accent: '#f59e0b',
          background: '#f8fafc'
        }
      }
    }
  }
};
```

## Deployment

### 1. Build Configuration
Update your build configuration:

```json
{
  "scripts": {
    "build": "next build",
    "start": "next start",
    "dev": "next dev",
    "lint": "next lint",
    "test": "jest",
    "test:watch": "jest --watch"
  }
}
```

### 2. Environment-Specific Configuration
Create environment-specific configuration files:

```javascript
// config/marketing.js
export const marketingConfig = {
  development: {
    apiBaseUrl: 'http://localhost:3000/api',
    enableAnalytics: false,
    enableScheduling: false
  },
  production: {
    apiBaseUrl: process.env.NEXT_PUBLIC_MARKETING_API_URL,
    enableAnalytics: true,
    enableScheduling: true
  }
};
```

### 3. CI/CD Integration
Add marketing module tests to your CI/CD pipeline:

```yaml
# .github/workflows/marketing-tests.yml
name: Marketing Module Tests

on: [push, pull_request]

jobs:
  test-marketing:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run lint
      - run: npm run test -- --coverage
      - run: npm run build
```

## Testing

### 1. Unit Tests
Run unit tests for marketing components:

```bash
npm test -- --testPathPattern=marketing
```

### 2. Integration Tests
Test API integration:

```bash
npm run test:integration -- --testPathPattern=marketing
```

### 3. E2E Tests
Run end-to-end tests:

```bash
npm run test:e2e -- --spec=marketing
```

## Monitoring and Maintenance

### 1. Performance Monitoring
Set up performance monitoring for marketing features:

```javascript
// performance-monitoring.js
export const trackMarketingPerformance = {
  bannerLoadTime: () => {
    // Track banner loading performance
  },
  seoRenderTime: () => {
    // Track SEO component rendering
  },
  socialMediaApiCalls: () => {
    // Track API call performance
  }
};
```

### 2. Error Tracking
Configure error tracking for marketing components:

```javascript
// error-tracking.js
export const trackMarketingErrors = {
  bannerErrors: (error) => {
    // Track banner-related errors
  },
  seoErrors: (error) => {
    // Track SEO-related errors
  },
  socialMediaErrors: (error) => {
    // Track social media errors
  }
};
```

### 3. Analytics Integration
Integrate with your analytics platform:

```javascript
// analytics.js
export const trackMarketingEvents = {
  bannerView: (bannerId) => {
    // Track banner views
  },
  bannerClick: (bannerId) => {
    // Track banner clicks
  },
  seoChange: (pageType) => {
    // Track SEO changes
  },
  socialMediaPost: (platform) => {
    // Track social media posts
  }
};
```

## Troubleshooting

### Common Issues

1. **Permission Errors**
   - Ensure PermissionProvider is properly configured
   - Check that user roles have the required permissions
   - Verify permission API is working correctly

2. **API Connection Issues**
   - Check API endpoints are accessible
   - Verify CORS configuration
   - Ensure authentication is working

3. **Performance Issues**
   - Check for unnecessary re-renders
   - Verify data fetching is optimized
   - Monitor bundle size

4. **Validation Errors**
   - Ensure Zod schemas are correctly defined
   - Check form validation logic
   - Verify error handling

### Debug Mode
Enable debug mode for troubleshooting:

```env
NEXT_PUBLIC_DEBUG_MARKETING=true
NEXT_PUBLIC_DEBUG_PERMISSIONS=true
NEXT_PUBLIC_DEBUG_API=true
```

## Security Considerations

### 1. Input Validation
All user inputs are validated using Zod schemas with proper sanitization.

### 2. Permission Checks
Every component checks permissions before rendering sensitive content.

### 3. API Security
- All API calls use HTTPS in production
- Authentication tokens are properly managed
- Rate limiting is implemented

### 4. Data Protection
- Sensitive data is encrypted
- GDPR compliance is maintained
- Audit logs are kept for sensitive operations

## Support and Maintenance

### Regular Maintenance Tasks

1. **Weekly**
   - Review error logs
   - Check performance metrics
   - Update dependencies

2. **Monthly**
   - Review permission assignments
   - Analyze usage patterns
   - Update security configurations

3. **Quarterly**
   - Performance optimization review
   - Feature usage analysis
   - Security audit

### Support Contacts
- **Development Team**: dev-team@tripalfa.com
- **Security Team**: security@tripalfa.com
- **Product Team**: product@tripalfa.com

## Version History

### v1.0.0
- Initial marketing module implementation
- Permission management system
- Banner, SEO, and Social Media management
- Comprehensive testing suite
- Security and performance optimizations

---

For additional support or questions, please refer to the main TripAlfa documentation or contact the development team.