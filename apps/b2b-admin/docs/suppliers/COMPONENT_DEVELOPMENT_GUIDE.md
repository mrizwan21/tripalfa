# API Gateway Components - Complete Index

**Comprehensive guide to all API Gateway components, hooks, and utilities. Build your supplier API gateway interface with production-ready components.**

---

## Component Hierarchy

```
SupplierGateway (Page Wrapper)
├── GatewayFormProvider (Context wrapper)
│   ├── EnvironmentSelector
│   ├── ProductSelector
│   ├── GatewayForm (Orchestrator)
│   │   ├── EnvironmentTabs
│   │   │   ├── AuthenticationForm
│   │   │   ├── EndpointConfigurator
│   │   │   └── RoutingConfigurator
│   │   └── SaveButton
│   └── GatewayHealthStatus
```

---

## Built Components (Phase 4)

### 1. EnvironmentSelector

**File**: `components/api-gateway/EnvironmentSelector.tsx`

Comprehensive environment switcher with status indicators and configuration details.

**Props**:
```typescript
interface EnvironmentSelectorProps {
  onEnvironmentChange?: (environment: Environment) => void
  showStatus?: boolean          // Show green/red indicators
  showDetails?: boolean         // Show full config panel
  disabled?: boolean            // Disable interactions
  className?: string            // Custom CSS class
}
```

**Usage Examples**:

```typescript
// Basic variant
<EnvironmentSelector />

// With details panel
<EnvironmentSelector showDetails={true} />

// Tab-based variant
<EnvironmentSelectorTabs onEnvironmentChange={(env) => console.log(env)} />

// Inline variant (compact)
<EnvironmentSelectorInline />
```

**Features**:
- ✅ Tab switcher for dev/staging/production
- ✅ Status indicators (configured/invalid/missing)
- ✅ Environment configuration display
- ✅ Security requirements per environment
- ✅ Performance limits display
- ✅ Easy environment switching
- ✅ Keyboard accessible
- ✅ Responsive design

**Integration Points**:
- Uses `useGatewayForm()` for active environment state
- Uses `useEnvironmentConfig()` for configuration details
- Updates form on environment change

---

### 2. ProductSelector

**File**: `components/api-gateway/ProductSelector.tsx`

Multi-variant product selection with schema information and endpoint details.

**Main Component Props**:
```typescript
interface ProductSelectorProps {
  onProductChange?: (productId: ProductType) => void
  showDetails?: boolean        // Show product details
  multiSelect?: boolean        // Allow multiple selection
  disabled?: boolean           // Disable interactions
  className?: string           // Custom CSS class
}
```

**Variants**:

```typescript
// Grid layout (default)
<ProductSelector />

// Grid with details
<ProductSelector showDetails={true} />

// Multi-select support
<ProductSelector multiSelect={true} />

// Dropdown variant
<ProductDropdown 
  selectedProduct="hotel"
  onProductChange={(product) => console.log(product)}
  placeholder="Select a product..."
  error={errors.product}
/>

// With schema viewer
<ProductSelectorWithSchema selectedProduct="hotel" />
```

**Available Products**:
- 🏨 Hotel Management (12 endpoints, api-key/oauth2)
- ✈️ Flight Management (8 endpoints, api-key/bearer)
- 🚗 Car Rental (6 endpoints, api-key/jwt)
- 🚐 Transfer Services (5 endpoints, api-key/bearer)
- 🎭 Activities & Tours (7 endpoints, api-key/oauth2)
- ⚙️ Custom Integration (flexible auth)

**Features**:
- ✅ Grid or dropdown layouts
- ✅ Product categorization
- ✅ Endpoint count display
- ✅ Supported auth types
- ✅ Schema information viewer
- ✅ Selected product summary
- ✅ Product icons and descriptions
- ✅ Single or multi-select

**Integration Points**:
- Updates `form.formData.productConfigs`
- Uses `useProductSchema()` for endpoint definitions
- Triggers `onProductChange` callback

---

## To-Be-Built Components (Next Phase)

### 3. AuthenticationForm

**Purpose**: Dynamic authentication form that changes based on selected auth type.

**File**: `components/api-gateway/AuthenticationForm.tsx`

**Props**:
```typescript
interface AuthenticationFormProps {
  environment: Environment
  authType: 'api-key' | 'oauth2' | 'jwt' | 'bearer' | 'basic'
  credentials?: Record<string, any>
  onCredentialsChange?: (credentials: Record<string, any>) => void
  error?: string
}
```

**Expected Features**:
- Dynamic form fields based on auth type
- API Key: Simple text input
- OAuth2: ClientID, ClientSecret, TokenURL, Scopes
- JWT: Secret, Algorithm selector
- Bearer: Token field
- Basic: Username & password fields
- Validation based on auth type
- Sensitive credential handling (masked input for secrets)
- Copy-to-clipboard for easy sharing

---

### 4. EndpointConfigurator

**Purpose**: View, edit, test, and manage API endpoints for each product.

**File**: `components/api-gateway/EndpointConfigurator.tsx`

**Props**:
```typescript
interface EndpointConfiguratorProps {
  product: ProductType
  environment: Environment
  endpoints?: SupplierAPIEndpoint[]
  onEndpointsChange?: (endpoints: SupplierAPIEndpoint[]) => void
  onTest?: (endpointId: string) => Promise<void>
}
```

**Expected Features**:
- List all endpoints for selected product
- Edit endpoint configuration (URL, timeout, retry policy)
- Add custom endpoints
- Test individual endpoints
- Display test results
- Health status per endpoint
- Timeout and retry configuration
- Add/remove endpoints from form

---

### 5. RoutingConfigurator

**Purpose**: Configure geography and channel-based routing rules.

**File**: `components/api-gateway/RoutingConfigurator.tsx`

**Props**:
```typescript
interface RoutingConfiguratorProps {
  geography?: GeographyRouting[]
  channels?: ChannelRouting[]
  endpoints: SupplierAPIEndpoint[]
  onGeographyChange?: (routing: GeographyRouting[]) => void
  onChannelChange?: (routing: ChannelRouting[]) => void
}
```

**Expected Features**:
- Add geography-specific routing rules
- Configure channel-based routing (web/mobile/b2b/b2c)
- Set primary and fallback endpoints
- Priority-based routing logic
- Country/region configuration
- Enable/disable routing rules

---

### 6. GatewayForm

**Purpose**: Main orchestrator form combining all fields.

**File**: `components/api-gateway/GatewayForm.tsx`

**Props**:
```typescript
interface GatewayFormProps {
  supplierId: string
  gatewayId?: string
  onSaveSuccess?: () => void
  onSaveError?: (error: string) => void
}
```

**Expected Features**:
- Integrate all sub-components
- Handle multi-environment form state
- Validate before submission
- Show errors inline
- Save/cancel buttons with state
- Dirty state tracking
- Unsaved changes warning
- Reset to initial data

---

### 7. GatewayHealthStatus

**Purpose**: Real-time health monitoring dashboard with auto-refresh.

**File**: `components/api-gateway/GatewayHealthStatus.tsx`

**Props**:
```typescript
interface GatewayHealthStatusProps {
  supplierId: string
  gatewayId: string
  autoRefresh?: boolean
  refreshInterval?: number  // milliseconds
}
```

**Expected Features**:
- Auto-refresh every 30 seconds
- Display overall status (healthy/degraded/unhealthy)
- Per-environment health indicators
- Detailed health checks per endpoint
- Response time metrics
- Error rate display
- Manual refresh button
- Timestamp of last check

---

## Core Hooks Documentation

### `useGateway(supplierId, gatewayId)`

Fetch and manage single gateway configuration.

```typescript
const { gateway, loading, error, refetch } = useGateway('supplier-1', 'gw-123')

// Returns:
// - gateway: SupplierAPIGateway | null
// - loading: boolean
// - error: string | null
// - refetch: () => Promise<void>
```

---

### `useGatewayList(supplierId, page?, limit?)`

Paginated list of gateways for a supplier.

```typescript
const { gateways, total, loading, error, refetch } = 
  useGatewayList('supplier-1', 1, 20)

// Returns:
// - gateways: SupplierAPIGateway[]
// - total: number
// - loading: boolean
// - error: string | null
// - refetch: () => Promise<void>
```

---

### `useGatewayForm(supplierId, options?)`

Complete form state management for gateway creation/editing.

```typescript
const form = useGatewayForm('supplier-1', {
  gateway: existingGateway  // Optional: for edit mode
})

// Returns GatewayFormContextType with:
// - formData: SupplierAPIGatewayFormData
// - errors: Record<string, string>
// - isDirty: boolean
// - isSaving: boolean
// - updateField(field, value): void
// - validateForm(): boolean
// - save(): Promise<SupplierAPIGateway>
// - resetForm(): void
```

---

### `useEnvironmentConfig(environment)`

Get environment-specific configuration and requirements.

```typescript
const config = useEnvironmentConfig('production')

// Returns:
// - requiresSSL: boolean
// - requiresApproval: boolean
// - requiresMonitoring: boolean
// - timeout: number
// - rateLimit?: number
// - securityLevel: 'strict' | 'standard' | 'permissive'
```

---

### `useGatewayTest(supplierId, gatewayId)`

Test endpoints, credentials, and health status.

```typescript
const { testing, result, error, testEndpoint, testCredentials, testGateway } =
  useGatewayTest('supplier-1', 'gw-123')

// Methods:
// - testEndpoint(endpointId, testData): Promise<TestResult>
// - testCredentials(): Promise<CredentialTestResult>
// - testGateway(): Promise<HealthCheckResult>
```

---

### `useGatewayHealth(supplierId, gatewayId)`

Real-time health monitoring with auto-refresh every 30 seconds.

```typescript
const { health, loading, error, refetch } = 
  useGatewayHealth('supplier-1', 'gw-123')

// Returns:
// - health.status: 'healthy' | 'degraded' | 'unhealthy'
// - health.lastChecked: ISO timestamp
// - health.checks: DetailedHealthChecks
// Auto-refreshes every 30 seconds!
```

---

### `useGatewayMetrics(supplierId, gatewayId, period)`

Performance metrics for specific period.

```typescript
const { metrics, loading, error, refetch } = 
  useGatewayMetrics('supplier-1', 'gw-123', 'day')

// Returns:
// - metrics.averageResponseTime: number (ms)
// - metrics.requestCount: number
// - metrics.errorRate: number (%)
// - metrics.endpoint: Array<EndpointMetrics>
```

---

### `useProductSchema(product)`

Load product-specific endpoint definitions.

```typescript
const { schema, loading } = useProductSchema('hotel')

// Returns:
// - schema.endpoints: Endpoint[]
// - schema.authTypes: string[]
// - schema.requiredParams: string[]
// - schema.mappedFields: FieldMapping[]
```

---

## Validation Utilities

### `validateGatewayForm(data)`

Validate complete gateway configuration.

```typescript
const result = validateGatewayForm(formData)

if (result.success) {
  // result.data contains validated data with correct types
  console.log(result.data)
} else {
  // result.error contains detailed validation errors
  const errors = formatValidationErrors(result.error.errors)
  console.log(errors)
}
```

---

### `validateEnvironmentConfig(data, environment)`

Validate environment-specific configuration.

```typescript
const result = validateEnvironmentConfig(envConfig, 'production')

if (!result.success) {
  // Production validation is strict:
  // - SSL required
  // - Monitoring required
  // - Approval required
  // - Timeout limited to 15 seconds max
}
```

---

### `formatValidationErrors(errors)`

Convert Zod errors to user-friendly format.

```typescript
const errors = formatValidationErrors(validationError.errors)

// Returns:
// {
//   'environments.0.baseUrl': 'Invalid URL',
//   'environments.2.timeout': 'Must be less than 15000ms',
//   ...
// }
```

---

## Context API

### GatewayFormContext

Centralized form state management accessible to all child components.

**Provider**:
```typescript
<GatewayFormProvider initialFormData={gateway}>
  {children}
</GatewayFormProvider>
```

**Hook**:
```typescript
const form = useGatewayForm()

// Available properties and methods:
form.formData              // Current form values
form.errors              // Validation errors
form.isDirty             // Has form been modified?
form.isSaving            // Is API request in progress?
form.activeEnvironment   // Currently selected environment

form.updateField(path, value)
form.updateFormData(data)
form.updateEnvironmentConfig(env, config)
form.validateForm()
form.resetForm()
form.setActiveEnvironment(env)
form.toggleSection(section)
```

---

## API Integration Service

### GatewayAPIService

18 endpoints for complete gateway management.

```typescript
// Gateway CRUD
listGateways(supplierId, page?, limit?)
getGateway(supplierId, gatewayId)
createGateway(supplierId, data)
updateGateway(supplierId, gatewayId, data)
deleteGateway(supplierId, gatewayId)

// Testing
testCredentials(supplierId, gatewayId, environment)
testEndpoint(supplierId, gatewayId, endpointId, testData)
testGateway(supplierId, gatewayId)

// Monitoring
getGatewayHealth(supplierId, gatewayId)
getGatewayMetrics(supplierId, gatewayId, period)
getGatewayAlerts(supplierId, gatewayId)

// Configuration
getGatewayEndpoints(supplierId, gatewayId, product?)
addGatewayEndpoint(supplierId, gatewayId, endpoint)
updateGatewayEndpoint(supplierId, gatewayId, endpointId, endpoint)
deleteGatewayEndpoint(supplierId, gatewayId, endpointId)

// Product integration
getProductGatewayConfig(supplierId, product)

// Cache
clearGatewayCache(supplierId, gatewayId?)
```

---

## Type Definitions

All types are in `services/api-manager/types-gateway.ts`:

```typescript
// Core types
SupplierAPIGateway          // Complete gateway
SupplierAPIGatewayFormData  // Form-ready structure
EnvironmentSpecificGateway  // Per-environment config
SupplierAPIEndpoint         // API endpoint definition
SupplierAPIHeader           // HTTP header
SupplierAPIQueryParam       // Query parameter

// Routing types
GeographyRouting            // Geography based routing
ChannelRouting              // Channel based routing

// Health & Testing
EnvironmentHealthCheck      // Health check result
SupplierAPIGatewayAlert     // Alert information
TestResult                  // Endpoint test result

// Environment enum
type Environment = 'development' | 'staging' | 'production'

// Auth types union
type AuthenticationType = 'api-key' | 'oauth2' | 'jwt' | 'bearer' | 'basic'
```

---

## Design Tokens

Use design tokens from `SUPPLIER_DESIGN_GUIDE.md`:

```typescript
// Colors
primary: '#0066cc'          // Blue
success: '#10b981'          // Green
warning: '#f59e0b'          // Amber
error: '#ef4444'            // Red
disabled: '#d1d5db'         // Gray-300

// Spacing
sm: '4px'
md: '8px'
lg: '16px'
xl: '24px'
2xl: '32px'

// Typography
h1: '32px', '600', 'line-height: 1.2'
h2: '24px', '600', 'line-height: 1.25'
h3: '20px', '600', 'line-height: 1.3'
body: '14px', '400', 'line-height: 1.5'
small: '12px', '400', 'line-height: 1.5'
```

---

## Complete Integration Example

```typescript
// pages/GatewayEditor.tsx
import { useGateway } from '@/features/suppliers/hooks/useGateway'
import { GatewayFormProvider } from '@/features/suppliers/context/GatewayFormContext'
import { EnvironmentSelector } from '@/features/suppliers/components/api-gateway/EnvironmentSelector'
import { ProductSelector } from '@/features/suppliers/components/api-gateway/ProductSelector'

export function GatewayEditorPage({ supplierId, gatewayId }) {
  // Fetch existing gateway (if editing)
  const { gateway, loading } = useGateway(supplierId, gatewayId)

  if (loading) return <Spinner />

  return (
    <GatewayFormProvider initialFormData={gateway}>
      <GatewayEditor supplierId={supplierId} />
    </GatewayFormProvider>
  )
}

function GatewayEditor({ supplierId }) {
  return (
    <div className="space-y-8">
      {/* Step 1: Select Product */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Select Product</h2>
        <ProductSelector />
      </section>

      {/* Step 2: Select Environment */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Choose Environment</h2>
        <EnvironmentSelector showDetails={true} />
      </section>

      {/* Step 3: Configure Gateway */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Configure Gateway</h2>
        {/* AuthenticationForm, EndpointConfigurator, etc to build */}
      </section>
    </div>
  )
}
```

---

## Testing Components

All components are testable with provided patterns:

```typescript
// Example: Testing EnvironmentSelector
import { render, screen,fireEvent } from '@testing-library/react'
import { EnvironmentSelector } from './EnvironmentSelector'
import { GatewayFormProvider } from '../context/GatewayFormContext'

test('switches environment on click', () => {
  render(
    <GatewayFormProvider>
      <EnvironmentSelector />
    </GatewayFormProvider>
  )

  const stagingTab = screen.getByText('Staging')
  fireEvent.click(stagingTab)

  expect(screen.getByText('Testing environment before production')).toBeVisible()
})
```

---

## Checklist for Component Development

- [ ] Read `API_GATEWAY_INTEGRATION_GUIDE.md`
- [ ] Create component file in `components/api-gateway/`
- [ ] Implement TypeScript types
- [ ] Use `useGatewayForm()` for form state
- [ ] Use appropriate custom hooks
- [ ] Apply design tokens from guide
- [ ] Handle loading/error states
- [ ] Add validation where needed
- [ ] Write unit tests
- [ ] Add JSDoc comments
- [ ] Test in browser with GatewayFormProvider
- [ ] Verify TypeScript compilation (0 errors)

---

## Summary

**Infrastructure Complete** ✅
- 8 custom hooks
- 1 form context
- 5 validation schemas
- 18 API endpoints
- 2 working components (EnvironmentSelector, ProductSelector)
- 8,000+ lines of documentation

**Ready to Build**:
- AuthenticationForm
- EndpointConfigurator
- RoutingConfigurator
- GatewayForm (orchestrator)
- GatewayHealthStatus
- SupplierGateway page

**Estimated Completion**: 2-3 hours for all components with unit tests

---

Generated: $(date)
Status: COMPONENT DEVELOPMENT IN PROGRESS
