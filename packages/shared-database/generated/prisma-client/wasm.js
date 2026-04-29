
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
  skip
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 5.22.0
 * Query Engine version: 605197351a3c8bdd595af2d2a9bc3025bca48ea2
 */
Prisma.prismaVersion = {
  client: "5.22.0",
  engine: "605197351a3c8bdd595af2d2a9bc3025bca48ea2"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.NotFoundError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`NotFoundError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}



/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.TenantScalarFieldEnum = {
  id: 'id',
  agentCode: 'agentCode',
  name: 'name',
  type: 'type',
  status: 'status',
  databaseUrl: 'databaseUrl',
  databaseSchema: 'databaseSchema',
  parentId: 'parentId',
  logoUrl: 'logoUrl',
  contactEmail: 'contactEmail',
  contactPhone: 'contactPhone',
  address: 'address',
  city: 'city',
  country: 'country',
  iataNo: 'iataNo',
  officeId: 'officeId',
  vatNo: 'vatNo',
  creditLimit: 'creditLimit',
  paymentType: 'paymentType',
  accessFlights: 'accessFlights',
  accessHotels: 'accessHotels',
  accessCars: 'accessCars',
  enableB2B2C: 'enableB2B2C',
  canManageMarkups: 'canManageMarkups',
  canManageUsers: 'canManageUsers',
  cachedRevenue: 'cachedRevenue',
  cachedBookings: 'cachedBookings',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  dateOfOperations: 'dateOfOperations',
  address1: 'address1',
  address2: 'address2',
  address3: 'address3',
  state: 'state',
  postCode: 'postCode',
  telephone: 'telephone',
  mobile: 'mobile',
  fax: 'fax',
  contactName: 'contactName',
  designation: 'designation',
  contactMobile: 'contactMobile',
  websiteUrl: 'websiteUrl',
  referredBy: 'referredBy',
  remarks: 'remarks',
  language: 'language',
  salesEmail: 'salesEmail',
  salesPhone: 'salesPhone',
  salesMobile: 'salesMobile',
  salesContactName: 'salesContactName',
  bankName: 'bankName',
  bankAddress: 'bankAddress',
  bankSwiftCode: 'bankSwiftCode',
  bankPhone: 'bankPhone',
  bankFax: 'bankFax',
  bankAccountNo: 'bankAccountNo',
  abtaNo: 'abtaNo',
  atolNo: 'atolNo',
  creditLimitAlert: 'creditLimitAlert',
  tempCreditLimit: 'tempCreditLimit',
  tempCreditLimitStart: 'tempCreditLimitStart',
  tempCreditLimitEnd: 'tempCreditLimitEnd',
  tdsApplicable: 'tdsApplicable',
  tdsExemption: 'tdsExemption',
  dailyTicketValue: 'dailyTicketValue',
  payPeriod: 'payPeriod',
  annualTurnover: 'annualTurnover',
  reserveVolumeMonthly: 'reserveVolumeMonthly',
  noOfEmployees: 'noOfEmployees',
  noOfBranches: 'noOfBranches',
  accessInsurance: 'accessInsurance',
  accessPackages: 'accessPackages',
  accessSightseeing: 'accessSightseeing',
  accessTransfers: 'accessTransfers',
  accessDynamicSearch: 'accessDynamicSearch',
  canManageBranches: 'canManageBranches',
  canManageRoles: 'canManageRoles',
  canManageCreditCards: 'canManageCreditCards',
  canImportPNR: 'canImportPNR',
  canAllowAutoTicket: 'canAllowAutoTicket',
  canAccessIITFare: 'canAccessIITFare',
  canManageSupplierCreds: 'canManageSupplierCreds',
  canManagePGCreds: 'canManagePGCreds',
  showLogoOnDashboard: 'showLogoOnDashboard',
  allowAirCanx: 'allowAirCanx',
  perfSparkline: 'perfSparkline',
  isActive: 'isActive'
};

exports.Prisma.UserScalarFieldEnum = {
  id: 'id',
  tenantId: 'tenantId',
  username: 'username',
  email: 'email',
  passwordHash: 'passwordHash',
  name: 'name',
  role: 'role',
  salesChannelId: 'salesChannelId',
  isActive: 'isActive',
  lastLoginAt: 'lastLoginAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SalesChannelConfigScalarFieldEnum = {
  id: 'id',
  tenantId: 'tenantId',
  channelCode: 'channelCode',
  name: 'name',
  description: 'description',
  slug: 'slug',
  isActive: 'isActive',
  markupOverride: 'markupOverride',
  commissionShare: 'commissionShare',
  settings: 'settings',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ApiKeyScalarFieldEnum = {
  id: 'id',
  tenantId: 'tenantId',
  userId: 'userId',
  key: 'key',
  name: 'name',
  scopes: 'scopes',
  expiresAt: 'expiresAt',
  isActive: 'isActive',
  lastUsedAt: 'lastUsedAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.AuditLogScalarFieldEnum = {
  id: 'id',
  tenantId: 'tenantId',
  userId: 'userId',
  action: 'action',
  resource: 'resource',
  resourceId: 'resourceId',
  oldValue: 'oldValue',
  newValue: 'newValue',
  ipAddress: 'ipAddress',
  userAgent: 'userAgent',
  createdAt: 'createdAt',
  timestamp: 'timestamp',
  actorId: 'actorId',
  actorName: 'actorName',
  entity: 'entity',
  entityId: 'entityId',
  details: 'details',
  severity: 'severity'
};

exports.Prisma.BookingScalarFieldEnum = {
  id: 'id',
  bookingRef: 'bookingRef',
  pnr: 'pnr',
  tenantId: 'tenantId',
  salesChannel: 'salesChannel',
  agentCode: 'agentCode',
  service: 'service',
  productType: 'productType',
  status: 'status',
  segmentStatus: 'segmentStatus',
  ticketed: 'ticketed',
  dispatched: 'dispatched',
  bookingDate: 'bookingDate',
  travelDate: 'travelDate',
  tripStartDate: 'tripStartDate',
  ticketDeadline: 'ticketDeadline',
  issuedDate: 'issuedDate',
  passengerName: 'passengerName',
  amount: 'amount',
  currency: 'currency',
  markup: 'markup',
  netFare: 'netFare',
  supplierCost: 'supplierCost',
  route: 'route',
  hotelName: 'hotelName',
  destination: 'destination',
  passengerDob: 'passengerDob',
  passengerNationality: 'passengerNationality',
  passengerPassport: 'passengerPassport',
  passengerPassportExpiry: 'passengerPassportExpiry',
  corporateId: 'corporateId',
  subagentId: 'subagentId',
  enquiryId: 'enquiryId',
  paymentStatus: 'paymentStatus',
  paymentMethod: 'paymentMethod',
  paymentDate: 'paymentDate',
  receiptNo: 'receiptNo',
  invoiceNo: 'invoiceNo',
  ticketNo: 'ticketNo',
  lockedBy: 'lockedBy',
  lockedAt: 'lockedAt',
  remarks: 'remarks',
  amendmentHistory: 'amendmentHistory',
  inventoryBlockId: 'inventoryBlockId',
  inventoryDbUrl: 'inventoryDbUrl',
  workflowState: 'workflowState',
  metadata: 'metadata',
  userId: 'userId',
  customerEmail: 'customerEmail',
  customerPhone: 'customerPhone',
  serviceType: 'serviceType',
  baseAmount: 'baseAmount',
  totalAmount: 'totalAmount',
  taxAmount: 'taxAmount',
  markupAmount: 'markupAmount',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  tktLater: 'tktLater',
  autoCancelScheduled: 'autoCancelScheduled',
  balanceDueDate: 'balanceDueDate',
  refundAmount: 'refundAmount',
  penaltyAmount: 'penaltyAmount',
  passengerResidency: 'passengerResidency',
  clientSwitchBlocked: 'clientSwitchBlocked',
  approvalStatus: 'approvalStatus',
  refundStatus: 'refundStatus',
  authorizationStatus: 'authorizationStatus',
  authorizationBy: 'authorizationBy',
  authorizedAt: 'authorizedAt',
  rejectionReason: 'rejectionReason',
  originalBookingId: 'originalBookingId',
  modificationDelta: 'modificationDelta',
  retryCount: 'retryCount',
  errorMessage: 'errorMessage',
  notifications: 'notifications'
};

exports.Prisma.SegmentScalarFieldEnum = {
  id: 'id',
  bookingId: 'bookingId',
  type: 'type',
  gdsPnr: 'gdsPnr',
  validatingCarrier: 'validatingCarrier',
  status: 'status',
  confirmationNo: 'confirmationNo',
  airline: 'airline',
  airlineCode: 'airlineCode',
  flightNumber: 'flightNumber',
  origin: 'origin',
  destination: 'destination',
  departureDateTime: 'departureDateTime',
  arrivalDateTime: 'arrivalDateTime',
  class: 'class',
  fareBasisCode: 'fareBasisCode',
  totalStops: 'totalStops',
  airlinePnr: 'airlinePnr',
  duration: 'duration',
  sequenceNumber: 'sequenceNumber',
  segmentType: 'segmentType',
  tripType: 'tripType',
  operatedBy: 'operatedBy',
  promoCode: 'promoCode',
  hotelName: 'hotelName',
  hotelChain: 'hotelChain',
  starCategory: 'starCategory',
  checkInDate: 'checkInDate',
  checkOutDate: 'checkOutDate',
  noOfNights: 'noOfNights',
  roomType: 'roomType',
  mealPlan: 'mealPlan',
  noOfRooms: 'noOfRooms',
  noOfOccupants: 'noOfOccupants',
  occupantsAdults: 'occupantsAdults',
  occupantsChildren: 'occupantsChildren',
  carSupplier: 'carSupplier',
  pickupLocation: 'pickupLocation',
  dropOffLocation: 'dropOffLocation',
  pickupDateTime: 'pickupDateTime',
  dropOffDateTime: 'dropOffDateTime',
  carType: 'carType',
  leadDriver: 'leadDriver',
  supplierCurrency: 'supplierCurrency',
  fareDetails: 'fareDetails',
  costing: 'costing',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  supplierPaymentDueDate: 'supplierPaymentDueDate',
  additionalReferenceNo: 'additionalReferenceNo',
  originAirport: 'originAirport',
  destinationAirport: 'destinationAirport',
  terminal: 'terminal',
  openSegment: 'openSegment',
  rateCode: 'rateCode',
  hotelAddress: 'hotelAddress',
  cityCode: 'cityCode',
  phone: 'phone',
  email: 'email',
  cancellationDate: 'cancellationDate',
  cancellationConditions: 'cancellationConditions',
  specialRequest: 'specialRequest',
  notes: 'notes',
  serviceDescription: 'serviceDescription',
  serviceQuantity: 'serviceQuantity',
  pickupAddress: 'pickupAddress',
  dropOffAddress: 'dropOffAddress',
  carName: 'carName',
  carGroup: 'carGroup',
  additionalDriver: 'additionalDriver',
  driverDob: 'driverDob',
  passengerIds: 'passengerIds',
  calculationMode: 'calculationMode',
  miscCharges: 'miscCharges'
};

exports.Prisma.DocumentScalarFieldEnum = {
  id: 'id',
  bookingId: 'bookingId',
  type: 'type',
  documentNo: 'documentNo',
  status: 'status',
  refundStatus: 'refundStatus',
  fareDetails: 'fareDetails',
  tstDetails: 'tstDetails',
  baggage: 'baggage',
  nvdNva: 'nvdNva',
  ticketingDate: 'ticketingDate',
  fareType: 'fareType',
  airlineCode: 'airlineCode',
  voucherDetails: 'voucherDetails',
  refundAmount: 'refundAmount',
  agencyCharge: 'agencyCharge',
  airlineCharge: 'airlineCharge',
  issuedAt: 'issuedAt',
  issuedBy: 'issuedBy',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  iataNo: 'iataNo',
  checkDigit: 'checkDigit',
  conjunctionTickets: 'conjunctionTickets',
  gdsValidated: 'gdsValidated',
  refundedAmount: 'refundedAmount',
  nonRefundedAmount: 'nonRefundedAmount'
};

exports.Prisma.ServiceRequestScalarFieldEnum = {
  id: 'id',
  bookingId: 'bookingId',
  type: 'type',
  status: 'status',
  requestDate: 'requestDate',
  requestedBy: 'requestedBy',
  requestFrom: 'requestFrom',
  requestRemarks: 'requestRemarks',
  approvalDate: 'approvalDate',
  approvedBy: 'approvedBy',
  approvalRemarks: 'approvalRemarks',
  processedDate: 'processedDate',
  processedBy: 'processedBy',
  productType: 'productType',
  lastModifiedDate: 'lastModifiedDate'
};

exports.Prisma.ApprovalScalarFieldEnum = {
  id: 'id',
  bookingId: 'bookingId',
  serviceRequestId: 'serviceRequestId',
  level: 'level',
  approverEmail: 'approverEmail',
  approverName: 'approverName',
  status: 'status',
  actionDate: 'actionDate',
  remarks: 'remarks',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.StatusChangeLogScalarFieldEnum = {
  id: 'id',
  bookingId: 'bookingId',
  fromStatus: 'fromStatus',
  toStatus: 'toStatus',
  changedBy: 'changedBy',
  changedByName: 'changedByName',
  changedAt: 'changedAt',
  reason: 'reason'
};

exports.Prisma.ClientSwitchApprovalScalarFieldEnum = {
  id: 'id',
  bookingId: 'bookingId',
  fromCorporateId: 'fromCorporateId',
  toCorporateId: 'toCorporateId',
  reason: 'reason',
  status: 'status',
  level1Approver: 'level1Approver',
  level1Status: 'level1Status',
  level1Date: 'level1Date',
  level1Remarks: 'level1Remarks',
  level2Approver: 'level2Approver',
  level2Status: 'level2Status',
  level2Date: 'level2Date',
  level2Remarks: 'level2Remarks',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.EnquiryScalarFieldEnum = {
  id: 'id',
  enquiryId: 'enquiryId',
  tenantId: 'tenantId',
  type: 'type',
  corporateId: 'corporateId',
  travellerId: 'travellerId',
  travellerName: 'travellerName',
  status: 'status',
  itineraries: 'itineraries',
  approverEmails: 'approverEmails',
  sendToEmployeeFirst: 'sendToEmployeeFirst',
  quoteWithoutCost: 'quoteWithoutCost',
  sendFareRules: 'sendFareRules',
  includeCheapest: 'includeCheapest',
  format: 'format',
  upsertData: 'upsertData',
  remarks: 'remarks',
  createdBy: 'createdBy',
  assignedTo: 'assignedTo',
  approvedDate: 'approvedDate',
  approverRemark: 'approverRemark',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CorporateTravellerScalarFieldEnum = {
  id: 'id',
  tenantId: 'tenantId',
  employeeId: 'employeeId',
  corporateId: 'corporateId',
  corporateName: 'corporateName',
  title: 'title',
  firstName: 'firstName',
  lastName: 'lastName',
  designation: 'designation',
  department: 'department',
  costCenter: 'costCenter',
  email: 'email',
  phone: 'phone',
  fop: 'fop',
  availableCredit: 'availableCredit',
  creditLimit: 'creditLimit',
  vip: 'vip',
  cip: 'cip',
  frequentFlyerNos: 'frequentFlyerNos',
  preferences: 'preferences',
  travelCoordinator: 'travelCoordinator',
  last3Bookings: 'last3Bookings',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ContactScalarFieldEnum = {
  id: 'id',
  tenantId: 'tenantId',
  agentCode: 'agentCode',
  type: 'type',
  status: 'status',
  companyName: 'companyName',
  firstName: 'firstName',
  lastName: 'lastName',
  designation: 'designation',
  department: 'department',
  email: 'email',
  phone: 'phone',
  mobile: 'mobile',
  fax: 'fax',
  website: 'website',
  address: 'address',
  city: 'city',
  userId: 'userId',
  tier: 'tier',
  comments: 'comments',
  totalSpent: 'totalSpent',
  state: 'state',
  country: 'country',
  postCode: 'postCode',
  iataNo: 'iataNo',
  officeId: 'officeId',
  vatNo: 'vatNo',
  creditLimit: 'creditLimit',
  paymentType: 'paymentType',
  payPeriod: 'payPeriod',
  frequentFlyerNos: 'frequentFlyerNos',
  travelPreferences: 'travelPreferences',
  travelPolicy: 'travelPolicy',
  salesChannel: 'salesChannel',
  tags: 'tags',
  notes: 'notes',
  assignedTo: 'assignedTo',
  lastBookingDate: 'lastBookingDate',
  totalBookings: 'totalBookings',
  totalSpend: 'totalSpend',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ActivityScalarFieldEnum = {
  id: 'id',
  contactId: 'contactId',
  type: 'type',
  title: 'title',
  bookingId: 'bookingId',
  ticketId: 'ticketId',
  subject: 'subject',
  description: 'description',
  slug: 'slug',
  bookingRef: 'bookingRef',
  amount: 'amount',
  scheduledAt: 'scheduledAt',
  completedAt: 'completedAt',
  createdBy: 'createdBy',
  assignedTo: 'assignedTo',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PreferenceScalarFieldEnum = {
  id: 'id',
  contactId: 'contactId',
  category: 'category',
  key: 'key',
  value: 'value',
  priority: 'priority',
  isRequired: 'isRequired',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.InventoryBlockScalarFieldEnum = {
  id: 'id',
  type: 'type',
  provider: 'provider',
  reference: 'reference',
  totalQuantity: 'totalQuantity',
  availableQuantity: 'availableQuantity',
  costPerUnit: 'costPerUnit',
  sellPricePerUnit: 'sellPricePerUnit',
  expiryDate: 'expiryDate',
  status: 'status',
  parentBlockId: 'parentBlockId',
  tenantId: 'tenantId',
  agentCode: 'agentCode',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.InventoryTransactionScalarFieldEnum = {
  id: 'id',
  inventoryBlockId: 'inventoryBlockId',
  bookingId: 'bookingId',
  bookingRef: 'bookingRef',
  quantity: 'quantity',
  type: 'type',
  description: 'description',
  slug: 'slug',
  tenantId: 'tenantId',
  agentCode: 'agentCode',
  createdAt: 'createdAt'
};

exports.Prisma.InventoryAllocationScalarFieldEnum = {
  id: 'id',
  inventoryBlockId: 'inventoryBlockId',
  bookingRef: 'bookingRef',
  tenantId: 'tenantId',
  quantity: 'quantity',
  reservedUntil: 'reservedUntil',
  status: 'status',
  confirmedAt: 'confirmedAt',
  releasedAt: 'releasedAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.NotificationTemplateScalarFieldEnum = {
  id: 'id',
  name: 'name',
  code: 'code',
  channel: 'channel',
  subject: 'subject',
  bodyTemplate: 'bodyTemplate',
  variables: 'variables',
  isActive: 'isActive',
  isDefault: 'isDefault',
  tenantId: 'tenantId',
  agentCode: 'agentCode',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.NotificationLogScalarFieldEnum = {
  id: 'id',
  templateId: 'templateId',
  channel: 'channel',
  priority: 'priority',
  status: 'status',
  to: 'to',
  cc: 'cc',
  bcc: 'bcc',
  subject: 'subject',
  body: 'body',
  attachments: 'attachments',
  tenantId: 'tenantId',
  bookingRef: 'bookingRef',
  userId: 'userId',
  provider: 'provider',
  providerMessageId: 'providerMessageId',
  providerError: 'providerError',
  attempts: 'attempts',
  maxAttempts: 'maxAttempts',
  nextRetryAt: 'nextRetryAt',
  sentAt: 'sentAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.WalletScalarFieldEnum = {
  id: 'id',
  walletNo: 'walletNo',
  ownerType: 'ownerType',
  ownerId: 'ownerId',
  ownerName: 'ownerName',
  balance: 'balance',
  creditLimit: 'creditLimit',
  currency: 'currency',
  autoReloadEnabled: 'autoReloadEnabled',
  autoReloadAmount: 'autoReloadAmount',
  autoReloadThreshold: 'autoReloadThreshold',
  autoReloadCurrency: 'autoReloadCurrency',
  status: 'status',
  defaultCurrency: 'defaultCurrency',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CurrencyAccountScalarFieldEnum = {
  id: 'id',
  walletId: 'walletId',
  currency: 'currency',
  balance: 'balance',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  computedBalance: 'computedBalance',
  availableBalance: 'availableBalance',
  blockedBalance: 'blockedBalance',
  ledgerAccountId: 'ledgerAccountId'
};

exports.Prisma.WalletTransactionScalarFieldEnum = {
  id: 'id',
  walletId: 'walletId',
  referenceId: 'referenceId',
  amount: 'amount',
  currency: 'currency',
  balanceAfter: 'balanceAfter',
  category: 'category',
  status: 'status',
  description: 'description',
  createdAt: 'createdAt',
  userId: 'userId',
  userName: 'userName',
  transactionNo: 'transactionNo',
  currencyAccountId: 'currencyAccountId',
  type: 'type',
  bookingId: 'bookingId',
  bookingRef: 'bookingRef',
  paymentMethod: 'paymentMethod',
  paymentReference: 'paymentReference',
  fxRate: 'fxRate',
  originalAmount: 'originalAmount',
  originalCurrency: 'originalCurrency',
  reference: 'reference',
  notes: 'notes',
  processedAt: 'processedAt'
};

exports.Prisma.WalletHoldScalarFieldEnum = {
  id: 'id',
  walletId: 'walletId',
  bookingRef: 'bookingRef',
  amount: 'amount',
  currency: 'currency',
  status: 'status',
  reason: 'reason',
  expiresAt: 'expiresAt',
  releasedAt: 'releasedAt',
  convertedAt: 'convertedAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  holdNo: 'holdNo',
  currencyAccountId: 'currencyAccountId',
  bookingId: 'bookingId',
  description: 'description',
  slug: 'slug'
};

exports.Prisma.AgentCreditLimitScalarFieldEnum = {
  id: 'id',
  walletId: 'walletId',
  creditLimit: 'creditLimit',
  tempCreditLimit: 'tempCreditLimit',
  tempCreditLimitStart: 'tempCreditLimitStart',
  tempCreditLimitEnd: 'tempCreditLimitEnd',
  alertThreshold: 'alertThreshold',
  tdsPercentage: 'tdsPercentage',
  tdsExemption: 'tdsExemption',
  payPeriod: 'payPeriod',
  annualTurnover: 'annualTurnover',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  usedCredit: 'usedCredit',
  availableCredit: 'availableCredit',
  currency: 'currency',
  tempCreditStart: 'tempCreditStart',
  tempCreditEnd: 'tempCreditEnd',
  creditAlertThreshold: 'creditAlertThreshold',
  status: 'status',
  lastCheckedAt: 'lastCheckedAt'
};

exports.Prisma.WalletRefundScalarFieldEnum = {
  id: 'id',
  walletId: 'walletId',
  bookingRef: 'bookingRef',
  originalAmount: 'originalAmount',
  penaltyAmount: 'penaltyAmount',
  refundAmount: 'refundAmount',
  currency: 'currency',
  status: 'status',
  reason: 'reason',
  processedAt: 'processedAt',
  processedBy: 'processedBy',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  refundNo: 'refundNo',
  originalTransactionId: 'originalTransactionId',
  bookingId: 'bookingId',
  reasonCategory: 'reasonCategory',
  notes: 'notes'
};

exports.Prisma.WalletReconciliationLogScalarFieldEnum = {
  id: 'id',
  walletId: 'walletId',
  balanceBefore: 'balanceBefore',
  balanceAfter: 'balanceAfter',
  adjustedAmount: 'adjustedAmount',
  reason: 'reason',
  reconciledBy: 'reconciledBy',
  reconciledAt: 'reconciledAt',
  reconciliationDate: 'reconciliationDate',
  currency: 'currency',
  systemBalance: 'systemBalance',
  ledgerBalance: 'ledgerBalance',
  discrepancy: 'discrepancy',
  discrepancyTolerance: 'discrepancyTolerance',
  status: 'status',
  adjustmentAmount: 'adjustmentAmount',
  adjustmentReason: 'adjustmentReason',
  notes: 'notes',
  processedBy: 'processedBy',
  createdAt: 'createdAt'
};

exports.Prisma.CorporateAccountScalarFieldEnum = {
  id: 'id',
  walletId: 'walletId',
  corporateId: 'corporateId',
  corporateName: 'corporateName',
  billingCycle: 'billingCycle',
  invoiceDay: 'invoiceDay',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  paymentTerms: 'paymentTerms',
  creditLimit: 'creditLimit',
  outstandingBalance: 'outstandingBalance',
  autoInvoiceEnabled: 'autoInvoiceEnabled',
  invoiceEmail: 'invoiceEmail',
  status: 'status'
};

exports.Prisma.SupplierWalletScalarFieldEnum = {
  id: 'id',
  walletId: 'walletId',
  supplierCode: 'supplierCode',
  supplierName: 'supplierName',
  supplierType: 'supplierType',
  balance: 'balance',
  currency: 'currency',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  supplierId: 'supplierId',
  settlementCycle: 'settlementCycle',
  settlementCurrency: 'settlementCurrency',
  payableBalance: 'payableBalance',
  paidBalance: 'paidBalance',
  bankName: 'bankName',
  accountNumber: 'accountNumber',
  iban: 'iban',
  swiftCode: 'swiftCode',
  status: 'status',
  lastSettlementDate: 'lastSettlementDate'
};

exports.Prisma.MarkupRuleScalarFieldEnum = {
  id: 'id',
  name: 'name',
  description: 'description',
  slug: 'slug',
  serviceType: 'serviceType',
  valueType: 'valueType',
  value: 'value',
  isActive: 'isActive',
  priority: 'priority',
  ruleLevel: 'ruleLevel',
  salesChannels: 'salesChannels',
  airlineCode: 'airlineCode',
  airlineGroup: 'airlineGroup',
  originCode: 'originCode',
  destinationCode: 'destinationCode',
  marketRegion: 'marketRegion',
  rbdClass: 'rbdClass',
  journeyType: 'journeyType',
  cabinClass: 'cabinClass',
  hotelId: 'hotelId',
  hotelChain: 'hotelChain',
  hotelStars: 'hotelStars',
  mealPlan: 'mealPlan',
  supplierCode: 'supplierCode',
  customerId: 'customerId',
  customerType: 'customerType',
  customerTier: 'customerTier',
  tenantId: 'tenantId',
  agentCode: 'agentCode',
  effectiveFrom: 'effectiveFrom',
  effectiveTo: 'effectiveTo',
  createdBy: 'createdBy',
  updatedBy: 'updatedBy',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.MarkupRuleAuditLogScalarFieldEnum = {
  id: 'id',
  ruleId: 'ruleId',
  action: 'action',
  previousValues: 'previousValues',
  newValues: 'newValues',
  changedBy: 'changedBy',
  changedAt: 'changedAt',
  ipAddress: 'ipAddress'
};

exports.Prisma.CommissionRuleScalarFieldEnum = {
  id: 'id',
  name: 'name',
  description: 'description',
  slug: 'slug',
  sourceType: 'sourceType',
  serviceType: 'serviceType',
  commissionType: 'commissionType',
  baseCommission: 'baseCommission',
  isActive: 'isActive',
  supplierCode: 'supplierCode',
  supplierId: 'supplierId',
  contractRef: 'contractRef',
  airlineCode: 'airlineCode',
  airlineGroup: 'airlineGroup',
  originCode: 'originCode',
  destinationCode: 'destinationCode',
  rbdClass: 'rbdClass',
  cabinClass: 'cabinClass',
  hotelId: 'hotelId',
  hotelChain: 'hotelChain',
  hotelStars: 'hotelStars',
  mealPlan: 'mealPlan',
  salesChannels: 'salesChannels',
  tenantId: 'tenantId',
  agentCode: 'agentCode',
  effectiveFrom: 'effectiveFrom',
  effectiveTo: 'effectiveTo',
  createdBy: 'createdBy',
  updatedBy: 'updatedBy',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CommissionRuleAuditLogScalarFieldEnum = {
  id: 'id',
  ruleId: 'ruleId',
  action: 'action',
  previousValues: 'previousValues',
  newValues: 'newValues',
  changedBy: 'changedBy',
  changedAt: 'changedAt',
  ipAddress: 'ipAddress'
};

exports.Prisma.TaxRuleScalarFieldEnum = {
  id: 'id',
  name: 'name',
  description: 'description',
  slug: 'slug',
  serviceType: 'serviceType',
  valueType: 'valueType',
  value: 'value',
  isActive: 'isActive',
  priority: 'priority',
  ruleLevel: 'ruleLevel',
  taxCode: 'taxCode',
  taxAuthority: 'taxAuthority',
  isRecoverable: 'isRecoverable',
  appliesToNet: 'appliesToNet',
  salesChannels: 'salesChannels',
  airlineCode: 'airlineCode',
  airlineGroup: 'airlineGroup',
  originCode: 'originCode',
  destinationCode: 'destinationCode',
  marketRegion: 'marketRegion',
  rbdClass: 'rbdClass',
  journeyType: 'journeyType',
  cabinClass: 'cabinClass',
  hotelId: 'hotelId',
  hotelChain: 'hotelChain',
  hotelStars: 'hotelStars',
  mealPlan: 'mealPlan',
  supplierCode: 'supplierCode',
  customerId: 'customerId',
  customerType: 'customerType',
  customerTier: 'customerTier',
  tenantId: 'tenantId',
  agentCode: 'agentCode',
  effectiveFrom: 'effectiveFrom',
  effectiveTo: 'effectiveTo',
  createdBy: 'createdBy',
  updatedBy: 'updatedBy',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.TaxRuleAuditLogScalarFieldEnum = {
  id: 'id',
  ruleId: 'ruleId',
  action: 'action',
  previousValues: 'previousValues',
  newValues: 'newValues',
  changedBy: 'changedBy',
  changedAt: 'changedAt',
  ipAddress: 'ipAddress'
};

exports.Prisma.LedgerTransactionScalarFieldEnum = {
  id: 'id',
  referenceId: 'referenceId',
  amount: 'amount',
  currency: 'currency',
  runningBalance: 'runningBalance',
  category: 'category',
  status: 'status',
  description: 'description',
  date: 'date'
};

exports.Prisma.DispatchEventScalarFieldEnum = {
  id: 'id',
  bookingId: 'bookingId',
  type: 'type',
  label: 'label',
  status: 'status',
  recipient: 'recipient',
  timestamp: 'timestamp'
};

exports.Prisma.ApprovalHistoryScalarFieldEnum = {
  id: 'id',
  bookingId: 'bookingId',
  approvalLevel: 'approvalLevel',
  approverEmail: 'approverEmail',
  approverName: 'approverName',
  status: 'status',
  actionDate: 'actionDate',
  remarks: 'remarks',
  createdAt: 'createdAt'
};

exports.Prisma.CommissionSharingRuleScalarFieldEnum = {
  id: 'id',
  commissionRuleId: 'commissionRuleId',
  shareType: 'shareType',
  shareValue: 'shareValue',
  recipientType: 'recipientType',
  customerId: 'customerId',
  customerType: 'customerType',
  customerTier: 'customerTier',
  minBookingValue: 'minBookingValue',
  maxShareValue: 'maxShareValue',
  priority: 'priority',
  isActive: 'isActive',
  effectiveFrom: 'effectiveFrom',
  effectiveTo: 'effectiveTo',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CommissionTransactionScalarFieldEnum = {
  id: 'id',
  bookingRef: 'bookingRef',
  commissionRuleId: 'commissionRuleId',
  sharingRuleId: 'sharingRuleId',
  baseCommission: 'baseCommission',
  sharedAmount: 'sharedAmount',
  retainedAmount: 'retainedAmount',
  currency: 'currency',
  recipientType: 'recipientType',
  recipientId: 'recipientId',
  status: 'status',
  paidAt: 'paidAt',
  description: 'description',
  slug: 'slug',
  createdAt: 'createdAt'
};

exports.Prisma.TravellerProfileScalarFieldEnum = {
  id: 'id',
  tenantId: 'tenantId',
  title: 'title',
  firstName: 'firstName',
  middleName: 'middleName',
  lastName: 'lastName',
  preferredName: 'preferredName',
  dateOfBirth: 'dateOfBirth',
  gender: 'gender',
  nationality: 'nationality',
  travellerType: 'travellerType',
  username: 'username',
  status: 'status',
  email: 'email',
  alternateEmail: 'alternateEmail',
  mobile: 'mobile',
  alternateMobile: 'alternateMobile',
  phone: 'phone',
  fax: 'fax',
  homeAddress: 'homeAddress',
  businessAddress: 'businessAddress',
  deliveryAddress: 'deliveryAddress',
  emergencyContactName: 'emergencyContactName',
  emergencyContactRelation: 'emergencyContactRelation',
  emergencyPhone: 'emergencyPhone',
  emergencyEmail: 'emergencyEmail',
  noEmail: 'noEmail',
  remarks: 'remarks',
  encryptionIv: 'encryptionIv',
  preferredLanguage: 'preferredLanguage',
  gdprConsent: 'gdprConsent',
  gdprConsentDate: 'gdprConsentDate',
  dataRetentionExpiry: 'dataRetentionExpiry',
  marketingConsent: 'marketingConsent',
  thirdPartySharingConsent: 'thirdPartySharingConsent',
  externalCRMId: 'externalCRMId',
  lastSyncedAt: 'lastSyncedAt',
  syncStatus: 'syncStatus',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ClientPassportScalarFieldEnum = {
  id: 'id',
  travellerId: 'travellerId',
  passportNumber: 'passportNumber',
  dateOfBirth: 'dateOfBirth',
  nationality: 'nationality',
  issuingCountry: 'issuingCountry',
  expiryDate: 'expiryDate',
  isPrimary: 'isPrimary',
  status: 'status',
  encryptionIv: 'encryptionIv',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ClientVisaScalarFieldEnum = {
  id: 'id',
  travellerId: 'travellerId',
  visaNumber: 'visaNumber',
  country: 'country',
  type: 'type',
  dateOfIssue: 'dateOfIssue',
  dateOfExpiry: 'dateOfExpiry',
  encryptionIv: 'encryptionIv',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ClientDependentScalarFieldEnum = {
  id: 'id',
  travellerId: 'travellerId',
  status: 'status',
  title: 'title',
  firstName: 'firstName',
  middleName: 'middleName',
  lastName: 'lastName',
  preferredName: 'preferredName',
  gender: 'gender',
  dateOfBirth: 'dateOfBirth',
  relation: 'relation',
  email: 'email',
  mobile: 'mobile',
  alternateMobile: 'alternateMobile',
  flightPreferences: 'flightPreferences',
  hotelPreferences: 'hotelPreferences',
  carPreferences: 'carPreferences',
  passportNumber: 'passportNumber',
  passportExpiry: 'passportExpiry',
  passportNationality: 'passportNationality',
  visaNumber: 'visaNumber',
  visaExpiry: 'visaExpiry',
  encryptionIv: 'encryptionIv',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ClientPreferencesScalarFieldEnum = {
  id: 'id',
  travellerId: 'travellerId',
  flightPreferences: 'flightPreferences',
  hotelPreferences: 'hotelPreferences',
  carPreferences: 'carPreferences',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ClientDocumentScalarFieldEnum = {
  id: 'id',
  travellerId: 'travellerId',
  title: 'title',
  fileName: 'fileName',
  fileSize: 'fileSize',
  fileType: 'fileType',
  fileUrl: 'fileUrl',
  documentType: 'documentType',
  encrypted: 'encrypted',
  encryptionKey: 'encryptionKey',
  uploadedBy: 'uploadedBy',
  uploadedAt: 'uploadedAt'
};

exports.Prisma.ClientPersonalCardScalarFieldEnum = {
  id: 'id',
  travellerId: 'travellerId',
  cardName: 'cardName',
  cardOption: 'cardOption',
  cardType: 'cardType',
  nameOnCard: 'nameOnCard',
  cardNumber: 'cardNumber',
  cardNumberLast4: 'cardNumberLast4',
  expiryDate: 'expiryDate',
  product: 'product',
  encryptionIv: 'encryptionIv',
  encrypted: 'encrypted',
  isDefault: 'isDefault',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ClientAssociationScalarFieldEnum = {
  id: 'id',
  travellerId: 'travellerId',
  associatedClientId: 'associatedClientId',
  associatedClientName: 'associatedClientName',
  associationType: 'associationType',
  associatedAt: 'associatedAt'
};

exports.Prisma.CustomAlertScalarFieldEnum = {
  id: 'id',
  travellerId: 'travellerId',
  alertType: 'alertType',
  title: 'title',
  message: 'message',
  severity: 'severity',
  triggerDate: 'triggerDate',
  isRecurring: 'isRecurring',
  recurrenceRule: 'recurrenceRule',
  isActive: 'isActive',
  isDismissed: 'isDismissed',
  dismissedAt: 'dismissedAt',
  dismissedBy: 'dismissedBy',
  notificationChannels: 'notificationChannels',
  metadata: 'metadata',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.IntegrationLogScalarFieldEnum = {
  id: 'id',
  travellerId: 'travellerId',
  integrationType: 'integrationType',
  provider: 'provider',
  operation: 'operation',
  requestPayload: 'requestPayload',
  responsePayload: 'responsePayload',
  statusCode: 'statusCode',
  errorMessage: 'errorMessage',
  duration: 'duration',
  syncDirection: 'syncDirection',
  status: 'status',
  retryCount: 'retryCount',
  nextRetryAt: 'nextRetryAt',
  createdAt: 'createdAt'
};

exports.Prisma.SubUserScalarFieldEnum = {
  id: 'id',
  username: 'username',
  name: 'name',
  email: 'email',
  role: 'role',
  title: 'title',
  firstName: 'firstName',
  lastName: 'lastName',
  gender: 'gender',
  language: 'language',
  allowAutoTicket: 'allowAutoTicket',
  streetAddress: 'streetAddress',
  city: 'city',
  state: 'state',
  postCode: 'postCode',
  telephone: 'telephone',
  mobile: 'mobile',
  remarks: 'remarks',
  creditLimit: 'creditLimit',
  availableCredit: 'availableCredit',
  createdAt: 'createdAt'
};

exports.Prisma.BranchScalarFieldEnum = {
  id: 'id',
  name: 'name',
  email: 'email',
  address1: 'address1',
  address2: 'address2',
  address3: 'address3',
  city: 'city',
  userId: 'userId',
  tier: 'tier',
  comments: 'comments',
  totalSpent: 'totalSpent',
  state: 'state',
  postCode: 'postCode',
  country: 'country',
  telephone: 'telephone',
  mobile: 'mobile',
  fax: 'fax',
  contactName: 'contactName',
  contactEmail: 'contactEmail',
  contactMobile: 'contactMobile',
  remark: 'remark',
  isActive: 'isActive',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.FavoriteAssetScalarFieldEnum = {
  id: 'id',
  subUserId: 'subUserId',
  type: 'type',
  assetId: 'assetId',
  name: 'name',
  details: 'details',
  createdAt: 'createdAt'
};

exports.Prisma.SupplierScalarFieldEnum = {
  id: 'id',
  name: 'name',
  code: 'code',
  type: 'type',
  status: 'status',
  address: 'address',
  city: 'city',
  state: 'state',
  postCode: 'postCode',
  country: 'country',
  telephone1: 'telephone1',
  telephone2: 'telephone2',
  mobile: 'mobile',
  fax: 'fax',
  email: 'email',
  website: 'website',
  logoUrl: 'logoUrl',
  taxId: 'taxId',
  panNo: 'panNo',
  serviceTaxNo: 'serviceTaxNo',
  atolNo: 'atolNo',
  bankName: 'bankName',
  accountNumber: 'accountNumber',
  swiftCode: 'swiftCode',
  rtgsCode: 'rtgsCode',
  currency: 'currency',
  settlementPeriod: 'settlementPeriod',
  securityDeposit: 'securityDeposit',
  contractDate: 'contractDate',
  financialRemarks: 'financialRemarks',
  creditLimit: 'creditLimit',
  availableCredit: 'availableCredit',
  onboardingStatus: 'onboardingStatus',
  loginStatus: 'loginStatus'
};

exports.Prisma.SupplierAlertScalarFieldEnum = {
  id: 'id',
  supplierId: 'supplierId',
  type: 'type',
  threshold: 'threshold',
  status: 'status',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SupplierContractScalarFieldEnum = {
  id: 'id',
  supplierId: 'supplierId',
  contractRef: 'contractRef',
  startDate: 'startDate',
  endDate: 'endDate',
  terms: 'terms',
  netMarkup: 'netMarkup',
  isActive: 'isActive'
};

exports.Prisma.SupplierMetricScalarFieldEnum = {
  id: 'id',
  supplierId: 'supplierId',
  timestamp: 'timestamp',
  latencyMs: 'latencyMs',
  successRate: 'successRate',
  errorCount: 'errorCount',
  pnrVelocity: 'pnrVelocity'
};

exports.Prisma.CommunicationLogScalarFieldEnum = {
  id: 'id',
  travellerId: 'travellerId',
  timestamp: 'timestamp',
  type: 'type',
  subject: 'subject',
  content: 'content',
  status: 'status'
};

exports.Prisma.CurrencyExchangeRateScalarFieldEnum = {
  id: 'id',
  baseCurrency: 'baseCurrency',
  quoteCurrency: 'quoteCurrency',
  rate: 'rate',
  inverseRate: 'inverseRate',
  source: 'source',
  validFrom: 'validFrom',
  validTo: 'validTo',
  isLocked: 'isLocked',
  bookingId: 'bookingId',
  createdAt: 'createdAt'
};

exports.Prisma.CorporateInvoiceScalarFieldEnum = {
  id: 'id',
  invoiceNo: 'invoiceNo',
  corporateAccountId: 'corporateAccountId',
  billingPeriodStart: 'billingPeriodStart',
  billingPeriodEnd: 'billingPeriodEnd',
  totalAmount: 'totalAmount',
  currency: 'currency',
  lineItems: 'lineItems',
  status: 'status',
  dueDate: 'dueDate',
  sentAt: 'sentAt',
  paidAt: 'paidAt',
  paymentMethod: 'paymentMethod',
  paymentReference: 'paymentReference',
  notes: 'notes',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SupplierSettlementScalarFieldEnum = {
  id: 'id',
  settlementNo: 'settlementNo',
  supplierWalletId: 'supplierWalletId',
  settlementPeriodStart: 'settlementPeriodStart',
  settlementPeriodEnd: 'settlementPeriodEnd',
  totalAmount: 'totalAmount',
  currency: 'currency',
  lineItems: 'lineItems',
  exchangeRate: 'exchangeRate',
  localAmount: 'localAmount',
  localCurrency: 'localCurrency',
  status: 'status',
  paymentMethod: 'paymentMethod',
  paymentReference: 'paymentReference',
  paidAt: 'paidAt',
  adjustments: 'adjustments',
  adjustmentReason: 'adjustmentReason',
  notes: 'notes',
  processedBy: 'processedBy',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.LedgerAccountScalarFieldEnum = {
  id: 'id',
  accountNo: 'accountNo',
  accountName: 'accountName',
  accountType: 'accountType',
  parentAccountId: 'parentAccountId',
  currency: 'currency',
  balance: 'balance',
  debitTotal: 'debitTotal',
  creditTotal: 'creditTotal',
  isActive: 'isActive',
  description: 'description',
  slug: 'slug',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.LedgerEntryScalarFieldEnum = {
  id: 'id',
  entryNo: 'entryNo',
  transactionId: 'transactionId',
  bookingId: 'bookingId',
  bookingRef: 'bookingRef',
  entryType: 'entryType',
  amount: 'amount',
  currency: 'currency',
  accountId: 'accountId',
  description: 'description',
  slug: 'slug',
  createdAt: 'createdAt'
};

exports.Prisma.FinancialEventScalarFieldEnum = {
  id: 'id',
  eventType: 'eventType',
  entity: 'entity',
  entityId: 'entityId',
  amount: 'amount',
  currency: 'currency',
  balanceBefore: 'balanceBefore',
  balanceAfter: 'balanceAfter',
  metadata: 'metadata',
  status: 'status',
  createdAt: 'createdAt',
  paymentMethod: 'paymentMethod',
  invoiceId: 'invoiceId'
};

exports.Prisma.BookingQueueScalarFieldEnum = {
  id: 'id',
  bookingId: 'bookingId',
  queueType: 'queueType',
  status: 'status',
  priority: 'priority',
  notes: 'notes',
  metadata: 'metadata',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.BookingPassengerScalarFieldEnum = {
  id: 'id',
  bookingId: 'bookingId',
  firstName: 'firstName',
  lastName: 'lastName',
  email: 'email',
  phone: 'phone',
  passengerType: 'passengerType',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.InvoiceScalarFieldEnum = {
  id: 'id',
  invoiceNumber: 'invoiceNumber',
  bookingId: 'bookingId',
  totalAmount: 'totalAmount',
  currency: 'currency',
  status: 'status',
  billingPeriodStart: 'billingPeriodStart',
  billingPeriodEnd: 'billingPeriodEnd',
  dueDate: 'dueDate',
  paidAt: 'paidAt',
  paymentMethod: 'paymentMethod',
  paymentReference: 'paymentReference',
  lineItems: 'lineItems',
  notes: 'notes',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.DuffelOrderScalarFieldEnum = {
  id: 'id',
  orderId: 'orderId',
  bookingId: 'bookingId',
  clientKey: 'clientKey',
  pnr: 'pnr',
  status: 'status',
  totalAmount: 'totalAmount',
  totalCurrency: 'totalCurrency',
  passengers: 'passengers',
  slices: 'slices',
  taxAmount: 'taxAmount',
  taxCurrency: 'taxCurrency',
  ticketingStatus: 'ticketingStatus',
  paymentStatus: 'paymentStatus',
  metadata: 'metadata',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.DuffelOfferRequestScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  origin: 'origin',
  destination: 'destination',
  departureDate: 'departureDate',
  returnDate: 'returnDate',
  passengers: 'passengers',
  cabinClass: 'cabinClass',
  rawResponse: 'rawResponse',
  createdAt: 'createdAt'
};

exports.Prisma.DuffelOfferScalarFieldEnum = {
  id: 'id',
  offerRequestId: 'offerRequestId',
  totalAmount: 'totalAmount',
  taxAmount: 'taxAmount',
  currency: 'currency',
  ownerId: 'ownerId',
  expiresAt: 'expiresAt',
  rawResponse: 'rawResponse',
  createdAt: 'createdAt'
};

exports.Prisma.LiteApiBookingScalarFieldEnum = {
  id: 'id',
  bookingId: 'bookingId',
  otaBookingId: 'otaBookingId',
  localBookingId: 'localBookingId',
  status: 'status',
  hotelId: 'hotelId',
  hotelName: 'hotelName',
  checkIn: 'checkIn',
  checkOut: 'checkOut',
  price: 'price',
  totalAmount: 'totalAmount',
  currency: 'currency',
  cancellationPax: 'cancellationPax',
  rooms: 'rooms',
  metadata: 'metadata',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PrebookSessionScalarFieldEnum = {
  id: 'id',
  sessionId: 'sessionId',
  transactionId: 'transactionId',
  flightType: 'flightType',
  offerId: 'offerId',
  hotelId: 'hotelId',
  price: 'price',
  currency: 'currency',
  guestEmail: 'guestEmail',
  guestName: 'guestName',
  expiresAt: 'expiresAt',
  status: 'status',
  bookingId: 'bookingId',
  searchParams: 'searchParams',
  selectedOffer: 'selectedOffer',
  tenantId: 'tenantId',
  salesChannel: 'salesChannel',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.OfflineChangeRequestScalarFieldEnum = {
  id: 'id',
  requestRef: 'requestRef',
  bookingId: 'bookingId',
  bookingRef: 'bookingRef',
  requestType: 'requestType',
  status: 'status',
  requestedBy: 'requestedBy',
  requestedRole: 'requestedRole',
  submittedBy: 'submittedBy',
  assignedTo: 'assignedTo',
  priority: 'priority',
  subject: 'subject',
  description: 'description',
  attachments: 'attachments',
  internalRemarks: 'internalRemarks',
  requestDetails: 'requestDetails',
  resolutionData: 'resolutionData',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.OfflineRequestAuditLogScalarFieldEnum = {
  id: 'id',
  requestId: 'requestId',
  action: 'action',
  performedBy: 'performedBy',
  role: 'role',
  oldStatus: 'oldStatus',
  newStatus: 'newStatus',
  details: 'details',
  createdAt: 'createdAt'
};

exports.Prisma.OfflineRequestNotificationQueueScalarFieldEnum = {
  id: 'id',
  requestId: 'requestId',
  type: 'type',
  recipient: 'recipient',
  status: 'status',
  payload: 'payload',
  error: 'error',
  createdAt: 'createdAt',
  processedAt: 'processedAt'
};

exports.Prisma.SupplierHotelMappingScalarFieldEnum = {
  id: 'id',
  supplierHotelId: 'supplierHotelId',
  localHotelId: 'localHotelId',
  hotelName: 'hotelName',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.BoardTypeScalarFieldEnum = {
  id: 'id',
  code: 'code',
  name: 'name',
  isActive: 'isActive',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SupportTicketScalarFieldEnum = {
  id: 'id',
  tenantId: 'tenantId',
  userId: 'userId',
  subject: 'subject',
  description: 'description',
  status: 'status',
  priority: 'priority',
  assignedTo: 'assignedTo',
  relatedTo: 'relatedTo',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.TicketMessageScalarFieldEnum = {
  id: 'id',
  ticketId: 'ticketId',
  userId: 'userId',
  sender: 'sender',
  message: 'message',
  isInternal: 'isInternal',
  createdAt: 'createdAt'
};

exports.Prisma.WhiteLabelThemeScalarFieldEnum = {
  id: 'id',
  tenantId: 'tenantId',
  logoUrl: 'logoUrl',
  primaryColor: 'primaryColor',
  secondaryColor: 'secondaryColor',
  fontFamily: 'fontFamily',
  customCss: 'customCss',
  featureFlags: 'featureFlags',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SystemConfigScalarFieldEnum = {
  id: 'id',
  key: 'key',
  value: 'value',
  description: 'description',
  isPublic: 'isPublic',
  lastUpdatedBy: 'lastUpdatedBy',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.WebhookLogScalarFieldEnum = {
  id: 'id',
  supplier: 'supplier',
  eventType: 'eventType',
  raw_payload: 'raw_payload',
  processed: 'processed',
  processedAt: 'processedAt',
  error: 'error',
  retryCount: 'retryCount',
  createdAt: 'createdAt'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.NullableJsonNullValueInput = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull
};

exports.Prisma.JsonNullValueInput = {
  JsonNull: Prisma.JsonNull
};

exports.Prisma.QueryMode = {
  default: 'default',
  insensitive: 'insensitive'
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};

exports.Prisma.JsonNullValueFilter = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull,
  AnyNull: Prisma.AnyNull
};
exports.TenantType = exports.$Enums.TenantType = {
  MASTER: 'MASTER',
  SUB_AGENT: 'SUB_AGENT',
  CORPORATE: 'CORPORATE'
};

exports.TenantStatus = exports.$Enums.TenantStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  SUSPENDED: 'SUSPENDED'
};

exports.SalesChannel = exports.$Enums.SalesChannel = {
  POS_DC: 'POS_DC',
  POS_SA: 'POS_SA',
  POS_CA: 'POS_CA',
  SUBAGENT: 'SUBAGENT',
  WEBSITE: 'WEBSITE',
  MOBILE: 'MOBILE'
};

exports.BookingStatus = exports.$Enums.BookingStatus = {
  NEW_BOOKING: 'NEW_BOOKING',
  PROVISIONAL: 'PROVISIONAL',
  AUTHORIZED: 'AUTHORIZED',
  TICKETED: 'TICKETED',
  DOCUMENTED: 'DOCUMENTED',
  DISPATCHED: 'DISPATCHED',
  CANCELLED: 'CANCELLED',
  VOID: 'VOID',
  REFUNDED: 'REFUNDED',
  REFUND_ON_HOLD: 'REFUND_ON_HOLD',
  REJECTED: 'REJECTED'
};

exports.SegmentStatus = exports.$Enums.SegmentStatus = {
  HK: 'HK',
  UC: 'UC',
  RQ: 'RQ',
  HX: 'HX',
  NO: 'NO'
};

exports.DocumentType = exports.$Enums.DocumentType = {
  TICKET: 'TICKET',
  VOUCHER: 'VOUCHER',
  INVOICE: 'INVOICE',
  CREDIT_NOTE: 'CREDIT_NOTE',
  DEBIT_NOTE: 'DEBIT_NOTE',
  RECEIPT: 'RECEIPT'
};

exports.ServiceRequestType = exports.$Enums.ServiceRequestType = {
  REFUND: 'REFUND',
  RESCHEDULE: 'RESCHEDULE',
  CANCEL: 'CANCEL',
  CLIENT_SWITCH: 'CLIENT_SWITCH'
};

exports.ServiceRequestStatus = exports.$Enums.ServiceRequestStatus = {
  OPEN: 'OPEN',
  APPROVED: 'APPROVED',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  REJECTED: 'REJECTED'
};

exports.ApprovalLevel = exports.$Enums.ApprovalLevel = {
  LEVEL_1: 'LEVEL_1',
  LEVEL_2: 'LEVEL_2',
  LEVEL_3: 'LEVEL_3',
  LINE_MANAGER: 'LINE_MANAGER',
  FINANCE_MANAGER: 'FINANCE_MANAGER'
};

exports.ContactType = exports.$Enums.ContactType = {
  CORPORATE: 'CORPORATE',
  SUB_AGENT: 'SUB_AGENT',
  INDIVIDUAL: 'INDIVIDUAL',
  WALK_IN: 'WALK_IN'
};

exports.ActivityType = exports.$Enums.ActivityType = {
  BOOKING: 'BOOKING',
  EMAIL: 'EMAIL',
  CALL: 'CALL',
  MEETING: 'MEETING',
  NOTE: 'NOTE',
  TASK: 'TASK',
  REMINDER: 'REMINDER'
};

exports.InventoryType = exports.$Enums.InventoryType = {
  Flight: 'Flight',
  Hotel: 'Hotel'
};

exports.InventoryStatus = exports.$Enums.InventoryStatus = {
  Active: 'Active',
  Depleted: 'Depleted',
  Expired: 'Expired',
  CarryForwarded: 'CarryForwarded'
};

exports.InventoryTransactionType = exports.$Enums.InventoryTransactionType = {
  Purchase: 'Purchase',
  Sale: 'Sale',
  CarryForward: 'CarryForward',
  Adjustment: 'Adjustment',
  GroupSale: 'GroupSale'
};

exports.NotificationChannel = exports.$Enums.NotificationChannel = {
  email: 'email',
  sms: 'sms',
  push: 'push',
  in_app: 'in_app'
};

exports.NotificationPriority = exports.$Enums.NotificationPriority = {
  low: 'low',
  medium: 'medium',
  high: 'high',
  urgent: 'urgent'
};

exports.NotificationStatus = exports.$Enums.NotificationStatus = {
  pending: 'pending',
  sent: 'sent',
  failed: 'failed',
  retrying: 'retrying'
};

exports.WalletOwnerType = exports.$Enums.WalletOwnerType = {
  CUSTOMER: 'CUSTOMER',
  AGENT: 'AGENT',
  CORPORATE: 'CORPORATE',
  SUPPLIER: 'SUPPLIER',
  SUB_AGENT: 'SUB_AGENT'
};

exports.WalletStatus = exports.$Enums.WalletStatus = {
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  CLOSED: 'CLOSED',
  PENDING_ACTIVATION: 'PENDING_ACTIVATION'
};

exports.TransactionCategory = exports.$Enums.TransactionCategory = {
  FLIGHT_BOOKING: 'FLIGHT_BOOKING',
  HOTEL_BOOKING: 'HOTEL_BOOKING',
  MARKUP_EARNING: 'MARKUP_EARNING',
  COMMISSION_EARNING: 'COMMISSION_EARNING',
  REFUND: 'REFUND',
  CREDIT_LIMIT: 'CREDIT_LIMIT',
  AUTO_RELOAD: 'AUTO_RELOAD',
  MANUAL_ADJUSTMENT: 'MANUAL_ADJUSTMENT',
  PAYMENT: 'PAYMENT',
  HOLD: 'HOLD'
};

exports.WalletTransactionType = exports.$Enums.WalletTransactionType = {
  CREDIT: 'CREDIT',
  DEBIT: 'DEBIT',
  HOLD: 'HOLD',
  RELEASE: 'RELEASE',
  TRANSFER: 'TRANSFER',
  REFUND: 'REFUND',
  FEE: 'FEE',
  ADJUSTMENT: 'ADJUSTMENT',
  RECONCILIATION: 'RECONCILIATION',
  AUTO_RELOAD: 'AUTO_RELOAD'
};

exports.PaymentMethod = exports.$Enums.PaymentMethod = {
  CASH: 'CASH',
  CREDIT_CARD: 'CREDIT_CARD',
  DEBIT_CARD: 'DEBIT_CARD',
  BANK_TRANSFER: 'BANK_TRANSFER',
  WALLET: 'WALLET',
  CHEQUE: 'CHEQUE',
  ON_HOLD: 'ON_HOLD',
  SKIP_PAYMENT: 'SKIP_PAYMENT'
};

exports.HoldStatus = exports.$Enums.HoldStatus = {
  ACTIVE: 'ACTIVE',
  RELEASED: 'RELEASED',
  CONVERTED: 'CONVERTED',
  EXPIRED: 'EXPIRED'
};

exports.MarkupValueType = exports.$Enums.MarkupValueType = {
  Percentage: 'Percentage',
  Fixed: 'Fixed'
};

exports.MarkupRuleLevel = exports.$Enums.MarkupRuleLevel = {
  BASE: 'BASE',
  OVERRIDE: 'OVERRIDE',
  EXCEPTION: 'EXCEPTION'
};

exports.CommissionSourceType = exports.$Enums.CommissionSourceType = {
  Airline: 'Airline',
  HotelSupplier: 'HotelSupplier',
  GDS: 'GDS',
  DirectContract: 'DirectContract'
};

exports.CommissionType = exports.$Enums.CommissionType = {
  Percentage: 'Percentage',
  Fixed: 'Fixed',
  Tiered: 'Tiered'
};

exports.TaxValueType = exports.$Enums.TaxValueType = {
  Percentage: 'Percentage',
  Fixed: 'Fixed',
  Tiered: 'Tiered'
};

exports.TaxRuleLevel = exports.$Enums.TaxRuleLevel = {
  BASE: 'BASE',
  OVERRIDE: 'OVERRIDE',
  EXCEPTION: 'EXCEPTION'
};

exports.Prisma.ModelName = {
  Tenant: 'Tenant',
  User: 'User',
  SalesChannelConfig: 'SalesChannelConfig',
  ApiKey: 'ApiKey',
  AuditLog: 'AuditLog',
  Booking: 'Booking',
  Segment: 'Segment',
  Document: 'Document',
  ServiceRequest: 'ServiceRequest',
  Approval: 'Approval',
  StatusChangeLog: 'StatusChangeLog',
  ClientSwitchApproval: 'ClientSwitchApproval',
  Enquiry: 'Enquiry',
  CorporateTraveller: 'CorporateTraveller',
  Contact: 'Contact',
  Activity: 'Activity',
  Preference: 'Preference',
  InventoryBlock: 'InventoryBlock',
  InventoryTransaction: 'InventoryTransaction',
  InventoryAllocation: 'InventoryAllocation',
  NotificationTemplate: 'NotificationTemplate',
  NotificationLog: 'NotificationLog',
  Wallet: 'Wallet',
  CurrencyAccount: 'CurrencyAccount',
  WalletTransaction: 'WalletTransaction',
  WalletHold: 'WalletHold',
  AgentCreditLimit: 'AgentCreditLimit',
  WalletRefund: 'WalletRefund',
  WalletReconciliationLog: 'WalletReconciliationLog',
  CorporateAccount: 'CorporateAccount',
  SupplierWallet: 'SupplierWallet',
  MarkupRule: 'MarkupRule',
  MarkupRuleAuditLog: 'MarkupRuleAuditLog',
  CommissionRule: 'CommissionRule',
  CommissionRuleAuditLog: 'CommissionRuleAuditLog',
  TaxRule: 'TaxRule',
  TaxRuleAuditLog: 'TaxRuleAuditLog',
  LedgerTransaction: 'LedgerTransaction',
  DispatchEvent: 'DispatchEvent',
  ApprovalHistory: 'ApprovalHistory',
  CommissionSharingRule: 'CommissionSharingRule',
  CommissionTransaction: 'CommissionTransaction',
  TravellerProfile: 'TravellerProfile',
  ClientPassport: 'ClientPassport',
  ClientVisa: 'ClientVisa',
  ClientDependent: 'ClientDependent',
  ClientPreferences: 'ClientPreferences',
  ClientDocument: 'ClientDocument',
  ClientPersonalCard: 'ClientPersonalCard',
  ClientAssociation: 'ClientAssociation',
  CustomAlert: 'CustomAlert',
  IntegrationLog: 'IntegrationLog',
  SubUser: 'SubUser',
  Branch: 'Branch',
  FavoriteAsset: 'FavoriteAsset',
  Supplier: 'Supplier',
  SupplierAlert: 'SupplierAlert',
  SupplierContract: 'SupplierContract',
  SupplierMetric: 'SupplierMetric',
  CommunicationLog: 'CommunicationLog',
  CurrencyExchangeRate: 'CurrencyExchangeRate',
  CorporateInvoice: 'CorporateInvoice',
  SupplierSettlement: 'SupplierSettlement',
  LedgerAccount: 'LedgerAccount',
  LedgerEntry: 'LedgerEntry',
  FinancialEvent: 'FinancialEvent',
  BookingQueue: 'BookingQueue',
  BookingPassenger: 'BookingPassenger',
  Invoice: 'Invoice',
  DuffelOrder: 'DuffelOrder',
  DuffelOfferRequest: 'DuffelOfferRequest',
  DuffelOffer: 'DuffelOffer',
  LiteApiBooking: 'LiteApiBooking',
  PrebookSession: 'PrebookSession',
  OfflineChangeRequest: 'OfflineChangeRequest',
  OfflineRequestAuditLog: 'OfflineRequestAuditLog',
  OfflineRequestNotificationQueue: 'OfflineRequestNotificationQueue',
  SupplierHotelMapping: 'SupplierHotelMapping',
  BoardType: 'BoardType',
  SupportTicket: 'SupportTicket',
  TicketMessage: 'TicketMessage',
  WhiteLabelTheme: 'WhiteLabelTheme',
  SystemConfig: 'SystemConfig',
  WebhookLog: 'WebhookLog'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }
        
        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
