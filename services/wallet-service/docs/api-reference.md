# Wallet Management API Reference

## Overview

The Wallet Management API provides comprehensive endpoints for managing user wallets, transactions, ledger entries, exchange rates, settlements, and financial operations. This API supports multi-currency wallets, real-time exchange rate tracking, and complete audit trails for all financial transactions.

## Base URL

- **Development**: `http://localhost:3003`
- **Production**: `https://api.tripalfa.com/wallet`

## Authentication

### API Key Authentication

Include your API key in the request header:

```http
X-API-Key: your-api-key-here
```

### Bearer Token Authentication

Include your JWT token in the request header:

```http
Authorization: Bearer your-jwt-token
```

## Error Handling

All API responses follow a consistent error format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description",
    "details": {
      "field": "specific details"
    },
    "timestamp": "2024-10-25T10:30:00Z",
    "requestId": "optional-request-id"
  }
}
```

### Common Error Codes

- `VALIDATION_ERROR` (400): Invalid input parameters
- `NOT_FOUND` (404): Resource not found
- `CONFLICT` (409): Resource conflict (insufficient balance, duplicate transaction)
- `FORBIDDEN` (403): Access denied or wallet inactive
- `INSUFFICIENT_FUNDS` (422): Insufficient balance for transaction
- `SERVICE_UNAVAILABLE` (503): External service error
- `INTERNAL_ERROR` (500): Internal server error

## Endpoints

### Health Check

#### GET /health

Returns service health status and metadata.

**Response:**

```json
{
  "status": "healthy",
  "service": "wallet-service",
  "timestamp": "2024-10-25T10:30:00Z"
}
```

### Wallet Management

#### GET /wallets

Retrieve all wallets with their current balances.

**Query Parameters:**

- `userId` (optional): Filter by user ID
- `currency` (optional): Filter by currency
- `status` (optional): Filter by wallet status (`ACTIVE`, `INACTIVE`, `SUSPENDED`)

**Response:**

```json
[
  {
    "id": "wallet_12345",
    "userId": "user_67890",
    "currency": "USD",
    "balance": 1500.0,
    "status": "ACTIVE",
    "createdAt": "2024-10-25T10:30:00Z",
    "updatedAt": "2024-10-25T10:30:00Z"
  }
]
```

#### POST /wallets

Create a new wallet for a user.

**Request Body:**

```json
{
  "userId": "user_67890",
  "currency": "USD",
  "initialBalance": 1000.0
}
```

**Response:** 201 Created with wallet object

#### GET /wallets/{id}

Retrieve a specific wallet by ID.

**Response:** Wallet object

#### PUT /wallets/{id}

Update an existing wallet.

**Request Body:**

```json
{
  "status": "SUSPENDED"
}
```

**Response:** Updated wallet object

#### DELETE /wallets/{id}

Delete a wallet by ID.

**Response:** 204 No Content

### Transaction Management

#### GET /transactions

Retrieve all transactions with filtering and pagination.

**Query Parameters:**

- `walletId` (optional): Filter by wallet ID
- `userId` (optional): Filter by user ID
- `type` (optional): Filter by transaction type (`CREDIT`, `DEBIT`, `TRANSFER`)
- `status` (optional): Filter by transaction status (`PENDING`, `COMPLETED`, `FAILED`, `CANCELLED`)
- `gatewayReference` (optional): Filter by gateway reference
- `startDate` (optional): Filter by start date
- `endDate` (optional): Filter by end date
- `limit` (optional): Limit number of results (default: 50)
- `offset` (optional): Offset for pagination (default: 0)

**Response:**

```json
{
  "transactions": [
    {
      "id": "txn_12345",
      "walletId": "wallet_12345",
      "type": "CREDIT",
      "amount": 500.0,
      "currency": "USD",
      "status": "COMPLETED",
      "gatewayReference": "pay_67890",
      "description": "Payment received",
      "createdAt": "2024-10-25T10:30:00Z",
      "completedAt": "2024-10-25T10:31:00Z"
    }
  ],
  "pagination": {
    "total": 100,
    "limit": 50,
    "offset": 0,
    "hasMore": true
  }
}
```

#### POST /transactions

Create a new transaction.

**Request Body:**

```json
{
  "walletId": "wallet_12345",
  "type": "DEBIT",
  "amount": 250.0,
  "currency": "USD",
  "gatewayReference": "booking_12345",
  "description": "Flight booking payment",
  "metadata": {
    "bookingId": "booking_12345",
    "serviceType": "flight"
  }
}
```

**Response:** 201 Created with transaction object

#### GET /transactions/{id}

Retrieve a specific transaction by ID.

**Response:** Transaction object

#### POST /transactions/{id}/cancel

Cancel a pending transaction.

**Response:** Updated transaction object with status `CANCELLED`

#### POST /transactions/{id}/complete

Complete a pending transaction.

**Request Body:**

```json
{
  "gatewayReference": "pay_67890"
}
```

**Response:** Updated transaction object with status `COMPLETED`

### Transfer Operations

#### POST /transfers

Create a transfer between wallets.

**Request Body:**

```json
{
  "fromWalletId": "wallet_12345",
  "toWalletId": "wallet_67890",
  "amount": 100.0,
  "currency": "USD",
  "description": "Internal transfer"
}
```

**Response:** 201 Created with transfer details

#### GET /transfers

Retrieve all transfers with filtering.

**Query Parameters:**

- `walletId` (optional): Filter by wallet ID (either from or to)
- `userId` (optional): Filter by user ID
- `status` (optional): Filter by transfer status

### Ledger Management

#### GET /ledger

Retrieve ledger entries with filtering.

**Query Parameters:**

- `walletId` (optional): Filter by wallet ID
- `transactionId` (optional): Filter by transaction ID
- `account` (optional): Filter by ledger account
- `startDate` (optional): Filter by start date
- `endDate` (optional): Filter by end date

**Response:**

```json
[
  {
    "id": "ledger_12345",
    "transactionId": "txn_12345",
    "account": "WALLET_DEBIT",
    "amount": -250.0,
    "currency": "USD",
    "description": "Flight booking payment",
    "createdAt": "2024-10-25T10:30:00Z"
  }
]
```

### Exchange Rate Management

#### GET /exchange-rates

Retrieve current exchange rates.

**Query Parameters:**

- `baseCurrency` (optional): Base currency for rates
- `targetCurrency` (optional): Target currency for rates

**Response:**

```json
[
  {
    "id": "rate_12345",
    "baseCurrency": "USD",
    "targetCurrency": "EUR",
    "rate": 0.85,
    "fetchedAt": "2024-10-25T10:30:00Z",
    "createdAt": "2024-10-25T10:30:00Z"
  }
]
```

#### POST /exchange-rates/refresh

Refresh exchange rates from external providers.

**Response:** 200 OK with refresh status

### Settlement Management

#### GET /settlements

Retrieve all settlements.

**Query Parameters:**

- `gateway` (optional): Filter by gateway
- `status` (optional): Filter by settlement status
- `startDate` (optional): Filter by start date
- `endDate` (optional): Filter by end date

**Response:**

```json
[
  {
    "id": "settlement_12345",
    "gateway": "stripe",
    "amount": 5000.0,
    "currency": "USD",
    "status": "COMPLETED",
    "settledAt": "2024-10-25T10:30:00Z",
    "createdAt": "2024-10-25T10:30:00Z"
  }
]
```

#### POST /settlements

Create a new settlement.

**Request Body:**

```json
{
  "gateway": "stripe",
  "amount": 5000.0,
  "currency": "USD",
  "reference": "settlement_12345"
}
```

**Response:** 201 Created with settlement object

### Bank Statement Management

#### GET /bank-statements

Retrieve bank statements.

**Query Parameters:**

- `gateway` (optional): Filter by gateway
- `matched` (optional): Filter by match status
- `startDate` (optional): Filter by start date
- `endDate` (optional): Filter by end date

**Response:**

```json
[
  {
    "id": "statement_12345",
    "gateway": "stripe",
    "amount": 1000.0,
    "currency": "USD",
    "description": "Customer payment",
    "date": "2024-10-25",
    "matched": true,
    "matchedAt": "2024-10-25T10:30:00Z",
    "createdAt": "2024-10-25T10:30:00Z"
  }
]
```

#### POST /bank-statements/match

Match bank statements with transactions.

**Request Body:**

```json
{
  "statementId": "statement_12345",
  "transactionId": "txn_12345"
}
```

**Response:** 200 OK with match status

### Dispute Management

#### GET /disputes

Retrieve all disputes.

**Query Parameters:**

- `transactionId` (optional): Filter by transaction ID
- `gateway` (optional): Filter by gateway
- `status` (optional): Filter by dispute status

**Response:**

```json
[
  {
    "id": "dispute_12345",
    "transactionId": "txn_12345",
    "gateway": "stripe",
    "amount": 250.0,
    "currency": "USD",
    "status": "PENDING",
    "reason": "Customer dispute",
    "createdAt": "2024-10-25T10:30:00Z",
    "updatedAt": "2024-10-25T10:30:00Z"
  }
]
```

#### POST /disputes

Create a new dispute.

**Request Body:**

```json
{
  "transactionId": "txn_12345",
  "gateway": "stripe",
  "reason": "Customer dispute",
  "amount": 250.0,
  "currency": "USD"
}
```

**Response:** 201 Created with dispute object

### FX Adjustment Management

#### GET /fx-adjustments

Retrieve all FX adjustments.

**Query Parameters:**

- `settlementId` (optional): Filter by settlement ID
- `startDate` (optional): Filter by start date
- `endDate` (optional): Filter by end date

**Response:**

```json
[
  {
    "id": "fx_12345",
    "settlementId": "settlement_12345",
    "amount": 50.0,
    "currency": "USD",
    "rate": 0.85,
    "createdAt": "2024-10-25T10:30:00Z"
  }
]
```

#### POST /fx-adjustments

Create a new FX adjustment.

**Request Body:**

```json
{
  "settlementId": "settlement_12345",
  "amount": 50.0,
  "currency": "USD",
  "rate": 0.85
}
```

**Response:** 201 Created with FX adjustment object

### Configuration Endpoints

#### GET /config/active-wallets

Retrieve configuration for all active wallets. Used by other services to get current wallet configuration.

**Response:** Array of active wallet objects

#### GET /config/exchange-rates/latest

Retrieve the latest exchange rates for all supported currencies.

**Response:**

```json
{
  "rates": {
    "USD": {
      "EUR": 0.85,
      "GBP": 0.75,
      "AED": 3.67
    },
    "EUR": {
      "USD": 1.18,
      "GBP": 0.88,
      "AED": 4.32
    }
  },
  "timestamp": "2024-10-25T10:30:00Z"
}
```

## Transaction Types

- **CREDIT**: Money added to wallet (payment received, refund)
- **DEBIT**: Money deducted from wallet (payment made, fees)
- **TRANSFER**: Internal transfer between wallets

## Transaction Statuses

- **PENDING**: Transaction initiated but not yet processed
- **COMPLETED**: Transaction successfully completed
- **FAILED**: Transaction failed
- **CANCELLED**: Transaction was cancelled

## Wallet Statuses

- **ACTIVE**: Wallet is active and can process transactions
- **INACTIVE**: Wallet is inactive
- **SUSPENDED**: Wallet is temporarily suspended

## Dispute Statuses

- **PENDING**: Dispute is under review
- **WON**: Dispute resolved in favor of the business
- **LOST**: Dispute resolved in favor of the customer
- **CANCELLED**: Dispute was cancelled

## Rate Limiting

The API implements rate limiting to ensure fair usage:

- Default: 200 requests per minute per API key
- Burst limit: 50 requests per second
- Higher limits available for enterprise accounts

## Webhook Events

The wallet service supports webhook events for real-time notifications:

### Supported Event Types

- `transaction.completed`: Transaction successfully completed
- `transaction.failed`: Transaction failed
- `wallet.created`: New wallet created
- `dispute.created`: New dispute created
- `settlement.completed`: Settlement completed

### Webhook Payload Example

```json
{
  "event": "transaction.completed",
  "data": {
    "transactionId": "txn_12345",
    "walletId": "wallet_12345",
    "amount": 250.0,
    "currency": "USD",
    "completedAt": "2024-10-25T10:30:00Z"
  },
  "timestamp": "2024-10-25T10:30:00Z",
  "signature": "webhook_signature_here"
}
```

## Monitoring

The API provides health check endpoints and metrics for monitoring:

- `/health`: Service health status
- Request/response logging with correlation IDs
- Performance metrics and error tracking
- Wallet balance monitoring
- Transaction volume metrics

## Security

- All API endpoints require authentication
- Sensitive data is encrypted in transit and at rest
- Webhook signatures are verified for authenticity
- Rate limiting prevents abuse
- Audit logs track all financial operations

## Support

For API support and documentation updates:

- Email: <api-support@tripalfa.com>
- Documentation: <https://docs.tripalfa.com/wallet-management>
- Status Page: <https://status.tripalfa.com>
