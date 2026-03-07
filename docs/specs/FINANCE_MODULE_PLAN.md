# Finance Module Implementation Plan

## Overview

This document outlines the implementation of two new submodules under the Finance Module:

1. **Currency Management** - Manage currencies with exchange rates, buffer/margin for ROE fluctuations, decimal precision, and rounding options
2. **Reports** - Reports to monitor B2B and B2C consumers

## Currency Management Features

### Database Schema Changes

- Add `bufferPercentage` field to Currency model for ROE fluctuations
- Add `decimalPrecision` field to specify decimal places per currency
- Add `roundingMode` field for rounding strategy (HALF_UP, HALF_DOWN, BANKERS, etc.)
- Add `isBaseCurrency` field to designate base currency

### UI Components

1. **CurrencyList** - Data table showing all currencies with:
   - Code, Name, Symbol
   - Current Exchange Rate (from OpenExchange API)
   - Buffer % (editable)
   - Effective Rate (calculated: rate + buffer)
   - Decimal Precision (editable)
   - Rounding Mode (dropdown)
   - Status (active/inactive)

2. **CurrencyForm** - Dialog for editing currency settings:
   - Buffer percentage input (0-100%)
   - Decimal precision selector (0-6 decimals)
   - Rounding mode dropdown
   - Active/Inactive toggle

### Functionality

- Sync with OpenExchange API every 1 hour (existing cron)
- Manual override for exchange rates
- Buffer calculation: Effective Rate = Base Rate × (1 + Buffer%)
- Rounding using moneyx patterns (HALF_UP, HALF_DOWN, BANKERS, etc.)

## Reports Features

### B2B Reports

1. **Company Transaction Summary**
   - Total bookings per company
   - Revenue by company
   - Payment status breakdown
   - Commission earned

2. **Company Performance**
   - Booking volume trends
   - Popular routes/destinations
   - Average booking value
   - Customer retention

### B2C Reports

1. **Customer Analytics**
   - Total customers
   - New vs returning customers
   - Customer lifetime value
   - Booking frequency

2. **Booking Trends**
   - Daily/weekly/monthly bookings
   - Revenue trends
   - Popular services (flight/hotel)
   - Cancellation rates

### Common Reports

1. **Financial Summary**
   - Total revenue
   - Pending payments
   - Refunds issued
   - Net revenue

2. **Export Options**
   - CSV export
   - Date range filtering

## Implementation Steps

### Step 1: Database Schema

- [ ] Update Currency model with new fields
- [ ] Run migration

### Step 2: Currency Management UI

- [ ] Create CurrencyService API
- [ ] Create CurrencyList page
- [ ] Create CurrencySettings dialog
- [ ] Add to routing

### Step 3: Reports UI

- [ ] Create ReportsService API
- [ ] Create B2B Reports page
- [ ] Create B2C Reports page
- [ ] Add to routing

### Step 4: Sidebar Updates

- [ ] Add Currency Management menu item
- [ ] Add Reports menu item

### Step 5: Integration

- [ ] Connect with existing FX service
- [ ] Test currency conversion with buffer
- [ ] Test rounding calculations

## Reference

- Money library: <https://github.com/devAbreu/moneyx>
- Key features: Decimal precision, multiple rounding modes, currency validation
