# Admin Booking Card Specification

## Overview

The Admin Booking Card is the central interface for managing all booking operations in the Travel Kingdom system. This document specifies the enhanced functionality required for admin-level booking management.

## Core Booking Card Structure

### 1. Booking Card Data Model

```typescript
interface AdminBookingCard {
  // Core Booking Information
  id: string;
  bookingRef: string;
  confirmationNumber: string;
  status: BookingStatus;
  bookingType: BookingType;
  customerType: 'B2B' | 'B2C';
  
  // Customer Information
  customer: {
    id: string;
    name: string;
    email: string;
    phone: string;
    type: 'individual' | 'corporate';
    companyId?: string;
    branchId?: string;
  };
  
  // Service Details
  serviceDetails: {
    type: 'flight' | 'hotel' | 'package' | 'transfer' | 'visa' | 'insurance';
    segments: ServiceSegment[];
    supplier: {
      id: string;
      name: string;
      pnr: string;
      supplierRef: string;
    };
  };
  
  // Financial Information
  financials: {
    customerPrice: number;
    supplierPrice: number;
    markup: number;
    taxes: number;
    fees: number;
    currency: string;
    paymentStatus: PaymentStatus;
    paymentMethod: PaymentMethod;
    profit: number;
  };
  
  // Timeline Information
  timeline: {
    bookedAt: Date;
    travelDate: Date;
    returnDate?: Date;
    holdUntil?: Date;
    lastModified: Date;
  };
  
  // Admin-Specific Features
  adminFeatures: {
    assignedAgent: string;
    branch: string;
    queueStatus: QueueStatus;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    tags: string[];
    notes: AdminNote[];
    auditTrail: AuditEvent[];
  };
  
  // Documents & Communications
  documents: BookingDocument[];
  communications: CommunicationLog[];
  
  // Special Features
  specialFeatures: {
    specialRequests: string[];
    amendments: AmendmentRequest[];
    refunds: RefundRequest[];
    notifications: Notification[];
  };
}
```

### 2. Enhanced Admin Features

#### A. Real-time Status Tracking
```typescript
interface RealTimeStatus {
  currentStatus: BookingStatus;
  statusHistory: StatusChange[];
  queuePosition: number;
  estimatedProcessingTime: string;
  lastUpdated: Date;
  autoRefresh: boolean;
}
```

#### B. Advanced Search & Filtering
```typescript
interface AdminSearchFilters {
  bookingRef?: string;
  customerName?: string;
  customerEmail?: string;
  pnr?: string;
  supplierRef?: string;
  companyId?: string;
  branchId?: string;
  agentId?: string;
  dateRange?: {
    from: Date;
    to: Date;
  };
  status: BookingStatus[];
  bookingType: BookingType[];
  queueType: QueueType[];
  priority: Priority[];
  paymentStatus: PaymentStatus[];
  serviceType: ServiceType[];
  tags: string[];
}
```

#### C. Bulk Operations
```typescript
interface BulkOperations {
  selectAllMatching: (filters: AdminSearchFilters) => void;
  bulkUpdateStatus: (status: BookingStatus, bookingIds: string[]) => Promise<void>;
  bulkAssignAgent: (agentId: string, bookingIds: string[]) => Promise<void>;
  bulkAddTags: (tags: string[], bookingIds: string[]) => Promise<void>;
  bulkSendNotifications: (message: string, bookingIds: string[]) => Promise<void>;
  bulkExport: (format: 'pdf' | 'excel' | 'csv', bookingIds: string[]) => Promise<Blob>;
}
```

#### D. Workflow Automation
```typescript
interface WorkflowAutomation {
  autoAssignRules: AutoAssignRule[];
  escalationRules: EscalationRule[];
  notificationTriggers: NotificationTrigger[];
  approvalWorkflows: ApprovalWorkflow[];
  SLAManagement: SLAConfiguration[];
}
```

## Admin Booking Card UI Components

### 1. Main Card Layout

```typescript
interface BookingCardLayout {
  header: {
    bookingRef: string;
    statusBadge: StatusBadge;
    priorityIndicator: PriorityIndicator;
    customerInfo: CustomerInfo;
    quickActions: QuickAction[];
  };
  
  tabs: {
    overview: OverviewTab;
    financials: FinancialsTab;
    documents: DocumentsTab;
    communications: CommunicationsTab;
    audit: AuditTab;
    workflow: WorkflowTab;
  };
  
  sidebar: {
    assignedAgent: AgentInfo;
    queueStatus: QueueStatus;
    relatedBookings: RelatedBooking[];
    quickStats: QuickStats;
  };
}
```

### 2. Interactive Features

#### A. Drag & Drop Queue Management
```typescript
interface QueueManagement {
  dragAndDrop: {
    enableReordering: boolean;
    enableStatusChange: boolean;
    enableAssignment: boolean;
  };
  
  queueVisualization: {
    kanbanView: KanbanView;
    listView: ListView;
    calendarView: CalendarView;
  };
}
```

#### B. Real-time Collaboration
```typescript
interface RealTimeCollaboration {
  liveEditing: {
    concurrentEditing: boolean;
    conflictResolution: ConflictResolutionStrategy;
    editHistory: EditHistory[];
  };
  
  teamCommunication: {
    @mentionUsers: (users: string[], message: string) => void;
    privateNotes: PrivateNote[];
    teamChat: TeamChat[];
  };
}
```

#### C. Advanced Document Management
```typescript
interface DocumentManagement {
  documentTypes: DocumentType[];
  uploadProgress: UploadProgress;
  versionControl: VersionControl;
  eSignature: ESignatureIntegration;
  documentSharing: DocumentSharing;
}
```

## Admin-Specific API Endpoints

### 1. Enhanced Booking Management

```typescript
// Admin booking search with advanced filtering
GET /api/admin/bookings/search
Query: AdminSearchFilters
Response: PaginatedResult<AdminBookingCard>

// Bulk booking operations
POST /api/admin/bookings/bulk-update
Body: {
  bookingIds: string[];
  updates: Partial<AdminBookingCard>;
}
Response: BulkOperationResult

// Queue management
PUT /api/admin/bookings/:id/queue
Body: {
  newQueue: QueueType;
  priority?: Priority;
  assignedAgent?: string;
}
Response: QueueUpdateResult

// Workflow automation
POST /api/admin/bookings/:id/workflow
Body: {
  action: WorkflowAction;
  parameters?: any;
}
Response: WorkflowResult
```

### 2. Admin Analytics & Reporting

```typescript
// Booking performance metrics
GET /api/admin/analytics/bookings
Query: {
  dateRange: DateRange;
  filters?: AdminSearchFilters;
}
Response: BookingAnalytics

// Agent performance metrics
GET /api/admin/analytics/agents
Query: {
  dateRange: DateRange;
  agentIds?: string[];
}
Response: AgentPerformanceMetrics

// SLA compliance tracking
GET /api/admin/analytics/sla
Query: {
  dateRange: DateRange;
  serviceTypes?: ServiceType[];
}
Response: SLAComplianceReport
```

### 3. Advanced Document Operations

```typescript
// Document batch operations
POST /api/admin/documents/batch
Body: {
  bookingIds: string[];
  documentType: DocumentType;
  templateId?: string;
}
Response: BatchDocumentResult

// E-signature workflow
POST /api/admin/documents/:id/sign
Body: {
  signers: Signer[];
  templateId?: string;
}
Response: SignatureWorkflowResult

// Document compliance check
GET /api/admin/documents/:id/compliance
Response: ComplianceCheckResult
```

## Admin Booking Card Features

### 1. Smart Notifications System

```typescript
interface SmartNotifications {
  notificationTypes: {
    statusChange: boolean;
    deadlineApproaching: boolean;
    SLABreach: boolean;
    highPriorityBooking: boolean;
    paymentPending: boolean;
    documentRequired: boolean;
  };
  
  notificationChannels: {
    inApp: boolean;
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  
  escalationRules: EscalationRule[];
}
```

### 2. Advanced Reporting

```typescript
interface AdvancedReporting {
  reportTypes: {
    bookingPerformance: BookingPerformanceReport;
    agentProductivity: AgentProductivityReport;
    financialSummary: FinancialSummaryReport;
    customerInsights: CustomerInsightsReport;
    supplierPerformance: SupplierPerformanceReport;
  };
  
  exportFormats: ['pdf', 'excel', 'csv', 'json'];
  scheduledReports: ScheduledReport[];
  realTimeDashboards: Dashboard[];
}
```

### 3. Integration Capabilities

```typescript
interface IntegrationCapabilities {
  CRMIntegration: {
    syncContacts: boolean;
    syncCompanies: boolean;
    syncActivities: boolean;
  };
  
  AccountingIntegration: {
    syncInvoices: boolean;
    syncPayments: boolean;
    syncExpenses: boolean;
  };
  
  CommunicationIntegration: {
    emailIntegration: EmailIntegration;
    SMSIntegration: SMSIntegration;
    chatIntegration: ChatIntegration;
  };
}
```

## Implementation Priority

### Phase 1: Core Admin Features (Week 1-2)
1. Enhanced booking card data model
2. Advanced search and filtering
3. Basic bulk operations
4. Real-time status tracking

### Phase 2: Workflow & Automation (Week 3-4)
1. Queue management system
2. Workflow automation rules
3. Smart notifications
4. SLA management

### Phase 3: Advanced Features (Week 5-6)
1. Document management system
2. Advanced reporting and analytics
3. Integration capabilities
4. Real-time collaboration

### Phase 4: Optimization & Polish (Week 7-8)
1. Performance optimization
2. User experience improvements
3. Mobile responsiveness
4. Accessibility compliance

## Security Considerations

### 1. Role-Based Access Control
```typescript
interface AdminAccessControl {
  permissions: {
    viewBookings: boolean;
    editBookings: boolean;
    deleteBookings: boolean;
    manageAgents: boolean;
    viewFinancials: boolean;
    exportData: boolean;
  };
  
  dataAccess: {
    companyLevel: boolean;
    branchLevel: boolean;
    agentLevel: boolean;
    customerLevel: boolean;
  };
}
```

### 2. Audit Trail
```typescript
interface AuditTrail {
  trackChanges: {
    bookingModifications: boolean;
    statusChanges: boolean;
    financialChanges: boolean;
    documentAccess: boolean;
  };
  
  auditReports: AuditReport[];
  complianceMonitoring: ComplianceMonitoring;
}
```

This specification provides a comprehensive framework for implementing the admin booking card functionality, ensuring it serves as the central hub for all booking management operations with enterprise-grade features and capabilities.