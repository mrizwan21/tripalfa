# User Management API Documentation

## Overview

The TripAlfa User Management API provides comprehensive user management capabilities including company management, department management, designation management, cost center management, KYC operations, and Virtual Card operations. The system includes robust permission management with role-based access control and comprehensive audit logging.

## Base URL

```
https://api.tripalfa.com/api
```

## Authentication

All API endpoints require authentication via JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

## Permission System

### Permission Categories
- **COMPANY**: Company management operations
- **DEPARTMENT**: Department management operations  
- **DESIGNATION**: Designation management operations
- **COST_CENTER**: Cost center management operations
- **KYC**: Know Your Customer operations
- **VIRTUAL_CARD**: Virtual card operations

### Permission Actions
- **VIEW**: Read-only access
- **CREATE**: Create new resources
- **UPDATE**: Modify existing resources
- **DELETE**: Remove resources
- **MANAGE**: Full management access
- **EXPORT**: Export data
- **VERIFY**: Verify documents/requests
- **AUTHORIZE**: Approve transactions/actions
- **UPLOAD**: Upload files/documents
- **DOWNLOAD**: Download files/documents
- **TRIGGER**: Initiate processes
- **ACTIVATE/DEACTIVATE**: Control resource state
- **BLOCK/UNBLOCK**: Security controls

### Default Roles

**SUPER_ADMIN**
- Full access to all company management features
- Can manage all roles and permissions
- Can access audit logs and system configuration

**ADMIN**
- Management and review capabilities
- Can create and manage departments, designations, cost centers
- Can review and verify KYC documents
- Can monitor virtual card transactions

**B2B**
- Operational access to company features
- Can submit KYC documents
- Can create and manage virtual cards
- Limited to own company scope

**VIEWER**
- Read-only access to company management
- Can monitor status and view reports
- Limited to viewing own company data

## Error Handling

### Error Response Format

```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "Human-readable error message",
  "details": {
    "field": "Additional error details"
  }
}
```

### Common Error Codes

| Error Code | HTTP Status | Description |
|------------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `INTERNAL_SERVER_ERROR` | 500 | Server error |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `PERMISSION_DENIED` | 403 | Access denied |
| `ROLE_NOT_FOUND` | 404 | Role does not exist |
| `USER_NOT_FOUND` | 404 | User does not exist |

## API Endpoints

### 1. Permission Management

#### GET /permissions/roles
Get all available roles and their permissions

**Required Permissions:** `admin:access`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "role": "SUPER_ADMIN",
      "permissions": [
        "company:companies:manage",
        "company:departments:manage",
        "company:kyc:documents:manage",
        "company:virtual_card:cards:manage"
      ],
      "description": "Super Admin with full access to all company management features",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ],
  "message": "Roles loaded successfully"
}
```

#### GET /permissions/role/{roleName}
Get permissions for a specific role

**Required Permissions:** `admin:access`

**Path Parameters:**
- `roleName` (string, required): The name of the role (e.g., "SUPER_ADMIN", "ADMIN")

**Response:**
```json
{
  "success": true,
  "data": {
    "role": "ADMIN",
    "permissions": [
      "company:companies:view",
      "company:companies:update",
      "company:departments:view",
      "company:departments:create",
      "company:kyc:documents:view",
      "company:kyc:documents:verify",
      "company:virtual_card:cards:view",
      "company:virtual_card:transactions:view"
    ],
    "description": "Admin with management and review capabilities",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "message": "Role permissions retrieved successfully"
}
```

#### POST /permissions/roles
Create a new role

**Required Permissions:** `super_admin:access`

**Request Body:**
```json
{
  "name": "NEW_ROLE",
  "description": "Description of the new role",
  "permissions": [
    "company:companies:view",
    "company:departments:manage"
  ],
  "isActive": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "role_123",
    "name": "NEW_ROLE",
    "description": "Description of the new role",
    "permissions": [
      "company:companies:view",
      "company:departments:manage"
    ],
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "message": "Role created successfully"
}
```

#### PUT /permissions/role/{roleId}
Update an existing role

**Required Permissions:** `super_admin:access`

**Path Parameters:**
- `roleId` (string, required): The ID of the role to update

**Request Body:**
```json
{
  "name": "UPDATED_ROLE",
  "description": "Updated role description",
  "permissions": [
    "company:companies:manage",
    "company:departments:manage"
  ],
  "isActive": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "role_123",
    "name": "UPDATED_ROLE",
    "description": "Updated role description",
    "permissions": [
      "company:companies:manage",
      "company:departments:manage"
    ],
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-02T00:00:00Z"
  },
  "message": "Role updated successfully"
}
```

#### DELETE /permissions/role/{roleId}
Delete a role

**Required Permissions:** `super_admin:access`

**Path Parameters:**
- `roleId` (string, required): The ID of the role to delete

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true
  },
  "message": "Role deleted successfully"
}
```

#### POST /permissions/validate
Validate if user has specific permissions

**Required Permissions:** `admin:access`

**Request Body:**
```json
{
  "userPermissions": ["company:companies:view", "company:departments:manage"],
  "requiredPermissions": ["company:companies:manage"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "hasAllPermissions": false,
    "missingPermissions": ["company:companies:manage"],
    "userPermissions": ["company:companies:view", "company:departments:manage"],
    "requiredPermissions": ["company:companies:manage"]
  },
  "message": "Permission validation completed"
}
```

#### GET /permissions/user/{userId}
Get user's permissions summary

**Required Permissions:** `admin:access`

**Path Parameters:**
- `userId` (string, required): The ID of the user

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "user_123",
    "userRole": "ADMIN",
    "permissions": ["company:companies:manage", "company:departments:manage"],
    "permissionCount": 2,
    "hasCompanyAccess": true,
    "capabilities": {
      "canManageCompanies": true,
      "canManageDepartments": true,
      "canManageDesignations": true,
      "canManageCostCenters": true,
      "canManageKYC": true,
      "canManageVirtualCards": true
    }
  },
  "message": "User permissions retrieved successfully"
}
```

#### GET /permissions/audit
Get permission audit logs

**Required Permissions:** `super_admin:access`

**Query Parameters:**
- `limit` (number, optional): Maximum number of logs to return (default: 100)
- `offset` (number, optional): Number of logs to skip (default: 0)
- `startDate` (string, optional): Start date for filtering logs (ISO 8601 format)
- `endDate` (string, optional): End date for filtering logs (ISO 8601 format)

**Response:**
```json
{
  "success": true,
  "data": {
    "auditLog": [
      {
        "id": "audit_123",
        "timestamp": "2024-01-01T10:00:00Z",
        "userId": "user_123",
        "action": "PERMISSION_CHECK",
        "resource": "company:kyc:documents:view",
        "result": "GRANTED",
        "ipAddress": "192.168.1.100",
        "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
      }
    ],
    "totalEntries": 1,
    "timeRange": {
      "start": "2024-01-01T00:00:00Z",
      "end": "2024-01-01T23:59:59Z"
    }
  },
  "message": "Audit logs retrieved successfully"
}
```

#### GET /permissions/summary
Get comprehensive permission summary

**Required Permissions:** `admin:access`

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "role": "ADMIN",
      "permissions": ["company:companies:manage", "company:departments:manage"],
      "permissionCount": 2
    },
    "system": {
      "totalRoles": 4,
      "totalPermissions": 50,
      "permissionCategories": ["COMPANY", "DEPARTMENT", "DESIGNATION", "COST_CENTER", "KYC", "VIRTUAL_CARD"],
      "permissionActions": ["VIEW", "CREATE", "UPDATE", "DELETE", "MANAGE", "EXPORT", "VERIFY", "AUTHORIZE"],
      "permissionResources": ["COMPANY", "DEPARTMENT", "DESIGNATION", "COST_CENTER", "KYC_DOCUMENT", "VIRTUAL_CARD"]
    },
    "capabilities": {
      "canManageCompanies": true,
      "canManageDepartments": true,
      "canManageDesignations": true,
      "canManageCostCenters": true,
      "canManageKYC": true,
      "canManageVirtualCards": true,
      "canViewReports": true,
      "canExportData": true
    }
  },
  "message": "Permission summary retrieved successfully"
}
```

### 2. Company Management

#### GET /companies
Get all companies (SUPER_ADMIN) or user's company (other roles)

**Required Permissions:** `company:companies:view`

**Query Parameters:**
- `limit` (number, optional): Maximum number of companies to return
- `offset` (number, optional): Number of companies to skip
- `search` (string, optional): Search term for company name or email

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "company_123",
      "name": "Acme Corp",
      "email": "admin@acme.com",
      "phone": "+1234567890",
      "address": "123 Main St, City, Country",
      "status": "ACTIVE",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ],
  "message": "Companies retrieved successfully"
}
```

#### POST /companies
Create a new company

**Required Permissions:** `company:companies:create`

**Request Body:**
```json
{
  "name": "New Company",
  "email": "admin@newcompany.com",
  "phone": "+1234567890",
  "address": "456 Business Ave, City, Country",
  "status": "ACTIVE"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "company_456",
    "name": "New Company",
    "email": "admin@newcompany.com",
    "phone": "+1234567890",
    "address": "456 Business Ave, City, Country",
    "status": "ACTIVE",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "message": "Company created successfully"
}
```

#### GET /companies/{companyId}
Get company details

**Required Permissions:** `company:companies:view`

**Path Parameters:**
- `companyId` (string, required): The ID of the company

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "company_123",
    "name": "Acme Corp",
    "email": "admin@acme.com",
    "phone": "+1234567890",
    "address": "123 Main St, City, Country",
    "status": "ACTIVE",
    "departments": [
      {
        "id": "dept_123",
        "name": "Engineering",
        "description": "Engineering Department",
        "status": "ACTIVE"
      }
    ],
    "designations": [
      {
        "id": "desig_123",
        "name": "Software Engineer",
        "description": "Software Engineering Role"
      }
    ],
    "costCenters": [
      {
        "id": "cc_123",
        "name": "R&D",
        "description": "Research and Development"
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "message": "Company details retrieved successfully"
}
```

#### PUT /companies/{companyId}
Update company details

**Required Permissions:** `company:companies:update`

**Path Parameters:**
- `companyId` (string, required): The ID of the company

**Request Body:**
```json
{
  "name": "Updated Company Name",
  "email": "newadmin@acme.com",
  "phone": "+0987654321",
  "address": "789 Updated Address, City, Country",
  "status": "ACTIVE"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "company_123",
    "name": "Updated Company Name",
    "email": "newadmin@acme.com",
    "phone": "+0987654321",
    "address": "789 Updated Address, City, Country",
    "status": "ACTIVE",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-02T00:00:00Z"
  },
  "message": "Company updated successfully"
}
```

#### DELETE /companies/{companyId}
Delete a company

**Required Permissions:** `company:companies:delete`

**Path Parameters:**
- `companyId` (string, required): The ID of the company

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true
  },
  "message": "Company deleted successfully"
}
```

### 3. Department Management

#### GET /companies/{companyId}/departments
Get all departments for a company

**Required Permissions:** `company:departments:view`

**Path Parameters:**
- `companyId` (string, required): The ID of the company

**Query Parameters:**
- `limit` (number, optional): Maximum number of departments to return
- `offset` (number, optional): Number of departments to skip
- `search` (string, optional): Search term for department name

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "dept_123",
      "name": "Engineering",
      "description": "Engineering Department",
      "status": "ACTIVE",
      "companyId": "company_123",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ],
  "message": "Departments retrieved successfully"
}
```

#### POST /companies/{companyId}/departments
Create a new department

**Required Permissions:** `company:departments:create`

**Path Parameters:**
- `companyId` (string, required): The ID of the company

**Request Body:**
```json
{
  "name": "Marketing",
  "description": "Marketing Department",
  "status": "ACTIVE"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "dept_456",
    "name": "Marketing",
    "description": "Marketing Department",
    "status": "ACTIVE",
    "companyId": "company_123",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "message": "Department created successfully"
}
```

#### GET /companies/{companyId}/departments/{departmentId}
Get department details

**Required Permissions:** `company:departments:view`

**Path Parameters:**
- `companyId` (string, required): The ID of the company
- `departmentId` (string, required): The ID of the department

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "dept_123",
    "name": "Engineering",
    "description": "Engineering Department",
    "status": "ACTIVE",
    "companyId": "company_123",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "message": "Department details retrieved successfully"
}
```

#### PUT /companies/{companyId}/departments/{departmentId}
Update department details

**Required Permissions:** `company:departments:update`

**Path Parameters:**
- `companyId` (string, required): The ID of the company
- `departmentId` (string, required): The ID of the department

**Request Body:**
```json
{
  "name": "Engineering & Development",
  "description": "Engineering and Development Department",
  "status": "ACTIVE"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "dept_123",
    "name": "Engineering & Development",
    "description": "Engineering and Development Department",
    "status": "ACTIVE",
    "companyId": "company_123",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-02T00:00:00Z"
  },
  "message": "Department updated successfully"
}
```

#### DELETE /companies/{companyId}/departments/{departmentId}
Delete a department

**Required Permissions:** `company:departments:delete`

**Path Parameters:**
- `companyId` (string, required): The ID of the company
- `departmentId` (string, required): The ID of the department

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true
  },
  "message": "Department deleted successfully"
}
```

### 4. Designation Management

#### GET /companies/{companyId}/designations
Get all designations for a company

**Required Permissions:** `company:designations:view`

**Path Parameters:**
- `companyId` (string, required): The ID of the company

**Query Parameters:**
- `limit` (number, optional): Maximum number of designations to return
- `offset` (number, optional): Number of designations to skip
- `search` (string, optional): Search term for designation name

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "desig_123",
      "name": "Software Engineer",
      "description": "Software Engineering Role",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ],
  "message": "Designations retrieved successfully"
}
```

#### POST /companies/{companyId}/designations
Create a new designation

**Required Permissions:** `company:designations:create`

**Path Parameters:**
- `companyId` (string, required): The ID of the company

**Request Body:**
```json
{
  "name": "Senior Software Engineer",
  "description": "Senior Software Engineering Role"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "desig_456",
    "name": "Senior Software Engineer",
    "description": "Senior Software Engineering Role",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "message": "Designation created successfully"
}
```

#### GET /companies/{companyId}/designations/{designationId}
Get designation details

**Required Permissions:** `company:designations:view`

**Path Parameters:**
- `companyId` (string, required): The ID of the company
- `designationId` (string, required): The ID of the designation

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "desig_123",
    "name": "Software Engineer",
    "description": "Software Engineering Role",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "message": "Designation details retrieved successfully"
}
```

#### PUT /companies/{companyId}/designations/{designationId}
Update designation details

**Required Permissions:** `company:designations:update`

**Path Parameters:**
- `companyId` (string, required): The ID of the company
- `designationId` (string, required): The ID of the designation

**Request Body:**
```json
{
  "name": "Lead Software Engineer",
  "description": "Lead Software Engineering Role"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "desig_123",
    "name": "Lead Software Engineer",
    "description": "Lead Software Engineering Role",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-02T00:00:00Z"
  },
  "message": "Designation updated successfully"
}
```

#### DELETE /companies/{companyId}/designations/{designationId}
Delete a designation

**Required Permissions:** `company:designations:delete`

**Path Parameters:**
- `companyId` (string, required): The ID of the company
- `designationId` (string, required): The ID of the designation

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true
  },
  "message": "Designation deleted successfully"
}
```

### 5. Cost Center Management

#### GET /companies/{companyId}/cost-centers
Get all cost centers for a company

**Required Permissions:** `company:cost_centers:view`

**Path Parameters:**
- `companyId` (string, required): The ID of the company

**Query Parameters:**
- `limit` (number, optional): Maximum number of cost centers to return
- `offset` (number, optional): Number of cost centers to skip
- `search` (string, optional): Search term for cost center name

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "cc_123",
      "name": "R&D",
      "description": "Research and Development",
      "budget": 100000,
      "currency": "USD",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ],
  "message": "Cost centers retrieved successfully"
}
```

#### POST /companies/{companyId}/cost-centers
Create a new cost center

**Required Permissions:** `company:cost_centers:create`

**Path Parameters:**
- `companyId` (string, required): The ID of the company

**Request Body:**
```json
{
  "name": "Marketing",
  "description": "Marketing Budget",
  "budget": 50000,
  "currency": "USD"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "cc_456",
    "name": "Marketing",
    "description": "Marketing Budget",
    "budget": 50000,
    "currency": "USD",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "message": "Cost center created successfully"
}
```

#### GET /companies/{companyId}/cost-centers/{costCenterId}
Get cost center details

**Required Permissions:** `company:cost_centers:view`

**Path Parameters:**
- `companyId` (string, required): The ID of the company
- `costCenterId` (string, required): The ID of the cost center

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "cc_123",
    "name": "R&D",
    "description": "Research and Development",
    "budget": 100000,
    "currency": "USD",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "message": "Cost center details retrieved successfully"
}
```

#### PUT /companies/{companyId}/cost-centers/{costCenterId}
Update cost center details

**Required Permissions:** `company:cost_centers:update`

**Path Parameters:**
- `companyId` (string, required): The ID of the company
- `costCenterId` (string, required): The ID of the cost center

**Request Body:**
```json
{
  "name": "R&D - Advanced",
  "description": "Advanced Research and Development",
  "budget": 150000,
  "currency": "USD"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "cc_123",
    "name": "R&D - Advanced",
    "description": "Advanced Research and Development",
    "budget": 150000,
    "currency": "USD",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-02T00:00:00Z"
  },
  "message": "Cost center updated successfully"
}
```

#### DELETE /companies/{companyId}/cost-centers/{costCenterId}
Delete a cost center

**Required Permissions:** `company:cost_centers:delete`

**Path Parameters:**
- `companyId` (string, required): The ID of the company
- `costCenterId` (string, required): The ID of the cost center

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true
  },
  "message": "Cost center deleted successfully"
}
```

### 6. KYC Management

#### GET /companies/{companyId}/kyc-documents
Get all KYC documents for a company

**Required Permissions:** `company:kyc:documents:view`

**Path Parameters:**
- `companyId` (string, required): The ID of the company

**Query Parameters:**
- `limit` (number, optional): Maximum number of documents to return
- `offset` (number, optional): Number of documents to skip
- `status` (string, optional): Filter by document status (PENDING, VERIFIED, REJECTED)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "kyc_123",
      "companyId": "company_123",
      "documentType": "BUSINESS_REGISTRATION",
      "documentUrl": "https://storage.example.com/kyc/business_reg.pdf",
      "status": "PENDING",
      "verifiedAt": null,
      "verifiedBy": null,
      "rejectionReason": null,
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ],
  "message": "KYC documents retrieved successfully"
}
```

#### POST /companies/{companyId}/kyc-documents
Upload a new KYC document

**Required Permissions:** `company:kyc:documents:create`

**Path Parameters:**
- `companyId` (string, required): The ID of the company

**Request Body:**
```json
{
  "documentType": "BUSINESS_REGISTRATION",
  "documentUrl": "https://storage.example.com/kyc/business_reg.pdf"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "kyc_456",
    "companyId": "company_123",
    "documentType": "BUSINESS_REGISTRATION",
    "documentUrl": "https://storage.example.com/kyc/business_reg.pdf",
    "status": "PENDING",
    "verifiedAt": null,
    "verifiedBy": null,
    "rejectionReason": null,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "message": "KYC document uploaded successfully"
}
```

#### GET /companies/{companyId}/kyc-documents/{kycId}
Get KYC document details

**Required Permissions:** `company:kyc:documents:view`

**Path Parameters:**
- `companyId` (string, required): The ID of the company
- `kycId` (string, required): The ID of the KYC document

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "kyc_123",
    "companyId": "company_123",
    "documentType": "BUSINESS_REGISTRATION",
    "documentUrl": "https://storage.example.com/kyc/business_reg.pdf",
    "status": "PENDING",
    "verifiedAt": null,
    "verifiedBy": null,
    "rejectionReason": null,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "message": "KYC document details retrieved successfully"
}
```

#### PUT /companies/{companyId}/kyc-documents/{kycId}/verify
Verify a KYC document

**Required Permissions:** `company:kyc:documents:verify`

**Path Parameters:**
- `companyId` (string, required): The ID of the company
- `kycId` (string, required): The ID of the KYC document

**Request Body:**
```json
{
  "verifiedBy": "admin_user_123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "kyc_123",
    "companyId": "company_123",
    "documentType": "BUSINESS_REGISTRATION",
    "documentUrl": "https://storage.example.com/kyc/business_reg.pdf",
    "status": "VERIFIED",
    "verifiedAt": "2024-01-02T00:00:00Z",
    "verifiedBy": "admin_user_123",
    "rejectionReason": null,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-02T00:00:00Z"
  },
  "message": "KYC document verified successfully"
}
```

#### PUT /companies/{companyId}/kyc-documents/{kycId}/reject
Reject a KYC document

**Required Permissions:** `company:kyc:documents:verify`

**Path Parameters:**
- `companyId` (string, required): The ID of the company
- `kycId` (string, required): The ID of the KYC document

**Request Body:**
```json
{
  "rejectionReason": "Document is not clear",
  "rejectedBy": "admin_user_123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "kyc_123",
    "companyId": "company_123",
    "documentType": "BUSINESS_REGISTRATION",
    "documentUrl": "https://storage.example.com/kyc/business_reg.pdf",
    "status": "REJECTED",
    "verifiedAt": null,
    "verifiedBy": null,
    "rejectionReason": "Document is not clear",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-02T00:00:00Z"
  },
  "message": "KYC document rejected successfully"
}
```

### 7. Virtual Card Management

#### GET /companies/{companyId}/virtual-cards
Get all virtual cards for a company

**Required Permissions:** `company:virtual_card:cards:view`

**Path Parameters:**
- `companyId` (string, required): The ID of the company

**Query Parameters:**
- `limit` (number, optional): Maximum number of cards to return
- `offset` (number, optional): Number of cards to skip
- `status` (string, optional): Filter by card status (ACTIVE, INACTIVE, BLOCKED)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "card_123",
      "companyId": "company_123",
      "cardNumber": "**** **** **** 1234",
      "cardholderName": "Acme Corp",
      "status": "ACTIVE",
      "currency": "USD",
      "balance": 1000.00,
      "spendingLimit": 5000.00,
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ],
  "message": "Virtual cards retrieved successfully"
}
```

#### POST /companies/{companyId}/virtual-cards
Create a new virtual card

**Required Permissions:** `company:virtual_card:cards:create`

**Path Parameters:**
- `companyId` (string, required): The ID of the company

**Request Body:**
```json
{
  "cardholderName": "Acme Corp",
  "currency": "USD",
  "spendingLimit": 5000.00
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "card_456",
    "companyId": "company_123",
    "cardNumber": "**** **** **** 5678",
    "cardholderName": "Acme Corp",
    "status": "ACTIVE",
    "currency": "USD",
    "balance": 0.00,
    "spendingLimit": 5000.00,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "message": "Virtual card created successfully"
}
```

#### GET /companies/{companyId}/virtual-cards/{cardId}
Get virtual card details

**Required Permissions:** `company:virtual_card:cards:view`

**Path Parameters:**
- `companyId` (string, required): The ID of the company
- `cardId` (string, required): The ID of the virtual card

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "card_123",
    "companyId": "company_123",
    "cardNumber": "**** **** **** 1234",
    "cardholderName": "Acme Corp",
    "status": "ACTIVE",
    "currency": "USD",
    "balance": 1000.00,
    "spendingLimit": 5000.00,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "message": "Virtual card details retrieved successfully"
}
```

#### PUT /companies/{companyId}/virtual-cards/{cardId}/activate
Activate a virtual card

**Required Permissions:** `company:virtual_card:cards:manage`

**Path Parameters:**
- `companyId` (string, required): The ID of the company
- `cardId` (string, required): The ID of the virtual card

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "card_123",
    "companyId": "company_123",
    "cardNumber": "**** **** **** 1234",
    "cardholderName": "Acme Corp",
    "status": "ACTIVE",
    "currency": "USD",
    "balance": 1000.00,
    "spendingLimit": 5000.00,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-02T00:00:00Z"
  },
  "message": "Virtual card activated successfully"
}
```

#### PUT /companies/{companyId}/virtual-cards/{cardId}/deactivate
Deactivate a virtual card

**Required Permissions:** `company:virtual_card:cards:manage`

**Path Parameters:**
- `companyId` (string, required): The ID of the company
- `cardId` (string, required): The ID of the virtual card

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "card_123",
    "companyId": "company_123",
    "cardNumber": "**** **** **** 1234",
    "cardholderName": "Acme Corp",
    "status": "INACTIVE",
    "currency": "USD",
    "balance": 1000.00,
    "spendingLimit": 5000.00,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-02T00:00:00Z"
  },
  "message": "Virtual card deactivated successfully"
}
```

#### PUT /companies/{companyId}/virtual-cards/{cardId}/block
Block a virtual card

**Required Permissions:** `company:virtual_card:cards:manage`

**Path Parameters:**
- `companyId` (string, required): The ID of the company
- `cardId` (string, required): The ID of the virtual card

**Request Body:**
```json
{
  "reason": "Card lost"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "card_123",
    "companyId": "company_123",
    "cardNumber": "**** **** **** 1234",
    "cardholderName": "Acme Corp",
    "status": "BLOCKED",
    "currency": "USD",
    "balance": 1000.00,
    "spendingLimit": 5000.00,
    "blockReason": "Card lost",
    "blockedAt": "2024-01-02T00:00:00Z",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-02T00:00:00Z"
  },
  "message": "Virtual card blocked successfully"
}
```

#### GET /companies/{companyId}/virtual-cards/{cardId}/transactions
Get virtual card transactions

**Required Permissions:** `company:virtual_card:transactions:view`

**Path Parameters:**
- `companyId` (string, required): The ID of the company
- `cardId` (string, required): The ID of the virtual card

**Query Parameters:**
- `limit` (number, optional): Maximum number of transactions to return
- `offset` (number, optional): Number of transactions to skip
- `startDate` (string, optional): Start date for filtering transactions (ISO 8601 format)
- `endDate` (string, optional): End date for filtering transactions (ISO 8601 format)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "txn_123",
      "cardId": "card_123",
      "amount": 100.00,
      "currency": "USD",
      "transactionType": "PURCHASE",
      "merchant": "Amazon",
      "status": "COMPLETED",
      "createdAt": "2024-01-01T10:00:00Z"
    }
  ],
  "message": "Virtual card transactions retrieved successfully"
}
```

## Webhook Events

### Permission Events

#### permission.permission_granted
Fired when a permission check is granted

**Event Data:**
```json
{
  "event": "permission.permission_granted",
  "data": {
    "userId": "user_123",
    "permission": "company:companies:manage",
    "resource": "company_123",
    "ipAddress": "192.168.1.100",
    "timestamp": "2024-01-01T00:00:00Z"
  }
}
```

#### permission.permission_denied
Fired when a permission check is denied

**Event Data:**
```json
{
  "event": "permission.permission_denied",
  "data": {
    "userId": "user_123",
    "permission": "company:companies:manage",
    "resource": "company_123",
    "ipAddress": "192.168.1.100",
    "timestamp": "2024-01-01T00:00:00Z"
  }
}
```

#### permission.role_created
Fired when a new role is created

**Event Data:**
```json
{
  "event": "permission.role_created",
  "data": {
    "roleId": "role_123",
    "roleName": "NEW_ROLE",
    "permissions": ["company:companies:view", "company:departments:manage"],
    "createdBy": "admin_user_123",
    "timestamp": "2024-01-01T00:00:00Z"
  }
}
```

#### permission.role_updated
Fired when a role is updated

**Event Data:**
```json
{
  "event": "permission.role_updated",
  "data": {
    "roleId": "role_123",
    "roleName": "UPDATED_ROLE",
    "oldPermissions": ["company:companies:view"],
    "newPermissions": ["company:companies:manage"],
    "updatedBy": "admin_user_123",
    "timestamp": "2024-01-01T00:00:00Z"
  }
}
```

#### permission.role_deleted
Fired when a role is deleted

**Event Data:**
```json
{
  "event": "permission.role_deleted",
  "data": {
    "roleId": "role_123",
    "roleName": "DELETED_ROLE",
    "deletedBy": "admin_user_123",
    "timestamp": "2024-01-01T00:00:00Z"
  }
}
```

### KYC Events

#### kyc.document_uploaded
Fired when a KYC document is uploaded

**Event Data:**
```json
{
  "event": "kyc.document_uploaded",
  "data": {
    "kycId": "kyc_123",
    "companyId": "company_123",
    "documentType": "BUSINESS_REGISTRATION",
    "uploadedBy": "user_123",
    "timestamp": "2024-01-01T00:00:00Z"
  }
}
```

#### kyc.document_verified
Fired when a KYC document is verified

**Event Data:**
```json
{
  "event": "kyc.document_verified",
  "data": {
    "kycId": "kyc_123",
    "companyId": "company_123",
    "verifiedBy": "admin_user_123",
    "timestamp": "2024-01-01T00:00:00Z"
  }
}
```

#### kyc.document_rejected
Fired when a KYC document is rejected

**Event Data:**
```json
{
  "event": "kyc.document_rejected",
  "data": {
    "kycId": "kyc_123",
    "companyId": "company_123",
    "rejectionReason": "Document is not clear",
    "rejectedBy": "admin_user_123",
    "timestamp": "2024-01-01T00:00:00Z"
  }
}
```

### Virtual Card Events

#### virtual_card.card_created
Fired when a virtual card is created

**Event Data:**
```json
{
  "event": "virtual_card.card_created",
  "data": {
    "cardId": "card_123",
    "companyId": "company_123",
    "cardholderName": "Acme Corp",
    "currency": "USD",
    "spendingLimit": 5000.00,
    "createdBy": "user_123",
    "timestamp": "2024-01-01T00:00:00Z"
  }
}
```

#### virtual_card.card_activated
Fired when a virtual card is activated

**Event Data:**
```json
{
  "event": "virtual_card.card_activated",
  "data": {
    "cardId": "card_123",
    "companyId": "company_123",
    "activatedBy": "user_123",
    "timestamp": "2024-01-01T00:00:00Z"
  }
}
```

#### virtual_card.card_deactivated
Fired when a virtual card is deactivated

**Event Data:**
```json
{
  "event": "virtual_card.card_deactivated",
  "data": {
    "cardId": "card_123",
    "companyId": "company_123",
    "deactivatedBy": "user_123",
    "timestamp": "2024-01-01T00:00:00Z"
  }
}
```

#### virtual_card.card_blocked
Fired when a virtual card is blocked

**Event Data:**
```json
{
  "event": "virtual_card.card_blocked",
  "data": {
    "cardId": "card_123",
    "companyId": "company_123",
    "blockReason": "Card lost",
    "blockedBy": "user_123",
    "timestamp": "2024-01-01T00:00:00Z"
  }
}
```

#### virtual_card.transaction_created
Fired when a virtual card transaction is created

**Event Data:**
```json
{
  "event": "virtual_card.transaction_created",
  "data": {
    "transactionId": "txn_123",
    "cardId": "card_123",
    "amount": 100.00,
    "currency": "USD",
    "transactionType": "PURCHASE",
    "merchant": "Amazon",
    "status": "COMPLETED",
    "timestamp": "2024-01-01T00:00:00Z"
  }
}
```

## Rate Limiting

The API implements rate limiting to ensure fair usage:

- **General API endpoints**: 100 requests per minute per user
- **Permission validation**: 200 requests per minute per user
- **File upload endpoints**: 10 requests per minute per user
- **Bulk operations**: 20 requests per minute per user

When rate limits are exceeded, the API returns:
- HTTP Status: 429 Too Many Requests
- Response: `{"error": "RATE_LIMIT_EXCEEDED", "message": "Rate limit exceeded. Please try again later."}`

## SDK Examples

### JavaScript/Node.js

```javascript
const TripAlfaAPI = require('tripalfa-api');

const client = new TripAlfaAPI({
  baseURL: 'https://api.tripalfa.com',
  apiKey: 'your-api-key',
  jwtToken: 'your-jwt-token'
});

// Get user permissions
const permissions = await client.permissions.getUserPermissions('user_123');

// Create a new company
const company = await client.companies.create({
  name: 'New Company',
  email: 'admin@newcompany.com',
  phone: '+1234567890'
});

// Upload KYC document
const kyc = await client.kyc.uploadDocument('company_123', {
  documentType: 'BUSINESS_REGISTRATION',
  documentUrl: 'https://storage.example.com/kyc/business_reg.pdf'
});

// Create virtual card
const card = await client.virtualCards.create('company_123', {
  cardholderName: 'Acme Corp',
  currency: 'USD',
  spendingLimit: 5000.00
});
```

### Python

```python
from tripalfa_api import TripAlfaClient

client = TripAlfaClient(
    base_url='https://api.tripalfa.com',
    api_key='your-api-key',
    jwt_token='your-jwt-token'
)

# Get user permissions
permissions = client.permissions.get_user_permissions('user_123')

# Create a new company
company = client.companies.create({
    'name': 'New Company',
    'email': 'admin@newcompany.com',
    'phone': '+1234567890'
})

# Upload KYC document
kyc = client.kyc.upload_document('company_123', {
    'documentType': 'BUSINESS_REGISTRATION',
    'documentUrl': 'https://storage.example.com/kyc/business_reg.pdf'
})

# Create virtual card
card = client.virtual_cards.create('company_123', {
    'cardholderName': 'Acme Corp',
    'currency': 'USD',
    'spendingLimit': 5000.00
})
```

## Support

For API support and questions:

- **Documentation**: [https://docs.tripalfa.com](https://docs.tripalfa.com)
- **Support Email**: api-support@tripalfa.com
- **Developer Forum**: [https://community.tripalfa.com](https://community.tripalfa.com)
- **Status Page**: [https://status.tripalfa.com](https://status.tripalfa.com)

## Changelog

### v1.0.0 (2024-01-01)
- Initial release of User Management API
- Complete permission management system
- Company, department, designation, and cost center management
- KYC document management and verification
- Virtual card creation and management
- Comprehensive audit logging and webhook events
- Rate limiting and security features