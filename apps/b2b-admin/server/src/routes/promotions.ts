import { Router, Request, Response } from 'express';

const router = Router();

// Promotion and Pricing Engine interfaces
export interface Promotion {
  id: string;
  name: string;
  description: string;
  type: 'percentage' | 'fixed' | 'free_shipping' | 'bogo' | 'bundle' | 'loyalty_points';
  value: number;
  code?: string;
  conditions: {
    minPurchase?: number;
    maxPurchase?: number;
    categories?: string[];
    products?: string[];
    userSegments?: string[];
    dateRange?: { start: string; end: string };
    usageLimit?: number;
    userLimit?: number;
    firstTimeOnly?: boolean;
  };
  isActive: boolean;
  priority: number;
  createdAt: string;
  updatedAt: string;
  usageCount: number;
  revenueImpact: number;
}

export interface LoyaltyProgram {
  id: string;
  name: string;
  description: string;
  tiers: Array<{
    name: string;
    minPoints: number;
    benefits: {
      discountPercentage?: number;
      freeShipping?: boolean;
      prioritySupport?: boolean;
      bonusPoints?: number;
    };
  }>;
  pointsPerDollar: number;
  pointsExpiryDays: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DynamicPricingRule {
  id: string;
  name: string;
  description: string;
  trigger: 'demand' | 'inventory' | 'time' | 'competitor' | 'behavioral';
  conditions: {
    occupancyRate?: number;
    timeWindow?: { start: string; end: string };
    competitorPrice?: number;
    userHistory?: string[];
    inventoryLevel?: number;
  };
  adjustment: {
    type: 'percentage' | 'fixed';
    value: number;
    maxAdjustment?: number;
    minAdjustment?: number;
  };
  isActive: boolean;
  priority: number;
  createdAt: string;
  updatedAt: string;
  performance: {
    appliedCount: number;
    revenueImpact: number;
    conversionRate: number;
  };
}

export interface ABTest {
  id: string;
  name: string;
  description: string;
  type: 'pricing' | 'promotion' | 'ui';
  variants: Array<{
    id: string;
    name: string;
    config: Record<string, unknown>;
    trafficPercentage: number;
  }>;
  status: 'draft' | 'running' | 'completed' | 'stopped';
  startDate?: string;
  endDate?: string;
  winner?: string;
  results: {
    variants: Array<{
      variantId: string;
      impressions: number;
      conversions: number;
      revenue: number;
      conversionRate: number;
    }>;
    confidence: number;
  };
  createdAt: string;
  updatedAt: string;
}

// Mock data
const promotions: Promotion[] = [
  {
    id: 'promo-001',
    name: 'Summer Sale 20%',
    description: '20% off all bookings',
    type: 'percentage',
    value: 20,
    code: 'SUMMER20',
    conditions: {
      minPurchase: 100,
      dateRange: { start: '2026-06-01', end: '2026-08-31' },
      usageLimit: 1000,
      userLimit: 1
    },
    isActive: true,
    priority: 10,
    createdAt: '2026-01-20T10:00:00Z',
    updatedAt: '2026-01-20T10:00:00Z',
    usageCount: 245,
    revenueImpact: 15680
  },
  {
    id: 'promo-002',
    name: 'First Time Booker',
    description: '15% off for new customers',
    type: 'percentage',
    value: 15,
    conditions: {
      firstTimeOnly: true,
      categories: ['flights', 'hotels']
    },
    isActive: true,
    priority: 5,
    createdAt: '2026-01-20T10:00:00Z',
    updatedAt: '2026-01-20T10:00:00Z',
    usageCount: 89,
    revenueImpact: 4230
  }
];

const loyaltyPrograms: LoyaltyProgram[] = [
  {
    id: 'loyalty-001',
    name: 'Travel Rewards Plus',
    description: 'Earn points on every booking and redeem for travel credits',
    tiers: [
      {
        name: 'Bronze',
        minPoints: 0,
        benefits: {
          discountPercentage: 5,
          bonusPoints: 1
        }
      },
      {
        name: 'Silver',
        minPoints: 1000,
        benefits: {
          discountPercentage: 10,
          freeShipping: true,
          bonusPoints: 1.5
        }
      },
      {
        name: 'Gold',
        minPoints: 5000,
        benefits: {
          discountPercentage: 15,
          freeShipping: true,
          prioritySupport: true,
          bonusPoints: 2
        }
      }
    ],
    pointsPerDollar: 10,
    pointsExpiryDays: 365,
    isActive: true,
    createdAt: '2026-01-20T10:00:00Z',
    updatedAt: '2026-01-20T10:00:00Z'
  }
];

const dynamicRules: DynamicPricingRule[] = [
  {
    id: 'dynamic-001',
    name: 'Peak Season Surge',
    description: 'Increase prices during peak demand periods',
    trigger: 'demand',
    conditions: {
      occupancyRate: 80,
      timeWindow: { start: '06:00', end: '22:00' }
    },
    adjustment: {
      type: 'percentage',
      value: 15,
      maxAdjustment: 50
    },
    isActive: true,
    priority: 8,
    createdAt: '2026-01-20T10:00:00Z',
    updatedAt: '2026-01-20T10:00:00Z',
    performance: {
      appliedCount: 1250,
      revenueImpact: 18750,
      conversionRate: 0.85
    }
  }
];

const abTests: ABTest[] = [
  {
    id: 'ab-test-001',
    name: 'Checkout Button Color Test',
    description: 'Testing blue vs green checkout button conversion rates',
    type: 'ui',
    variants: [
      { id: 'variant-a', name: 'Blue Button', config: { color: 'blue' }, trafficPercentage: 50 },
      { id: 'variant-b', name: 'Green Button', config: { color: 'green' }, trafficPercentage: 50 }
    ],
    status: 'running',
    startDate: '2026-01-15',
    results: {
      variants: [
        { variantId: 'variant-a', impressions: 15420, conversions: 892, revenue: 45630, conversionRate: 5.79 },
        { variantId: 'variant-b', impressions: 15380, conversions: 945, revenue: 48920, conversionRate: 6.14 }
      ],
      confidence: 85
    },
    createdAt: '2026-01-15T10:00:00Z',
    updatedAt: '2026-01-20T10:00:00Z'
  }
];

// Promotion CRUD routes
router.get('/promotions', (req: Request, res: Response) => {
  const { active, type, code } = req.query;
  let filteredPromotions = promotions;

  if (active !== undefined) {
    const isActive = active === 'true';
    filteredPromotions = filteredPromotions.filter(p => p.isActive === isActive);
  }

  if (type) {
    filteredPromotions = filteredPromotions.filter(p => p.type === type);
  }

  if (code) {
    filteredPromotions = filteredPromotions.filter(p => p.code === code);
  }

  res.json(filteredPromotions);
});

router.post('/promotions', (req: Request, res: Response) => {
  const { name, description, type, value, code, conditions } = req.body;

  if (!name || !type || typeof value !== 'number') {
    return res.status(400).json({ error: 'name, type, and value are required' });
  }

  const newPromotion: Promotion = {
    id: 'promo-' + String(promotions.length + 1).padStart(3, '0'),
    name,
    description: description || '',
    type,
    value,
    code,
    conditions: conditions || {},
    isActive: true,
    priority: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    usageCount: 0,
    revenueImpact: 0
  };

  promotions.push(newPromotion);
  res.status(201).json(newPromotion);
});

router.put('/promotions/:id', (req: Request, res: Response) => {
  const promotion = promotions.find(p => p.id === req.params.id);
  if (!promotion) {
    return res.status(404).json({ error: 'Promotion not found' });
  }

  Object.assign(promotion, req.body);
  promotion.updatedAt = new Date().toISOString();

  res.json(promotion);
});

router.delete('/promotions/:id', (req: Request, res: Response) => {
  const index = promotions.findIndex(p => p.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Promotion not found' });
  }

  const deleted = promotions.splice(index, 1)[0];
  res.json(deleted);
});

// Validate promotion code
router.post('/promotions/validate', (req: Request, res: Response) => {
  const { code, cartTotal, userId, items } = req.body;

  if (!code || !cartTotal) {
    return res.status(400).json({ error: 'code and cartTotal are required' });
  }

  const promotion = promotions.find(p => p.code === code && p.isActive);
  if (!promotion) {
    return res.status(404).json({ error: 'Invalid or expired promotion code' });
  }

  // Check conditions
  const conditions = promotion.conditions;

  if (conditions.minPurchase && cartTotal < conditions.minPurchase) {
    return res.status(400).json({ error: `Minimum purchase of $${conditions.minPurchase} required` });
  }

  if (conditions.maxPurchase && cartTotal > conditions.maxPurchase) {
    return res.status(400).json({ error: `Maximum purchase limit of $${conditions.maxPurchase} exceeded` });
  }

  if (conditions.usageLimit && promotion.usageCount >= conditions.usageLimit) {
    return res.status(400).json({ error: 'Promotion code usage limit reached' });
  }

  if (conditions.userLimit && userId) {
    // Mock user usage check - in real app, check database
    const userUsage = Math.floor(Math.random() * 5); // Mock usage
    if (userUsage >= conditions.userLimit) {
      return res.status(400).json({ error: 'Promotion code already used by this user' });
    }
  }

  // Calculate discount
  let discountAmount = 0;
  switch (promotion.type) {
    case 'percentage':
      discountAmount = (cartTotal * promotion.value) / 100;
      break;
    case 'fixed':
      discountAmount = Math.min(promotion.value, cartTotal);
      break;
    case 'free_shipping':
      discountAmount = 25; // Assume shipping cost
      break;
  }

  res.json({
    valid: true,
    promotion,
    discountAmount,
    finalTotal: Math.max(0, cartTotal - discountAmount)
  });
});

// Loyalty Program routes
router.get('/loyalty', (req: Request, res: Response) => {
  res.json(loyaltyPrograms);
});

router.post('/loyalty', (req: Request, res: Response) => {
  const { name, description, tiers, pointsPerDollar, pointsExpiryDays } = req.body;

  if (!name || !tiers || !pointsPerDollar) {
    return res.status(400).json({ error: 'name, tiers, and pointsPerDollar are required' });
  }

  const newProgram: LoyaltyProgram = {
    id: 'loyalty-' + String(loyaltyPrograms.length + 1).padStart(3, '0'),
    name,
    description: description || '',
    tiers,
    pointsPerDollar,
    pointsExpiryDays: pointsExpiryDays || 365,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  loyaltyPrograms.push(newProgram);
  res.status(201).json(newProgram);
});

// Calculate loyalty points and tier
router.post('/loyalty/calculate', (req: Request, res: Response) => {
  const { userId, purchaseAmount } = req.body;

  if (!userId || !purchaseAmount) {
    return res.status(400).json({ error: 'userId and purchaseAmount are required' });
  }

  const program = loyaltyPrograms.find(p => p.isActive);
  if (!program) {
    return res.status(404).json({ error: 'No active loyalty program found' });
  }

  // Mock user points - in real app, get from database
  const userPoints = Math.floor(Math.random() * 2000) + 500; // Mock points
  const earnedPoints = Math.floor(purchaseAmount * program.pointsPerDollar);
  const newTotalPoints = userPoints + earnedPoints;

  // Determine tier
  let currentTier = program.tiers[0];
  for (const tier of program.tiers) {
    if (newTotalPoints >= tier.minPoints) {
      currentTier = tier;
    }
  }

  res.json({
    userId,
    currentPoints: userPoints,
    earnedPoints,
    newTotalPoints,
    currentTier: {
      name: currentTier.name,
      benefits: currentTier.benefits
    },
    nextTier: program.tiers.find(t => t.minPoints > newTotalPoints)
  });
});

// Dynamic Pricing Rules routes
router.get('/dynamic-pricing', (req: Request, res: Response) => {
  const { active, trigger } = req.query;
  let rules = dynamicRules;

  if (active !== undefined) {
    const isActive = active === 'true';
    rules = rules.filter(r => r.isActive === isActive);
  }

  if (trigger) {
    rules = rules.filter(r => r.trigger === trigger);
  }

  res.json(rules);
});

router.post('/dynamic-pricing', (req: Request, res: Response) => {
  const { name, description, trigger, conditions, adjustment } = req.body;

  if (!name || !trigger || !conditions || !adjustment) {
    return res.status(400).json({ error: 'name, trigger, conditions, and adjustment are required' });
  }

  const newRule: DynamicPricingRule = {
    id: 'dynamic-' + String(dynamicRules.length + 1).padStart(3, '0'),
    name,
    description: description || '',
    trigger,
    conditions,
    adjustment,
    isActive: true,
    priority: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    performance: {
      appliedCount: 0,
      revenueImpact: 0,
      conversionRate: 0
    }
  };

  dynamicRules.push(newRule);
  res.status(201).json(newRule);
});

// Calculate dynamic price
router.post('/dynamic-pricing/calculate', (req: Request, res: Response) => {
  const { basePrice, productId, occupancyRate, currentTime, userHistory } = req.body;

  if (!basePrice) {
    return res.status(400).json({ error: 'basePrice is required' });
  }

  // Find applicable dynamic rules
  const applicableRules = dynamicRules.filter(rule => {
    if (!rule.isActive) return false;

    const conditions = rule.conditions;

    // Check occupancy rate
    if (conditions.occupancyRate && occupancyRate && occupancyRate >= conditions.occupancyRate) {
      return true;
    }

    // Check time window
    if (conditions.timeWindow && currentTime) {
      const time = currentTime.split('T')[1]?.substring(0, 5); // HH:MM format
      if (time >= conditions.timeWindow.start && time <= conditions.timeWindow.end) {
        return true;
      }
    }

    return false;
  }).sort((a, b) => b.priority - a.priority);

  let finalPrice = basePrice;
  const appliedRules = [];

  for (const rule of applicableRules) {
    const adjustment = rule.adjustment;
    let adjustmentAmount = 0;

    if (adjustment.type === 'percentage') {
      adjustmentAmount = (finalPrice * adjustment.value) / 100;
    } else if (adjustment.type === 'fixed') {
      adjustmentAmount = adjustment.value;
    }

    // Apply limits
    if (adjustment.maxAdjustment) {
      adjustmentAmount = Math.min(adjustmentAmount, adjustment.maxAdjustment);
    }
    if (adjustment.minAdjustment) {
      adjustmentAmount = Math.max(adjustmentAmount, adjustment.minAdjustment);
    }

    finalPrice += adjustmentAmount;

    appliedRules.push({
      ruleId: rule.id,
      ruleName: rule.name,
      adjustmentAmount
    });

    // Update performance metrics
    rule.performance.appliedCount++;
    rule.performance.revenueImpact += adjustmentAmount;
  }

  res.json({
    originalPrice: basePrice,
    finalPrice,
    adjustment: finalPrice - basePrice,
    appliedRules,
    currency: 'USD'
  });
});

// A/B Testing routes
router.get('/ab-tests', (req: Request, res: Response) => {
  const { status } = req.query;
  let tests = abTests;

  if (status) {
    tests = tests.filter(t => t.status === status);
  }

  res.json(tests);
});

router.post('/ab-tests', (req: Request, res: Response) => {
  const { name, description, type, variants } = req.body;

  if (!name || !type || !variants || variants.length < 2) {
    return res.status(400).json({ error: 'name, type, and at least 2 variants are required' });
  }

  // Validate traffic distribution
  const totalTraffic = variants.reduce((sum, v) => sum + v.trafficPercentage, 0);
  if (totalTraffic !== 100) {
    return res.status(400).json({ error: 'Traffic percentages must sum to 100%' });
  }

  const newTest: ABTest = {
    id: 'ab-test-' + String(abTests.length + 1).padStart(3, '0'),
    name,
    description: description || '',
    type,
    variants,
    status: 'draft',
    results: {
      variants: variants.map(v => ({
        variantId: v.id,
        impressions: 0,
        conversions: 0,
        revenue: 0,
        conversionRate: 0
      })),
      confidence: 0
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  abTests.push(newTest);
  res.status(201).json(newTest);
});

// Start A/B test
router.post('/ab-tests/:id/start', (req: Request, res: Response) => {
  const test = abTests.find(t => t.id === req.params.id);
  if (!test) {
    return res.status(404).json({ error: 'A/B test not found' });
  }

  if (test.status !== 'draft') {
    return res.status(400).json({ error: 'Test can only be started from draft status' });
  }

  test.status = 'running';
  test.startDate = new Date().toISOString();
  test.updatedAt = new Date().toISOString();

  res.json(test);
});

// Stop A/B test and declare winner
router.post('/ab-tests/:id/stop', (req: Request, res: Response) => {
  const test = abTests.find(t => t.id === req.params.id);
  if (!test) {
    return res.status(404).json({ error: 'A/B test not found' });
  }

  if (test.status !== 'running') {
    return res.status(400).json({ error: 'Test must be running to stop it' });
  }

  // Determine winner based on revenue
  const winner = test.results.variants.reduce((best, current) =>
    current.revenue > best.revenue ? current : best
  );

  test.status = 'completed';
  test.winner = winner.variantId;
  test.endDate = new Date().toISOString();
  test.updatedAt = new Date().toISOString();

  res.json({ test, winner: winner.variantId });
});

// Get pricing analytics
router.get('/analytics', (req: Request, res: Response) => {
  const analytics = {
    promotions: {
      totalActive: promotions.filter(p => p.isActive).length,
      totalRevenue: promotions.reduce((sum, p) => sum + p.revenueImpact, 0),
      topPerforming: promotions
        .sort((a, b) => b.revenueImpact - a.revenueImpact)
        .slice(0, 5)
    },
    dynamicPricing: {
      totalActive: dynamicRules.filter(r => r.isActive).length,
      totalRevenue: dynamicRules.reduce((sum, r) => sum + r.performance.revenueImpact, 0),
      averageConversion: dynamicRules.reduce((sum, r) => sum + r.performance.conversionRate, 0) / dynamicRules.length
    },
    loyalty: {
      totalPrograms: loyaltyPrograms.filter(p => p.isActive).length,
      totalPointsIssued: 125000, // Mock data
      redemptionRate: 0.68
    },
    abTesting: {
      activeTests: abTests.filter(t => t.status === 'running').length,
      completedTests: abTests.filter(t => t.status === 'completed').length,
      averageImprovement: 12.5 // Percentage
    }
  };

  res.json({ data: analytics });
});

export default router;
