# Wallet Service - Quick Start Integration Guide

## 🚀 Getting Started with Wallet Service

### Prerequisites

- PostgreSQL running locally (tripalfa_local database)
- All workspace dependencies installed (`npm install`)
- Services built (`npm run build`)

---

## 1. Starting Services

### Start Individual Services (Development)

```bash
# Terminal 1: Wallet Service (Port 3008)
cd services/wallet-service
pnpm dev

# Terminal 2: Payment Service (Port 3007)
cd services/payment-service
pnpm dev

# Terminal 3: API Gateway (Port 3000)
cd services/api-gateway
pnpm dev

# Terminal 4: Booking Service (Port 3006)
cd services/booking-service
pnpm dev

# Terminal 5: Frontend (Port 5173)
cd apps/booking-engine
pnpm dev
```

### Or Start All Services via Root

```bash
# From repo root
npm run dev
# Typically starts api-gateway + booking-engine by default
```

---

## 2. Verify Services Are Running

```bash
# Check all services
curl http://localhost:3000/health        # API Gateway
curl http://localhost:3006/health        # Booking Service
curl http://localhost:3007/health        # Payment Service
curl http://localhost:3008/health        # Wallet Service

# Expected responses
{"status":"healthy|ok","service":"service-name"}
```

---

## 3. Access API Documentation

### Swagger UI

- **Payment Service**: http://localhost:3007/payment/api-docs
- **Wallet Service**: http://localhost:3008/wallet/api-docs
- **API Gateway**: http://localhost:3000/api-docs (if configured)

### OpenAPI Specs

- Payment: `http://localhost:3007/payment/openapi.json`
- Wallet: `http://localhost:3008/wallet/openapi.json`

---

## 4. Test Wallet Endpoints

### Get Authentication Token

```bash
# Login to get JWT token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'

# Response includes: { token: "eyJhbGc...", userId: "user_xxx", ... }
export TOKEN="eyJhbGc..."
```

### List User Wallets

```bash
curl -X GET http://localhost:3000/api/wallet \
  -H "Authorization: Bearer $TOKEN"

# Expected response:
[
  {
    "id": "wallet_123",
    "userId": "user_456",
    "currency": "USD",
    "balance": 1500.00,
    "status": "active",
    "createdAt": "2024-03-20T10:00:00Z"
  }
]
```

### Get Wallet Balance

```bash
curl -X GET "http://localhost:3000/api/wallet/balance?currency=USD" \
  -H "Authorization: Bearer $TOKEN"

# Expected response:
{
  "balance": 1500.00,
  "currency": "USD"
}
```

### Credit Wallet (Top-up)

```bash
curl -X POST http://localhost:3000/api/wallet/credit \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "currency": "USD",
    "amount": 500,
    "reason": "Manual top-up",
    "idempotencyKey": "'$(uuidgen)'"
  }'

# Expected response:
{
  "id": "txn_abc123",
  "walletId": "wallet_123",
  "type": "deposit",
  "flow": "credit",
  "amount": 500,
  "balance": 2000,
  "currency": "USD",
  "status": "completed",
  "createdAt": "2024-03-20T10:05:00Z"
}
```

### Debit Wallet (Withdraw)

```bash
curl -X POST http://localhost:3000/api/wallet/debit \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "currency": "USD",
    "amount": 200,
    "reason": "Booking payment",
    "idempotencyKey": "'$(uuidgen)'"
  }'

# Expected response:
{
  "id": "txn_def456",
  "walletId": "wallet_123",
  "type": "withdrawal",
  "flow": "debit",
  "amount": 200,
  "balance": 1300,
  "currency": "USD",
  "status": "completed"
}
```

### Transfer Between Currencies

```bash
curl -X POST http://localhost:3000/api/wallet/transfer \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fromCurrency": "USD",
    "toCurrency": "EUR",
    "amount": 100,
    "idempotencyKey": "'$(uuidgen)'"
  }'

# Expected response:
{
  "id": "txn_ghi789",
  "type": "transfer",
  "fromCurrency": "USD",
  "toCurrency": "EUR",
  "amount": 100,
  "exchangeRate": 0.92,
  "convertedAmount": 92,
  "status": "completed"
}
```

### View Transaction History

```bash
curl -X GET "http://localhost:3000/api/wallet/history?limit=20&offset=0" \
  -H "Authorization: Bearer $TOKEN"

# Expected response:
[
  {
    "id": "txn_...",
    "type": "deposit",
    "amount": 500,
    "balance": 2000,
    "currency": "USD",
    "createdAt": "2024-03-20T10:05:00Z"
  },
  ...
]
```

### Get FX Preview (No Transaction)

```bash
curl -X GET "http://localhost:3000/api/wallet/fx-preview?fromCurrency=USD&toCurrency=EUR&amount=100" \
  -H "Authorization: Bearer $TOKEN"

# Expected response:
{
  "fromCurrency": "USD",
  "fromAmount": 100,
  "toCurrency": "EUR",
  "toAmount": 92,
  "rate": 0.92,
  "timestamp": "2024-03-20T10:00:00Z"
}
```

---

## 5. Test Booking with Wallet Payment

### Create Flight Booking with Wallet Payment

```bash
curl -X POST http://localhost:3000/api/bookings \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "passengers": [
      {
        "firstName": "John",
        "lastName": "Doe",
        "dateOfBirth": "1990-01-01",
        "nationality": "US",
        "passportNumber": "ABC123456"
      }
    ],
    "flights": {
      "outbound": {
        "departureAirport": "LHR",
        "arrivalAirport": "JFK",
        "departureDate": "2024-04-15",
        "passengers": 1
      }
    },
    "paymentMethod": "WALLET",
    "currency": "USD"
  }'
```

### Process Wallet Payment for Existing Booking

```bash
curl -X POST http://localhost:3000/api/admin/bookings/{bookingId}/pay-wallet \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "paymentAmount": 1200.00,
    "currency": "USD"
  }'

# Expected: Booking status updates to "paid"
```

---

## 6. Database Queries

### Check Wallet Table

```sql
-- Connect to tripalfa_local
psql postgresql://user:password@localhost:5432/tripalfa_local

-- View user wallets
SELECT id, "userId", balance, currency, status FROM wallet;

-- View recent transactions
SELECT id, "walletId", type, flow, amount, balance, currency, status, "createdAt"
FROM wallet_transaction
ORDER BY "createdAt" DESC
LIMIT 20;

-- View ledger entries
SELECT id, "walletId", "entryType", amount, balance, currency, "accountType", "createdAt"
FROM wallet_ledger
ORDER BY "createdAt" DESC
LIMIT 20;
```

---

## 7. Common Issues & Troubleshooting

### Issue: "Unauthorized" Response

**Problem**: 401 error on wallet endpoints

**Solutions**:

```bash
# 1. Check token is valid
echo $TOKEN

# 2. Verify token format (should start with eyJ)
# 3. Check token hasn't expired
# 4. Make sure Authorization header is properly formatted
```

### Issue: "Wallet not found"

**Problem**: 404 error when accessing wallet

**Solutions**:

```bash
# 1. Create wallet for user first
curl -X POST http://localhost:3000/api/wallet \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"currency": "USD"}'

# 2. Verify user has been created
# 3. Check user ID matches authenticated user
```

### Issue: "Insufficient balance"

**Problem**: Cannot debit more than available balance

**Solutions**:

- Top-up wallet: See "Credit Wallet" endpoint
- Check current balance: `GET /api/wallet/balance`
- Review transaction history: `GET /api/wallet/history`

### Issue: "Duplicate transaction"

**Problem**: Same idempotencyKey used twice

**Expected Behavior**:

- Should return cached result from first request (Idempotent)
- Use new UUID: `$(uuidgen)`

### Issue: Service not responding

**Problem**: Connection refused on port 3007/3008/3000

**Solutions**:

```bash
# Check if port is in use
lsof -i :3007
lsof -i :3008
lsof -i :3000

# Kill process on port
kill -9 <PID>

# Restart service
cd services/payment-service && pnpm dev
```

---

## 8. Testing Checklist

- [ ] Services start without errors
- [ ] Health checks pass for all services
- [ ] Can obtain valid JWT token
- [ ] Can list wallets for authenticated user
- [ ] Can check wallet balance
- [ ] Can credit wallet and balance increases
- [ ] Can debit wallet and balance decreases (with sufficient funds)
- [ ] Can transfer between currencies
- [ ] Can view transaction history
- [ ] Can get FX preview
- [ ] Can create booking with WALLET payment
- [ ] Insufficient balance prevents debit
- [ ] Idempotency prevents duplicate charges
- [ ] Rate limiting enforced

---

## 9. Development Workflow

### Making Changes to Wallet Service

```bash
# 1. Edit files in services/wallet-service/src/
# 2. TypeScript auto-recompiles (with tsx watch)
# 3. Restart server if needed or hot-reload
# 4. Test via curl or Swagger UI

# Run tests
cd services/wallet-service
pnpm test

# Run linting
pnpm lint
pnpm lint:fix

# Build for production
pnpm build
```

### Making Changes to WalletManager

```bash
# 1. Edit packages/wallet/src/services/index.ts
# 2. Recompile package
cd packages/wallet
pnpm build

# 3. This is used by payment-service
# 4. Restart payment-service to pick up changes
cd services/payment-service && pnpm dev

# Run tests
pnpm test
```

---

## 10. Production Deployment

### Build All Services

```bash
npm run build
```

### Environment Setup

```bash
# Copy .env.example to .env for production
cp .env.example .env

# Update with production values:
# - DATABASE_URL (production database)
# - WALLET_SERVICE_PORT (or use default 3008)
# - WALLET_SERVICE_URL (production URL)
# - ENABLE_WALLET=true
# - JWT_SECRET
# - NODE_ENV=production
```

### Start Services

```bash
# Production start
cd services/wallet-service && npm start
cd services/payment-service && npm start
cd services/api-gateway && npm start
```

### Docker Deployment

```bash
# If Dockerfile exists
docker build -t tripalfa/wallet-service ./services/wallet-service
docker run -p 3008:3008 \
  -e DATABASE_URL="..." \
  -e NODE_ENV=production \
  tripalfa/wallet-service
```

---

## 11. Monitoring & Debugging

### Check Logs

```bash
# Payment Service
tail -f logs/payment-service.log

# Wallet Service
tail -f logs/wallet-service.log

# Booking Service
tail -f logs/booking-service.log
```

### Monitor Database

```bash
# Check active connections
SELECT * FROM pg_stat_activity;

# Check slow queries
SELECT * FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;

# Monitor wallet transactions in real-time
watch -n 1 'psql -c "SELECT COUNT(*) FROM wallet_transaction;"'
```

### Performance Testing

```bash
# Load test wallet endpoints
ab -n 1000 -c 10 \
  -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/wallet

# Check rate limiting (should get 429 after limit exceeded)
for i in {1..15}; do
  curl -X POST http://localhost:3000/api/wallet/debit \
    -H "Authorization: Bearer $TOKEN" \
    -d '{"currency":"USD","amount":1,"idempotencyKey":"test-'$i'"}' \
    -H "Content-Type: application/json"
  echo "Request $i"
done
```

---

## 12. Useful Commands

```bash
# Format code
npm run format

# Lint code
npm run lint
npm run lint:fix

# Type check
npx tsc --noEmit

# Generate database types
npm run db:generate

# Push database schema
npm run db:push

# Run migrations
npm run db:migrate

# Seed database
npm run seed

# Run all tests
npm test

# Run tests for specific service
npm test --workspace=@tripalfa/payment-service
npm test --workspace=@tripalfa/wallet
```

---

## 13. References

**Documentation**:

- Complete Report: `WALLET_INFRASTRUCTURE_REPORT.md`
- Architecture: `WALLET_ARCHITECTURE_VISUAL.md`
- File Inventory: `WALLET_FILES_INVENTORY.md`
- API Reference: `services/wallet-service/docs/api-reference.md`

**Key Files**:

- Wallet Schema: `database/prisma/schema.core.prisma` (lines 1065-1175)
- WalletManager: `packages/wallet/src/services/index.ts`
- Payment Wallet Routes: `services/payment-service/src/routes/wallet.ts`
- API Gateway Config: `services/api-gateway/src/config/api-manager.config.ts`

**Phase 2 Planning**:

- `docs/PAYMENT_PHASE1_IMPLEMENTATION.md`
- `docs/PAYMENT_TESTING_QUICKSTART.md`

---

## 14. Get Help

If you encounter issues:

1. Check troubleshooting section above
2. Review logs in service terminals
3. Check database state using SQL queries
4. Verify service health checks pass
5. Review related documentation files
6. Check payment-service/wallet.ts for endpoint details

**Note**: As of March 20, 2026, there is a known issue with WalletManager initialization in payment-service that needs to be fixed for full wallet functionality. See `WALLET_INFRASTRUCTURE_REPORT.md` section 9.1 for details.

---

**Last Updated**: March 20, 2026  
**Quick Start Version**: 1.0  
**Status**: Ready for Phase 2 development
