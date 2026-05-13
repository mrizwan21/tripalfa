# B2B Portal & Call Center API - Test Scripts

## Overview

This document provides test scripts for the B2B Portal and Call Center modules.

## Prerequisites

- Node.js 20+
- PostgreSQL with TripAlfa databases
- API running on port 3002
- Valid JWT token for authentication

## Setup

### 1. Install Dependencies

```bash
npm install axios dotenv
```

### 2. Create .env file

```env
API_BASE_URL=http://localhost:3002
API_TOKEN=your_jwt_token_here
```

## Test Scripts

### B2B Portal Tests

#### 1. Create Tenant

```javascript
// test-b2b-tenant-create.js
const axios = require('axios');
require('dotenv').config();

const API_BASE_URL = process.env.API_BASE_URL;
const API_TOKEN = process.env.API_TOKEN;

async function createTenant() {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/v1/b2b/tenants`,
      {
        name: 'Test Travel Agency',
        slug: 'test-travel-agency',
        tier: 'PROFESSIONAL',
        contactName: 'John Doe',
        contactEmail: 'john@testagency.com',
        contactPhone: '+1234567890',
        address: '123 Business Ave, Suite 100',
        settings: {
          bookingLimit: 10000,
          commissionRate: 0.15
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Tenant created:', response.data);
    return response.data.data;
  } catch (error) {
    console.error('❌ Error creating tenant:', error.response?.data || error.message);
    throw error;
  }
}

createTenant().catch(console.error);
```

#### 2. List Tenants

```javascript
// test-b2b-tenant-list.js
const axios = require('axios');
require('dotenv').config();

const API_BASE_URL = process.env.API_BASE_URL;
const API_TOKEN = process.env.API_TOKEN;

async function listTenants() {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/api/v1/b2b/tenants?page=1&pageSize=10`,
      {
        headers: {
          'Authorization': `Bearer ${API_TOKEN}`
        }
      }
    );
    
    console.log('✅ Tenants retrieved:', response.data.data.length, 'items');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('❌ Error listing tenants:', error.response?.data || error.message);
  }
}

listTenants().catch(console.error);
```

#### 3. Create B2B User

```javascript
// test-b2b-user-create.js
const axios = require('axios');
require('dotenv').config();

const API_BASE_URL = process.env.API_BASE_URL;
const API_TOKEN = process.env.API_TOKEN;

async function createB2BUser(tenantId) {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/v1/b2b/users`,
      {
        tenantId,
        email: 'agent@testagency.com',
        firstName: 'Jane',
        lastName: 'Smith',
        phone: '+1987654321',
        role: 'MANAGER',
        password: 'SecurePass123!'
      },
      {
        headers: {
          'Authorization': `Bearer ${API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ B2B User created:', response.data);
    return response.data.data;
  } catch (error) {
    console.error('❌ Error creating B2B user:', error.response?.data || error.message);
    throw error;
  }
}

// Replace with actual tenant ID
createB2BUser('YOUR_TENANT_ID').catch(console.error);
```

#### 4. Create Partner

```javascript
// test-b2b-partner-create.js
const axios = require('axios');
require('dotenv').config();

const API_BASE_URL = process.env.API_BASE_URL;
const API_TOKEN = process.env.API_TOKEN;

async function createPartner(tenantId) {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/v1/b2b/partners`,
      {
        tenantId,
        name: 'Global Travel Corp',
        type: 'TRAVEL_AGENCY',
        status: 'ACTIVE',
        contactName: 'Mike Johnson',
        contactEmail: 'mike@globaltravel.com',
        contactPhone: '+1122334455',
        commissionRate: 0.12,
        commissionType: 'PERCENTAGE'
      },
      {
        headers: {
          'Authorization': `Bearer ${API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Partner created:', response.data);
    return response.data.data;
  } catch (error) {
    console.error('❌ Error creating partner:', error.response?.data || error.message);
    throw error;
  }
}

// Replace with actual tenant ID
createPartner('YOUR_TENANT_ID').catch(console.error);
```

#### 5. Create Agreement

```javascript
// test-b2b-agreement-create.js
const axios = require('axios');
require('dotenv').config();

const API_BASE_URL = process.env.API_BASE_URL;
const API_TOKEN = process.env.API_TOKEN;

async function createAgreement(tenantId, partnerId) {
  try {
    const today = new Date().toISOString().split('T')[0];
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    const endDate = nextYear.toISOString().split('T')[0];
    
    const response = await axios.post(
      `${API_BASE_URL}/api/v1/b2b/agreements`,
      {
        tenantId,
        partnerId,
        name: 'Annual Partnership Agreement 2024',
        type: 'PARTNERSHIP',
        status: 'ACTIVE',
        startDate: today,
        endDate,
        commissionRate: 0.15,
        minBookings: 100,
        maxBookings: 10000,
        billingCycle: 'MONTHLY',
        paymentTerms: 'Net 30 days'
      },
      {
        headers: {
          'Authorization': `Bearer ${API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Agreement created:', response.data);
    return response.data.data;
  } catch (error) {
    console.error('❌ Error creating agreement:', error.response?.data || error.message);
    throw error;
  }
}

// Replace with actual IDs
createAgreement('YOUR_TENANT_ID', 'YOUR_PARTNER_ID').catch(console.error);
```

#### 6. Create B2B Booking

```javascript
// test-b2b-booking-create.js
const axios = require('axios');
require('dotenv').config();

const API_BASE_URL = process.env.API_BASE_URL;
const API_TOKEN = process.env.API_TOKEN;

async function createB2BBooking(tenantId, partnerId) {
  try {
    const travelDate = new Date();
    travelDate.setDate(travelDate.getDate() + 30);
    
    const response = await axios.post(
      `${API_BASE_URL}/api/v1/b2b/bookings`,
      {
        tenantId,
        partnerId,
        serviceType: 'FLIGHT',
        customerName: 'Corporate Client Inc',
        customerEmail: 'booking@corporate.com',
        customerPhone: '+1555123456',
        travelDate: travelDate.toISOString().split('T')[0],
        route: 'JFK-LAX',
        passengers: 5,
        baseAmount: 2500,
        commissionAmount: 375,
        totalAmount: 2875,
        currency: 'USD',
        metadata: {
          corporateAccount: true,
          department: 'Sales'
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ B2B Booking created:', response.data);
    return response.data.data;
  } catch (error) {
    console.error('❌ Error creating B2B booking:', error.response?.data || error.message);
    throw error;
  }
}

// Replace with actual IDs
createB2BBooking('YOUR_TENANT_ID', 'YOUR_PARTNER_ID').catch(console.error);
```

#### 7. List B2B Bookings

```javascript
// test-b2b-booking-list.js
const axios = require('axios');
require('dotenv').config();

const API_BASE_URL = process.env.API_BASE_URL;
const API_TOKEN = process.env.API_TOKEN;

async function listB2BBookings(tenantId) {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/api/v1/b2b/bookings?tenantId=${tenantId}&page=1&pageSize=20`,
      {
        headers: {
          'Authorization': `Bearer ${API_TOKEN}`
        }
      }
    );
    
    console.log('✅ B2B Bookings retrieved:', response.data.data.length, 'items');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('❌ Error listing B2B bookings:', error.response?.data || error.message);
  }
}

// Replace with actual tenant ID
listB2BBookings('YOUR_TENANT_ID').catch(console.error);
```

### Call Center Tests

#### 1. Create Agent

```javascript
// test-call-center-agent-create.js
const axios = require('axios');
require('dotenv').config();

const API_BASE_URL = process.env.API_BASE_URL;
const API_TOKEN = process.env.API_TOKEN;

async function createAgent(userId) {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/v1/call-center/agents`,
      {
        userId,
        firstName: 'Sarah',
        lastName: 'Williams',
        email: 'sarah.williams@company.com',
        phone: '+1555987654',
        role: 'AGENT',
        skills: ['customer_service', 'sales', 'technical_support'],
        languages: ['en', 'es'],
        status: 'AVAILABLE',
        shiftStart: '09:00',
        shiftEnd: '17:00'
      },
      {
        headers: {
          'Authorization': `Bearer ${API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Agent created:', response.data);
    return response.data.data;
  } catch (error) {
    console.error('❌ Error creating agent:', error.response?.data || error.message);
    throw error;
  }
}

// Replace with actual user ID from core.users
createAgent('USER_ID_FROM_CORE').catch(console.error);
```

#### 2. List Agents

```javascript
// test-call-center-agent-list.js
const axios = require('axios');
require('dotenv').config();

const API_BASE_URL = process.env.API_BASE_URL;
const API_TOKEN = process.env.API_TOKEN;

async function listAgents() {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/api/v1/call-center/agents?status=AVAILABLE&page=1&pageSize=50`,
      {
        headers: {
          'Authorization': `Bearer ${API_TOKEN}`
        }
      }
    );
    
    console.log('✅ Agents retrieved:', response.data.data.length, 'items');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('❌ Error listing agents:', error.response?.data || error.message);
  }
}

listAgents().catch(console.error);
```

#### 3. Create Call Queue

```javascript
// test-call-center-queue-create.js
const axios = require('axios');
require('dotenv').config();

const API_BASE_URL = process.env.API_BASE_URL;
const API_TOKEN = process.env.API_TOKEN;

async function createQueue() {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/v1/call-center/queues`,
      {
        name: 'Technical Support',
        description: 'Queue for technical support calls',
        routingStrategy: 'SKILL_BASED',
        priority: 8,
        requiredSkills: ['technical_support', 'troubleshooting'],
        maxWaitTime: 600,
        maxQueueSize: 50,
        isActive: true
      },
      {
        headers: {
          'Authorization': `Bearer ${API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Queue created:', response.data);
    return response.data.data;
  } catch (error) {
    console.error('❌ Error creating queue:', error.response?.data || error.message);
    throw error;
  }
}

createQueue().catch(console.error);
```

#### 4. Create Call

```javascript
// test-call-center-call-create.js
const axios = require('axios');
require('dotenv').config();

const API_BASE_URL = process.env.API_BASE_URL;
const API_TOKEN = process.env.API_TOKEN;

async function createCall(queueId, agentId) {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/v1/call-center/calls`,
      {
        queueId,
        agentId,
        customerId: 'CUSTOMER_ID', // Optional: link to core.users
        direction: 'INBOUND',
        source: '+1555123456',
        destination: '+1555987654',
        status: 'COMPLETED',
        outcome: 'RESOLVED',
        waitTime: 45,
        talkTime: 300,
        holdTime: 60,
        recordingUrl: 'https://recordings.company.com/call123.mp3',
        metadata: {
          issueType: 'technical',
          resolutionTime: 300,
          customerSatisfaction: 5
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Call created:', response.data);
    return response.data.data;
  } catch (error) {
    console.error('❌ Error creating call:', error.response?.data || error.message);
    throw error;
  }
}

// Replace with actual IDs
createCall('QUEUE_ID', 'AGENT_ID').catch(console.error);
```

#### 5. List Calls

```javascript
// test-call-center-call-list.js
const axios = require('axios');
require('dotenv').config();

const API_BASE_URL = process.env.API_BASE_URL;
const API_TOKEN = process.env.API_TOKEN;

async function listCalls() {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/api/v1/call-center/calls?status=COMPLETED&dateFrom=2024-01-01&page=1&pageSize=50`,
      {
        headers: {
          'Authorization': `Bearer ${API_TOKEN}`
        }
      }
    );
    
    console.log('✅ Calls retrieved:', response.data.data.length, 'items');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('❌ Error listing calls:', error.response?.data || error.message);
  }
}

listCalls().catch(console.error);
```

#### 6. Create Interaction

```javascript
// test-call-center-interaction-create.js
const axios = require('axios');
require('dotenv').config();

const API_BASE_URL = process.env.API_BASE_URL;
const API_TOKEN = process.env.API_TOKEN;

async function createInteraction(callId, agentId) {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/v1/call-center/interactions`,
      {
        callId,
        agentId,
        type: 'RESOLUTION',
        content: 'Issue resolved by updating software to latest version. Customer satisfied with solution.',
        sentiment: 'POSITIVE'
      },
      {
        headers: {
          'Authorization': `Bearer ${API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Interaction created:', response.data);
    return response.data.data;
  } catch (error) {
    console.error('❌ Error creating interaction:', error.response?.data || error.message);
    throw error;
  }
}

// Replace with actual IDs
createInteraction('CALL_ID', 'AGENT_ID').catch(console.error);
```

#### 7. List Interactions

```javascript
// test-call-center-interaction-list.js
const axios = require('axios');
require('dotenv').config();

const API_BASE_URL = process.env.API_BASE_URL;
const API_TOKEN = process.env.API_TOKEN;

async function listInteractions(callId) {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/api/v1/call-center/interactions?callId=${callId}&page=1&pageSize=50`,
      {
        headers: {
          'Authorization': `Bearer ${API_TOKEN}`
        }
      }
    );
    
    console.log('✅ Interactions retrieved:', response.data.data.length, 'items');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('❌ Error listing interactions:', error.response?.data || error.message);
  }
}

// Replace with actual call ID
listInteractions('CALL_ID').catch(console.error);
```

## Running All Tests

```bash
# Run all B2B tests
node test-b2b-tenant-create.js
node test-b2b-user-create.js
node test-b2b-partner-create.js
node test-b2b-agreement-create.js
node test-b2b-booking-create.js

# Run all Call Center tests
node test-call-center-agent-create.js
node test-call-center-queue-create.js
node test-call-center-call-create.js
node test-call-center-interaction-create.js
```

## Postman Collection

A Postman collection is available at: `postman/TripAlfa-API.postman_collection.json`

### Import to Postman

1. Open Postman
2. Click "Import"
3. Select the collection file
4. Set environment variables:
   - `base_url`: http://localhost:3002
   - `token`: Your JWT token

## Test Coverage

| Module | Endpoints | Test Scripts |
|--------|-----------|--------------|
| B2B Portal | 8 | 7 |
| Call Center | 7 | 7 |
| **Total** | **15** | **14** |

## Common Issues

### 401 Unauthorized
- Ensure JWT token is valid
- Check token expiration
- Verify user has required permissions

### 403 Forbidden
- User lacks required permission
- Check role assignments
- Verify permission scope

### 404 Not Found
- Invalid UUID format
- Resource doesn't exist
- Check database connectivity

### 400 Bad Request
- Invalid request body
- Missing required fields
- Invalid data format

## Performance Testing

For load testing, use tools like:
- Apache JMeter
- k6
- Artillery

Example k6 script:

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '30s', target: 10 },
    { duration: '1m', target: 50 },
    { duration: '30s', target: 0 },
  ],
};

export default function () {
  const params = {
    headers: {
      'Authorization': `Bearer ${__ENV.TOKEN}`,
    },
  };
  
  const res = http.get('http://localhost:3002/api/v1/b2b/tenants?page=1&pageSize=10', params);
  check(res, { 'status was 200': (r) => r.status == 200 });
  sleep(1);
}
```

Run with:
```bash
TOKEN=your_jwt_token k6 run test.js
```
