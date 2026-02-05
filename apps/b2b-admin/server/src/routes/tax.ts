import { Router, Request, Response } from 'express';

const router = Router();

// VAT/Tax Configuration interfaces
export interface TaxRate {
  id: string;
  countryCode: string;
  countryName: string;
  regionCode?: string;
  regionName?: string;
  taxType: 'VAT' | 'GST' | 'Sales Tax' | 'Consumption Tax';
  standardRate: number; // Percentage (e.g., 20.0 for 20%)
  reducedRates?: {
    category: string;
    rate: number;
  }[];
  zeroRates?: string[]; // Categories with 0% rate
  exemptCategories?: string[]; // Fully exempt categories
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TaxRule {
  id: string;
  name: string;
  description: string;
  priority: number;
  conditions: {
    countryCodes?: string[];
    customerTypes?: ('B2B' | 'B2C')[];
    productCategories?: string[];
    minAmount?: number;
    maxAmount?: number;
    dateRange?: { start: string; end: string };
  };
  taxApplication: {
    taxRateId: string;
    overrideRate?: number; // Optional rate override
    isReverseCharge?: boolean; // For intra-EU B2B transactions
    reclaimAllowed?: boolean; // Whether B2B customers can reclaim this tax
    reclaimThreshold?: number; // Minimum amount for reclaim
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VATReclaimRequest {
  id: string;
  companyId: string;
  period: {
    startDate: string;
    endDate: string;
  };
  transactions: {
    transactionId: string;
    date: string;
    amount: number;
    taxAmount: number;
    taxRate: number;
    supplierCountry: string;
    reclaimableAmount: number;
    status: 'pending' | 'approved' | 'rejected' | 'paid';
  }[];
  totalReclaimAmount: number;
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'paid';
  documents?: string[]; // URLs to supporting documents
  submittedAt?: string;
  approvedAt?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Mock data
const taxRates: TaxRate[] = [
  {
    id: 'vat-gb-standard',
    countryCode: 'GB',
    countryName: 'United Kingdom',
    taxType: 'VAT',
    standardRate: 20.0,
    reducedRates: [
      { category: 'childrens_clothing', rate: 5.0 },
      { category: 'domestic_fuel', rate: 5.0 }
    ],
    zeroRates: ['books', 'newspapers', 'childrens_car_seats'],
    exemptCategories: ['financial_services', 'education'],
    isActive: true,
    createdAt: '2026-01-20T10:00:00Z',
    updatedAt: '2026-01-20T10:00:00Z'
  },
  {
    id: 'vat-de-standard',
    countryCode: 'DE',
    countryName: 'Germany',
    taxType: 'VAT',
    standardRate: 19.0,
    reducedRates: [
      { category: 'food', rate: 7.0 },
      { category: 'books', rate: 7.0 }
    ],
    isActive: true,
    createdAt: '2026-01-20T10:00:00Z',
    updatedAt: '2026-01-20T10:00:00Z'
  },
  {
    id: 'vat-us-ca-sales',
    countryCode: 'US',
    countryName: 'United States',
    regionCode: 'CA',
    regionName: 'California',
    taxType: 'Sales Tax',
    standardRate: 8.25,
    isActive: true,
    createdAt: '2026-01-20T10:00:00Z',
    updatedAt: '2026-01-20T10:00:00Z'
  }
];

const taxRules: TaxRule[] = [
  {
    id: 'rule-b2b-intra-eu',
    name: 'B2B Intra-EU Reverse Charge',
    description: 'Reverse charge VAT for B2B transactions within EU',
    priority: 10,
    conditions: {
      customerTypes: ['B2B'],
      countryCodes: ['GB', 'DE', 'FR', 'IT', 'ES', 'NL'] // EU countries
    },
    taxApplication: {
      taxRateId: 'vat-gb-standard',
      isReverseCharge: true,
      reclaimAllowed: true,
      reclaimThreshold: 100
    },
    isActive: true,
    createdAt: '2026-01-20T10:00:00Z',
    updatedAt: '2026-01-20T10:00:00Z'
  },
  {
    id: 'rule-b2c-standard',
    name: 'B2C Standard Rate',
    description: 'Standard VAT rate for B2C customers',
    priority: 1,
    conditions: {
      customerTypes: ['B2C']
    },
    taxApplication: {
      taxRateId: 'vat-gb-standard',
      reclaimAllowed: false
    },
    isActive: true,
    createdAt: '2026-01-20T10:00:00Z',
    updatedAt: '2026-01-20T10:00:00Z'
  }
];

const vatReclaimRequests: VATReclaimRequest[] = [
  {
    id: 'reclaim-001',
    companyId: 'comp1',
    period: {
      startDate: '2026-01-01',
      endDate: '2026-01-31'
    },
    transactions: [
      {
        transactionId: 'txn-001',
        date: '2026-01-15',
        amount: 1000,
        taxAmount: 200,
        taxRate: 20.0,
        supplierCountry: 'DE',
        reclaimableAmount: 200,
        status: 'approved'
      }
    ],
    totalReclaimAmount: 200,
    status: 'approved',
    submittedAt: '2026-02-01T10:00:00Z',
    approvedAt: '2026-02-15T10:00:00Z',
    paidAt: '2026-02-28T10:00:00Z',
    createdAt: '2026-01-20T10:00:00Z',
    updatedAt: '2026-01-20T10:00:00Z'
  }
];

// Tax Rates Routes
router.get('/rates', (req: Request, res: Response) => {
  const { countryCode, active } = req.query;
  let rates = taxRates;

  if (countryCode && typeof countryCode === 'string') {
    rates = rates.filter(r => r.countryCode === countryCode);
  }

  if (active !== undefined) {
    const isActive = active === 'true';
    rates = rates.filter(r => r.isActive === isActive);
  }

  res.json(rates);
});

router.post('/rates', (req: Request, res: Response) => {
  const { countryCode, countryName, regionCode, regionName, taxType, standardRate } = req.body;

  if (!countryCode || !countryName || !taxType || typeof standardRate !== 'number') {
    return res.status(400).json({ message: 'countryCode, countryName, taxType, and standardRate are required' });
  }

  const newRate: TaxRate = {
    id: `${taxType.toLowerCase()}-${countryCode.toLowerCase()}${regionCode ? `-${regionCode.toLowerCase()}` : ''}-standard`,
    countryCode,
    countryName,
    regionCode,
    regionName,
    taxType,
    standardRate,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  taxRates.push(newRate);
  res.status(201).json(newRate);
});

router.put('/rates/:id', (req: Request, res: Response) => {
  const rate = taxRates.find(r => r.id === req.params.id);
  if (!rate) {
    return res.status(404).json({ message: 'Tax rate not found' });
  }

  Object.assign(rate, req.body);
  rate.updatedAt = new Date().toISOString();

  res.json(rate);
});

// Tax Rules Routes
router.get('/rules', (req: Request, res: Response) => {
  const { active } = req.query;
  let rules = taxRules;

  if (active !== undefined) {
    const isActive = active === 'true';
    rules = rules.filter(r => r.isActive === isActive);
  }

  res.json(rules);
});

router.post('/rules', (req: Request, res: Response) => {
  const { name, description, priority, conditions, taxApplication } = req.body;

  if (!name || !taxApplication) {
    return res.status(400).json({ message: 'name and taxApplication are required' });
  }

  const newRule: TaxRule = {
    id: 'rule-' + String(taxRules.length + 1).padStart(3, '0'),
    name,
    description: description || '',
    priority: priority || 1,
    conditions: conditions || {},
    taxApplication,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  taxRules.push(newRule);
  res.status(201).json(newRule);
});

router.put('/rules/:id', (req: Request, res: Response) => {
  const rule = taxRules.find(r => r.id === req.params.id);
  if (!rule) {
    return res.status(404).json({ message: 'Tax rule not found' });
  }

  Object.assign(rule, req.body);
  rule.updatedAt = new Date().toISOString();

  res.json(rule);
});

// Calculate tax for a transaction
router.post('/calculate', (req: Request, res: Response) => {
  const { amount, customerType, customerCountry, productCategory, transactionDate } = req.body;

  if (typeof amount !== 'number' || !customerType) {
    return res.status(400).json({ message: 'amount and customerType are required' });
  }

  // Find applicable tax rules (sorted by priority)
  const applicableRules = taxRules.filter(rule => {
    if (!rule.isActive) return false;

    // Check conditions
    const conditions = rule.conditions;

    if (conditions.customerTypes && !conditions.customerTypes.includes(customerType)) return false;
    if (conditions.countryCodes && customerCountry && !conditions.countryCodes.includes(customerCountry)) return false;
    if (conditions.productCategories && productCategory && !conditions.productCategories.includes(productCategory)) return false;
    if (conditions.minAmount && amount < conditions.minAmount) return false;
    if (conditions.maxAmount && amount > conditions.maxAmount) return false;

    // Date range check
    if (conditions.dateRange && transactionDate) {
      const txDate = new Date(transactionDate);
      const startDate = new Date(conditions.dateRange.start);
      const endDate = new Date(conditions.dateRange.end);
      if (txDate < startDate || txDate > endDate) return false;
    }

    return true;
  }).sort((a, b) => b.priority - a.priority);

  if (applicableRules.length === 0) {
    return res.json({
      originalAmount: amount,
      taxAmount: 0,
      totalAmount: amount,
      taxRate: 0,
      isReverseCharge: false,
      reclaimAllowed: false,
      appliedRule: null
    });
  }

  const appliedRule = applicableRules[0];
  const taxApplication = appliedRule.taxApplication;

  // Get tax rate
  const taxRate = taxRates.find(r => r.id === taxApplication.taxRateId);
  if (!taxRate) {
    return res.status(404).json({ message: 'Tax rate not found for rule' });
  }

  const effectiveRate = taxApplication.overrideRate !== undefined ? taxApplication.overrideRate : taxRate.standardRate;
  const taxAmount = taxApplication.isReverseCharge ? 0 : Math.round(amount * (effectiveRate / 100) * 100) / 100;
  const totalAmount = amount + taxAmount;

  res.json({
    originalAmount: amount,
    taxAmount,
    totalAmount,
    taxRate: effectiveRate,
    taxType: taxRate.taxType,
    country: taxRate.countryName,
    isReverseCharge: taxApplication.isReverseCharge || false,
    reclaimAllowed: taxApplication.reclaimAllowed || false,
    reclaimThreshold: taxApplication.reclaimThreshold,
    appliedRule: {
      id: appliedRule.id,
      name: appliedRule.name,
      priority: appliedRule.priority
    }
  });
});

// VAT Reclaim Routes
router.get('/reclaims', (req: Request, res: Response) => {
  const { companyId, status } = req.query;
  let reclaims = vatReclaimRequests;

  if (companyId && typeof companyId === 'string') {
    reclaims = reclaims.filter(r => r.companyId === companyId);
  }

  if (status && typeof status === 'string') {
    reclaims = reclaims.filter(r => r.status === status);
  }

  res.json(reclaims);
});

router.post('/reclaims', (req: Request, res: Response) => {
  const { companyId, period, transactions } = req.body;

  if (!companyId || !period || !transactions) {
    return res.status(400).json({ message: 'companyId, period, and transactions are required' });
  }

  const totalReclaimAmount = transactions.reduce((sum: number, tx: { reclaimableAmount: number }) => sum + tx.reclaimableAmount, 0);

  const newReclaim: VATReclaimRequest = {
    id: 'reclaim-' + String(vatReclaimRequests.length + 1).padStart(3, '0'),
    companyId,
    period,
    transactions,
    totalReclaimAmount,
    status: 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  vatReclaimRequests.push(newReclaim);
  res.status(201).json(newReclaim);
});

router.put('/reclaims/:id', (req: Request, res: Response) => {
  const reclaim = vatReclaimRequests.find(r => r.id === req.params.id);
  if (!reclaim) {
    return res.status(404).json({ message: 'VAT reclaim request not found' });
  }

  const { status } = req.body;
  if (status) {
    reclaim.status = status;
    if (status === 'submitted' && !reclaim.submittedAt) {
      reclaim.submittedAt = new Date().toISOString();
    } else if (status === 'approved' && !reclaim.approvedAt) {
      reclaim.approvedAt = new Date().toISOString();
    } else if (status === 'paid' && !reclaim.paidAt) {
      reclaim.paidAt = new Date().toISOString();
    }
  }

  reclaim.updatedAt = new Date().toISOString();
  res.json(reclaim);
});

// Get VAT reclaim eligibility for a company
router.get('/reclaims/eligibility/:companyId', (req: Request, res: Response) => {
  const companyId = req.params.companyId;

  // Mock eligibility calculation
  const eligibleTransactions = [
    {
      transactionId: 'txn-001',
      date: '2026-01-15',
      amount: 1000,
      taxAmount: 200,
      taxRate: 20.0,
      supplierCountry: 'DE',
      reclaimableAmount: 200,
      isEligible: true,
      reason: 'Intra-EU B2B transaction'
    },
    {
      transactionId: 'txn-002',
      date: '2026-01-20',
      amount: 500,
      taxAmount: 100,
      taxRate: 20.0,
      supplierCountry: 'FR',
      reclaimableAmount: 100,
      isEligible: true,
      reason: 'Intra-EU B2B transaction'
    }
  ];

  const totalEligible = eligibleTransactions.reduce((sum, tx) => sum + tx.reclaimableAmount, 0);

  res.json({
    companyId,
    period: {
      startDate: '2026-01-01',
      endDate: '2026-01-31'
    },
    transactions: eligibleTransactions,
    totalReclaimable: totalEligible,
    minimumThreshold: 100,
    isEligible: totalEligible >= 100
  });
});

// Validate reclaim request
router.post('/reclaims/:id/validate', (req: Request, res: Response) => {
  const reclaim = vatReclaimRequests.find(r => r.id === req.params.id);
  if (!reclaim) {
    return res.status(404).json({ message: 'VAT reclaim request not found' });
  }

  // Mock validation logic
  const validationResults = {
    isValid: true,
    warnings: [],
    errors: [],
    recommendedAdjustments: []
  };

  // Check for missing documents
  if (!reclaim.documents || reclaim.documents.length === 0) {
    validationResults.warnings.push('Supporting documents are recommended for reclaim requests');
  }

  // Check transaction dates within period
  reclaim.transactions.forEach((tx, index) => {
    const txDate = new Date(tx.date);
    const periodStart = new Date(reclaim.period.startDate);
    const periodEnd = new Date(reclaim.period.endDate);

    if (txDate < periodStart || txDate > periodEnd) {
      validationResults.errors.push(`Transaction ${index + 1} date is outside the reclaim period`);
      validationResults.isValid = false;
    }
  });

  res.json({
    reclaimId: reclaim.id,
    validation: validationResults,
    canProceed: validationResults.isValid
  });
});

export default router;
