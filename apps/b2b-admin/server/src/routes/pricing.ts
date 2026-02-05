import { Router, Request, Response } from 'express';

const router = Router();

// Pricing Configuration interfaces
export interface PricingRule {
  id: string;
  companyId: string;
  ruleType: 'markup' | 'discount' | 'commission' | 'fixed_fee';
  ruleName: string;
  description: string;
  serviceType: 'flights' | 'hotels' | 'packages' | 'all';
  conditions: {
    minAmount?: number;
    maxAmount?: number;
    dateRange?: { start: string; end: string };
    userType?: 'B2B' | 'B2C';
    regions?: string[];
    suppliers?: string[];
  };
  calculation: {
    type: 'percentage' | 'fixed' | 'multiplier';
    value: number;
    currency?: string;
  };
  priority: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RevenueShare {
  id: string;
  companyId: string;
  shareType: 'commission' | 'markup' | 'subscription';
  name: string;
  description: string;
  percentage: number;
  fixedAmount?: number;
  currency: string;
  frequency: 'monthly' | 'quarterly' | 'annually' | 'per_transaction';
  paymentTerms: string;
  minimumRevenue: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyPricing {
  id: string;
  companyId: string;
  baseMarkup: number;
  serviceMarkups: {
    flights: number;
    hotels: number;
    packages: number;
    activities: number;
  };
  currency: string;
  paymentTerms: 'net_15' | 'net_30' | 'net_45' | 'net_60';
  creditLimit: number;
  monthlyMinimum?: number;
  specialRates?: {
    supplierId: string;
    discount: number;
    expiryDate: string;
  }[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Mock data
const pricingRules: PricingRule[] = [
  {
    id: 'rule1',
    companyId: 'comp1',
    ruleType: 'markup',
    ruleName: 'Standard B2B Markup',
    description: 'Standard 15% markup on all services',
    serviceType: 'all',
    conditions: {
      userType: 'B2B',
      minAmount: 100
    },
    calculation: {
      type: 'percentage',
      value: 15
    },
    priority: 1,
    isActive: true,
    createdAt: '2026-01-20T10:00:00Z',
    updatedAt: '2026-01-20T10:00:00Z'
  },
  {
    id: 'rule2',
    companyId: 'comp1',
    ruleType: 'discount',
    ruleName: 'Early Bird Discount',
    description: '10% discount for bookings 60+ days in advance',
    serviceType: 'all',
    conditions: {
      dateRange: { start: '2026-12-01', end: '2027-12-01' }
    },
    calculation: {
      type: 'percentage',
      value: -10
    },
    priority: 2,
    isActive: true,
    createdAt: '2026-01-20T10:00:00Z',
    updatedAt: '2026-01-20T10:00:00Z'
  }
];

const revenueShares: RevenueShare[] = [
  {
    id: 'share1',
    companyId: 'comp1',
    shareType: 'commission',
    name: 'Standard Commission',
    description: '8.5% commission on all bookings',
    percentage: 8.5,
    currency: 'USD',
    frequency: 'monthly',
    paymentTerms: 'Net 30 days',
    minimumRevenue: 5000,
    isActive: true,
    createdAt: '2026-01-20T10:00:00Z',
    updatedAt: '2026-01-20T10:00:00Z'
  }
];

const companyPricing: CompanyPricing[] = [
  {
    id: 'pricing1',
    companyId: 'comp1',
    baseMarkup: 12,
    serviceMarkups: {
      flights: 15,
      hotels: 18,
      packages: 20,
      activities: 25
    },
    currency: 'USD',
    paymentTerms: 'net_30',
    creditLimit: 50000,
    monthlyMinimum: 10000,
    specialRates: [
      {
        supplierId: 'supplier1',
        discount: 5,
        expiryDate: '2026-12-31'
      }
    ],
    isActive: true,
    createdAt: '2026-01-20T10:00:00Z',
    updatedAt: '2026-01-20T10:00:00Z'
  }
];

// Pricing Rules Routes
router.get('/rules', (req: Request, res: Response) => {
  const { companyId, ruleType, serviceType } = req.query;
  let rules = pricingRules;

  if (companyId && typeof companyId === 'string') {
    rules = rules.filter(r => r.companyId === companyId);
  }

  if (ruleType && typeof ruleType === 'string') {
    rules = rules.filter(r => r.ruleType === ruleType);
  }

  if (serviceType && typeof serviceType === 'string') {
    rules = rules.filter(r => r.serviceType === serviceType);
  }

  res.json(rules);
});

router.post('/rules', (req: Request, res: Response) => {
  const { companyId, ruleType, ruleName, description, serviceType, conditions, calculation, priority } = req.body;

  if (!companyId || !ruleType || !ruleName || !serviceType || !calculation) {
    return res.status(400).json({ message: 'Required fields: companyId, ruleType, ruleName, serviceType, calculation' });
  }

  const newRule: PricingRule = {
    id: String(Date.now()),
    companyId,
    ruleType,
    ruleName,
    description: description || '',
    serviceType,
    conditions: conditions || {},
    calculation,
    priority: priority || 1,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  pricingRules.push(newRule);
  res.status(201).json(newRule);
});

router.put('/rules/:id', (req: Request, res: Response) => {
  const rule = pricingRules.find(r => r.id === req.params.id);
  if (!rule) {
    return res.status(404).json({ message: 'Pricing rule not found' });
  }

  Object.assign(rule, req.body);
  rule.updatedAt = new Date().toISOString();

  res.json(rule);
});

router.delete('/rules/:id', (req: Request, res: Response) => {
  const idx = pricingRules.findIndex(r => r.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ message: 'Pricing rule not found' });
  }

  const deleted = pricingRules.splice(idx, 1)[0];
  res.json(deleted);
});

// Revenue Share Routes
router.get('/revenue-share', (req: Request, res: Response) => {
  const { companyId, shareType } = req.query;
  let shares = revenueShares;

  if (companyId && typeof companyId === 'string') {
    shares = shares.filter(s => s.companyId === companyId);
  }

  if (shareType && typeof shareType === 'string') {
    shares = shares.filter(s => s.shareType === shareType);
  }

  res.json(shares);
});

router.post('/revenue-share', (req: Request, res: Response) => {
  const { companyId, shareType, name, description, percentage, fixedAmount, currency, frequency, paymentTerms, minimumRevenue } = req.body;

  if (!companyId || !shareType || !name || !percentage || !currency || !frequency || !paymentTerms) {
    return res.status(400).json({ message: 'Required fields: companyId, shareType, name, percentage, currency, frequency, paymentTerms' });
  }

  const newShare: RevenueShare = {
    id: String(Date.now()),
    companyId,
    shareType,
    name,
    description: description || '',
    percentage,
    fixedAmount,
    currency,
    frequency,
    paymentTerms,
    minimumRevenue: minimumRevenue || 0,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  revenueShares.push(newShare);
  res.status(201).json(newShare);
});

router.put('/revenue-share/:id', (req: Request, res: Response) => {
  const share = revenueShares.find(s => s.id === req.params.id);
  if (!share) {
    return res.status(404).json({ message: 'Revenue share not found' });
  }

  Object.assign(share, req.body);
  share.updatedAt = new Date().toISOString();

  res.json(share);
});

router.delete('/revenue-share/:id', (req: Request, res: Response) => {
  const idx = revenueShares.findIndex(s => s.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ message: 'Revenue share not found' });
  }

  const deleted = revenueShares.splice(idx, 1)[0];
  res.json(deleted);
});

// Company Pricing Routes
router.get('/company', (req: Request, res: Response) => {
  const { companyId } = req.query;
  if (!companyId || typeof companyId !== 'string') {
    return res.status(400).json({ message: 'companyId query parameter required' });
  }

  const pricing = companyPricing.find(p => p.companyId === companyId);
  if (!pricing) {
    return res.status(404).json({ message: 'Company pricing not found' });
  }

  res.json(pricing);
});

router.post('/company', (req: Request, res: Response) => {
  const { companyId, baseMarkup, serviceMarkups, currency, paymentTerms, creditLimit } = req.body;

  if (!companyId || typeof baseMarkup !== 'number' || !serviceMarkups || !currency || !paymentTerms || typeof creditLimit !== 'number') {
    return res.status(400).json({ message: 'Required fields: companyId, baseMarkup, serviceMarkups, currency, paymentTerms, creditLimit' });
  }

  const existingPricing = companyPricing.find(p => p.companyId === companyId);
  if (existingPricing) {
    return res.status(409).json({ message: 'Pricing configuration already exists for this company' });
  }

  const newPricing: CompanyPricing = {
    id: String(Date.now()),
    companyId,
    baseMarkup,
    serviceMarkups,
    currency,
    paymentTerms,
    creditLimit,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  companyPricing.push(newPricing);
  res.status(201).json(newPricing);
});

router.put('/company/:id', (req: Request, res: Response) => {
  const pricing = companyPricing.find(p => p.id === req.params.id);
  if (!pricing) {
    return res.status(404).json({ message: 'Company pricing not found' });
  }

  Object.assign(pricing, req.body);
  pricing.updatedAt = new Date().toISOString();

  res.json(pricing);
});

// Calculate pricing for a booking
router.post('/calculate', (req: Request, res: Response) => {
  const { companyId, serviceType, basePrice, bookingDetails } = req.body;

  if (!companyId || !serviceType || typeof basePrice !== 'number') {
    return res.status(400).json({ message: 'companyId, serviceType, and basePrice are required' });
  }

  // Get company pricing configuration
  const companyPricingConfig = companyPricing.find(p => p.companyId === companyId);
  if (!companyPricingConfig) {
    return res.status(404).json({ message: 'Company pricing configuration not found' });
  }

  // Get applicable pricing rules
  const applicableRules = pricingRules.filter(rule =>
    rule.companyId === companyId &&
    rule.isActive &&
    (rule.serviceType === serviceType || rule.serviceType === 'all') &&
    evaluateRuleConditions(rule.conditions, bookingDetails)
  ).sort((a, b) => b.priority - a.priority);

  // Calculate final price
  let finalPrice = basePrice;
  const appliedRules = [];

  for (const rule of applicableRules) {
    const ruleResult = applyPricingRule(finalPrice, rule);
    finalPrice = ruleResult.price;
    appliedRules.push({
      ruleId: rule.id,
      ruleName: rule.ruleName,
      adjustment: ruleResult.adjustment
    });
  }

  // Calculate revenue share
  const revenueShare = revenueShares.find(s => s.companyId === companyId && s.isActive);
  const revenueShareAmount = revenueShare ? (finalPrice * revenueShare.percentage / 100) : 0;

  res.json({
    originalPrice: basePrice,
    finalPrice,
    markup: finalPrice - basePrice,
    markupPercentage: ((finalPrice - basePrice) / basePrice) * 100,
    appliedRules,
    revenueShare: {
      amount: revenueShareAmount,
      percentage: revenueShare?.percentage || 0
    },
    currency: companyPricingConfig.currency
  });
});

// Helper functions
function evaluateRuleConditions(conditions: any, bookingDetails: any): boolean {
  if (conditions.minAmount && bookingDetails.total < conditions.minAmount) return false;
  if (conditions.maxAmount && bookingDetails.total > conditions.maxAmount) return false;
  if (conditions.userType && bookingDetails.userType !== conditions.userType) return false;
  if (conditions.regions && !conditions.regions.includes(bookingDetails.region)) return false;
  if (conditions.suppliers && !conditions.suppliers.includes(bookingDetails.supplierId)) return false;

  // Date range check
  if (conditions.dateRange) {
    const bookingDate = new Date(bookingDetails.date);
    const startDate = new Date(conditions.dateRange.start);
    const endDate = new Date(conditions.dateRange.end);
    if (bookingDate < startDate || bookingDate > endDate) return false;
  }

  return true;
}

function applyPricingRule(price: number, rule: PricingRule): { price: number; adjustment: number } {
  let adjustment = 0;

  switch (rule.calculation.type) {
    case 'percentage':
      adjustment = price * (rule.calculation.value / 100);
      break;
    case 'fixed':
      adjustment = rule.calculation.value;
      break;
    case 'multiplier':
      adjustment = price * (rule.calculation.value - 1);
      break;
  }

  return {
    price: price + adjustment,
    adjustment
  };
}

export default router;
