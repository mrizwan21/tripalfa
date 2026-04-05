# TripAlfa Authentication & Authorization Specification

## Overview

This document outlines the authentication and authorization architecture for
TripAlfa's multi-tenant platform supporting B2C consumers and B2B enterprise
customers. It includes comprehensive security features including OAuth/SSO,
role-based access control (RBAC), service-level access control, IP management,
and state management.

---

## 1. Security Features Summary

### 1.1 IP Management

- **IP Whitelist/Blacklist**: Control access by specific IP addresses or CIDR ranges
- **Geographic Blocking**: Block access from specific countries
- **VPN/Proxy/Tor Detection**: Detect and optionally block anonymizing networks
- **IP Audit Logging**: Track all IP access attempts

### 1.2 State Management

- **Session State**: Track active sessions with risk scoring
- **Device Management**: Device fingerprinting, trust levels, and verification
- **Login Audit**: Comprehensive logging of all authentication events
- **Concurrent Session Control**: Limit simultaneous sessions per user

### 1.3 Service Access Control

- **Service-level Permissions**: Control which backend services each role can access
- **Rate Limiting**: Per-service, per-role rate limits
- **Quotas**: Daily request quotas per role/service
- **Endpoint-level Control**: Granular control over specific API endpoints

### 1.4 Security Policies

- **Password Policies**: Length, complexity, expiry requirements
- **Session Policies**: Timeout, concurrent device limits
- **MFA Requirements**: Enforce MFA for specific roles
- **Risk-based Authentication**: Dynamic risk scoring and verification

---

## 2. User Types & Authentication Methods

### 1.1 B2C Users (Consumers)

- **Authentication Methods**:
  - Email/Password (traditional)
  - OAuth 2.0 / Social Login (Google, Apple, Facebook)
  - Magic Link (optional future enhancement)

### 1.2 B2B Admin Users

- **Authentication Methods**:
  - SSO (SAML 2.0 / OIDC)
  - Email/Password with MFA
  - SSO Providers: Okta, Azure AD, Google Workspace

### 1.3 User Type Detection

```typescript
enum UserType {
  B2C = 'B2C',
  B2B_ADMIN = 'B2B_ADMIN',
  B2B_EMPLOYEE = 'B2B_EMPLOYEE',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

enum AuthProvider {
  EMAIL = 'email',
  GOOGLE = 'google',
  APPLE = 'apple',
  FACEBOOK = 'facebook',
  SAML = 'saml',
  OIDC = 'oidc',
}
```

---

## 2. Database Schema Extensions

### 2.1 Updated User Model

```prisma
// schema.core.prisma additions

model user {
  id              String    @id @default(cuid())
  externalId      String?   // OAuth provider user ID
  email           String    @unique
  phoneNumber     String?
  firstName       String?
  lastName       String?
  avatarUrl       String?
  companyId       String?

  // Authentication fields
  passwordHash    String?
  userType        UserType  @default(B2C)
  authProvider    AuthProvider @default(EMAIL)
  isEmailVerified Boolean   @default(false)
  isActive        Boolean   @default(true)
  lastLoginAt     DateTime? @db.Timestamptz(6)
  failedLoginAttempts Int   @default(0)
  lockedUntil     DateTime? @db.Timestamptz(6)

  // MFA
  mfaEnabled      Boolean   @default(false)
  mfaSecret       String?
  backupCodes     String[]  // Hashed backup codes

  // SSO fields
  samlIdpId       String?   // SAML Identity Provider ID
  oidcSubject     String?   // OIDC subject claim
  idpTenantId     String?   // For B2B multi-tenant SSO

  // Timestamps
  createdAt       DateTime  @default(now()) @db.Timestamptz(6)
  updatedAt       DateTime  @updatedAt @db.Timestamptz(6)

  // Relations
  role            role?     @relation(fields: [roleId], references: [id])
  roleId          String?
  sessions        user_session[]
  oauthAccounts   oauth_account[]
  company         company?   @relation(fields: [companyId], references: [id])

  @@index([email])
  @@index([companyId])
  @@index([userType])
  @@index([authProvider])
  @@map("user")
}
```

### 2.2 OAuth Account Model (for Social Login)

```prisma
model oauth_account {
  id            String    @id @default(cuid())
  userId        String
  provider      String    // "google", "apple", "facebook"
  providerId    String    // Provider's user ID
  accessToken   String?
  refreshToken  String?
  expiresAt     DateTime? @db.Timestamptz(6)
  scope         String?   // OAuth scopes granted
  createdAt     DateTime  @default(now()) @db.Timestamptz(6)
  updatedAt     DateTime  @updatedAt @db.Timestamptz(6)

  user          user      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerId])
  @@index([userId])
  @@map("oauth_account")
}
```

### 2.3 Role & Permission Models

```prisma
model role {
  id            String    @id @default(cuid())
  name          String    @unique
  description   String?
  userType      UserType  // B2C, B2B_ADMIN, SUPER_ADMIN
  isSystem      Boolean   @default(false) // System roles cannot be deleted
  isActive      Boolean   @default(true)
  priority      Int       @default(0) // Higher = more privileged
  createdAt     DateTime  @default(now()) @db.Timestamptz(6)
  updatedAt     DateTime  @updatedAt @db.Timestamptz(6)

  permissions   permission[]
  users         user[]

  @@map("role")
}

model permission {
  id            String    @id @default(cuid())
  name          String    @unique
  description   String?
  category      String    // "booking", "finance", "user_management", etc.
  resource      String    // "bookings", "users", "reports", etc.
  action        String    // "create", "read", "update", "delete"
  conditions    Json?     // Conditional permissions (e.g., own_only)

  roles         role[]    @relation("role_permissions")

  @@unique([resource, action])
  @@index([category])
  @@index([resource])
  @@map("permission")
}

// Role-Permission junction table (explicit many-to-many)
model role_permission {
  roleId       String
  permissionId String
  grantedAt    DateTime  @default(now()) @db.Timestamptz(6)

  role         role       @relation(fields: [roleId], references: [id], onDelete: Cascade)
  permission   permission @relation(fields: [permissionId], references: [id], onDelete: Cascade)

  @@id([roleId, permissionId])
  @@map("role_permission")
}
```

### 2.4 SSO / Identity Provider Model

```prisma
model identity_provider {
  id                  String    @id @default(cuid())
  name                String    // "Company Okta", "Azure AD", etc.
  type                String    // "saml", "oidc"
  tenantId            String?   // For multi-tenant SSO (companyId)

  // SAML Config
  samlEntryPoint      String?   // SSO URL
  samlIssuer          String?   // Entity ID
  samlCertificate     String?   // IdP certificate

  // OIDC Config
  oidcIssuer          String?   // Authorization endpoint
  oidcClientId        String?
  oidcClientSecret    String?   // Encrypted
  oidcScopes          String?   // Space-separated scopes

  // General
  isActive            Boolean   @default(true)
  isDefault           Boolean   @default(false) // Default IdP for tenant
  createdAt           DateTime  @default(now()) @db.Timestamptz(6)
  updatedAt           DateTime  @updatedAt @db.Timestamptz(6)

  company             company?  @relation(fields: [tenantId], references: [id])

  @@unique([type, tenantId])
  @@map("identity_provider")
}
```

### 2.5 Session Management

```prisma
model user_session {
  id              String    @id @default(cuid())
  userId          String
  sessionToken    String    @unique
  refreshToken    String?   // For token rotation
  ipAddress       String?
  userAgent       String?
  deviceInfo      Json?     // Parsed device info
  isValid         Boolean   @default(true)
  expiresAt       DateTime  @db.Timestamptz(6)
  lastActivityAt  DateTime  @default(now()) @db.Timestamptz(6)
  createdAt       DateTime  @default(now()) @db.Timestamptz(6)

  user            user      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([sessionToken])
  @@index([expiresAt])
  @@map("user_session")
}
```

---

## 3. B2C Authentication (OAuth / Social Login)

### 3.1 Supported Providers

- **Google**: Full profile access, email verification
- **Apple**: Private email relay support
- **Facebook**: Basic profile and email

### 3.2 OAuth Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    B2C OAuth Flow                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. User clicks "Sign in with Google"                          │
│         │                                                        │
│         ▼                                                        │
│  2. Redirect to OAuth Provider                                  │
│     GET /oauth/google/authorize                                 │
│         │                                                        │
│         ▼                                                        │
│  3. User authorizes on Provider                                 │
│         │                                                        │
│         ▼                                                        │
│  4. Callback with auth code                                      │
│     GET /oauth/google/callback?code=xxx                         │
│         │                                                        │
│         ▼                                                        │
│  5. Exchange code for tokens                                    │
│     POST /oauth/google/token                                    │
│         │                                                        │
│         ▼                                                        │
│  6. Get user profile from Provider                              │
│     GET /oauth/google/userinfo                                  │
│         │                                                        │
│         ▼                                                        │
│  7. Find or create user in DB                                   │
│     - Check oauth_account by providerId                         │
│     - If exists: link to user, update profile                   │
│     - If new: create user + oauth_account                       │
│         │                                                        │
│         ▼                                                        │
│  8. Generate JWT + Refresh Token                                │
│         │                                                        │
│         ▼                                                        │
│  9. Return tokens to client                                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 3.3 Implementation Endpoints

```typescript
// OAuth Routes (user-service)
POST / auth / oauth / google / authorize; // Initiate OAuth flow
GET / auth / oauth / google / callback; // OAuth callback
POST / auth / oauth / google / token; // Exchange code for tokens

POST / auth / oauth / apple / authorize;
GET / auth / oauth / apple / callback;
POST / auth / oauth / apple / token;

POST / auth / oauth / facebook / authorize;
GET / auth / oauth / facebook / callback;
POST / auth / oauth / facebook / token;

// Token Management
POST / auth / refresh; // Refresh access token
POST / auth / revoke; // Revoke tokens
POST / auth / logout; // Logout (invalidate session)

// Traditional Auth
POST / auth / register; // Email/password registration
POST / auth / login; // Email/password login
POST / auth / forgot - password; // Password reset request
POST / auth / reset - password; // Password reset
POST / auth / verify - email; // Email verification
```

---

## 4. B2B Admin Authentication (SSO)

### 4.1 Supported SSO Protocols

| Protocol | Use Case        | Implementation                    |
| -------- | --------------- | --------------------------------- |
| SAML 2.0 | Enterprise IdPs | Okta, Azure AD, OneLogin          |
| OIDC     | Modern IdPs     | Auth0, Keycloak, Google Workspace |

### 4.2 SAML 2.0 Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    B2B SAML SSO Flow                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Admin accesses /auth/sso/login?tenant=company123           │
│         │                                                        │
│         ▼                                                        │
│  2. Lookup IdP config for tenant                                │
│     GET /auth/sso/saml/metadata?tenant=company123              │
│         │                                                        │
│         ▼                                                        │
│  3. Build AuthnRequest + Redirect to IdP                        │
│         │                                                        │
│         ▼                                                        │
│  4. User authenticates on IdP                                   │
│         │                                                        │
│         ▼                                                        │
│  5. IdP POSTs SAML Response                                    │
│     POST /auth/sso/saml/callback                                │
│         │                                                        │
│         ▼                                                        │
│  6. Validate SAML Response                                      │
│     - Verify signature                                          │
│     - Check conditions (audience, not-before, not-on-or-after)  │
│     - Extract attributes                                        │
│         │                                                        │
│         ▼                                                        │
│  7. Find or create user                                         │
│     - Match by email + tenantId                                 │
│     - Create if new                                             │
│         │                                                        │
│         ▼                                                        │
│  8. Create session + Generate JWT                               │
│         │                                                        │
│         ▼                                                        │
│  9. Redirect to app with tokens                                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 4.3 OIDC Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    B2B OIDC SSO Flow                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. User accesses /auth/sso/oidc/login?tenant=company123       │
│         │                                                        │
│         ▼                                                        │
│  2. Redirect to IdP Authorization Endpoint                      │
│     ?client_id=...&redirect_uri=...&scope=openid+profile+email │
│         │                                                        │
│         ▼                                                        │
│  3. User authenticates on IdP                                   │
│         │                                                        │
│         ▼                                                        │
│  4. Callback with authorization code                           │
│     GET /auth/sso/oidc/callback?code=xxx                        │
│         │                                                        │
│         ▼                                                        │
│  5. Exchange code for tokens                                    │
│     POST /token (grant_type=authorization_code)                │
│         │                                                        │
│         ▼                                                        │
│  6. Get user info from UserInfo endpoint                        │
│         │                                                        │
│         ▼                                                        │
│  7. Validate tokens + Extract claims                            │
│         │                                                        │
│         ▼                                                        │
│  8. Find or create user                                         │
│         │                                                        │
│         ▼                                                        │
│  9. Generate JWT + Redirect                                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 4.4 SSO Endpoints

```typescript
// SAML SSO
GET    /auth/sso/saml/login/:tenantId         // Initiate SAML login
GET    /auth/sso/saml/metadata/:tenantId      // SP metadata (for IdP setup)
POST   /auth/sso/saml/callback                 // SAML Assertion Consumer
GET    /auth/sso/saml/logout                   // SAML SLO

// OIDC SSO
GET    /auth/sso/oidc/login/:tenantId         // Initiate OIDC flow
GET    /auth/sso/oidc/callback                 // OIDC callback
GET    /auth/sso/oidc/logout                   // OIDC logout

// IdP Management (Admin)
GET    /auth/sso/providers                      // List IdPs
POST   /auth/sso/providers                      // Create IdP
PUT    /auth/sso/providers/:id                  // Update IdP
DELETE /auth/sso/providers/:id                  // Delete IdP
GET    /auth/sso/providers/:id/metadata        // Get IdP metadata

// Tenant Management
GET    /auth/sso/tenants                         // List SSO tenants
POST   /auth/sso/tenants/:companyId/enable      // Enable SSO for company
POST   /auth/sso/tenants/:companyId/disable     // Disable SSO
```

---

## 5. Access Management (RBAC)

### 5.1 Role Hierarchy

```
SUPER_ADMIN
    │
    ├── B2B_ADMIN (Company-level admin)
    │       │
    │       ├── FINANCE_MANAGER
    │       │       │
    │       │       └── VIEW_ONLY_FINANCE
    │       │
    │       ├── BOOKING_MANAGER
    │       │       │
    │       │       └── BOOKING_AGENT
    │       │
    │       └── USER_MANAGER
    │               │
    │               └── HR_ADMIN
    │
    └── B2C_USER
            │
            ├── PREMIUM_USER
            │
            └── STANDARD_USER
```

### 5.2 Default Roles

```typescript
const DEFAULT_ROLES = [
  // B2C Roles
  {
    name: 'B2C_USER',
    userType: 'B2C',
    description: 'Standard B2C customer',
    permissions: [
      'booking:read:own',
      'booking:create:own',
      'booking:update:own',
      'booking:cancel:own',
      'wallet:read:own',
      'profile:read:own',
      'profile:update:own',
    ],
  },
  {
    name: 'PREMIUM_USER',
    userType: 'B2C',
    description: 'Premium B2C customer',
    permissions: [
      'booking:read:own',
      'booking:create:own',
      'booking:update:own',
      'booking:cancel:own',
      'wallet:read:own',
      'wallet:topup:own',
      'profile:read:own',
      'profile:update:own',
      'booking:read:all', // View all bookings in family
      'booking:manage:family',
    ],
  },

  // B2B Admin Roles
  {
    name: 'SUPER_ADMIN',
    userType: 'SUPER_ADMIN',
    description: 'System super administrator',
    permissions: ['*'], // All permissions
  },
  {
    name: 'B2B_ADMIN',
    userType: 'B2B_ADMIN',
    description: 'Company administrator',
    permissions: [
      'company:read:own',
      'company:update:own',
      'user:read:own',
      'user:create:own',
      'user:update:own',
      'user:delete:own',
      'role:read:own',
      'booking:read:own',
      'booking:read:all',
      'booking:create:own',
      'booking:update:own',
      'booking:approve:own',
      'finance:read:own',
      'finance:read:all',
      'supplier:read:own',
      'supplier:create:own',
      'supplier:update:own',
    ],
  },
  {
    name: 'FINANCE_MANAGER',
    userType: 'B2B_ADMIN',
    description: 'Finance team member',
    permissions: [
      'finance:read:own',
      'finance:read:all',
      'finance:approve:own',
      'booking:read:own',
      'booking:read:all',
      'report:read:own',
    ],
  },
  {
    name: 'BOOKING_MANAGER',
    userType: 'B2B_ADMIN',
    description: 'Manages bookings',
    permissions: [
      'booking:read:own',
      'booking:read:all',
      'booking:create:own',
      'booking:update:own',
      'booking:approve:own',
      'booking:cancel:own',
    ],
  },
];
```

---

## 6. Permission Management

### 6.1 Permission Structure

```typescript
interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
  resource: string;
  action: string;
  conditions?: PermissionCondition[];
}

interface PermissionCondition {
  field: string;
  operator: 'eq' | 'ne' | 'in' | 'nin' | 'owns';
  value: any;
}

// Example: "booking:read:own"
// - resource: "booking"
// - action: "read"
// - conditions: [{ field: "userId", operator: "eq", value: "${user.id}" }]

// Example: "booking:read:all"
// - resource: "booking"
// - action: "read"
// - conditions: [] (no restriction)
```

### 6.2 Permission Categories

```typescript
const PERMISSION_CATEGORIES = {
  BOOKING: 'booking',
  FINANCE: 'finance',
  USER_MANAGEMENT: 'user_management',
  COMPANY: 'company',
  SUPPLIER: 'supplier',
  REPORT: 'report',
  SYSTEM: 'system',
  PROFILE: 'profile',
  WALLET: 'wallet',
};
```

### 6.3 Permission Endpoints

```typescript
// Permission Management
GET    /auth/permissions                    // List all permissions
GET    /auth/permissions/:id                // Get permission details
POST   /auth/permissions                    // Create permission
PUT    /auth/permissions/:id                // Update permission
DELETE /auth/permissions/:id                // Delete permission

// Role Management
GET    /auth/roles                          // List roles
GET    /auth/roles/:id                      // Get role with permissions
POST   /auth/roles                          // Create role
PUT    /auth/roles/:id                      // Update role
DELETE /auth/roles/:id                      // Delete role (non-system only)

POST   /auth/roles/:id/permissions         // Add permissions to role
DELETE /auth/roles/:id/permissions/:permId  // Remove permission from role

// User Role Assignment
GET    /auth/users/:id/role                // Get user's role
PUT    /auth/users/:id/role                 // Assign role to user
DELETE /auth/users/:id/role                 // Remove role from user

// Permission Check (for debugging)
POST   /auth/permissions/check             // Check if user has permission
GET    /auth/users/:id/permissions          // Get user's effective permissions
```

---

## 7. JWT Token Structure

### 7.1 Access Token

```typescript
interface AccessToken {
  sub: string; // User ID
  email: string;
  userType: UserType;
  role: string;
  roleId: string;
  companyId?: string;
  permissions: string[];
  iat: number;
  exp: number;
  jti: string; // Token ID (for revocation)
}
```

### 7.2 Refresh Token

```typescript
interface RefreshToken {
  sub: string; // User ID
  type: 'refresh';
  iat: number;
  exp: number;
  jti: string; // Token ID
  version: number; // For token rotation
}
```

### 7.3 Token Configuration

```typescript
const TOKEN_CONFIG = {
  accessToken: {
    expiresIn: '15m', // 15 minutes
    issuer: 'tripalfa',
    audience: 'tripalfa-api',
  },
  refreshToken: {
    expiresIn: '7d', // 7 days
    rotateOnUse: true, // Issue new refresh token on use
    maxLifetime: '30d', // Max lifetime before re-login required
  },
  sessionToken: {
    expiresIn: '24h', // 24 hours for web
    expiresInMobile: '30d', // 30 days for mobile
  },
};
```

---

## 8. Security Features

### 8.1 Password Security

- **Algorithm**: Argon2id (preferred) or bcrypt
- **Requirements**: Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special
- **Rate Limiting**: 5 attempts per 15 minutes, then lock for 15 minutes

### 8.2 MFA (Multi-Factor Authentication)

- **Methods**: TOTP (Authenticator apps), Backup codes
- **Required for**: B2B_ADMIN role and above

### 8.3 Session Security

- **Token Rotation**: Refresh tokens rotate on use
- **Device Tracking**: Store device fingerprint
- **Concurrent Sessions**: Configurable (default: 3 max)
- **Idle Timeout**: 30 minutes of inactivity

### 8.4 SSO Security

- **SP Certificate**: X.509 certificate for signing/encryption
- **IdP Certificate**: Stored encrypted, validated on each response
- **Assertion Consumer Service URL**: Validated against registered URLs
- **Single Logout (SLO)**: Support for IdP-initiated logout

---

## 9. Integration with Existing Architecture

### 9.1 Service Integration

```
┌─────────────────────────────────────────────────────────────────┐
│                      API Gateway / Auth Service                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  user-service │  │b2b-admin-svc│  │booking-svc  │          │
│  │  (B2C Auth)  │  │  (SSO Auth)  │  │ (Authz)     │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                  │                  │                  │
│         └──────────────────┼──────────────────┘                  │
│                            │                                     │
│                   ┌────────▼────────┐                          │
│                   │ shared-database │                          │
│                   │   (tripalfa_core)│                          │
│                   └─────────────────┘                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 9.2 Middleware Integration

```typescript
// In each service, use shared auth middleware
import { authMiddleware, requirePermission } from '@tripalfa/auth';

// Example: Protect booking routes
router.get('/bookings', authMiddleware, requirePermission('booking:read:own'), getBookings);

// Example: B2B-only route
router.get(
  '/reports',
  authMiddleware,
  requirePermission('report:read:own'),
  requireUserType('B2B_ADMIN', 'SUPER_ADMIN'),
  getReports
);
```

---

## 10. Environment Variables

```bash
# JWT
JWT_SECRET=your-jwt-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
JWT_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# OAuth - Google
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=

# OAuth - Apple
APPLE_CLIENT_ID=
APPLE_TEAM_ID=
APPLE_KEY_ID=
APPLE_PRIVATE_KEY=
APPLE_REDIRECT_URI=

# OAuth - Facebook
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=
FACEBOOK_REDIRECT_URI=

# SSO - SAML
SAML_ENTRY_POINT=
SAML_ISSUER=tripalfa
SAML_CERT=

# SSO - OIDC
OIDC_ISSUER=
OIDC_CLIENT_ID=
OIDC_CLIENT_SECRET=
OIDC_REDIRECT_URI=

# SSO - General
SSO_SESSION_SECRET=

# Security
BCRYPT_ROUNDS=12
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION=15m
SESSION_MAX_AGE=24h

# Database (already configured)
CORE_DATABASE_URL=
```

---

## 11. Implementation Checklist

### Phase 1: Database Schema

- [ ] Update user model with auth fields
- [ ] Create oauth_account model
- [ ] Create permission model with categories
- [ ] Update role model with relations
- [ ] Create role_permission junction table
- [ ] Create identity_provider model
- [ ] Update user_session model

### Phase 2: B2C OAuth

- [ ] Implement OAuth 2.0 authorization flow
- [ ] Google OAuth provider
- [ ] Apple OAuth provider
- [ ] Facebook OAuth provider
- [ ] Token generation and refresh
- [ ] User registration via OAuth

### Phase 3: B2B SSO

- [ ] SAML 2.0 Service Provider
- [ ] OIDC Relying Party
- [ ] IdP metadata management
- [ ] SSO login flow
- [ ] Single Logout (SLO)
- [ ] Multi-tenant SSO routing

### Phase 4: RBAC

- [ ] Permission management CRUD
- [ ] Role management CRUD
- [ ] User role assignment
- [ ] Permission check middleware
- [ ] Role hierarchy enforcement

### Phase 5: Security

- [ ] Password hashing with Argon2
- [ ] MFA implementation
- [ ] Session management
- [ ] Token revocation
- [ ] Rate limiting
- [ ] Audit logging

---

## 12. File Structure

```
services/
├── auth-service/
│   ├── src/
│   │   ├── index.ts                 # Entry point
│   │   ├── database.ts              # Database connection
│   │   ├── config/                  # Configuration
│   │   │   └── index.ts
│   │   ├── routes/
│   │   │   ├── auth.routes.ts       # Authentication routes
│   │   │   ├── oauth.routes.ts      # OAuth routes
│   │   │   ├── sso.routes.ts        # SSO routes
│   │   │   ├── role.routes.ts       # RBAC routes
│   │   │   └── permission.routes.ts # Permission routes
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts   # JWT validation
│   │   │   ├── rbac.middleware.ts  # Permission checks
│   │   │   └── oauth.middleware.ts  # OAuth validation
│   │   ├── services/
│   │   │   ├── auth.service.ts      # Auth logic
│   │   │   ├── oauth.service.ts     # OAuth logic
│   │   │   ├── sso.service.ts       # SSO logic
│   │   │   ├── token.service.ts     # Token management
│   │   │   ├── role.service.ts      # Role management
│   │   │   └── permission.service.ts # Permission management
│   │   ├── strategies/
│   │   │   ├── google.strategy.ts
│   │   │   ├── apple.strategy.ts
│   │   │   ├── facebook.strategy.ts
│   │   │   ├── saml.strategy.ts
│   │   │   └── oidc.strategy.ts
│   │   ├── utils/
│   │   │   ├── crypto.utils.ts
│   │   │   └── validation.utils.ts
│   │   └── types/
│   │       └── index.ts
│   ├── package.json
│   └── tsconfig.json
│
└── existing services...
    ├── user-service/     # Extend with auth endpoints
    ├── b2b-admin-service/ # Add SSO middleware
    └── booking-service/  # Add RBAC middleware
```

---

## Summary

This specification provides:

1. **B2C OAuth/Social Login**: Complete OAuth 2.0 implementation with Google, Apple, and Facebook
2. **B2B SSO**: SAML 2.0 and OIDC support for enterprise customers
3. **Access Management**: Role-based access control with hierarchical roles
4. **Permission Management**: Fine-grained permissions with resource/action/conditions
5. **Database Integration**: Seamless extension of existing `tripalfa_core` schema
