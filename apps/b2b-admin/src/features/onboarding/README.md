# 🎯 Onboarding Management System - Admin Panel Guide

## Overview

The Onboarding Management System provides a comprehensive admin panel interface for managing both supplier and customer onboarding processes, including lifecycle tracking and notification template management.

## 📂 Project Structure

```
apps/b2b-admin/src/
├── features/onboarding/
│   ├── OnboardingManagementPage.tsx         # Main page component
│   └── components/
│       ├── SupplierOnboardingManager.tsx    # Supplier lifecycle tracking
│       ├── CustomerOnboardingManager.tsx    # Customer lifecycle tracking
│       └── NotificationTemplateEditor.tsx   # Template editor
├── hooks/
│   └── useOnboardingManagement.ts           # State management hook
└── components/ui/
    └── Modal.tsx                             # Modal dialog wrapper
```

## 🚀 Features

### 1. Supplier Onboarding Management

Track supplier lifecycle through the following stages:
- **Registered** - Initial supplier account creation
- **Wallet Assigned** - Payment wallet configured
- **Wallet Activated** - Wallet ready for transactions
- **Active** - Supplier fully onboarded

**Actions Available:**
- View supplier information and registration timeline
- Transition between lifecycle stages
- Resend notifications to admin or supplier
- Search and filter supplier records

### 2. Customer Onboarding Management

Track customer lifecycle through the following stages:
- **Registered** - Initial account creation with email
- **Profile Completed** - User completes their profile information
- **Account Verified** - Email or SMS verification completed
- **Payment Added** - Payment method configured
- **Active** - Customer fully onboarded with payment

**Actions Available:**
- View customer information and progress timeline
- Visualize onboarding completion percentage (0-100%)
- Transition between lifecycle stages
- Resend notifications to admin or customer
- Advanced search by name, ID, or email

### 3. Notification Template Management

Create and manage notification templates for both supplier and customer onboarding.

**Supported Event Types:**

**Supplier Onboarding:**
- `supplier_registered` - New supplier account created
- `wallet_assigned` - Wallet configured for supplier
- `wallet_activated` - Wallet activated and ready

**Customer Onboarding:**
- `customer_registered` - New customer account created
- `profile_completed` - User profile filled out
- `account_verified` - Email/SMS verification completed
- `payment_method_added` - Payment method added to account

**Notification Channels:**
- 📧 **Email** - Formatted HTML emails with variables
- 💬 **SMS** - 160-character limited messages
- 🔔 **In-App** - In-application notifications

**Priority Levels:**
- Low
- Medium (default)
- High
- Urgent

**Template Features:**
- Dynamic variable support using `{{variableName}}` syntax
- Multi-channel templates (email, SMS, in-app)
- Live preview before saving
- Auto-detection of available variables from template content
- Full CRUD operations (Create, Read, Update, Delete)

## 🎨 UI Components Used

- **Tabs** - Navigation between Overview, Suppliers, Customers
- **Cards** - Information display and metrics
- **Badges** - Status indicators and tags
- **Buttons** - Actions and navigation
- **Input** - Search and form fields
- **Modal Dialog** - Template editor form
- **Progress Bars** - Customer onboarding completion visualization

## 📊 Dashboard Overview

The Overview tab provides:
- **Statistics Cards** showing:
  - Total suppliers and active count
  - Total customers and active count
  - Combined completion rate percentage
  - Total active templates

- **Status Charts** showing:
  - Supplier onboarding progression (Registered → Wallet Assigned → Active)
  - Customer onboarding progression (Registered → Profile → Verified → Payment → Active)

- **Template Status** showing all active templates at a glance

## 🔌 Integration Points

### Backend Webhooks

The system triggers webhooks to the backend when statuses change:

```
POST /api/webhooks/supplier-onboarding
{
  "eventType": "supplier_registered|wallet_assigned|wallet_activated",
  "supplierId": "string",
  "supplierName": "string",
  "supplierEmail": "string",
  "walletId": "string?",
  "walletType": "credit|prepaid|postpaid?",
  "timestamp": "ISO 8601 string"
}

POST /api/webhooks/customer-onboarding
{
  "eventType": "customer_registered|profile_completed|account_verified|payment_method_added",
  "customerId": "string",
  "customerName": "string",
  "customerEmail": "string",
  "phoneNumber": "string?",
  "profileData": {
    "firstName": "string?",
    "lastName": "string?",
    "country": "string?",
    "preferredLanguage": "string?"
  },
  "paymentMethod": "credit_card|debit_card|digital_wallet?",
  "verificationMethod": "email|sms|phone?",
  "timestamp": "ISO 8601 string"
}
```

### Notification Service Integration

The backend then dispatches notifications through the NotificationService:

```typescript
await notificationService.sendNotification({
  userId: recipientEmail,
  title: "Notification Title",
  message: "Notification message body",
  type: "onboarding_event_type",
  priority: "high",
  channels: ["email", "in_app", "sms"],
  metadata: { /* event details */ }
})
```

## 🛠️ Usage

### Accessing the Admin Panel

1. Navigate to **`/onboarding`** in the admin panel
2. Select the desired tab:
   - **Overview** - Statistics and status overview
   - **Suppliers** - Supplier lifecycle management
   - **Customers** - Customer lifecycle management
   - **Templates** - Create and edit notification templates

### Managing Supplier Onboarding

1. Go to **Suppliers** tab
2. Use search bar to find suppliers
3. Filter by status (All, Registered, Wallet Assigned, Wallet Activated, Active)
4. Click status buttons to transition between stages
5. Use **Resend Admin** or **Resend Supplier** to resend notifications

### Managing Customer Onboarding

1. Go to **Customers** tab
2. Use search bar to find customers by name, ID, or email
3. Filter by status
4. View progress percentage for each customer
5. Click stage buttons to advance through lifecycle
6. Use **Resend Admin** or **Resend Customer** to resend notifications

### Creating Notification Templates

1. Scroll to **Notification Templates** section at bottom
2. Click **Create Template**
3. Fill in template details:
   - Template Name (e.g., "Supplier Registration Welcome")
   - Type (Supplier or Customer Onboarding)
   - Event Type (specific event for this template)
   - Subject Line
   - Priority Level
   - Select Channels (Email, SMS, In-App)
   - Template content for each channel using `{{variable}}` syntax
4. Click **Save Template**

### Using Template Variables

Variables are automatically extracted from template content. Use the following patterns:

**Supplier Onboarding Variables:**
- `{{supplierName}}` - Supplier company name
- `{{supplierId}}` - Supplier ID
- `{{supplierEmail}}` - Supplier contact email
- `{{walletType}}` - Wallet type (credit, prepaid, postpaid)

**Customer Onboarding Variables:**
- `{{customerName}}` - Customer full name
- `{{customerId}}` - Customer ID
- `{{customerEmail}}` - Customer email address
- `{{firstName}}` - Customer first name
- `{{lastName}}` - Customer last name
- `{{country}}` - Customer country

**Example Email Template:**
```html
<h2>Welcome {{supplierName}}!</h2>
<p>Your supplier account has been successfully created.</p>
<p>Next steps:</p>
<ul>
  <li>Set up your payment wallet</li>
  <li>Configure your inventory</li>
  <li>Verify your bank account</li>
</ul>
<p>Account ID: {{supplierId}}</p>
```

**Example SMS Template:**
```
Hi {{firstName}}, Welcome to TripAlfa! 🎉 Confirm your email to start booking: [link]
```

## 📈 Statistics Explained

- **Completion Rate** - Average percentage of suppliers and customers at final stages
- **Active** - Suppliers/customers in "active" or "wallet_activated" / "payment_added" stages
- **Total** - Sum of all records including all stages

## 🔒 Permissions & Security

- Requires admin authentication to access onboarding management
- All backend operations validated and logged
- Notification resend operations tracked for audit
- Templates stored securely with versioning

## 🐛 Troubleshooting

### Notifications Not Sending
- Check template is marked as "Active"
- Verify template channels are enabled
- Check backend logs for NotificationService errors
- Ensure recipient email/SMS is valid

### Status Transitions Not Working
- Verify current status allows transition to next stage
- Check browser console for API errors
- Ensure admin has proper permissions
- Verify backend webhook endpoint is accessible

### Template Variables Not Appearing
- Variables must be in `{{variableName}}` format
- Check spelling matches available variable names
- Ensure template is saved before sending

## 📝 Notes

- Templates use HTML for email (sanitized before sending)
- SMS templates limited to 160 characters (counted in editor)
- In-app templates support plain text with emoji
- All timestamps in ISO 8601 format (UTC)
- Onboarding records and templates are reactive and update in real-time

## 🎓 Best Practices

1. **Template Organization** - Use clear naming conventions (e.g., "Supplier Registration Welcome")
2. **Channel Strategy** - Use Email for detailed info, SMS for urgent alerts, In-App for discovery
3. **Variable Usage** - Always include personalization with customer/supplier names
4. **Testing** - Create templates and test with preview before activating
5. **Escalation** - Use "Urgent" priority for verification deadlines, high-priority payments
6. **Mobile Friendly** - Keep SMS templates concise and to the point
7. **Compliance** - Ensure templates comply with marketing and privacy regulations

---

**Version:** 1.0  
**Last Updated:** February 2026  
**Backend Service:** booking-service  
**API Endpoints:** `/api/webhooks/supplier-onboarding`, `/api/webhooks/customer-onboarding`
