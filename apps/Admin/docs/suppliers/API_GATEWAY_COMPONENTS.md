# API Gateway Component Specifications

Dynamic form components for configuring API gateways with product-specific endpoint mapping.

---

## Component Architecture

```text
SupplierDetail
└── API Gateway Tab
    ├── EnvironmentSelector
    │   ├── EnvironmentTabs (Development/Staging/Production)
    │   └── EnvironmentStatus
    │
    ├── GatewayForm (Dynamic based on Product + Environment)
    │   ├── ProductSelector
    │   │   └── OnChange → Reload endpoint schema
    │   │
    │   ├── BaseConfiguration
    │   │   ├── URLInput
    │   │   ├── VersionSelector
    │   │   └── AuthenticationForm (Dynamic)
    │   │
    │   ├── EndpointConfigurator
    │   │   ├── EndpointsList (from product schema)
    │   │   ├── EndpointDetail (Config modal)
    │   │   └── EndpointTester
    │   │
    │   ├── RequestResponseMapper
    │   │   ├── RequestTransformations
    │   │   └── ResponseMappings
    │   │
    │   ├── RoutingConfiguration
    │   │   ├── GeographyRouter
    │   │   └── ChannelRouter
    │   │
    │   └── FormActions
    │       ├── Save
    │       ├── Test
    │       └── Preview
    │
    └── GatewayMonitoring
        ├── HealthStatus
        ├── MetricsChart
        ├── AlertsPanel
        └── TestHistory
```

---

## 🏷️ COMPONENT: EnvironmentSelector

**Purpose**: Switch between development, staging, and production environments

**Props**:

```typescript
interface EnvironmentSelectorProps {
  currentEnvironment: Environment;
  availableEnvironments: Environment[];
  onEnvironmentChange: (env: Environment) => Promise<void>;
  loading?: boolean;
  gatewayStatus: {
    development?: { status: GatewayStatus; lastTest?: Date };
    staging?: { status: GatewayStatus; lastTest?: Date };
    production?: { status: GatewayStatus; lastTest?: Date };
  };
}
```

**Design**:

```text
┌──────────────────────────────────────────────────┐
│ Environment:                                     │
├──────────────────────────────────────────────────┤
│
│  [Development]  [Staging]  [Production]
│   ✓ Ready      🟡 Ready    🔴 Locked
│   Live config  Live config Config changes
│   edit mode    read mode   require approval
│
└──────────────────────────────────────────────────┘
```

**States per Environment**:

```typescript
interface EnvironmentStatus {
  environment: Environment;
  isActive: boolean;
  status: "active" | "inactive" | "testing" | "pending";
  lastTestDate?: Date;
  lastTestSuccess?: boolean;
  requiresApproval: boolean;
  canEdit: boolean;
  canDeploy: boolean;
}
```

**Behavior**:

- Click environment → Fetch configuration for that environment
- Show spinner while loading
- Display status badge (Ready/Testing/Error)
- Prevent switching if unsaved changes exist
- Show confirmation if switching away from Production

---

## 🧩 COMPONENT: ProductSelector

**Purpose**: Select product to configure, triggers dynamic form updates

**Props**:

```typescript
interface ProductSelectorProps {
  availableProducts: SupplierProduct[];
  selectedProduct?: SupplierProduct;
  onProductChange: (product: SupplierProduct) => Promise<void>;
  loading?: boolean;
  gatewayConfig?: SupplierAPIGateway;
}
```

**Design**:

```text
┌──────────────────────────────────────────────┐
│ Select Product:                              │
├──────────────────────────────────────────────┤
│ [Hotel ▼]                                    │
│                                              │
│ Selected: Hotel                              │
│ ─────────────────────────────────            │
│ Type: Commissionable                         │
│ Commission: 8%                               │
│ Presence: Online                           │
│ Contact: John Doe                            │
│ Status: ✓ Active                             │
└──────────────────────────────────────────────┘
```

**On Product Change**:

```typescript
// Triggers these actions:
1. Fetch product-specific endpoint schema
2. Load any existing configuration for this product
3. Reload endpoint templates
4. Reset form validation
5. Update available authentication types
6. Load geography/channel mappings for this product
```

---

## 🔐 COMPONENT: AuthenticationForm (Dynamic)

**Purpose**: Configure API authentication based on selected type

The form **dynamically changes** based on selected authentication type.

### Type 1: API Key

```text
┌────────────────────────────────────┐
│ Authentication: API Key            │
├────────────────────────────────────┤
│                                    │
│ API Key:                           │
│ [••••••••••••••••] [👁 Show]      │
│                                    │
│ Key Location:                      │
│ ○ Header (X-API-Key)              │
│ ○ Query Parameter (api_key)       │
│                                    │
│ Key Expires: [2025-12-31]         │
│                                    │
│ [🔄 Regenerate] [Test] [Clear]   │
└────────────────────────────────────┘
```

### Type 2: OAuth2

```text
┌────────────────────────────────────┐
│ Authentication: OAuth2             │
├────────────────────────────────────┤
│                                    │
│ Client ID:                         │
│ [••••••••••••••••] [👁 Show]      │
│                                    │
│ Client Secret:                     │
│ [••••••••••••••••] [👁 Show]      │
│                                    │
│ Token URL:                         │
│ [https://oauth.endpoint.com/token]│
│                                    │
│ Scopes:                            │
│ [○ read] [○ write] [○ admin]      │
│                                    │
│ Token Expiry: [3600] seconds      │
│ Refresh Token Expires: [30] days   │
│                                    │
│ [Test] [Refresh Token] [Clear]    │
└────────────────────────────────────┘
```

### Type 3: JWT (Bearer)

```text
┌────────────────────────────────────┐
│ Authentication: JWT Bearer         │
├────────────────────────────────────┤
│                                    │
│ JWT Secret:                        │
│ [••••••••••••••••] [👁 Show]      │
│                                    │
│ JWT Algorithm:                     │
│ [HS256 ▼]                          │
│                                    │
│ Token Expiry: [3600] seconds      │
│                                    │
│ Additional Claims:                 │
│ [issuer] → [supplier-id]          │
│ [subject] → [api-gateway]         │
│ [audience] → [api.endpoint.com]   │
│                                    │
│ [+ Add Claim] [Test] [Generate]   │
└────────────────────────────────────┘
```

### Type 4: Basic Auth

```text
┌────────────────────────────────────┐
│ Authentication: Basic Auth         │
├────────────────────────────────────┤
│                                    │
│ Username:                          │
│ [••••••••••••••••] [👁 Show]      │
│                                    │
│ Password:                          │
│ [••••••••••••••••] [👁 Show]      │
│                                    │
│ Expires: [2025-12-31]             │
│                                    │
│ [Test] [Update] [Clear]           │
└────────────────────────────────────┘
```

---

## 📡 COMPONENT: EndpointConfigurator

**Purpose**: Configure product-specific API endpoints

**Props**:

```typescript
interface EndpointConfiguratorProps {
  productId: string;
  environment: Environment;
  endpoints: APIEndpoint[];
  onEndpointAdd: (endpoint: Omit<APIEndpoint, "id">) => Promise<APIEndpoint>;
  onEndpointUpdate: (id: string, data: Partial<APIEndpoint>) => Promise<void>;
  onEndpointDelete: (id: string) => Promise<void>;
  onEndpointTest: (id: string) => Promise<GatewayTestResponse>;
  loading?: boolean;
  schema?: ProductEndpointSchema;
}
```

**Design** - List View:

```text
┌──────────────────────────────────────────────────────────┐
│ Endpoints - Hotel Product / Development                 │
├──────────────────────────────────────────────────────────┤
│ [+ Add Custom Endpoint]                                  │
│                                                          │
│ ┌─ GET /hotels/search[Configured] [Edit] [Test] [✕]    │
│ │ Status: 🟢 Healthy | Last: 2m ago | 1.2s              │
│ │                                                        │
│ ├─ GET /hotels/{id} [Configured] [Edit] [Test] [✕]     │
│ │ Status: 🟢 Healthy | Last: 1m ago | 800ms             │
│ │                                                        │
│ ├─ GET /hotels/{id}/rates [Config] [Edit] [Test] [✕]   │
│ │ Status: 🟡 Slow | Last: 5m ago | 4.2s                 │
│ │                                                        │
│ ├─ POST /bookings [Configured] [Edit] [Test] [✕]       │
│ │ Status: 🟢 Healthy | Last: 30s ago | 2.1s             │
│ │                                                        │
│ └─ GET /bookings/{id} [Configured] [Edit] [Test] [✕]   │
│   Status: 🟢 Healthy | Last: 10s ago | 1.5s             │
│                                                          │
│ [Test All Endpoints] [Export] [Import]                  │
└──────────────────────────────────────────────────────────┘
```

**Design** - Edit Detail Modal:

```text
┌────────────────────────────────────────────────────────┐
│ Edit Endpoint: GET /hotels/search                      │
├────────────────────────────────────────────────────────┤
│                                                        │
│ Method: [GET ▼]  URL: [/hotels/search]               │
│                                                        │
│ Configuration:                                         │
│ ────────────────────────────────────────              │
│ Timeout: [5000] ms                                     │
│ Max Retries: [3]                                       │
│ Retry Backoff: [2x]                                    │
│ Cache Duration: [5 minutes] [✓ Enabled]              │
│                                                        │
│ Required Parameters:                                   │
│ ────────────────────────────────────────              │
│ ☐ checkIn (Date) - Format: YYYY-MM-DD                │
│ ☐ checkOut (Date) - Format: YYYY-MM-DD               │
│ ☐ city (String) - Min length: 2                       │
│                                                        │
│ Optional Parameters:                                   │
│ ────────────────────────────────────────              │
│ ☐ adults (Number) → Min: 1, Max: 20                  │
│ ☐ children (Number) → Min: 0, Max: 10                │
│ ☐ language (String) → Default: en                     │
│                                                        │
│ Response Mapping:                                      │
│ ────────────────────────────────────────              │
│ supplier.hotels[] → hotels[]                          │
│ supplier.meta.totalCount → totalResults               │
│ supplier.meta.nextPage → pagination.next              │
│                                                        │
│ [+ Add Parameter] [Test Endpoint] [Cancel] [Save]    │
└────────────────────────────────────────────────────────┘
```

---

## 🗺️ COMPONENT: RoutingConfigurator

**Purpose**: Configure geography and channel-based routing

**Props**:

```typescript
interface RoutingConfiguratorProps {
  geographyRoutings: GeographyRouting[];
  channelRoutings: ChannelRouting[];
  availableEndpoints: APIEndpoint[];
  onGeographyAdd: (routing: GeographyRouting) => void;
  onChannelAdd: (routing: ChannelRouting) => void;
  onRoutingUpdate: (
    id: string,
    data: Partial<GeographyRouting | ChannelRouting>,
  ) => void;
  onRoutingDelete: (id: string) => void;
}
```

**Design** - Geography Routing:

```text
┌────────────────────────────────────────────────────────┐
│ Geography Routing                                      │
├────────────────────────────────────────────────────────┤
│                                                        │
│ Europe:                                                │
│ ├─ Primary Endpoint: [GET /hotels/search ▼]          │
│ ├─ Fallback: [GET /hotels/search-fallback ▼]         │
│ └─ Status: [✓ Active]                                 │
│                                                        │
│ Asia Pacific:                                          │
│ ├─ Primary Endpoint: [GET /hotels/search ▼]          │
│ ├─ Fallback: [None ▼]                                │
│ └─ Status: [✓ Active]                                 │
│                                                        │
│ North America:                                         │
│ ├─ Primary Endpoint: [GET /hotels/search-na ▼]       │
│ ├─ Fallback: [GET /hotels/search ▼]                  │
│ └─ Status: [✓ Active]                                 │
│                                                        │
│ Middle East & Africa:                                  │
│ ├─ Primary Endpoint: [GET /hotels/search ▼]          │
│ ├─ Fallback: [None ▼]                                │
│ └─ Status: [⊘ Inactive]                              │
│                                                        │
│ [+ Add Geography] [Save]                              │
└────────────────────────────────────────────────────────┘
```

**Design** - Channel Routing:

```text
┌────────────────────────────────────────────────────────┐
│ Channel Routing                                        │
├────────────────────────────────────────────────────────┤
│                                                        │
│ Web Channel:                                           │
│ ├─ Priority: [1] (Highest)                           │
│ ├─ Endpoint: [GET /hotels/search ▼]                  │
│ └─ Status: [✓ Active]                                 │
│                                                        │
│ Mobile App:                                            │
│ ├─ Priority: [2]                                      │
│ ├─ Endpoint: [GET /hotels/search-mobile ▼]           │
│ └─ Status: [✓ Active]                                 │
│                                                        │
│ B2B API:                                               │
│ ├─ Priority: [1] (Highest)                           │
│ ├─ Endpoint: [GET /hotels/search-b2b ▼]              │
│ └─ Status: [✓ Active]                                 │
│                                                        │
│ B2C Web:                                               │
│ ├─ Priority: [3]                                      │
│ ├─ Endpoint: [GET /hotels/search ▼]                  │
│ └─ Status: [⊘ Inactive]                              │
│                                                        │
│ [+ Add Channel] [Save]                                │
└────────────────────────────────────────────────────────┘
```

---

## 🧪 COMPONENT: EndpointTester

**Purpose**: Test individual endpoints with sample data

**Props**:

```typescript
interface EndpointTesterProps {
  endpoint: APIEndpoint;
  environment: Environment;
  onTest: (testData: any) => Promise<GatewayTestResponse>;
  loading?: boolean;
}
```

**Design**:

```text
┌────────────────────────────────────────────────────────┐
│ Test Endpoint: GET /hotels/search                      │
├────────────────────────────────────────────────────────┤
│                                                        │
│ Sample Test Data:                                      │
│ ────────────────────────────────────────              │
│ checkIn: [2025-06-01]                                 │
│ checkOut: [2025-06-10]                                │
│ city: [paris]                                         │
│ adults: [2]                                           │
│                                                        │
│ [Run Test] [Clear] [Load Sample]                     │
│                                                        │
├────────────────────────────────────────────────────────┤
│                                                        │
│ Test Result: ✓ SUCCESS (200 OK)                       │
│ ────────────────────────────────────────              │
│ Response Time: 1.2 seconds                            │
│ Status Code: 200                                      │
│ Response Size: 4.2 KB                                 │
│                                                        │
│ Response Body:                                         │
│ ┌──────────────────────────────────────┐             │
│ │ {                                    │              │
│ │   "hotels": [                        │              │
│ │     {                                │              │
│ │       "id": 123,                     │              │
│ │       "name": "Hotel A",             │              │
│ │       "rating": 4.5,                 │              │
│ │       "price": 89.99                 │              │
│ │     },                               │              │
│ │     ...                              │              │
│ │   ],                                 │
│ │   "totalResults": 45                 │              │
│ │ }                                    │              │
│ └──────────────────────────────────────┘             │
│                                                        │
│ Mapping Validation: ✓ All fields mapped               │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

## 📊 COMPONENT: GatewayHealthStatus

**Purpose**: Display real-time health status of gateway

**Props**:

```typescript
interface GatewayHealthStatusProps {
  gatewaySupplierId: string
  environment: Environment
  auto Refresh?: boolean
  refreshInterval?: number
}
```

**Design**:

```text
┌────────────────────────────────────────────┐
│ Gateway Health: Production                 │
├────────────────────────────────────────────┤
│                                            │
│ 🟢 Overall Status: HEALTHY                 │
│    Last Check: 2 seconds ago                │
│                                            │
├────────────────────────────────────────────┤
│ Component Status:                          │
│                                            │
│ 🟢 Authentication   ✓ Valid (Exp: 87d)   │
│ 🟢 Connectivity     ✓ 1.2s avg response  │
│ 🟢 Endpoints        ✓ 5/5 healthy        │
│ 🟢 Performance      ✓ Normal load        │
│ 🟢 Rate Limits      ✓ 45/100 used        │
│                                            │
├────────────────────────────────────────────┤
│                                            │
│ Recent Issues: None                        │
│                                            │
│ [Details] [Run Check] [View History]      │
└────────────────────────────────────────────┘
```

---

## 🎨 Design System Integration

### Colors Used

```typescript
- Environment Selection: Primary Blue
- Healthy Status: Success Green
- Warning Status: Warning Yellow
- Error Status: Error Red
- Production Lock: Dark Red
- Active/Ready: Success Green
```

### Typography

- Endpoint names: Code (monospace)
- Section headers: Heading 3
- Labels: Body Bold
- Status messages: Small (muted gray)

### Spacing & Layout

- Modal width: 800px (lg)
- Form field gap: 16px
- Section padding: 24px
- Component padding: 12px

---

## 🔄 State Management

```typescript
interface GatewayFormState {
  currentEnvironment: Environment;
  selectedProduct?: SupplierProduct;
  formData: SupplierAPIGatewayFormData;
  isValidating: boolean;
  isSaving: boolean;
  validationErrors: Record<string, string>;
  changedFields: Set<string>;
  hasUnsavedChanges: boolean;
}
```

---

## 🧪 Testing Scenarios

1. **Scenario 1**: Switch from Development to Production
   - Load different credentials
   - Show approval requirements
   - Display deployment window
   - Validate all endpoints

2. **Scenario 2**: Change Product from Hotel to Flight
   - Reload endpoint schema
   - Update response mapping templates
   - Reset geography routing
   - Show Flight-specific parameters

3. **Scenario 3**: Test Endpoint with Sample Data
   - Execute API call in selected environment
   - Show response time and status
   - Validate response structure
   - Highlight mapping issues

4. **Scenario 4**: Promote Configuration to Production
   - Copy from Staging
   - Show diff from current Production
   - Require approval
   - Schedule deployment window

---

**Status**: ✅ Complete  
**Components**: 8+  
**Implementation Ready**: Yes
