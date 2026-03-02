import * as JoiModule from "joi";
const Joi: any = (JoiModule as any).default || JoiModule;

// Booking creation schema
export const createBookingSchema = Joi.object({
  type: Joi.string()
    .valid("flight", "hotel", "package", "transfer", "visa", "insurance")
    .required(),
  details: Joi.object({
    origin: Joi.string().when("type", {
      is: "flight",
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
    destination: Joi.string().when("type", {
      is: "flight",
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
    checkIn: Joi.date().iso().when("type", {
      is: "hotel",
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
    checkOut: Joi.date().iso().when("type", {
      is: "hotel",
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
    travelDate: Joi.date().iso().required(),
    returnDate: Joi.date().iso().optional(),
    passengers: Joi.array()
      .items(
        Joi.object({
          firstName: Joi.string().min(2).max(50).required(),
          lastName: Joi.string().min(2).max(50).required(),
          type: Joi.string().valid("adult", "child", "infant").required(),
          dateOfBirth: Joi.date().iso().required(),
          passportNumber: Joi.string().optional(),
          nationality: Joi.string().optional(),
        }),
      )
      .min(1)
      .required(),
    serviceDetails: Joi.object().optional(),
  }).required(),
  customerInfo: Joi.object({
    type: Joi.string().valid("individual", "corporate").required(),
    name: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required(),
    phone: Joi.string()
      .pattern(/^\+?[1-9]\d{1,14}$/)
      .required(),
    address: Joi.string().optional(),
    companyName: Joi.string().when("type", {
      is: "corporate",
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
    companyRegistrationNumber: Joi.string().when("type", {
      is: "corporate",
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
    branchId: Joi.string().optional(),
  }).required(),
  paymentInfo: Joi.object({
    method: Joi.string()
      .valid("wallet", "credit_card", "debit_card", "net_banking", "upi")
      .required(),
    amount: Joi.number().positive().required(),
    currency: Joi.string().length(3).uppercase().default("USD"),
    paymentReference: Joi.string().optional(),
    paymentDetails: Joi.object().optional(),
  }).required(),
  bookingOptions: Joi.object({
    hold: Joi.boolean().default(false),
    priority: Joi.string()
      .valid("low", "medium", "high", "urgent")
      .default("medium"),
    remarks: Joi.string().max(500).optional(),
    tags: Joi.array().items(Joi.string()).optional(),
  }).optional(),
});

// Search bookings schema
export const searchBookingsSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  status: Joi.array()
    .items(
      Joi.string().valid(
        "PENDING",
        "CONFIRMED",
        "CANCELLED",
        "REFUNDED",
        "EXPIRED",
        "HOLD",
      ),
    )
    .optional(),
  customer: Joi.string().optional(),
  agent: Joi.string().optional(),
  dateFrom: Joi.date().iso().optional(),
  dateTo: Joi.date().iso().optional(),
  travelDateFrom: Joi.date().iso().optional(),
  travelDateTo: Joi.date().iso().optional(),
  serviceType: Joi.string()
    .valid("flight", "hotel", "package", "transfer", "visa", "insurance")
    .optional(),
  origin: Joi.string().optional(),
  destination: Joi.string().optional(),
  supplier: Joi.string().optional(),
  priority: Joi.array()
    .items(Joi.string().valid("low", "medium", "high", "urgent"))
    .optional(),
  queueStatus: Joi.array()
    .items(Joi.string().valid("pending", "processing", "completed"))
    .optional(),
  assignedAgent: Joi.string().optional(),
  branchId: Joi.string().optional(),
  search: Joi.string().min(2).optional(),
});

// Search customers schema
export const searchCustomersSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  type: Joi.string().valid("individual", "corporate").optional(),
  name: Joi.string().min(2).optional(),
  email: Joi.string().email().optional(),
  phone: Joi.string()
    .pattern(/^\+?[1-9]\d{1,14}$/)
    .optional(),
  companyName: Joi.string().optional(),
  branchId: Joi.string().optional(),
  status: Joi.string().valid("active", "inactive", "suspended").optional(),
  dateFrom: Joi.date().iso().optional(),
  dateTo: Joi.date().iso().optional(),
});

// Create customer schema
export const createCustomerSchema = Joi.object({
  type: Joi.string().valid("individual", "corporate").required(),
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  phone: Joi.string()
    .pattern(/^\+?[1-9]\d{1,14}$/)
    .required(),
  address: Joi.string().max(500).optional(),
  dateOfBirth: Joi.date().iso().optional(),
  nationality: Joi.string().optional(),
  passportNumber: Joi.string().optional(),
  companyName: Joi.string().when("type", {
    is: "corporate",
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  companyRegistrationNumber: Joi.string().when("type", {
    is: "corporate",
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  branchId: Joi.string().optional(),
  creditLimit: Joi.number().positive().optional(),
  paymentTerms: Joi.string()
    .valid("prepaid", "postpaid", "credit")
    .default("prepaid"),
  tags: Joi.array().items(Joi.string()).optional(),
  notes: Joi.string().max(1000).optional(),
});

// Search suppliers schema
export const searchSuppliersSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  type: Joi.string()
    .valid("airline", "hotel", "car_rental", "visa_agency", "insurance_company")
    .optional(),
  name: Joi.string().min(2).optional(),
  contactName: Joi.string().optional(),
  contactEmail: Joi.string().email().optional(),
  contactPhone: Joi.string()
    .pattern(/^\+?[1-9]\d{1,14}$/)
    .optional(),
  status: Joi.string().valid("active", "inactive", "suspended").optional(),
  serviceTypes: Joi.array()
    .items(
      Joi.string().valid(
        "flight",
        "hotel",
        "package",
        "transfer",
        "visa",
        "insurance",
      ),
    )
    .optional(),
});

// Create supplier schema
export const createSupplierSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  type: Joi.string()
    .valid("airline", "hotel", "car_rental", "visa_agency", "insurance_company")
    .required(),
  contactName: Joi.string().min(2).max(100).optional(),
  contactEmail: Joi.string().email().optional(),
  contactPhone: Joi.string()
    .pattern(/^\+?[1-9]\d{1,14}$/)
    .optional(),
  address: Joi.string().max(500).optional(),
  commissionRate: Joi.number().min(0).max(100).optional(),
  paymentTerms: Joi.string()
    .valid("prepaid", "postpaid", "net_7", "net_15", "net_30")
    .default("net_30"),
  status: Joi.string()
    .valid("active", "inactive", "suspended")
    .default("active"),
  serviceTypes: Joi.array()
    .items(
      Joi.string().valid(
        "flight",
        "hotel",
        "package",
        "transfer",
        "visa",
        "insurance",
      ),
    )
    .optional(),
  apiEndpoint: Joi.string().uri().optional(),
  apiKey: Joi.string().optional(),
  notes: Joi.string().max(1000).optional(),
});

// Hold inventory schema
export const holdInventorySchema = Joi.object({
  serviceType: Joi.string().valid("flight", "hotel", "package").required(),
  inventoryDetails: Joi.object({
    flight: Joi.object({
      origin: Joi.string().required(),
      destination: Joi.string().required(),
      departureDate: Joi.date().iso().required(),
      returnDate: Joi.date().iso().optional(),
      airline: Joi.string().optional(),
      flightNumber: Joi.string().optional(),
      cabinClass: Joi.string()
        .valid("economy", "premium_economy", "business", "first")
        .default("economy"),
    }).when("serviceType", { is: "flight", then: Joi.required() }),
    hotel: Joi.object({
      hotelName: Joi.string().required(),
      city: Joi.string().required(),
      checkIn: Joi.date().iso().required(),
      checkOut: Joi.date().iso().required(),
      rooms: Joi.array()
        .items(
          Joi.object({
            roomType: Joi.string().required(),
            adults: Joi.number().integer().min(1).max(4).required(),
            children: Joi.number().integer().min(0).max(4).default(0),
            infants: Joi.number().integer().min(0).max(2).default(0),
          }),
        )
        .min(1)
        .required(),
    }).when("serviceType", { is: "hotel", then: Joi.required() }),
    package: Joi.object({
      packageId: Joi.string().required(),
      travelDate: Joi.date().iso().required(),
      returnDate: Joi.date().iso().optional(),
      paxCount: Joi.number().integer().min(1).required(),
    }).when("serviceType", { is: "package", then: Joi.required() }),
  }).required(),
  holdDuration: Joi.number().integer().min(15).max(1440).default(60), // Minutes
  customerInfo: Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    phone: Joi.string()
      .pattern(/^\+?[1-9]\d{1,14}$/)
      .required(),
  }).required(),
  remarks: Joi.string().max(500).optional(),
});

// Confirm booking schema
export const confirmBookingSchema = Joi.object({
  bookingId: Joi.string().required(),
  supplierReference: Joi.string().required(),
  supplierPNR: Joi.string().optional(),
  confirmationDetails: Joi.object({
    ticketNumbers: Joi.array().items(Joi.string()).optional(),
    eTicketDetails: Joi.array()
      .items(
        Joi.object({
          passengerName: Joi.string().required(),
          ticketNumber: Joi.string().required(),
          pnr: Joi.string().required(),
        }),
      )
      .optional(),
    hotelVoucher: Joi.string().optional(),
    packageItinerary: Joi.string().optional(),
  }).optional(),
  paymentInfo: Joi.object({
    amount: Joi.number().positive().required(),
    currency: Joi.string().length(3).uppercase().default("USD"),
    paymentMethod: Joi.string()
      .valid("wallet", "credit_card", "debit_card", "net_banking", "upi")
      .required(),
    transactionId: Joi.string().optional(),
  }).required(),
  remarks: Joi.string().max(500).optional(),
});

// Issue ticket schema
export const issueTicketSchema = Joi.object({
  bookingId: Joi.string().required(),
  passengerDetails: Joi.array()
    .items(
      Joi.object({
        passengerId: Joi.string().required(),
        ticketNumber: Joi.string().required(),
        pnr: Joi.string().required(),
        seatNumber: Joi.string().optional(),
        baggageAllowance: Joi.string().optional(),
      }),
    )
    .min(1)
    .required(),
  issueDetails: Joi.object({
    issuedBy: Joi.string().required(),
    issueDate: Joi.date().iso().default(Date.now),
    remarks: Joi.string().max(500).optional(),
  }).required(),
});

// Update workflow status schema
export const updateWorkflowStatusSchema = Joi.object({
  bookingId: Joi.string().required(),
  status: Joi.string()
    .valid("PENDING", "CONFIRMED", "CANCELLED", "REFUNDED", "EXPIRED", "HOLD")
    .required(),
  reason: Joi.string().max(500).optional(),
  nextAction: Joi.string().optional(),
  estimatedCompletion: Joi.date().iso().optional(),
});

// Assign booking schema
export const assignBookingSchema = Joi.object({
  bookingId: Joi.string().required(),
  agentId: Joi.string().required(),
  reason: Joi.string().max(500).optional(),
  priority: Joi.string()
    .valid("low", "medium", "high", "urgent")
    .default("medium"),
  deadline: Joi.date().iso().optional(),
});

// Update priority schema
export const updatePrioritySchema = Joi.object({
  bookingId: Joi.string().required(),
  priority: Joi.string().valid("low", "medium", "high", "urgent").required(),
  reason: Joi.string().max(500).optional(),
  assignedAgent: Joi.string().optional(),
});

// Add inventory schema
export const addInventorySchema = Joi.object({
  serviceType: Joi.string().valid("flight", "hotel", "package").required(),
  inventoryDetails: Joi.object({
    flight: Joi.object({
      airline: Joi.string().required(),
      flightNumber: Joi.string().required(),
      origin: Joi.string().required(),
      destination: Joi.string().required(),
      departureDate: Joi.date().iso().required(),
      returnDate: Joi.date().iso().optional(),
      cabinClass: Joi.string()
        .valid("economy", "premium_economy", "business", "first")
        .default("economy"),
      availableSeats: Joi.number().integer().min(1).required(),
      basePrice: Joi.number().positive().required(),
      currency: Joi.string().length(3).uppercase().default("USD"),
      markup: Joi.number().min(0).max(100).default(10),
    }).when("serviceType", { is: "flight", then: Joi.required() }),
    hotel: Joi.object({
      hotelName: Joi.string().required(),
      city: Joi.string().required(),
      checkIn: Joi.date().iso().required(),
      checkOut: Joi.date().iso().required(),
      rooms: Joi.array()
        .items(
          Joi.object({
            roomType: Joi.string().required(),
            availableRooms: Joi.number().integer().min(1).required(),
            basePrice: Joi.number().positive().required(),
            currency: Joi.string().length(3).uppercase().default("USD"),
            markup: Joi.number().min(0).max(100).default(10),
          }),
        )
        .min(1)
        .required(),
    }).when("serviceType", { is: "hotel", then: Joi.required() }),
    package: Joi.object({
      packageName: Joi.string().required(),
      destination: Joi.string().required(),
      travelDate: Joi.date().iso().required(),
      returnDate: Joi.date().iso().optional(),
      paxCount: Joi.number().integer().min(1).required(),
      basePrice: Joi.number().positive().required(),
      currency: Joi.string().length(3).uppercase().default("USD"),
      markup: Joi.number().min(0).max(100).default(10),
    }).when("serviceType", { is: "package", then: Joi.required() }),
  }).required(),
  supplierId: Joi.string().required(),
  validity: Joi.object({
    startDate: Joi.date().iso().required(),
    endDate: Joi.date().iso().min(Joi.ref("startDate")).required(),
    bookingDeadline: Joi.date().iso().required(),
  }).required(),
  restrictions: Joi.object({
    minimumStay: Joi.number().integer().min(1).optional(),
    maximumStay: Joi.number().integer().min(1).optional(),
    blackoutDates: Joi.array().items(Joi.date().iso()).optional(),
    cancellationPolicy: Joi.string().optional(),
  }).optional(),
});

// Create pricing rule schema
export const createPricingRuleSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  description: Joi.string().max(500).optional(),
  ruleType: Joi.string()
    .valid("markup", "discount", "fixed_price", "dynamic")
    .required(),
  conditions: Joi.object({
    serviceType: Joi.array()
      .items(
        Joi.string().valid(
          "flight",
          "hotel",
          "package",
          "transfer",
          "visa",
          "insurance",
        ),
      )
      .required(),
    customerType: Joi.array()
      .items(Joi.string().valid("individual", "corporate"))
      .optional(),
    bookingChannel: Joi.array()
      .items(Joi.string().valid("b2b", "b2c", "call_center"))
      .optional(),
    bookingDateRange: Joi.object({
      startDate: Joi.date().iso().optional(),
      endDate: Joi.date().iso().optional(),
    }).optional(),
    travelDateRange: Joi.object({
      startDate: Joi.date().iso().optional(),
      endDate: Joi.date().iso().optional(),
    }).optional(),
    minimumAmount: Joi.number().positive().optional(),
    maximumAmount: Joi.number().positive().optional(),
  }).required(),
  pricingLogic: Joi.object({
    markupPercentage: Joi.number().min(0).max(100).optional(),
    discountPercentage: Joi.number().min(0).max(100).optional(),
    fixedPrice: Joi.number().positive().optional(),
    currency: Joi.string().length(3).uppercase().default("USD"),
    applyTo: Joi.string()
      .valid("base_price", "selling_price", "all")
      .default("base_price"),
  }).required(),
  validity: Joi.object({
    startDate: Joi.date().iso().required(),
    endDate: Joi.date().iso().min(Joi.ref("startDate")).optional(),
    isActive: Joi.boolean().default(true),
  }).required(),
  priority: Joi.number().integer().min(1).default(1),
});

// Update pricing rule schema
export const updatePricingRuleSchema = Joi.object({
  ruleId: Joi.string().required(),
  updates: Joi.object({
    name: Joi.string().min(2).max(100).optional(),
    description: Joi.string().max(500).optional(),
    ruleType: Joi.string()
      .valid("markup", "discount", "fixed_price", "dynamic")
      .optional(),
    conditions: Joi.object({
      serviceType: Joi.array()
        .items(
          Joi.string().valid(
            "flight",
            "hotel",
            "package",
            "transfer",
            "visa",
            "insurance",
          ),
        )
        .optional(),
      customerType: Joi.array()
        .items(Joi.string().valid("individual", "corporate"))
        .optional(),
      bookingChannel: Joi.array()
        .items(Joi.string().valid("b2b", "b2c", "call_center"))
        .optional(),
      bookingDateRange: Joi.object({
        startDate: Joi.date().iso().optional(),
        endDate: Joi.date().iso().optional(),
      }).optional(),
      travelDateRange: Joi.object({
        startDate: Joi.date().iso().optional(),
        endDate: Joi.date().iso().optional(),
      }).optional(),
      minimumAmount: Joi.number().positive().optional(),
      maximumAmount: Joi.number().positive().optional(),
    }).optional(),
    pricingLogic: Joi.object({
      markupPercentage: Joi.number().min(0).max(100).optional(),
      discountPercentage: Joi.number().min(0).max(100).optional(),
      fixedPrice: Joi.number().positive().optional(),
      currency: Joi.string().length(3).uppercase().optional(),
      applyTo: Joi.string()
        .valid("base_price", "selling_price", "all")
        .optional(),
    }).optional(),
    validity: Joi.object({
      startDate: Joi.date().iso().optional(),
      endDate: Joi.date().iso().optional(),
      isActive: Joi.boolean().optional(),
    }).optional(),
    priority: Joi.number().integer().min(1).optional(),
  }).required(),
});

// Create commission rule schema
export const createCommissionRuleSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  description: Joi.string().max(500).optional(),
  ruleType: Joi.string()
    .valid("percentage", "fixed_amount", "tiered")
    .required(),
  conditions: Joi.object({
    serviceType: Joi.array()
      .items(
        Joi.string().valid(
          "flight",
          "hotel",
          "package",
          "transfer",
          "visa",
          "insurance",
        ),
      )
      .required(),
    customerType: Joi.array()
      .items(Joi.string().valid("individual", "corporate"))
      .optional(),
    bookingChannel: Joi.array()
      .items(Joi.string().valid("b2b", "b2c", "call_center"))
      .optional(),
    bookingAmountRange: Joi.object({
      minAmount: Joi.number().positive().optional(),
      maxAmount: Joi.number().positive().optional(),
    }).optional(),
    agentLevel: Joi.array()
      .items(Joi.string().valid("agent", "supervisor", "manager"))
      .optional(),
  }).required(),
  commissionLogic: Joi.object({
    percentage: Joi.number().min(0).max(100).optional(),
    fixedAmount: Joi.number().positive().optional(),
    currency: Joi.string().length(3).uppercase().default("USD"),
    calculationBasis: Joi.string()
      .valid("net_price", "selling_price", "profit")
      .default("net_price"),
    tieredStructure: Joi.array()
      .items(
        Joi.object({
          minAmount: Joi.number().positive().required(),
          maxAmount: Joi.number().positive().optional(),
          percentage: Joi.number().min(0).max(100).required(),
        }),
      )
      .optional(),
  }).required(),
  paymentTerms: Joi.object({
    paymentMethod: Joi.string()
      .valid("immediate", "monthly", "quarterly")
      .default("monthly"),
    paymentDate: Joi.string()
      .valid("end_of_month", "15th_of_month", "custom")
      .default("end_of_month"),
    customPaymentDate: Joi.number().integer().min(1).max(31).optional(),
  }).required(),
  validity: Joi.object({
    startDate: Joi.date().iso().required(),
    endDate: Joi.date().iso().min(Joi.ref("startDate")).optional(),
    isActive: Joi.boolean().default(true),
  }).required(),
});

// Update commission rule schema
export const updateCommissionRuleSchema = Joi.object({
  ruleId: Joi.string().required(),
  updates: Joi.object({
    name: Joi.string().min(2).max(100).optional(),
    description: Joi.string().max(500).optional(),
    ruleType: Joi.string()
      .valid("percentage", "fixed_amount", "tiered")
      .optional(),
    conditions: Joi.object({
      serviceType: Joi.array()
        .items(
          Joi.string().valid(
            "flight",
            "hotel",
            "package",
            "transfer",
            "visa",
            "insurance",
          ),
        )
        .optional(),
      customerType: Joi.array()
        .items(Joi.string().valid("individual", "corporate"))
        .optional(),
      bookingChannel: Joi.array()
        .items(Joi.string().valid("b2b", "b2c", "call_center"))
        .optional(),
      bookingAmountRange: Joi.object({
        minAmount: Joi.number().positive().optional(),
        maxAmount: Joi.number().positive().optional(),
      }).optional(),
      agentLevel: Joi.array()
        .items(Joi.string().valid("agent", "supervisor", "manager"))
        .optional(),
    }).optional(),
    commissionLogic: Joi.object({
      percentage: Joi.number().min(0).max(100).optional(),
      fixedAmount: Joi.number().positive().optional(),
      currency: Joi.string().length(3).uppercase().optional(),
      calculationBasis: Joi.string()
        .valid("net_price", "selling_price", "profit")
        .optional(),
      tieredStructure: Joi.array()
        .items(
          Joi.object({
            minAmount: Joi.number().positive().required(),
            maxAmount: Joi.number().positive().optional(),
            percentage: Joi.number().min(0).max(100).required(),
          }),
        )
        .optional(),
    }).optional(),
    paymentTerms: Joi.object({
      paymentMethod: Joi.string()
        .valid("immediate", "monthly", "quarterly")
        .optional(),
      paymentDate: Joi.string()
        .valid("end_of_month", "15th_of_month", "custom")
        .optional(),
      customPaymentDate: Joi.number().integer().min(1).max(31).optional(),
    }).optional(),
    validity: Joi.object({
      startDate: Joi.date().iso().optional(),
      endDate: Joi.date().iso().optional(),
      isActive: Joi.boolean().optional(),
    }).optional(),
  }).required(),
});

// Booking report schema
export const bookingReportSchema = Joi.object({
  reportType: Joi.string()
    .valid("daily", "weekly", "monthly", "custom")
    .required(),
  dateRange: Joi.object({
    startDate: Joi.date().iso().required(),
    endDate: Joi.date().iso().min(Joi.ref("startDate")).required(),
  }).required(),
  filters: Joi.object({
    status: Joi.array()
      .items(
        Joi.string().valid(
          "PENDING",
          "CONFIRMED",
          "CANCELLED",
          "REFUNDED",
          "EXPIRED",
          "HOLD",
        ),
      )
      .optional(),
    serviceType: Joi.array()
      .items(
        Joi.string().valid(
          "flight",
          "hotel",
          "package",
          "transfer",
          "visa",
          "insurance",
        ),
      )
      .optional(),
    customerType: Joi.array()
      .items(Joi.string().valid("individual", "corporate"))
      .optional(),
    agentId: Joi.string().optional(),
    branchId: Joi.string().optional(),
    paymentMethod: Joi.array()
      .items(
        Joi.string().valid(
          "wallet",
          "credit_card",
          "debit_card",
          "net_banking",
          "upi",
        ),
      )
      .optional(),
  }).optional(),
  groupBy: Joi.array()
    .items(
      Joi.string().valid(
        "date",
        "service_type",
        "customer_type",
        "agent",
        "branch",
      ),
    )
    .optional(),
  includeDetails: Joi.boolean().default(false),
});

// Commission report schema
export const commissionReportSchema = Joi.object({
  reportType: Joi.string().valid("agent", "team", "period").required(),
  dateRange: Joi.object({
    startDate: Joi.date().iso().required(),
    endDate: Joi.date().iso().min(Joi.ref("startDate")).required(),
  }).required(),
  filters: Joi.object({
    agentId: Joi.string().optional(),
    teamId: Joi.string().optional(),
    serviceType: Joi.array()
      .items(
        Joi.string().valid(
          "flight",
          "hotel",
          "package",
          "transfer",
          "visa",
          "insurance",
        ),
      )
      .optional(),
    commissionStatus: Joi.array()
      .items(Joi.string().valid("pending", "paid", "overdue"))
      .optional(),
  }).optional(),
  includeDetails: Joi.boolean().default(false),
});

// Inventory report schema
export const inventoryReportSchema = Joi.object({
  reportType: Joi.string()
    .valid("availability", "utilization", "forecast")
    .required(),
  dateRange: Joi.object({
    startDate: Joi.date().iso().required(),
    endDate: Joi.date().iso().min(Joi.ref("startDate")).required(),
  }).required(),
  filters: Joi.object({
    serviceType: Joi.array()
      .items(Joi.string().valid("flight", "hotel", "package"))
      .required(),
    supplierId: Joi.string().optional(),
    route: Joi.object({
      origin: Joi.string().optional(),
      destination: Joi.string().optional(),
    }).optional(),
    hotelName: Joi.string().optional(),
  }).optional(),
  includeDetails: Joi.boolean().default(false),
});

// Audit log schema
export const auditLogSchema = Joi.object({
  dateRange: Joi.object({
    startDate: Joi.date().iso().required(),
    endDate: Joi.date().iso().min(Joi.ref("startDate")).required(),
  }).required(),
  filters: Joi.object({
    userId: Joi.string().optional(),
    actionType: Joi.array()
      .items(
        Joi.string().valid(
          "create",
          "update",
          "delete",
          "cancel",
          "confirm",
          "assign",
          "hold",
          "issue_ticket",
        ),
      )
      .optional(),
    resourceType: Joi.array()
      .items(
        Joi.string().valid(
          "booking",
          "customer",
          "supplier",
          "inventory",
          "pricing",
          "commission",
        ),
      )
      .optional(),
    ipAddress: Joi.string().ip().optional(),
  }).optional(),
  includeDetails: Joi.boolean().default(true),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(50),
});

// Assign permissions schema
export const assignPermissionsSchema = Joi.object({
  userId: Joi.string().required(),
  permissions: Joi.array().items(Joi.string()).required(),
  roleId: Joi.string().optional(),
});

// Inventory schemas
export const createInventorySchema = Joi.object({
  supplierId: Joi.string().required(),
  productCode: Joi.string().min(2).max(100).required(),
  name: Joi.string().min(2).max(255).required(),
  description: Joi.string().max(500).optional(),
  quantity: Joi.number().integer().min(0).required(),
  price: Joi.number().positive().required(),
  currency: Joi.string().length(3).uppercase().default("USD"),
  minimumPrice: Joi.number().positive().optional(),
  status: Joi.string()
    .valid("active", "inactive", "discontinued")
    .default("active"),
  serviceTypes: Joi.array().items(Joi.string()).default([]),
});

export const searchInventorySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  supplierId: Joi.string().optional(),
  productCode: Joi.string().optional(),
  name: Joi.string().min(2).optional(),
  status: Joi.array()
    .items(Joi.string().valid("active", "inactive", "discontinued"))
    .optional(),
  minPrice: Joi.number().min(0).optional(),
  maxPrice: Joi.number().min(0).optional(),
  minAvailable: Joi.number().integer().min(0).optional(),
  serviceTypes: Joi.array().items(Joi.string()).optional(),
  search: Joi.string().min(2).optional(),
});

export const updateInventorySchema = Joi.object({
  inventoryId: Joi.string().required(),
  name: Joi.string().min(2).max(255).optional(),
  description: Joi.string().max(500).optional(),
  quantity: Joi.number().integer().min(0).optional(),
  available: Joi.number().integer().min(0).optional(),
  reserved: Joi.number().integer().min(0).optional(),
  price: Joi.number().positive().optional(),
  minimumPrice: Joi.number().positive().optional(),
  status: Joi.string().valid("active", "inactive", "discontinued").optional(),
  serviceTypes: Joi.array().items(Joi.string()).optional(),
});

export const deleteInventorySchema = Joi.object({
  inventoryId: Joi.string().required(),
});

export const getInventorySchema = Joi.object({
  inventoryId: Joi.string().required(),
});

export const checkAvailabilitySchema = Joi.object({
  inventoryId: Joi.string().required(),
  quantity: Joi.number().integer().min(1).required(),
});

// Create role schema
export const createRoleSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  description: Joi.string().max(200).optional(),
  permissions: Joi.array().items(Joi.string()).required(),
  isActive: Joi.boolean().default(true),
});

// Update role schema
export const updateRoleSchema = Joi.object({
  roleId: Joi.string().required(),
  updates: Joi.object({
    name: Joi.string().min(2).max(50).optional(),
    description: Joi.string().max(200).optional(),
    permissions: Joi.array().items(Joi.string()).optional(),
    isActive: Joi.boolean().optional(),
  }).required(),
});

// Assign user role schema
export const assignUserRoleSchema = Joi.object({
  userId: Joi.string().required(),
  roleId: Joi.string().required(),
  effectiveDate: Joi.date().iso().default(Date.now),
  expiryDate: Joi.date().iso().optional(),
});

// Cancel order schema
export const cancelOrderSchema = Joi.object({
  bookingId: Joi.string().optional(),
  orderId: Joi.string().optional(),
  reason: Joi.string().max(500).optional(),
})
  .external(() => {
    // At least one of bookingId or orderId is required
    return new Promise((resolve, reject) => {
      reject(new Error("Either bookingId or orderId is required"));
    });
  })
  .messages({
    "any.invalid": "Either bookingId or orderId is required",
  });

// Get cancellation status schema
export const getCancellationStatusSchema = Joi.object({
  bookingId: Joi.string().optional(),
  orderId: Joi.string().optional(),
})
  .external(() => {
    // At least one of bookingId or orderId is required
    return new Promise((resolve, reject) => {
      reject(new Error("Either bookingId or orderId is required"));
    });
  })
  .messages({
    "any.invalid": "Either bookingId or orderId is required",
  });

// Get available airline credits schema
export const getAvailableAirlineCreditsSchema = Joi.object({
  customerId: Joi.string().optional(),
  bookingId: Joi.string().optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
})
  .external(() => {
    // At least one of customerId or bookingId is required
    return new Promise((resolve, reject) => {
      reject(new Error("Either customerId or bookingId is required"));
    });
  })
  .messages({
    "any.invalid": "Either customerId or bookingId is required",
  });

// Combined payment schema
export const combinedPaymentSchema = Joi.object({
  bookingId: Joi.string().uuid().required().messages({
    "string.guid": "bookingId must be a valid UUID",
    "any.required": "bookingId is required",
  }),
  customerId: Joi.string().uuid().required().messages({
    "string.guid": "customerId must be a valid UUID",
    "any.required": "customerId is required",
  }),
  totalAmount: Joi.number().positive().required().messages({
    "number.positive": "totalAmount must be positive",
    "any.required": "totalAmount is required",
  }),
  currency: Joi.string()
    .length(3)
    .uppercase()
    .default("USD")
    .valid("USD", "EUR", "GBP", "AED", "SAR", "INR")
    .messages({
      "string.length": "currency must be a 3-letter code",
      "any.only": "currency must be a valid currency code",
    }),
  useWallet: Joi.boolean().default(true),
  walletAmount: Joi.number().min(0).optional().messages({
    "number.min": "walletAmount cannot be negative",
  }),
  useCredits: Joi.boolean().default(true),
  creditIds: Joi.array().items(Joi.string().uuid()).default([]),
  cardAmount: Joi.number().positive().optional().messages({
    "number.positive": "cardAmount must be positive if provided",
  }),
})
  .with("useWallet", "walletAmount")
  .with("useCredits", "creditIds");

// Get payment options schema
export const getPaymentOptionsSchema = Joi.object({
  customerId: Joi.string().uuid().required(),
  totalAmount: Joi.number().positive().required(),
  currency: Joi.string()
    .length(3)
    .uppercase()
    .default("USD")
    .valid("USD", "EUR", "GBP", "AED", "SAR", "INR"),
});

// Create booking with combined payment schema
export const createBookingWithCombinedPaymentSchema = Joi.object({
  serviceType: Joi.string()
    .valid("flight", "hotel", "package", "transfer", "visa", "insurance")
    .default("flight"),
  customerId: Joi.string().uuid().required(),
  customerName: Joi.string().min(2).max(100).required(),
  customerEmail: Joi.string().email().required(),
  customerPhone: Joi.string()
    .pattern(/^\+?[1-9]\d{1,14}$/)
    .required(),
  totalAmount: Joi.number().positive().required(),
  supplierPrice: Joi.number().positive().optional(),
  currency: Joi.string().length(3).uppercase().default("USD"),
  useWallet: Joi.boolean().default(true),
  walletAmount: Joi.number().min(0).optional(),
  useCredits: Joi.boolean().default(true),
  creditIds: Joi.array().items(Joi.string().uuid()).default([]),
  cardAmount: Joi.number().positive().optional(),
});

// Apply credits to booking schema
export const applyCreditsToBookingSchema = Joi.object({
  bookingId: Joi.string().uuid().required(),
  creditIds: Joi.array().items(Joi.string().uuid()).min(1).required().messages({
    "array.min": "At least one creditId is required",
    "any.required": "creditIds array is required",
  }),
});

// Export all schemas
export const bookingManagementSchemas = {
  createBooking: createBookingSchema,
  searchBookings: searchBookingsSchema,
  searchCustomers: searchCustomersSchema,
  createCustomer: createCustomerSchema,
  searchSuppliers: searchSuppliersSchema,
  createSupplier: createSupplierSchema,
  holdInventory: holdInventorySchema,
  confirmBooking: confirmBookingSchema,
  issueTicket: issueTicketSchema,
  updateWorkflowStatus: updateWorkflowStatusSchema,
  assignBooking: assignBookingSchema,
  updatePriority: updatePrioritySchema,
  addInventory: addInventorySchema,
  updateInventory: updateInventorySchema,
  createPricingRule: createPricingRuleSchema,
  updatePricingRule: updatePricingRuleSchema,
  createCommissionRule: createCommissionRuleSchema,
  updateCommissionRule: updateCommissionRuleSchema,
  bookingReport: bookingReportSchema,
  commissionReport: commissionReportSchema,
  inventoryReport: inventoryReportSchema,
  auditLog: auditLogSchema,
  assignPermissions: assignPermissionsSchema,
  createRole: createRoleSchema,
  updateRole: updateRoleSchema,
  assignUserRole: assignUserRoleSchema,
  createInventory: createInventorySchema,
  searchInventory: searchInventorySchema,
  updateInventorySchema: updateInventorySchema,
  deleteInventory: deleteInventorySchema,
  getInventory: getInventorySchema,
  checkAvailability: checkAvailabilitySchema,
  cancelOrder: cancelOrderSchema,
  getCancellationStatus: getCancellationStatusSchema,
  getAvailableAirlineCredits: getAvailableAirlineCreditsSchema,
  combinedPayment: combinedPaymentSchema,
  getPaymentOptions: getPaymentOptionsSchema,
  createBookingWithCombinedPayment: createBookingWithCombinedPaymentSchema,
  applyCreditsToBooking: applyCreditsToBookingSchema,
};
