# Rule Management System - Example Configurations

This document provides practical examples of rule configurations for different business scenarios in the TripAlfa platform.

## Table of Contents

1. [Flight Rules Examples](#flight-rules-examples)
2. [Hotel Rules Examples](#hotel-rules-examples)
3. [Car Rental Rules Examples](#car-rental-rules-examples)
4. [Package Rules Examples](#package-rules-examples)
5. [Payment Rules Examples](#payment-rules-examples)
6. [User Rules Examples](#user-rules-examples)
7. [Booking Rules Examples](#booking-rules-examples)

## Flight Rules Examples

### 1. Corporate Discount Rule

**Scenario**: Apply 15% discount for corporate bookings made 14+ days in advance

```json
{
  "name": "Corporate Advance Booking Discount",
  "description": "15% discount for corporate flight bookings made 14+ days in advance",
  "category": "flight",
  "conditions": {
    "type": "object",
    "properties": {
      "bookingType": { "const": "flight" },
      "corporate": { "const": true },
      "advanceBookingDays": { "minimum": 14 },
      "flightClass": { "enum": ["economy", "business"] }
    },
    "required": ["bookingType", "corporate", "advanceBookingDays", "flightClass"]
  },
  "actions": [
    {
      "type": "apply_discount",
      "value": 15,
      "currency": "USD",
      "applyTo": "base_fare",
      "maxDiscount": 200
    }
  ],
  "priority": 500,
  "isActive": true
}
```

### 2. Last Minute Booking Markup

**Scenario**: Apply 25% markup for bookings made within 3 days of departure

```json
{
  "name": "Last Minute Booking Markup",
  "description": "25% markup for flight bookings made within 3 days of departure",
  "category": "flight",
  "conditions": {
    "type": "object",
    "properties": {
      "bookingType": { "const": "flight" },
      "advanceBookingDays": { "maximum": 3 },
      "flightClass": { "const": "economy" }
    },
    "required": ["bookingType", "advanceBookingDays", "flightClass"]
  },
  "actions": [
    {
      "type": "apply_markup",
      "value": 25,
      "currency": "USD",
      "applyTo": "total_price"
    }
  ],
  "priority": 800,
  "isActive": true
}
```

### 3. Premium Class Upgrade Rule

**Scenario**: Offer free seat upgrade for premium members on international flights

```json
{
  "name": "Premium Member Upgrade",
  "description": "Free seat upgrade for premium members on international flights",
  "category": "flight",
  "conditions": {
    "type": "object",
    "properties": {
      "bookingType": { "const": "flight" },
      "userType": { "const": "premium" },
      "flightType": { "const": "international" },
      "flightClass": { "const": "economy" }
    },
    "required": ["bookingType", "userType", "flightType", "flightClass"]
  },
  "actions": [
    {
      "type": "upgrade_class",
      "fromClass": "economy",
      "toClass": "business",
      "cost": 0
    }
  ],
  "priority": 900,
  "isActive": true
}
```

## Hotel Rules Examples

### 1. Weekend Stay Discount

**Scenario**: 20% discount for weekend bookings (Friday-Sunday)

```json
{
  "name": "Weekend Stay Discount",
  "description": "20% discount for hotel bookings on weekends",
  "category": "hotel",
  "conditions": {
    "type": "object",
    "properties": {
      "bookingType": { "const": "hotel" },
      "checkInDay": { "enum": ["friday", "saturday", "sunday"] },
      "stayDuration": { "minimum": 2 }
    },
    "required": ["bookingType", "checkInDay", "stayDuration"]
  },
  "actions": [
    {
      "type": "apply_discount",
      "value": 20,
      "currency": "USD",
      "applyTo": "room_rate"
    }
  ],
  "priority": 400,
  "isActive": true
}
```

### 2. Long Stay Bonus

**Scenario**: Free night for stays longer than 7 nights

```json
{
  "name": "Long Stay Bonus",
  "description": "Free night for hotel stays longer than 7 nights",
  "category": "hotel",
  "conditions": {
    "type": "object",
    "properties": {
      "bookingType": { "const": "hotel" },
      "stayDuration": { "minimum": 8 }
    },
    "required": ["bookingType", "stayDuration"]
  },
  "actions": [
    {
      "type": "add_free_night",
      "nightCount": 1,
      "applyAfterNights": 7
    }
  ],
  "priority": 600,
  "isActive": true
}
```

### 3. Business Traveler Perks

**Scenario**: Free Wi-Fi and late checkout for business bookings

```json
{
  "name": "Business Traveler Perks",
  "description": "Free Wi-Fi and late checkout for business hotel bookings",
  "category": "hotel",
  "conditions": {
    "type": "object",
    "properties": {
      "bookingType": { "const": "hotel" },
      "purpose": { "const": "business" },
      "roomType": { "enum": ["standard", "deluxe"] }
    },
    "required": ["bookingType", "purpose", "roomType"]
  },
  "actions": [
    {
      "type": "add_service",
      "service": "free_wifi",
      "cost": 0
    },
    {
      "type": "extend_checkout",
      "hours": 2,
      "cost": 0
    }
  ],
  "priority": 300,
  "isActive": true
}
```

## Car Rental Rules Examples

### 1. Weekly Rental Discount

**Scenario**: 15% discount for car rentals longer than 5 days

```json
{
  "name": "Weekly Rental Discount",
  "description": "15% discount for car rentals longer than 5 days",
  "category": "car",
  "conditions": {
    "type": "object",
    "properties": {
      "bookingType": { "const": "car" },
      "rentalDuration": { "minimum": 6 }
    },
    "required": ["bookingType", "rentalDuration"]
  },
  "actions": [
    {
      "type": "apply_discount",
      "value": 15,
      "currency": "USD",
      "applyTo": "daily_rate"
    }
  ],
  "priority": 400,
  "isActive": true
}
```

### 2. Premium Vehicle Surcharge

**Scenario**: 50% surcharge for premium vehicle categories

```json
{
  "name": "Premium Vehicle Surcharge",
  "description": "50% surcharge for premium vehicle categories",
  "category": "car",
  "conditions": {
    "type": "object",
    "properties": {
      "bookingType": { "const": "car" },
      "vehicleCategory": { "enum": ["luxury", "sports", "premium"] }
    },
    "required": ["bookingType", "vehicleCategory"]
  },
  "actions": [
    {
      "type": "apply_markup",
      "value": 50,
      "currency": "USD",
      "applyTo": "base_rate"
    }
  ],
  "priority": 700,
  "isActive": true
}
```

### 3. Insurance Bundle Offer

**Scenario**: 20% discount when booking comprehensive insurance

```json
{
  "name": "Insurance Bundle Discount",
  "description": "20% discount when booking comprehensive insurance with car rental",
  "category": "car",
  "conditions": {
    "type": "object",
    "properties": {
      "bookingType": { "const": "car" },
      "insuranceType": { "const": "comprehensive" }
    },
    "required": ["bookingType", "insuranceType"]
  },
  "actions": [
    {
      "type": "apply_discount",
      "value": 20,
      "currency": "USD",
      "applyTo": "total_cost"
    }
  ],
  "priority": 500,
  "isActive": true
}
```

## Package Rules Examples

### 1. Family Package Discount

**Scenario**: 10% discount for family packages (3+ adults)

```json
{
  "name": "Family Package Discount",
  "description": "10% discount for family packages with 3 or more adults",
  "category": "package",
  "conditions": {
    "type": "object",
    "properties": {
      "bookingType": { "const": "package" },
      "packageType": { "const": "family" },
      "adultCount": { "minimum": 3 }
    },
    "required": ["bookingType", "packageType", "adultCount"]
  },
  "actions": [
    {
      "type": "apply_discount",
      "value": 10,
      "currency": "USD",
      "applyTo": "package_price"
    }
  ],
  "priority": 450,
  "isActive": true
}
```

### 2. Early Bird Package Savings

**Scenario**: 25% discount for package bookings made 60+ days in advance

```json
{
  "name": "Early Bird Package Savings",
  "description": "25% discount for package bookings made 60+ days in advance",
  "category": "package",
  "conditions": {
    "type": "object",
    "properties": {
      "bookingType": { "const": "package" },
      "advanceBookingDays": { "minimum": 60 },
      "packageDuration": { "minimum": 5 }
    },
    "required": ["bookingType", "advanceBookingDays", "packageDuration"]
  },
  "actions": [
    {
      "type": "apply_discount",
      "value": 25,
      "currency": "USD",
      "applyTo": "total_package_price"
    }
  ],
  "priority": 800,
  "isActive": true
}
```

### 3. Honeymoon Package Perks

**Scenario**: Free room upgrade and champagne for honeymoon packages

```json
{
  "name": "Honeymoon Package Perks",
  "description": "Free room upgrade and champagne for honeymoon packages",
  "category": "package",
  "conditions": {
    "type": "object",
    "properties": {
      "bookingType": { "const": "package" },
      "packageType": { "const": "honeymoon" }
    },
    "required": ["bookingType", "packageType"]
  },
  "actions": [
    {
      "type": "upgrade_accommodation",
      "fromCategory": "standard",
      "toCategory": "suite",
      "cost": 0
    },
    {
      "type": "add_service",
      "service": "champagne_welcome",
      "cost": 0
    }
  ],
  "priority": 900,
  "isActive": true
}
```

## Payment Rules Examples

### 1. Credit Card Processing Fee

**Scenario**: 2.5% processing fee for credit card payments

```json
{
  "name": "Credit Card Processing Fee",
  "description": "2.5% processing fee for credit card payments",
  "category": "payment",
  "conditions": {
    "type": "object",
    "properties": {
      "paymentMethod": { "const": "credit_card" }
    },
    "required": ["paymentMethod"]
  },
  "actions": [
    {
      "type": "add_fee",
      "percentage": 2.5,
      "description": "Credit card processing fee"
    }
  ],
  "priority": 200,
  "isActive": true
}
```

### 2. Early Payment Discount

**Scenario**: 5% discount for payments made within 7 days of booking

```json
{
  "name": "Early Payment Discount",
  "description": "5% discount for payments made within 7 days of booking",
  "category": "payment",
  "conditions": {
    "type": "object",
    "properties": {
      "paymentMethod": { "enum": ["credit_card", "debit_card", "bank_transfer"] },
      "paymentDaysAfterBooking": { "maximum": 7 }
    },
    "required": ["paymentMethod", "paymentDaysAfterBooking"]
  },
  "actions": [
    {
      "type": "apply_discount",
      "value": 5,
      "currency": "USD",
      "applyTo": "total_amount"
    }
  ],
  "priority": 600,
  "isActive": true
}
```

### 3. Installment Payment Plan

**Scenario**: Allow installment payments for bookings over $1000

```json
{
  "name": "Installment Payment Plan",
  "description": "Allow installment payments for bookings over $1000",
  "category": "payment",
  "conditions": {
    "type": "object",
    "properties": {
      "totalAmount": { "minimum": 1000 },
      "bookingType": { "enum": ["flight", "hotel", "package"] }
    },
    "required": ["totalAmount", "bookingType"]
  },
  "actions": [
    {
      "type": "enable_installments",
      "maxInstallments": 6,
      "interestRate": 0,
      "setupFee": 25
    }
  ],
  "priority": 300,
  "isActive": true
}
```

## User Rules Examples

### 1. VIP Member Benefits

**Scenario**: VIP members get priority support and free changes

```json
{
  "name": "VIP Member Benefits",
  "description": "VIP members get priority support and free booking changes",
  "category": "user",
  "conditions": {
    "type": "object",
    "properties": {
      "userType": { "const": "vip" },
      "membershipTier": { "const": "gold" }
    },
    "required": ["userType", "membershipTier"]
  },
  "actions": [
    {
      "type": "priority_support",
      "responseTime": "2_hours"
    },
    {
      "type": "free_changes",
      "maxChangesPerYear": 12,
      "cost": 0
    }
  ],
  "priority": 950,
  "isActive": true
}
```

### 2. New User Welcome Bonus

**Scenario**: New users get $50 credit on first booking

```json
{
  "name": "New User Welcome Bonus",
  "description": "$50 credit for new users on their first booking",
  "category": "user",
  "conditions": {
    "type": "object",
    "properties": {
      "userType": { "const": "new" },
      "firstBooking": { "const": true },
      "bookingAmount": { "minimum": 100 }
    },
    "required": ["userType", "firstBooking", "bookingAmount"]
  },
  "actions": [
    {
      "type": "apply_credit",
      "amount": 50,
      "currency": "USD",
      "validFor": "first_booking"
    }
  ],
  "priority": 850,
  "isActive": true
}
```

### 3. Loyalty Points Multiplier

**Scenario**: Double loyalty points for premium members

```json
{
  "name": "Loyalty Points Multiplier",
  "description": "Double loyalty points for premium members",
  "category": "user",
  "conditions": {
    "type": "object",
    "properties": {
      "userType": { "const": "premium" },
      "membershipTier": { "enum": ["silver", "gold", "platinum"] }
    },
    "required": ["userType", "membershipTier"]
  },
  "actions": [
    {
      "type": "multiply_points",
      "multiplier": 2,
      "validFor": "all_bookings"
    }
  ],
  "priority": 700,
  "isActive": true
}
```

## Booking Rules Examples

### 1. Minimum Stay Requirement

**Scenario**: Minimum 3-night stay required for weekend bookings

```json
{
  "name": "Weekend Minimum Stay",
  "description": "Minimum 3-night stay required for weekend bookings",
  "category": "booking",
  "conditions": {
    "type": "object",
    "properties": {
      "bookingType": { "enum": ["hotel", "package"] },
      "checkInDay": { "enum": ["friday", "saturday"] }
    },
    "required": ["bookingType", "checkInDay"]
  },
  "actions": [
    {
      "type": "set_minimum_stay",
      "nights": 3,
      "reason": "Weekend demand"
    }
  ],
  "priority": 600,
  "isActive": true
}
```

### 2. Cancellation Policy Enforcement

**Scenario**: Strict cancellation policy for last-minute bookings

```json
{
  "name": "Last Minute Cancellation Policy",
  "description": "Strict cancellation policy for bookings made within 48 hours",
  "category": "booking",
  "conditions": {
    "type": "object",
    "properties": {
      "advanceBookingDays": { "maximum": 2 },
      "bookingType": { "enum": ["hotel", "flight", "car"] }
    },
    "required": ["advanceBookingDays", "bookingType"]
  },
  "actions": [
    {
      "type": "set_cancellation_policy",
      "policy": "non_refundable",
      "reason": "Last minute booking"
    }
  ],
  "priority": 800,
  "isActive": true
}
```

### 3. Group Booking Approval

**Scenario**: Group bookings over 10 people require manager approval

```json
{
  "name": "Group Booking Approval",
  "description": "Group bookings over 10 people require manager approval",
  "category": "booking",
  "conditions": {
    "type": "object",
    "properties": {
      "totalTravelers": { "minimum": 11 },
      "bookingType": { "enum": ["hotel", "flight", "package"] }
    },
    "required": ["totalTravelers", "bookingType"]
  },
  "actions": [
    {
      "type": "require_approval",
      "approverRole": "manager",
      "reason": "Large group booking"
    }
  ],
  "priority": 900,
  "isActive": true
}
```

## Rule Priority Guidelines

### Priority Ranges:
- **1-200**: System rules (lowest priority)
- **201-400**: Basic business rules
- **401-600**: Customer-facing rules
- **601-800**: Premium/Corporate rules
- **801-1000**: VIP/Executive rules (highest priority)

### Best Practices:
1. **Higher numbers = Higher priority**
2. **More specific conditions = Higher priority**
3. **Customer value rules = Higher priority**
4. **Always test rule interactions**
5. **Document rule dependencies**

## Testing Your Rules

### Validation Checklist:
- [ ] Conditions are properly structured JSON Schema
- [ ] Actions are valid and executable
- [ ] Priority levels prevent conflicts
- [ ] Rules don't create infinite loops
- [ ] Edge cases are handled
- [ ] Performance impact is acceptable

### Common Rule Patterns:
1. **Discount Rules**: Apply percentage or fixed amount discounts
2. **Markup Rules**: Add surcharges or fees
3. **Upgrade Rules**: Enhance service levels
4. **Restriction Rules**: Limit availability or options
5. **Approval Rules**: Require additional authorization
6. **Notification Rules**: Trigger alerts or communications

This examples guide provides a foundation for creating effective business rules in your TripAlfa Rule Management System. Customize these examples to match your specific business requirements and operational policies.