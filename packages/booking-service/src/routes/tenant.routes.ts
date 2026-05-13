import { Router, type Request, type Response, type NextFunction } from 'express';
import type { Router as RouterType } from 'express';

const router: RouterType = Router();

router.get('/tenants', (req: Request, res: Response) => {
  res.json({
    data: [
      { id: 't-1', name: 'Saba Travel & Holidays', slug: 'saba-travel', email: 'ops@saba.com', phone: '+973 17123456', status: 'active', createdAt: '2025-01-15T00:00:00Z' },
      { id: 't-2', name: 'Gulf Wings Travel', slug: 'gulf-wings', email: 'admin@gulfwings.com', phone: '+971 42123456', status: 'active', createdAt: '2025-02-20T00:00:00Z' },
      { id: 't-3', name: 'Desert Star Tourism', slug: 'desert-star', email: 'info@desertstar.ae', phone: '+971 50123456', status: 'active', createdAt: '2025-03-10T00:00:00Z' },
      { id: 't-4', name: 'Al Noon Travels', slug: 'al-noon', email: 'book@alnoon.com', phone: '+966 11123456', status: 'archived', createdAt: '2024-11-05T00:00:00Z' },
    ],
    total: 4,
    page: 1,
    limit: 10,
  });
});

router.get('/b2b/tenants', (req: Request, res: Response) => {
  res.json({
    data: [
      { id: 't-1', name: 'Saba Travel & Holidays', slug: 'saba-travel', email: 'ops@saba.com', phone: '+973 17123456', status: 'active', createdAt: '2025-01-15T00:00:00Z' },
      { id: 't-2', name: 'Gulf Wings Travel', slug: 'gulf-wings', email: 'admin@gulfwings.com', phone: '+971 42123456', status: 'active', createdAt: '2025-02-20T00:00:00Z' },
      { id: 't-3', name: 'Desert Star Tourism', slug: 'desert-star', email: 'info@desertstar.ae', phone: '+971 50123456', status: 'active', createdAt: '2025-03-10T00:00:00Z' },
      { id: 't-4', name: 'Al Noon Travels', slug: 'al-noon', email: 'book@alnoon.com', phone: '+966 11123456', status: 'archived', createdAt: '2024-11-05T00:00:00Z' },
    ],
    total: 4,
    page: 1,
    limit: 10,
  });
});

router.get('/sub-users', (req: Request, res: Response) => {
  res.json([
    { id: 'su-1', name: 'Ahmed Khan', email: 'ahmed@saba.com', role: 'Admin', isActive: true, lastLogin: new Date(Date.now() - 3600000).toISOString() },
    { id: 'su-2', name: 'Fatima Ali', email: 'fatima@saba.com', role: 'Agent', isActive: true, lastLogin: new Date(Date.now() - 86400000).toISOString() },
    { id: 'su-3', name: 'Omar Hassan', email: 'omar@saba.com', role: 'Supervisor', isActive: true, lastLogin: new Date(Date.now() - 172800000).toISOString() },
  ]);
});

router.get('/travellers', (req: Request, res: Response) => {
  res.json([
    { id: 't-1', firstName: 'John', lastName: 'Smith', email: 'john@corp.com', passportNo: 'AB123456', nationality: 'US' },
    { id: 't-2', firstName: 'Jane', lastName: 'Doe', email: 'jane@corp.com', passportNo: 'CD789012', nationality: 'UK' },
  ]);
});

router.get('/branches', (req: Request, res: Response) => {
  res.json([
    { id: 'b-1', name: 'Main Office', city: 'Manama', country: 'BH', isActive: true },
    { id: 'b-2', name: 'Airport Branch', city: 'Manama', country: 'BH', isActive: true },
  ]);
});

router.get('/transactions', (req: Request, res: Response) => {
  res.json([
    { id: 'tx-1', type: 'Debit', amount: 1250.00, currency: 'BHD', description: 'Flight booking BAH-LHR', status: 'Settled', date: new Date(Date.now() - 86400000).toISOString() },
    { id: 'tx-2', type: 'Credit', amount: 500.00, currency: 'BHD', description: 'Refund - Hotel cancellation', status: 'Settled', date: new Date(Date.now() - 172800000).toISOString() },
  ]);
});

router.get('/bookings', (req: Request, res: Response) => {
  res.json([
    { id: 'BK-001', status: 'Confirmed', type: 'Flight', amount: 1250.00, currency: 'BHD', createdAt: new Date(Date.now() - 86400000).toISOString() },
    { id: 'BK-002', status: 'Pending', type: 'Hotel', amount: 850.00, currency: 'BHD', createdAt: new Date(Date.now() - 172800000).toISOString() },
  ]);
});

router.get('/reports/audit', (req: Request, res: Response) => {
  res.json([
    { id: 'aud-1', action: 'BOOKING_CREATED', user: 'ahmed@saba.com', timestamp: new Date(Date.now() - 3600000).toISOString(), details: 'Booking BK-001 created' },
    { id: 'aud-2', action: 'PAYMENT_RECEIVED', user: 'fatima@saba.com', timestamp: new Date(Date.now() - 7200000).toISOString(), details: 'Payment of 1250 BHD received' },
  ]);
});

router.get('/reports/regulatory', (req: Request, res: Response) => {
  res.json([
    { id: 'rr-1', type: 'AML_REPORT', status: 'Submitted', submittedAt: new Date(Date.now() - 604800000).toISOString() },
  ]);
});

router.get('/sub-users/compliance', (req: Request, res: Response) => {
  res.json([
    { ruleId: 'c-1', status: 'Passed', lastChecked: new Date().toISOString(), details: 'All sub-users KYC verified' },
  ]);
});

router.get('/security-log', (req: Request, res: Response) => {
  res.json([
    { id: 'sec-1', event: 'LOGIN', user: 'ahmed@saba.com', ip: '192.168.1.100', timestamp: new Date(Date.now() - 3600000).toISOString(), success: true },
  ]);
});

router.get('/clients/:clientId/communication-log', (req: Request, res: Response) => {
  res.json([
    { id: 'msg-1', sender: 'Agent', content: 'Your booking is confirmed', timestamp: new Date(Date.now() - 86400000).toISOString(), isInternal: false },
  ]);
});

router.get('/clients/:clientId/feedback', (req: Request, res: Response) => {
  res.json([
    { id: 'fb-1', rating: 5, comment: 'Excellent service!', submittedAt: new Date(Date.now() - 172800000).toISOString() },
  ]);
});

router.get('/clients/:clientId/orders', (req: Request, res: Response) => {
  res.json([
    { id: 'ord-1', status: 'Delivered', type: 'Flight', date: new Date(Date.now() - 86400000).toISOString() },
  ]);
});

router.get('/markup-rules', (req: Request, res: Response) => {
  res.json([
    { id: 'mr-1', name: 'Standard Flight Markup', type: 'FLIGHT', percentage: 5, isActive: true },
    { id: 'mr-2', name: 'Hotel Markup', type: 'HOTEL', percentage: 8, isActive: true },
    { id: 'mr-3', name: 'Business Class Premium', type: 'FLIGHT', percentage: 3, isActive: false },
  ]);
});

router.get('/suppliers/escalation-rules', (req: Request, res: Response) => {
  res.json([
    { id: 'er-1', supplier: 'Duffel', priority: 'High', timeout: 30, notification: 'ops@tripinfo.com' },
    { id: 'er-2', supplier: 'LiteAPI', priority: 'Medium', timeout: 60, notification: 'ops@tripinfo.com' },
  ]);
});

router.get('/suppliers/:code/performance-history', (req: Request, res: Response) => {
  const months = parseInt(req.query.months as string) || 12;
  const data = Array.from({ length: months }, (_, i) => ({
    month: new Date(Date.now() - (months - 1 - i) * 30 * 86400000).toISOString().substring(0, 7),
    score: Math.floor(Math.random() * 30) + 70,
  }));
  res.json(data);
});

router.get('/agents', (req: Request, res: Response) => {
  res.json([
    { id: 'a-1', name: 'Ahmed Khan', role: 'Admin', active: true },
    { id: 'a-2', name: 'Fatima Ali', role: 'Agent', active: true },
    { id: 'a-3', name: 'Omar Hassan', role: 'Supervisor', active: true },
  ]);
});

router.get('/companies', (req: Request, res: Response) => {
  res.json([
    { id: 'c-1', name: 'Corporate ABZ', type: 'Corporate', status: 'Active', walletBalance: 8450.75, creditLimit: 4000 },
    { id: 'c-2', name: 'Gulf Holdings Ltd', type: 'Corporate', status: 'Active', walletBalance: 3220.50, creditLimit: 2000 },
  ]);
});

router.get('/reports/gross-sales', (req: Request, res: Response) => {
  res.json({ total: 125000, currency: 'BHD', period: 'month' });
});

router.get('/reports/supplier-health', (req: Request, res: Response) => {
  res.json({ duffel: 95, liteapi: 88, overall: 91.5 });
});

router.get('/reports/compliance', (req: Request, res: Response) => {
  res.json({ kyc: 100, aml: 98, gdpr: 100 });
});

router.post('/markup-rules', (req: Request, res: Response) => {
  res.status(201).json({ id: 'mr-' + Date.now(), ...req.body, isActive: true });
});

router.put('/markup-rules/:id', (req: Request, res: Response) => {
  res.json({ id: req.params.id, ...req.body });
});

router.delete('/markup-rules/:id', (req: Request, res: Response) => {
  res.json({ success: true });
});

router.post('/markup-rules/:id/toggle', (req: Request, res: Response) => {
  res.json({ id: req.params.id, isActive: !req.body.isActive });
});

router.post('/agents', (req: Request, res: Response) => {
  res.status(201).json({ id: 'a-' + Date.now(), ...req.body, active: true });
});

router.put('/agents/:id', (req: Request, res: Response) => {
  res.json({ id: req.params.id, ...req.body });
});

router.post('/agents/:id/status', (req: Request, res: Response) => {
  res.json({ id: req.params.id, status: req.body.status });
});

router.post('/agents/:id/delete', (req: Request, res: Response) => {
  res.json({ success: true });
});

router.post('/sub-users', (req: Request, res: Response) => {
  res.status(201).json({ id: 'su-' + Date.now(), ...req.body, isActive: true });
});

router.put('/sub-users/:id', (req: Request, res: Response) => {
  res.json({ id: req.params.id, ...req.body });
});

router.post('/sub-users/:id/status', (req: Request, res: Response) => {
  res.json({ id: req.params.id, status: req.body.status });
});

router.get('/login-history', (req: Request, res: Response) => {
  res.json([
    { id: 'lh-1', user: 'ahmed@saba.com', timestamp: new Date(Date.now() - 3600000).toISOString(), ip: '192.168.1.100', success: true },
    { id: 'lh-2', user: 'fatima@saba.com', timestamp: new Date(Date.now() - 7200000).toISOString(), ip: '192.168.1.101', success: true },
  ]);
});

router.get('/account/balance', (req: Request, res: Response) => {
  res.json({ available: 12500, pending: 3200, monthlyVolume: 85000, currency: 'BHD' });
});

router.get('/mpin/status', (req: Request, res: Response) => {
  res.json({ hasPin: true, biometricLinked: false });
});

router.post('/mpin/set', (req: Request, res: Response) => {
  res.json({ success: true });
});

router.post('/mpin/verify', (req: Request, res: Response) => {
  res.json({ success: true });
});

router.get('/branches', (req: Request, res: Response) => {
  res.json([
    { id: 'b-1', name: 'Main Office', city: 'Manama', country: 'BH', isActive: true },
    { id: 'b-2', name: 'Airport Branch', city: 'Manama', country: 'BH', isActive: true },
  ]);
});

router.post('/branches', (req: Request, res: Response) => {
  res.status(201).json({ id: 'b-' + Date.now(), ...req.body, isActive: true });
});

router.get('/sales/analytics', (req: Request, res: Response) => {
  res.json({ grossSales: 125000, totalMarkup: 8750, activeClients: 45, conversionRate: 32, monthlyData: [8500, 9200, 8800, 10100, 9500, 11000, 9800, 10500, 11200, 10800, 12500, 13500] });
});

router.get('/security-log/extended', (req: Request, res: Response) => {
  res.json([
    { id: 'sec-1', event: 'LOGIN', user: 'ahmed@saba.com', ip: '192.168.1.100', timestamp: new Date(Date.now() - 3600000).toISOString(), success: true },
    { id: 'sec-2', event: 'BOOKING_CREATED', user: 'fatima@saba.com', ip: '192.168.1.101', timestamp: new Date(Date.now() - 7200000).toISOString(), success: true },
  ]);
});

export default router;