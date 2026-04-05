# FusionAuth Backend Implementation Guide

## Overview

This document describes the backend implementation of FusionAuth integration for TripAlfa. The implementation provides a complete authentication system with user management capabilities.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │  B2B Admin       │  │  B2C Booking     │                │
│  │  Portal          │  │  Engine          │                │
│  │  (Port 5173)     │  │  (Port 5174)     │                │
│  └────────┬─────────┘  └────────┬─────────┘                │
│           │                     │                           │
│           │  FusionAuth SDK     │  FusionAuth SDK           │
│           │                     │                           │
└───────────┼─────────────────────┼───────────────────────────┘
            │                     │
            └──────────┬──────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    FUSIONAUTH                                │
│                  (Port 9011)                                 │
│                                                              │
│  • User Management                                          │
│  • OAuth 2.0 / OpenID Connect                              │
│  • JWT Signing (RS256)                                      │
│  • Role-Based Access Control                                │
│  • Session Management                                       │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │  JWT Token
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    API GATEWAY                               │
│                  (Port 3030)                                 │
│                                                              │
│  • FusionAuth JWT Validation                                │
│  • Request Routing                                          │
│  • Rate Limiting                                            │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │  Validated Request
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                  AUTH SERVICE                                │
│                  (Port 3005)                                 │
│                                                              │
│  • FusionAuth Service Integration                           │
│  • User Management Endpoints                                │
│  • OAuth2 Callback Handling                                 │
│  • Session Management                                       │
└─────────────────────────────────────────────────────────────┘
```

## Files Created

### 1. FusionAuth Service (`services/auth-service/src/services/fusionauth.service.ts`)

Core service for interacting with FusionAuth API. Provides methods for:
- User CRUD operations
- OAuth2 authentication flow
- Token validation and refresh
- Role management
- Application registration

### 2. FusionAuth Routes (`services/auth-service/src/routes/fusionauth.routes.ts`)

Authentication endpoints:
- `GET /auth/fusionauth/health` - Health check
- `GET /auth/fusionauth/login` - Get authorization URL
- `POST /auth/fusionauth/login` - Login with email/password
- `GET /auth/fusionauth/callback` - OAuth2 callback
- `POST /auth/fusionauth/exchange` - Exchange auth code for tokens
- `POST /auth/fusionauth/refresh` - Refresh access token
- `POST /auth/fusionauth/logout` - Logout user
- `GET /auth/fusionauth/userinfo` - Get user info
- `GET /auth/fusionauth/me` - Get current user

### 3. User Management Routes (`services/auth-service/src/routes/fusionauth-user.routes.ts`)

User management endpoints (admin only):
- `GET /auth/fusionauth/users` - List all users
- `GET /auth/fusionauth/users/:id` - Get user by ID
- `POST /auth/fusionauth/users` - Create user
- `PUT /auth/fusionauth/users/:id` - Update user
- `DELETE /auth/fusionauth/users/:id` - Delete user
- `POST /auth/fusionauth/users/:id/roles` - Assign role
- `DELETE /auth/fusionauth/users/:id/roles` - Remove role
- `POST /auth/fusionauth/users/:id/password` - Change password
- `GET /auth/fusionauth/users/:id/registrations` - Get registrations
- `POST /auth/fusionauth/users/:id/registrations` - Register to app

### 4. Setup Script (`scripts/fusionauth/setup-fusionauth.ts`)

Automated setup script that:
- Creates "Quick Start App" application
- Configures CORS settings
- Creates admin user (admin@example.com)
- Creates regular user (richard@example.com)
- Generates API key for backend

### 5. TypeScript Types (`services/auth-service/src/types/fusionauth.types.ts`)

Type definitions for FusionAuth SDK integration.

## Configuration

### Environment Variables

Add these to your `.env` file:

```env
# FusionAuth Configuration
FUSIONAUTH_URL=http://localhost:9011
FUSIONAUTH_API_KEY=your-api-key
FUSIONAUTH_TENANT_ID=your-tenant-id

# Application IDs
FUSIONAUTH_APP_ID=quick-start-app
FUSIONAUTH_B2B_APP_ID=b2b-admin-app
FUSIONAUTH_B2C_APP_ID=b2c-booking-app

# Client Secrets
FUSIONAUTH_B2B_CLIENT_SECRET=your-b2b-secret
FUSIONAUTH_B2C_CLIENT_SECRET=your-b2c-secret

# JWT Configuration
FUSIONAUTH_JWT_ISSUER=http://localhost:9011
FUSIONAUTH_JWT_AUDIENCE=quick-start-app

# Frontend URLs
B2B_FRONTEND_URL=http://localhost:5173
B2C_FRONTEND_URL=http://localhost:5174
```

### CORS Configuration

Configure CORS in FusionAuth properties file (`fusionauth.properties`):

```properties
http.fusionauth-cors.enabled=true
http.fusionauth-cors.allowed-origins=http://localhost:3000,http://localhost:5173,http://localhost:5174,http://localhost:9011
http.fusionauth-cors.allowed-methods=GET,POST,PUT,DELETE,OPTIONS
http.fusionauth-cors.allowed-headers=Authorization,Content-Type,X-Requested-With
```

## Usage

### 1. Start FusionAuth

```bash
# Download and install FusionAuth
cd /usr/local/fusionauth
./bin/startup.sh
```

### 2. Run Setup Script

```bash
# Set environment variable
export FUSIONAUTH_API_KEY=your-api-key

# Run setup
npx ts-node scripts/fusionauth/setup-fusionauth.ts
```

The script will:
1. Check FusionAuth health
2. Create/get tenant
3. Create JWT signing key
4. Create "Quick Start App" application
5. Configure CORS
6. Create users:
   - admin@example.com (password: Admin123!@#)
   - richard@example.com (password: Richard123!@#)
7. Generate API key
8. Print configuration summary

### 3. Start Auth Service

```bash
cd services/auth-service
npm run dev
```

### 4. Test Authentication

#### Login with Email/Password

```bash
curl -X POST http://localhost:3005/auth/fusionauth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "Admin123!@#",
    "userType": "B2B"
  }'
```

#### Get Authorization URL

```bash
curl http://localhost:3005/auth/fusionauth/login?userType=B2B
```

#### Exchange Auth Code

```bash
curl -X POST http://localhost:3005/auth/fusionauth/exchange \
  -H "Content-Type: application/json" \
  -d '{
    "code": "your-auth-code"
  }'
```

#### Refresh Token

```bash
curl -X POST http://localhost:3005/auth/fusionauth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "your-refresh-token",
    "userType": "B2B"
  }'
```

### 5. User Management (Admin Only)

#### List Users

```bash
curl http://localhost:3005/auth/fusionauth/users \
  -H "Authorization: Bearer your-admin-token"
```

#### Create User

```bash
curl -X POST http://localhost:3005/auth/fusionauth/users \
  -H "Authorization: Bearer your-admin-token" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "NewUser123!@#",
    "firstName": "New",
    "lastName": "User",
    "userType": "B2C",
    "roles": ["user"]
  }'
```

#### Update User

```bash
curl -X PUT http://localhost:3005/auth/fusionauth/users/:id \
  -H "Authorization: Bearer your-admin-token" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Updated",
    "lastName": "Name",
    "active": true
  }'
```

#### Assign Role

```bash
curl -X POST http://localhost:3005/auth/fusionauth/users/:id/roles \
  -H "Authorization: Bearer your-admin-token" \
  -H "Content-Type: application/json" \
  -d '{
    "applicationId": "quick-start-app",
    "roleName": "admin"
  }'
```

## JWT Token Structure

FusionAuth JWT tokens contain:

```json
{
  "aud": "quick-start-app",
  "exp": 1234567890,
  "iat": 1234567890,
  "iss": "http://localhost:9011",
  "sub": "user-uuid",
  "email": "user@example.com",
  "email_verified": true,
  "roles": ["user"],
  "applicationId": "quick-start-app",
  "tenantId": "tenant-uuid"
}
```

## Security Considerations

### Password Requirements

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

### Token Expiration

- Access Token: 15 minutes
- Refresh Token: 7 days
- Auth Code: 5 minutes (one-time use)

### Rate Limiting

- Login: 5 attempts per 15 minutes
- Registration: 10 attempts per hour
- General: 100 requests per 15 minutes

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message"
}
```

Common error codes:
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid credentials/token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `429` - Too Many Requests (rate limit)
- `500` - Internal Server Error

## Troubleshooting

### FusionAuth Not Accessible

```bash
# Check if FusionAuth is running
curl http://localhost:9011/api/status

# Check logs
tail -f /usr/local/fusionauth/logs/fusionauth-app.log
```

### CORS Errors

Verify CORS configuration in `fusionauth.properties` and ensure frontend URLs are in allowed origins.

### JWT Validation Failed

1. Check JWKS endpoint: `curl http://localhost:9011/.well-known/jwks.json`
2. Verify JWT issuer matches FusionAuth URL
3. Verify JWT audience matches application ID

### User Creation Failed

1. Check email format is valid
2. Check password meets requirements
3. Verify FusionAuth API key is correct
4. Check user doesn't already exist

## Next Steps

1. **Install FusionAuth**:
   - Follow instructions in `scripts/fusionauth/README.md`

2. **Run Setup Script**:
   - Configure environment variables
   - Run `npx ts-node scripts/fusionauth/setup-fusionauth.ts`

3. **Update Backend**:
   - Update API Gateway to validate FusionAuth JWTs
   - Update service integrations

4. **Update Frontend**:
   - Install FusionAuth SDK
   - Update authentication flows
   - Test login/logout

5. **Integration Testing**:
   - Test all authentication flows
   - Test role-based access control
   - Test token refresh

## Support

For issues or questions:
- Check FusionAuth documentation: https://fusionauth.io/docs/
- Review troubleshooting section
- Check server logs
- Contact DevOps team