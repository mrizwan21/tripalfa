# Marketing Module API Integration Guide

## Overview

This guide provides comprehensive instructions for integrating the marketing module with backend APIs and external services.

## API Architecture

### RESTful API Design
The marketing module follows RESTful API principles with the following endpoints:

```
GET    /api/marketing/banners          # List banners
POST   /api/marketing/banners          # Create banner
GET    /api/marketing/banners/:id      # Get banner by ID
PUT    /api/marketing/banners/:id      # Update banner
DELETE /api/marketing/banners/:id      # Delete banner
PATCH  /api/marketing/banners/:id/status # Update banner status

GET    /api/marketing/seo              # Get SEO settings
PUT    /api/marketing/seo              # Update SEO settings
GET    /api/marketing/seo/:pageType    # Get SEO settings by page type

GET    /api/marketing/social-media     # List social media platforms
PUT    /api/marketing/social-media/:platform # Update platform settings
POST   /api/marketing/social-media/:platform/posts # Create post
GET    /api/marketing/social-media/:platform/analytics # Get analytics

GET    /api/permissions/marketing      # Get marketing permissions
POST   /api/permissions/marketing      # Update permissions
```

## Backend Implementation Examples

### 1. Express.js Backend

```javascript
// server/routes/marketing/banners.js
const express = require('express');
const router = express.Router();
const { Banner } = require('../../models');
const { authenticate, authorize } = require('../../middleware/auth');

// Get all banners with pagination
router.get('/', authenticate, authorize('marketing:banner:banner_management:view'), async (req, res) => {
  try {
    const { page = 1, limit = 10, status, position } = req.query;
    const offset = (page - 1) * limit;
    
    const where = {};
    if (status) where.status = status;
    if (position) where.position = position;
    
    const banners = await Banner.findAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [['priority', 'DESC'], ['createdAt', 'DESC']]
    });
    
    const total = await Banner.count({ where });
    
    res.json({
      data: banners,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create banner
router.post('/', authenticate, authorize('marketing:banner:banner_management:create'), async (req, res) => {
  try {
    const bannerData = req.body;
    
    // Validate data
    const validation = validateBannerData(bannerData);
    if (!validation.isValid) {
      return res.status(400).json({ errors: validation.errors });
    }
    
    const banner = await Banner.create(bannerData);
    res.status(201).json(banner);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

### 2. Database Models

```javascript
// server/models/Banner.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Banner = sequelize.define('Banner', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      len: [5, 100],
      is: /^[a-zA-Z0-9\s\-_&]+$/
    }
  },
  status: {
    type: DataTypes.ENUM('active', 'scheduled', 'ended', 'draft'),
    defaultValue: 'draft'
  },
  position: {
    type: DataTypes.ENUM('home_hero', 'sidebar', 'footer', 'popup'),
    allowNull: false
  },
  imageUrl: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      isUrl: true,
      isImage: function(value) {
        const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
        if (!validExtensions.some(ext => value.toLowerCase().endsWith(ext))) {
          throw new Error('Invalid image file format');
        }
      }
    }
  },
  targetUrl: {
    type: DataTypes.TEXT,
    validate: {
      isUrl: true
    }
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: false,
    validate: {
      isAfterStartDate(value) {
        if (value <= this.startDate) {
          throw new Error('End date must be after start date');
        }
      }
    }
  },
  altText: {
    type: DataTypes.STRING(200),
    validate: {
      len: [0, 200]
    }
  },
  priority: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    validate: {
      min: 1,
      max: 100
    }
  }
}, {
  timestamps: true,
  tableName: 'banners'
});

module.exports = Banner;
```

### 3. Permission Middleware

```javascript
// server/middleware/auth.js
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid token.' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token.' });
  }
};

const authorize = (permission) => {
  return async (req, res, next) => {
    try {
      const userPermissions = await getUserPermissions(req.user.id);
      
      if (!userPermissions.includes(permission)) {
        return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
      }
      
      next();
    } catch (error) {
      res.status(500).json({ error: 'Permission check failed.' });
    }
  };
};

const getUserPermissions = async (userId) => {
  // Implementation depends on your permission system
  // This could query a permissions table or role-based system
  const user = await User.findByPk(userId, {
    include: [{
      model: Role,
      include: [Permission]
    }]
  });
  
  return user.roles.flatMap(role => role.permissions.map(p => p.code));
};

module.exports = { authenticate, authorize };
```

## Frontend API Integration

### 1. API Service Layer

```typescript
// apps/b2b-admin/src/services/marketingApi.ts
import { Banner, SEOSettings, SocialMediaPlatform } from '@/types/marketing';
import { API_BASE_URL } from '@/config/api';

export class MarketingApiService {
  private static getHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    };
  }

  // Banner Management
  static async getBanners(params?: {
    page?: number;
    limit?: number;
    status?: string;
    position?: string;
  }): Promise<{ data: Banner[]; pagination: any }> {
    const response = await fetch(`${API_BASE_URL}/marketing/banners?${new URLSearchParams(params as any)}`, {
      headers: this.getHeaders()
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch banners');
    }
    
    return response.json();
  }

  static async createBanner(banner: Omit<Banner, 'id' | 'createdAt' | 'updatedAt'>): Promise<Banner> {
    const response = await fetch(`${API_BASE_URL}/marketing/banners`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(banner)
    });
    
    if (!response.ok) {
      throw new Error('Failed to create banner');
    }
    
    return response.json();
  }

  static async updateBanner(id: number, banner: Partial<Banner>): Promise<Banner> {
    const response = await fetch(`${API_BASE_URL}/marketing/banners/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(banner)
    });
    
    if (!response.ok) {
      throw new Error('Failed to update banner');
    }
    
    return response.json();
  }

  static async deleteBanner(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/marketing/banners/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete banner');
    }
  }

  // SEO Management
  static async getSEOSettings(): Promise<SEOSettings[]> {
    const response = await fetch(`${API_BASE_URL}/marketing/seo`, {
      headers: this.getHeaders()
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch SEO settings');
    }
    
    return response.json();
  }

  static async updateSEOSettings(settings: Partial<SEOSettings>): Promise<SEOSettings> {
    const response = await fetch(`${API_BASE_URL}/marketing/seo`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(settings)
    });
    
    if (!response.ok) {
      throw new Error('Failed to update SEO settings');
    }
    
    return response.json();
  }

  // Social Media Management
  static async getSocialMediaPlatforms(): Promise<SocialMediaPlatform[]> {
    const response = await fetch(`${API_BASE_URL}/marketing/social-media`, {
      headers: this.getHeaders()
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch social media platforms');
    }
    
    return response.json();
  }

  static async updateSocialMediaPlatform(
    platform: string, 
    settings: Partial<SocialMediaPlatform>
  ): Promise<SocialMediaPlatform> {
    const response = await fetch(`${API_BASE_URL}/marketing/social-media/${platform}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(settings)
    });
    
    if (!response.ok) {
      throw new Error('Failed to update social media platform');
    }
    
    return response.json();
  }
}
```

### 2. TanStack Query Integration

```typescript
// apps/b2b-admin/src/hooks/useMarketingData.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MarketingApiService } from '@/services/marketingApi';

export const useBanners = (params?: any) => {
  return useQuery({
    queryKey: ['banners', params],
    queryFn: () => MarketingApiService.getBanners(params),
    enabled: !!params?.enabled
  });
};

export const useCreateBanner = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: MarketingApiService.createBanner,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banners'] });
    }
  });
};

export const useUpdateBanner = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, ...data }: { id: number; data: any }) => 
      MarketingApiService.updateBanner(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banners'] });
    }
  });
};

export const useDeleteBanner = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: MarketingApiService.deleteBanner,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banners'] });
    }
  });
};
```

## External Service Integration

### 1. Social Media API Integration

```typescript
// apps/b2b-admin/src/services/socialMediaApi.ts
export class SocialMediaApiService {
  // Twitter API Integration
  static async postToTwitter(content: string, imageUrl?: string): Promise<any> {
    const response = await fetch('https://api.twitter.com/2/tweets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.TWITTER_BEARER_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: content
      })
    });
    
    return response.json();
  }

  // Facebook API Integration
  static async postToFacebook(pageId: string, content: string, imageUrl?: string): Promise<any> {
    const response = await fetch(`https://graph.facebook.com/v18.0/${pageId}/feed`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        message: content,
        access_token: process.env.FACEBOOK_ACCESS_TOKEN!
      })
    });
    
    return response.json();
  }

  // Instagram API Integration
  static async postToInstagram(content: string, imageUrl: string): Promise<any> {
    // Implementation for Instagram API
  }

  // LinkedIn API Integration
  static async postToLinkedIn(content: string, imageUrl?: string): Promise<any> {
    const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.LINKEDIN_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        author: `urn:li:person:${process.env.LINKEDIN_PERSON_URN}`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: content
            },
            shareMediaCategory: 'NONE'
          }
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
        }
      })
    });
    
    return response.json();
  }
}
```

### 2. Image Upload Service

```typescript
// apps/b2b-admin/src/services/imageUploadService.ts
export class ImageUploadService {
  static async uploadImage(file: File, folder: string = 'marketing'): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);
    formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_PRESET!);

    const response = await fetch(process.env.NEXT_PUBLIC_CLOUDINARY_URL!, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error('Image upload failed');
    }

    const result = await response.json();
    return result.secure_url;
  }

  static async deleteImage(publicId: string): Promise<void> {
    const response = await fetch('/api/upload/delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ publicId })
    });

    if (!response.ok) {
      throw new Error('Image deletion failed');
    }
  }
}
```

## Error Handling & Monitoring

### 1. API Error Handling

```typescript
// apps/b2b-admin/src/services/apiErrorHandler.ts
export class ApiErrorHandler {
  static handle(error: any): string {
    if (error.response?.status === 401) {
      // Handle authentication errors
      localStorage.removeItem('token');
      window.location.href = '/login';
      return 'Authentication failed. Please log in again.';
    }
    
    if (error.response?.status === 403) {
      return 'You do not have permission to perform this action.';
    }
    
    if (error.response?.status === 422) {
      const errors = error.response.data.errors;
      return Object.values(errors).flat().join(', ');
    }
    
    if (error.response?.status >= 500) {
      return 'Server error. Please try again later.';
    }
    
    return error.message || 'An unexpected error occurred.';
  }
}
```

### 2. API Monitoring

```typescript
// apps/b2b-admin/src/services/apiMonitoring.ts
export class ApiMonitoring {
  static trackApiCall(endpoint: string, method: string, duration: number, success: boolean) {
    // Send metrics to monitoring service
    console.log(`API Call: ${method} ${endpoint} - ${duration}ms - ${success ? 'SUCCESS' : 'FAILED'}`);
    
    // Example: Send to analytics service
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'api_call', {
        event_category: 'API',
        event_label: `${method} ${endpoint}`,
        value: duration,
        custom_map: { success }
      });
    }
  }
}
```

## Security Considerations

### 1. CORS Configuration

```javascript
// server/config/cors.js
const cors = require('cors');

const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

module.exports = cors(corsOptions);
```

### 2. Rate Limiting

```javascript
// server/middleware/rateLimit.js
const rateLimit = require('express-rate-limit');

const createRateLimit = (windowMs: number, max: number, message: string) => {
  return rateLimit({
    windowMs,
    max,
    message: { error: message },
    standardHeaders: true,
    legacyHeaders: false
  });
};

// Marketing-specific rate limits
const bannerRateLimit = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  100, // limit each IP to 100 requests per windowMs
  'Too many banner requests, please try again later.'
);

const seoRateLimit = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  50, // limit each IP to 50 requests per windowMs
  'Too many SEO requests, please try again later.'
);

module.exports = { bannerRateLimit, seoRateLimit };
```

### 3. Input Validation

```javascript
// server/middleware/validation.js
const { body, validationResult } = require('express-validator');

const validateBanner = [
  body('title')
    .isLength({ min: 5, max: 100 })
    .matches(/^[a-zA-Z0-9\s\-_&]+$/)
    .withMessage('Title must be 5-100 characters and contain only letters, numbers, spaces, hyphens, underscores, and ampersands'),
  
  body('imageUrl')
    .isURL()
    .withMessage('Image URL must be valid')
    .custom((value) => {
      const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
      if (!validExtensions.some(ext => value.toLowerCase().endsWith(ext))) {
        throw new Error('Invalid image file format');
      }
      return true;
    }),
  
  body('status')
    .isIn(['active', 'scheduled', 'ended', 'draft'])
    .withMessage('Status must be one of: active, scheduled, ended, draft'),
  
  body('position')
    .isIn(['home_hero', 'sidebar', 'footer', 'popup'])
    .withMessage('Position must be one of: home_hero, sidebar, footer, popup'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

module.exports = { validateBanner };
```

## Testing API Integration

### 1. API Testing with Jest

```javascript
// server/tests/api/marketing.test.js
const request = require('supertest');
const app = require('../../app');
const { User, Banner } = require('../../models');

describe('Marketing API', () => {
  let authToken;
  let testUser;

  beforeEach(async () => {
    testUser = await User.create({
      email: 'test@example.com',
      password: 'password123'
    });
    
    authToken = jwt.sign({ userId: testUser.id }, process.env.JWT_SECRET);
  });

  describe('GET /api/marketing/banners', () => {
    it('should return banners for authenticated user with permission', async () => {
      const response = await request(app)
        .get('/api/marketing/banners')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
    });

    it('should return 401 for unauthenticated user', async () => {
      await request(app)
        .get('/api/marketing/banners')
        .expect(401);
    });
  });

  describe('POST /api/marketing/banners', () => {
    it('should create a new banner', async () => {
      const bannerData = {
        title: 'Test Banner',
        status: 'active',
        position: 'home_hero',
        imageUrl: 'https://example.com/banner.jpg',
        targetUrl: 'https://example.com',
        startDate: '2024-01-01',
        endDate: '2024-12-31'
      };

      const response = await request(app)
        .post('/api/marketing/banners')
        .set('Authorization', `Bearer ${authToken}`)
        .send(bannerData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe(bannerData.title);
    });
  });
});
```

This comprehensive API integration guide ensures seamless communication between the frontend marketing module and backend services, with proper security, error handling, and monitoring in place.