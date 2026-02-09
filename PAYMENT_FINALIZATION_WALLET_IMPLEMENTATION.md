# Payment Finalization & Wallet System - Implementation Guide

**Date**: February 7, 2026  
**Status**: ✅ FILES CREATED & INTEGRATED  
**Next Step**: Build verification and testing

---

## Overview

This document covers the implementation of two critical features:

1. **Payment Finalization Service** - Completes hold orders by processing payment and generating documents
2. **Wallet Service** - Manages wallet top-ups with credit card surcharges

These services work together to provide a complete payment flow:
- Hold order (no payment) → Payment finalization (on confirmation) → Wallet debit → Document generation

---

## Architecture

### Payment Flow Diagram

```
┌─────────────────┐
│  Hold Order     │
│  (Created)      │
│  Status: Hold   │
│  Payment: None  │
└────────┬────────┘
         │
      [Deadline expires or customer finalizes]
         │
         ▼
┌──────────────────────────┐
│ Payment Finalization     │
│  ✓ Validate eligibility  │
│  ✓ Process payment       │
│  ✓ Update booking status │
│  ✓ Generate documents    │
│  ✓ Send notifications    │
└────────┬─────────────────┘
         │
      [Success]
         │
         ▼
┌──────────────────────────┐
│  Booking Confirmed       │
│  Status: CONFIRMED       │
│  Payment: PAID           │
│  Documents: Generated    │
│  • Invoice               │
│  • Receipt               │
│  • E-Ticket              │
│  • Itinerary             │
└──────────────────────────┘
```

### Wallet Flow Diagram

```
┌──────────────────┐
│ Top-Up Request   │
│ Amount: X        │
│ Method: Card     │
└────────┬─────────┘
         │
         ▼
┌──────────────────────────────┐
│ Calculate Surcharge          │
│ Base: X                      │
│ Surcharge (2.5%): X * 0.025  │
│ Total Debit: X + Surcharge   │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│ Process Payment (Gateway)    │
│ Amount: Total Debit          │
│ Card Processing              │
└────────┬─────────────────────┘
         │
      [Success - Fund Received]
         │
         ▼
┌──────────────────────────────┐
│ Credit Wallet                │
│ Amount: Base (X)             │
│ NOT surcharge                │
│ New Balance: Old + X         │
└──────────────────────────────┘
```

---

## Files Created

### 1. Payment Finalization Service

**File**: `services/booking-service/src/services/paymentFinalizationService.ts`  
**Size**: ~400 lines  
**Purpose**: Orchestrate payment finalization workflow

#### Key Methods

```typescript
// Main finalization workflow
async finalizePayment(request: PaymentFinalizationRequest): Promise<PaymentFinalizationResponse>

// Validation
private async validatePaymentEligibility(request: PaymentFinalizationRequest): Promise<void>

// Payment processing
private async processPaymentTransaction(request: PaymentFinalizationRequest)

// Booking status update
private async updateBookingStatus(bookingId: string, newStatus: string): Promise<void>

// Document generation
private async generateFinalizationDocuments(request: PaymentFinalizationRequest): Promise<Record<string, string>>

// Notifications
private async sendFinalizationNotifications(request: PaymentFinalizationRequest): Promise<void>

// Queries
async getFinalizationStatus(paymentId: string): Promise<PaymentFinalizationResponse | null>
getFinalizationHistory(limit: number = 100)
isPaymentFinalized(bookingId: string): boolean
async getPaymentStats()
```

#### Workflow Steps

1. **Validate** - Check if payment is allowed (order exists, amount valid, etc.)
2. **Process** - Call paymentService to handle actual payment
3. **Update** - Change booking status from "HOLD" to "CONFIRMED"
4. **Documents** - Generate Invoice, Receipt, E-Ticket, Itinerary
5. **Notify** - Send payment confirmation and booking confirmation to customer
6. **Log** - Record transaction for audit trail

---

### 2. Wallet Service

**File**: `services/booking-service/src/services/walletService.ts`  
**Size**: ~450 lines  
**Purpose**: Manage wallet operations with surcharge handling

#### Key Methods

```typescript
// Top-up with surcharge
async topUpWallet(request: TopUpRequest): Promise<TopUpResponse>

// Wallet operations
async debitWallet(customerId: string, amount: number, reference: string): Promise<{...}>
async getWalletBalance(customerId: string): Promise<{...}>
getWalletTransactionHistory(customerId: string, limit: number = 50): WalletTransaction[]
async getWalletStats(customerId: string): Promise<{...}>

// Surcharge calculations
private calculateSurcharge(baseAmount: number, paymentMethod)
calculateTotalCost(amount: number, paymentMethod)
getSurchargeInfo(): Record<string, number>
```

#### Surcharge Structure

```typescript
const SURCHARGE_STRUCTURE = {
  card: 2.5,           // 2.5% for credit card processing fees
  bank_transfer: 0.5,  // 0.5% for bank transfer fees
  crypto: 1.0          // 1% for cryptocurrency processing fees
};
```

#### Key Point: Surcharge NOT Added to Wallet

```
User Top-Up: 1000 USD
├─ Method: Credit card
├─ Surcharge: 2.5% = 25 USD
├─ Total Customer Pays: 1025 USD ← Charged from customer's card
├─ Wallet Credit: 1000 USD ← Added to wallet (NOT surcharge)
└─ Company Keeps: 25 USD ← Processing fee
```

---

### 3. Payment Wallet Controller

**File**: `services/booking-service/src/controllers/paymentWalletController.ts`  
**Size**: ~300 lines  
**Purpose**: Handle HTTP requests for payment & wallet operations

#### Endpoints Implemented

```typescript
// Payment Finalization
POST   /bookings/payment/finalize                    // Finalize hold order
GET    /bookings/payment/status/:paymentId          // Get payment status
GET    /bookings/payment/statistics                 // Payment stats

// Wallet Top-Up
POST   /bookings/wallet/topup                       // Top up wallet
POST   /bookings/wallet/calculate-cost              // Calculate total cost

// Wallet Info
GET    /bookings/wallet/balance/:customerId         // Get balance
GET    /bookings/wallet/history/:customerId         // Transaction history
GET    /bookings/wallet/statistics/:customerId      // Wallet stats
GET    /bookings/wallet/surcharges                  // View surcharge rates
```

---

### 4. Payment Wallet Routes

**File**: `services/booking-service/src/routes/paymentWalletRoutes.ts`  
**Size**: ~80 lines  
**Purpose**: Route definitions with documentation

All endpoints mount on `/bookings` prefix via app.ts registration

---

## Integration with App

### Modified File: `src/app.ts`

**Changes**:
1. Added import for `paymentWalletRoutes`
2. Registered routes with rate limiting middleware

```typescript
import paymentWalletRoutes from './routes/paymentWalletRoutes.js';
// ...
app.use('/bookings', rateLimiters.booking, paymentWalletRoutes);
```

---

## API Examples

### 1. Finalize Payment

**Request**:
```bash
curl -X POST http://localhost:8000/bookings/payment/finalize \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "HOLD-123",
    "bookingId": "BK-ABC123",
    "customerId": "CUST-001",
    "amount": 599.99,
    "currency": "USD",
    "paymentMethod": "balance",
    "paymentDetails": {
      "transactionId": "TXN-789"
    }
  }'
```

**Response**:
```json
{
  "success": true,
  "data": {
    "paymentId": "PAY-uuid",
    "bookingId": "BK-ABC123",
    "status": "completed",
    "documents": {
      "invoice": "invoice_BK-ABC123.pdf",
      "receipt": "receipt_BK-ABC123.pdf",
      "eTicket": "eticket_BK-ABC123.pdf",
      "itinerary": "itinerary_BK-ABC123.pdf"
    },
    "message": "Payment finalized successfully..."
  }
}
```

### 2. Top-Up Wallet

**Request**:
```bash
curl -X POST http://localhost:8000/bookings/wallet/topup \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "CUST-001",
    "amount": 1000,
    "currency": "USD",
    "paymentMethod": "card",
    "cardDetails": {
      "last4": "4242",
      "brand": "Visa",
      "expiryMonth": 12,
      "expiryYear": 2025
    }
  }'
```

**Response**:
```json
{
  "success": true,
  "data": {
    "transactionId": "TOP-uuid",
    "customerId": "CUST-001",
    "topUpAmount": 1000,
    "surcharge": 25,
    "totalDebit": 1025,
    "newBalance": 1000,
    "currency": "USD",
    "message": "Top-up successful. Wallet credited 1000 USD. Surcharge: 25.00 USD"
  }
}
```

### 3. Get Wallet Balance

**Request**:
```bash
curl http://localhost:8000/bookings/wallet/balance/CUST-001
```

**Response**:
```json
{
  "success": true,
  "data": {
    "customerId": "CUST-001",
    "balance": 1000,
    "currency": "USD",
    "lastTopUp": "2026-02-07T06:00:00Z"
  }
}
```

### 4. Get Surcharge Information

**Request**:
```bash
curl http://localhost:8000/bookings/wallet/surcharges
```

**Response**:
```json
{
  "success": true,
  "data": {
    "card": 2.5,
    "bank_transfer": 0.5,
    "crypto": 1
  },
  "message": "Surcharge rates for wallet top-ups"
}
```

---

## Data Flow: Complete Journey

### Scenario: Book Flight & Pay Later

**Step 1: Create Hold Order**
```
POST /bookings/hold/orders
  customerId: CUST-001
  amount: 599.99
  
→ Hold created
→ No payment deducted
→ Status: ACTIVE
```

**Step 2: Hold Expires or Customer Pays**
```
POST /bookings/payment/finalize
  orderId: HOLD-123
  bookingId: BK-ABC123
  amount: 599.99

→ Payment validated
→ Payment processed from wallet
→ Booking status → CONFIRMED
→ Documents generated (4 files)
→ Notifications sent
```

**Step 3: Check Payment Status**
```
GET /bookings/payment/status/PAY-xxx
  
→ Shows confirmation
→ Lists generated documents
→ Payment confirmed
```

### Scenario: Top-Up Wallet with Card

**Step 1: Calculate Cost**
```
POST /bookings/wallet/calculate-cost
  amount: 1000
  paymentMethod: "card"
  
→ Returns:
  baseAmount: 1000
  surchargePercentage: 2.5
  surchargeAmount: 25
  totalAmount: 1025
```

**Step 2: Top-Up Wallet**
```
POST /bookings/wallet/topup
  customerId: CUST-001
  amount: 1000
  paymentMethod: "card"
  
→ Payment processed for 1025 USD
→ Wallet credited 1000 USD
→ Surcharge (25 USD) goes to company
→ Transaction recorded
```

**Step 3: Check Balance**
```
GET /bookings/wallet/balance/CUST-001
  
→ Balance: 1000 USD
→ Can now book with wallet
```

---

## Key Financial Rules

### Payment Finalization
- ✅ Deducts amount from wallet or incoming payment
- ✅ Updates booking status to CONFIRMED
- ✅ Generates all required documents
- ✅ Sends notifications
- ✅ Records transaction

### Wallet Top-Up
- ✅ Surcharge calculated based on payment method
- ✅ Surcharge is ADDED to payment (customer pays it)
- ✅ Surcharge is NOT added to wallet (company keeps it)
- ✅ Only base amount credited to wallet

### Hold Orders (No Change)
- ✅ No payment during hold
- ✅ No wallet impact
- ✅ Pure reservation
- ✅ Payment deferred

---

## Document Generation Integration

Payment finalization automatically generates:

1. **Invoice** - Customer billing document
2. **Receipt** - Payment proof
3. **E-Ticket** - For flight/transport bookings
4. **Itinerary** - Booking details

These are generated via existing `documentGenerationService`:
```typescript
await documentGenerationService.generateInvoice(booking);
await documentGenerationService.generateReceipt(booking);
await documentGenerationService.generateETicket(booking);
await documentGenerationService.generateItinerary(booking);
```

---

## Error Handling

### Payment Finalization Errors
- `Missing required fields` → 400
- `Insufficient wallet balance` → 400
- `Payment processing failed` → 400
- `Document generation failed` → Still completes (non-critical)
- `Notification failed` → Still completes (non-critical)

### Wallet Top-Up Errors
- `Invalid payment method` → 400
- `Card details missing` → 400
- `Payment gateway failure` → 400
- `Invalid top-up amount` → 400

---

## Next Steps

### Build & Testing
1. ✅ Services created
2. ✅ Controllers created
3. ✅ Routes created
4. ✅ App.ts integrated
5. ⏳ **BUILD VERIFICATION** - Run `npm run build`
6. ⏳ **Unit Tests** - Create test cases
7. ⏳ **Integration Tests** - Full workflow testing

### Kong Integration
- Add new endpoints to Kong routes
- Update rate limiting for wallet endpoints
- Test through Kong proxy

### Frontend Integration
- Add payment finalization component
- Add wallet top-up form
- Update booking confirmation page

---

## Summary

✅ **Payment Finalization Service**: Complete workflow from hold order to confirmed booking with documents  
✅ **Wallet Service**: Full wallet management with surcharge calculations  
✅ **Controllers & Routes**: All endpoints implemented  
✅ **App Integration**: Registered with rate limiting middleware  
⏳ **Build Verification**: Next step required

**Total New Code**: ~1,200 lines across 4 files
