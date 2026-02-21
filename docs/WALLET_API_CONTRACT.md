# Wallet API Contract

## Overview

The Wallet API is a centralized, multi-currency wallet system owned and operated by the **Payment Service**. All wallet operations are routed through the **API Gateway** at the canonical entry point `/api/wallet/*`.

**Architecture Principle:** Wallet is accessed exclusively through the API Gateway; there is no direct service-to-service communication to wallet endpoints. This ensures a single source of truth for wallet operations and enables centralized monitoring, throttling, and audit logging.

---

## Routing Architecture

### Entry Point

- **Public API:** `https://api.tripinfo.com/api/wallet/*` (Production)
- **Local Development:** `http://localhost:3000/api/wallet/*`
- **Docker Container (local):** `http://api-gateway:3000/api/wallet/*`

### Backend Routing

- **API Gateway receives:** `POST /api/wallet/credit` → resolves to Payment Service
- **API Gateway forwards to:** `http://payment-service:3007/api/wallet/credit`
- **Payment Service implementation:** `/services/payment-service/src/routes/wallet.ts`

### Service URLs (Environment-Specific)

#### Local Development (docker-compose.local.yml)

```env
PAYMENT_SERVICE_URL=http://payment-service:3007
PAYMENT_SERVICE_PORT=3007
```

#### Staging/Neon (docker-compose.neon.yml)

```env
PAYMENT_SERVICE_URL=http://payment-service:3007
PAYMENT_SERVICE_PORT=3007
RULE_ENGINE_SERVICE_URL=http://rule-engine-service:3010
RULE_ENGINE_SERVICE_PORT=3010
```

---

## Authentication

All wallet endpoints require bearer token authentication.

### Header

```
Authorization: Bearer <JWT_TOKEN>
```

### Middleware

- Authentication is enforced by `@tripalfa/wallet` middleware
- Invalid tokens return **401 Unauthorized**
- Token must contain a `userId` claim (extracted by middleware)

---

## Idempotency

All state-changing endpoints (POST operations) are **idempotent**.

### Mechanism

- Each request must include an `Idempotency-Key` header OR `idempotencyKey` in the request body
- Wallet library validates and stores idempotency keys to prevent duplicate operations
- Duplicate requests with the same key return the original response

### Example

```json
{
  "currency": "USD",
  "amount": 100.00,
  "reason": "payment_topup",
  "idempotencyKey": "unique-key-uuid-12345"
}
```

### Important

Idempotency keys **must be UUID v4 or equivalent** to ensure globally unique operation identification.

---

## Endpoints

### 1. List All Wallets

**Request**

```
GET /api/wallet
Authorization: Bearer <token>
```

**Response (200 OK)**

```json
[
  {
    "id": "wallet_uuid_1",
    "userId": "user_uuid",
    "currency": "USD",
    "balance": 1500.50,
    "updatedAt": "2026-02-14T10:30:00Z"
  },
  {
    "id": "wallet_uuid_2",
    "userId": "user_uuid",
    "currency": "EUR",
    "balance": 850.00,
    "updatedAt": "2026-02-14T10:30:00Z"
  }
]
```

**Error Cases**

- **401 Unauthorized:** No valid token provided
- **500 Internal Server Error:** Database connectivity issue

---

### 2. Get Wallet Balance

**Request**

```
GET /api/wallet/balance?currency=USD
Authorization: Bearer <token>
```

**Query Parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `currency` | string | Yes | 3-letter ISO currency code (e.g., USD, EUR, GBP) |

**Response (200 OK)**

```json
{
  "currency": "USD",
  "balance": 1500.50,
  "formatted": "$1,500.50",
  "updatedAt": "2026-02-14T10:30:00Z"
}
```

**Error Cases**

- **400 Bad Request:** Missing `currency` parameter
- **401 Unauthorized:** Invalid token
- **404 Not Found:** Wallet does not exist for this user and currency

---

### 3. Credit Wallet (Deposit/Top-up)

**Request**

```
POST /api/wallet/credit
Authorization: Bearer <token>
Content-Type: application/json
```

**Body**

```json
{
  "currency": "USD",
  "amount": 100.00,
  "reason": "payment_topup",
  "idempotencyKey": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Body Parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `currency` | string | Yes | 3-letter ISO currency code |
| `amount` | number | Yes | Positive amount to credit (e.g., 100.50) |
| `reason` | string | No | Transaction reason for audit logs |
| `idempotencyKey` | string | Yes | Unique UUID for idempotency |

**Response (201 Created)**

```json
{
  "id": "txn_uuid",
  "walletId": "wallet_uuid",
  "userId": "user_uuid",
  "type": "credit",
  "currency": "USD",
  "amount": 100.00,
  "reason": "payment_topup",
  "newBalance": 1600.50,
  "idempotencyKey": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2026-02-14T10:35:00Z",
  "status": "completed"
}
```

**Error Cases**

- **400 Bad Request:** Missing required fields or invalid amount (must be positive)
- **401 Unauthorized:** Invalid token
- **409 Conflict:** Duplicate idempotency key with different parameters
- **500 Internal Server Error:** Database or calculation error

---

### 4. Debit Wallet (Payment)

**Request**

```
POST /api/wallet/debit
Authorization: Bearer <token>
Content-Type: application/json
```

**Body**

```json
{
  "currency": "USD",
  "amount": 50.00,
  "reason": "flight_booking",
  "idempotencyKey": "550e8400-e29b-41d4-a716-446655440001"
}
```

**Body Parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `currency` | string | Yes | 3-letter ISO currency code |
| `amount` | number | Yes | Positive amount to debit (e.g., 50.00) |
| `reason` | string | No | Transaction reason for audit logs |
| `idempotencyKey` | string | Yes | Unique UUID for idempotency |

**Response (201 Created)**

```json
{
  "id": "txn_uuid",
  "walletId": "wallet_uuid",
  "userId": "user_uuid",
  "type": "debit",
  "currency": "USD",
  "amount": 50.00,
  "reason": "flight_booking",
  "newBalance": 1550.50,
  "idempotencyKey": "550e8400-e29b-41d4-a716-446655440001",
  "timestamp": "2026-02-14T10:36:00Z",
  "status": "completed"
}
```

**Error Cases**

- **400 Bad Request:** Missing required fields or invalid amount
- **402 Payment Required:** Insufficient balance
- **401 Unauthorized:** Invalid token
- **409 Conflict:** Duplicate idempotency key with different parameters
- **500 Internal Server Error:** Database or calculation error

---

### 5. Transfer Between Currencies (FX)

**Request**

```
POST /api/wallet/transfer
Authorization: Bearer <token>
Content-Type: application/json
```

**Body**

```json
{
  "fromCurrency": "USD",
  "toCurrency": "EUR",
  "amount": 100.00,
  "idempotencyKey": "550e8400-e29b-41d4-a716-446655440002"
}
```

**Body Parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `fromCurrency` | string | Yes | Source currency (3-letter ISO code) |
| `toCurrency` | string | Yes | Target currency (3-letter ISO code) |
| `amount` | number | Yes | Amount to transfer in source currency |
| `idempotencyKey` | string | Yes | Unique UUID for idempotency |

**Response (201 Created)**

```json
{
  "id": "transfer_uuid",
  "userId": "user_uuid",
  "fromCurrency": "USD",
  "fromAmount": 100.00,
  "fromNewBalance": 1450.50,
  "toCurrency": "EUR",
  "toAmount": 92.50,
  "toNewBalance": 942.50,
  "exchangeRate": 0.925,
  "idempotencyKey": "550e8400-e29b-41d4-a716-446655440002",
  "timestamp": "2026-02-14T10:37:00Z",
  "status": "completed"
}
```

**Error Cases**

- **400 Bad Request:** Missing required fields or currency not found
- **402 Payment Required:** Insufficient balance in source currency
- **401 Unauthorized:** Invalid token
- **409 Conflict:** Duplicate idempotency key with different parameters
- **500 Internal Server Error:** FX rate unavailable, database error

---

### 6. Get FX Conversion Preview

**Request**

```
GET /api/wallet/fx-preview?fromCurrency=USD&toCurrency=EUR&amount=100
Authorization: Bearer <token>
```

**Query Parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `fromCurrency` | string | Yes | Source currency (3-letter ISO code) |
| `toCurrency` | string | Yes | Target currency (3-letter ISO code) |
| `amount` | number | Yes | Amount to convert (in source currency) |

**Response (200 OK)**

```json
{
  "fromCurrency": "USD",
  "fromAmount": 100.00,
  "toCurrency": "EUR",
  "toAmount": 92.50,
  "exchangeRate": 0.925,
  "roeTimestamp": "2026-02-14T10:00:00Z",
  "validUntil": "2026-02-14T11:00:00Z"
}
```

**Error Cases**

- **400 Bad Request:** Missing query parameters or currency not found
- **401 Unauthorized:** Invalid token
- **500 Internal Server Error:** FX rate service unavailable

---

### 7. Get Transaction History

**Request**

```
GET /api/wallet/history?limit=20&offset=0
Authorization: Bearer <token>
```

**Query Parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `limit` | number | No | Max results per page (default: 50, max: 100) |
| `offset` | number | No | Pagination offset (default: 0) |

**Response (200 OK)**

```json
{
  "transactions": [
    {
      "id": "txn_uuid_1",
      "type": "debit",
      "currency": "USD",
      "amount": 50.00,
      "reason": "flight_booking",
      "balanceBefore": 1600.50,
      "balanceAfter": 1550.50,
      "timestamp": "2026-02-14T10:36:00Z",
      "status": "completed"
    },
    {
      "id": "txn_uuid_2",
      "type": "credit",
      "currency": "USD",
      "amount": 100.00,
      "reason": "payment_topup",
      "balanceBefore": 1500.50,
      "balanceAfter": 1600.50,
      "timestamp": "2026-02-14T10:35:00Z",
      "status": "completed"
    }
  ],
  "pagination": {
    "limit": 20,
    "offset": 0,
    "total": 150
  }
}
```

**Error Cases**

- **400 Bad Request:** Invalid pagination parameters
- **401 Unauthorized:** Invalid token
- **500 Internal Server Error:** Database error

---

## Error Handling

### Standard Error Response Format

```json
{
  "error": "Insufficient Balance",
  "message": "Wallet balance insufficient for debit operation",
  "code": "INSUFFICIENT_BALANCE",
  "details": {
    "required": 150.00,
    "available": 50.00,
    "currency": "USD"
  }
}
```

### HTTP Status Code Reference

| Code | Meaning | Example |
|------|---------|---------|
| 200 | Success (GET operations) | Balance retrieved |
| 201 | Created (POST operations) | Transaction completed |
| 400 | Bad Request | Missing required field |
| 401 | Unauthorized | Invalid/missing token |
| 402 | Payment Required | Insufficient balance |
| 404 | Not Found | Wallet not found |
| 409 | Conflict | Duplicate idempotency key |
| 500 | Server Error | Database connection failed |
| 502 | Bad Gateway | Upstream service unavailable |
| 503 | Service Unavailable | Maintenance mode |

---

## Integration with @tripalfa/wallet Library

The Payment Service depends on the `@tripalfa/wallet` npm package (symlinked via pnpm workspaces).

### Library Location

```
packages/wallet/
  src/
    index.ts       # initializeWallet() export
    middleware/    # auth, idempotency middleware
    services/      # WalletManager implementation
    types/         # Request/response types
```

### Import in Payment Service

```typescript
import { initializeWallet } from '@tripalfa/wallet'

const { walletManager } = initializeWallet(app)
app.use('/api/wallet', walletRoutes(walletManager))
```

### Key Dependencies

- `@tripalfa/shared-database` - Prisma client for wallet ledger persistence
- `@tripalfa/shared-types` - Shared TypeScript interfaces
- `@tripalfa/shared-utils` - Common utilities (logging, error handling)

---

## Data Sources

### Currency & Exchange Rate Source

- **Static-Data PostgreSQL Database** (read-only to Payment Service)
- Updated hourly via `scripts/update-exchange-rates.ts`
- Contains all supported currencies and current ROE (Rate of Exchange)

### Transaction Ledger

- **Main Database** (PostgreSQL via Prisma)
- Schema: `wallet_transactions` table
- Indexed on `userId`, `currency`, `timestamp` for query performance

---

## Usage Examples

### Example 1: JavaScript/Fetch (Frontend)

```javascript
// Top up a wallet
const response = await fetch('/api/wallet/credit', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    currency: 'USD',
    amount: 100.00,
    reason: 'payment_topup',
    idempotencyKey: crypto.randomUUID()
  })
});

const transaction = await response.json();
console.log(`Credited ${transaction.amount} ${transaction.currency}`);
```

### Example 2: cURL (API Testing)

```bash
curl -X POST http://localhost:3000/api/wallet/transfer \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fromCurrency": "USD",
    "toCurrency": "EUR",
    "amount": 100.00,
    "idempotencyKey": "'$(uuidgen)'"
  }'
```

### Example 3: Service-to-Service (Node.js)

```typescript
// From booking-service or another backend service
const response = await fetch('http://api-gateway:3000/api/wallet/balance', {
  headers: {
    'Authorization': `Bearer ${systemToken}`,
  },
  searchParams: { currency: 'USD' }
});
```

---

## Operational Guidelines

### Idempotency Key Generation

- **Use UUID v4:** `import { randomUUID } from 'crypto'; randomUUID()`
- **Store on client:** Save the key sent for retry scenarios
- **Never reuse:** Each operation must have a unique key

### Request Timeouts

- **API Gateway:** 10 seconds
- **Payment Service:** 5 seconds
- Implement exponential backoff for retries

### Rate Limiting

- **Per-user:** 100 requests/minute to wallet endpoints
- **Global:** 5000 requests/hour
- Returns `429 Too Many Requests` when exceeded

### Audit Logging

- All wallet operations are logged with transaction ID, user ID, timestamp
- Logs are immutable and retained for 7 years for compliance

---

## Phase 1 Roadmap & Future Enhancements

### Current State (Phase 1)

✅ Centralized multi-currency wallet  
✅ Core operations: balance, credit, debit, transfer, history  
✅ Idempotency on all mutations  
✅ FX preview endpoint  
✅ Routed through API Gateway  

### Future Phases

- [ ] **Phase 2:** Advanced reconciliation features, wallet hold (reserved balance)
- [ ] **Phase 3:** Scheduled transfers, recurring payments
- [ ] **Phase 4:** API versioning (v1, v2)
- [ ] **Phase 5:** Webhooks for transaction events

---

## Support & Debugging

### Health Check

```
GET http://localhost:3000/health
```

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Wallet not found | First operation for user/currency | Create wallet via credit operation |
| 402 Payment Required | Insufficient balance | Check balance via `/api/wallet/balance` |
| 409 Conflict | Idempotency key reused | Use unique UUID for each request |
| FX rates stale | Database not updated | Check `currency_rates` table timestamp |

### Contacting Support

- **Slack:** #wallet-api-support
- **Status Page:** <https://status.tripinfo.com>
- **Incident Hotline:** +1-800-WALLET-1

---

**Document Version:** 1.0.0  
**Last Updated:** 2026-02-14  
**Maintained By:** TripAlfa Payment Team
