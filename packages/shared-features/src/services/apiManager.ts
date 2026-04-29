import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse, type AxiosError } from 'axios';
import type {
  Agent,
  SubUser,
  TravellerProfile,
  MarkupRule,
  Transaction,
  Booking,
  FlightResult,
  Hotel,
  FlightSearch,
  HotelSearch,
  WalletAccount,
  WalletPaymentMethod,
  InventoryBlock,
  AuditEntry,
  SecurityEntry,
  PaymentHoldBooking,
  RefundTrackingBooking,
  BoardNotice,
  PromotionalBanner,
  BookingNote,
  BookingMessage,
  AgencyCompliance,
  AmendmentRequest,
  SupplierProfile,
  SupplierSearchResult,
  AgencyHierarchyItem,
  Branch,
  CommissionRule,
  CommissionSharingRule,
  CommissionTransaction,
  CommissionSummary,
  ClientProfile,
  ClientPassport,
  ClientVisa,
  ClientDependent,
  ClientPreferences,
  ClientDocument,
  ClientPersonalCard,
  ClientAssociation,
  ClientSearchResult,
  CustomAlert,
  CommunicationLogEntry,
  ClientFeedback,
  ClientOrderTracking,
  EscalationRule,
  ComplianceCheck,
  RegulatoryReport,
} from '../types';

/**
 * Centralized API Manager (Wicked Gateway Simulation)
 * Handles all internal and external API routing, queuing, and tenant context.
 */
class ApiManager {
 private static instance: ApiManager;
 private client: AxiosInstance;
 private activeTenantId: string | null = null;
 private activeToken: string | null = null;
 private activeUserId: string | null = null;

 private constructor() {
 this.client = axios.create({
 baseURL: import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:4000/api',
 timeout: 30000,
 });



 this.setupInterceptors();
 }

 private setupInterceptors() {
 this.client.interceptors.request.use((config) => {
 if (this.activeToken && config.headers) {
 config.headers.Authorization = `Bearer ${this.activeToken}`;
 }
 if (this.activeTenantId && config.headers) {
 config.headers['X-Tenant-ID'] = this.activeTenantId;
 }
 return config;
 });

 this.client.interceptors.response.use(
 (response) => response,
 (error: AxiosError) => {
 // Global Error Handling
 if (error.response?.status === 401) {
 console.error('[API Manager] 401 Unauthorized - Dispatching logout event');
 // Dispatch a custom event that AppContext can listen to, forcing logout
 if (typeof window !== 'undefined') {
 window.dispatchEvent(new CustomEvent('auth:expired'));
 this.clearPersistedContext();
 }
 }
 
 console.error(`[API Manager] Request Failed: ${error.config?.url}`, error.message);
 
 // Let the local try/catch block handle the fallback simulation
 return Promise.reject(error);
 }
 );
 }

 public static getInstance(): ApiManager {
 if (!ApiManager.instance) {
 ApiManager.instance = new ApiManager();
 }
 return ApiManager.instance;
 }

 /**
 * Sets the current tenant context for all outbound requests
 */
 public setTenantContext(tenantId: string, token?: string, userId?: string) {
 this.activeTenantId = tenantId;
 if (token) this.activeToken = token;
 if (userId) this.activeUserId = userId;
 
 // Persist to localStorage
 if (typeof window !== 'undefined') {
 localStorage.setItem('tenantId', tenantId);
 if (token) localStorage.setItem('token', token);
 if (userId) localStorage.setItem('userId', userId);
 }
 }

 public loadPersistedContext(): { tenantId: string | null, token: string | null, userId: string | null } {
 if (typeof window !== 'undefined') {
 this.activeTenantId = localStorage.getItem('tenantId') || this.activeTenantId;
 this.activeToken = localStorage.getItem('token') || this.activeToken;
 this.activeUserId = localStorage.getItem('userId') || this.activeUserId;
 }
 return {
 tenantId: this.activeTenantId,
 token: this.activeToken,
 userId: this.activeUserId
 };
 }

 public clearPersistedContext() {
 this.activeTenantId = null;
 this.activeToken = null;
 this.activeUserId = null;
 if (typeof window !== 'undefined') {
 localStorage.removeItem('tenantId');
 localStorage.removeItem('token');
 localStorage.removeItem('userId');
 }
 }

 /** Base URL for fetch-based requests (used by export endpoints) */
 private get baseUrl(): string {
 return this.client.defaults.baseURL || (import.meta.env.VITE_API_GATEWAY_URL as string) || 'http://localhost:4000/api';
 }

 /** Headers for fetch-based requests (mirrors axios interceptor logic) */
 private getHeaders(): Record<string, string> {
 const headers: Record<string, string> = {
 'Content-Type': 'application/json',
 };
 if (this.activeTenantId) headers['x-tenant-id'] = this.activeTenantId;
 if (this.activeToken) headers['Authorization'] = `Bearer ${this.activeToken}`;
 if (this.activeUserId) headers['x-user-id'] = this.activeUserId;
 return headers;
 }



 /**
 * Generic GET request payload
 */
 public async get<TReturnType>(url: string, config?: AxiosRequestConfig): Promise<TReturnType> {
 const response = await this.client.get(url, config);
 return response.data as TReturnType;
 }

 /**
 * Generic POST request payload
 */
 public async post<TReturnType>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<TReturnType> {
 const response = await this.client.post(url, data, config);
 return response.data as TReturnType;
 }

 /**
 * Generic DELETE request
 */
 public async delete<TReturnType>(url: string, config?: AxiosRequestConfig): Promise<TReturnType> {
 const response = await this.client.delete(url, config);
 return response.data as TReturnType;
 }

 /**
 * Generic PUT request
 */
 public async put<TReturnType>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<TReturnType> {
 const response = await this.client.put(url, data, config);
 return response.data as TReturnType;
 }

  public async voidTicket(ticketId: string, cancelBookings: boolean, reason: string): Promise<{ success: boolean; message: string; creditNoteNo?: string }> {
    return { 
      success: true, 
      message: `Ticket ${ticketId} voided successfully. Reason: ${reason}. Bookings ${cancelBookings ? 'cancelled' : 'preserved'}.`,
      creditNoteNo: `CN-${Math.floor(Math.random() * 1000000)}`
    };
  }

  // --- SYSTEM ADMIN / CONTROL PLANE ENDPOINTS --- //

 public async getAllTenants(): Promise<readonly Agent[]> {
 return this.get<readonly Agent[]>('/admin/tenants');
 }

 public async login(agentCode: string, username: string, password: string): Promise<unknown> {
 return this.post<any>('/auth/login', { agentCode, username, password });
 }

 public async provisionAgency(data: Record<string, unknown>): Promise<Record<string, unknown>> {
 return this.post<Record<string, unknown>>('/admin/provision', data);
 }

 public async getBranches(): Promise<Branch[]> {
 return this.get<Branch[]>('/tenant/branches');
 }

 public async createBranch(data: Partial<Branch>): Promise<Branch> {
 return this.post<Branch>('/tenant/branches', data);
 }

 public async getSecurityLog(): Promise<SecurityEntry[]> {
 return this.get<SecurityEntry[]>('/tenant/security-log');
 }

 public async getLoginHistory(): Promise<SecurityEntry[]> {
  try {
   return await this.get<SecurityEntry[]>('/tenant/security-log/extended');
  } catch {
   const events = ['Login', 'Login', 'Login', 'Logout', 'Login', 'Password Change', 'Login', 'Login Failed', 'Login', 'Login', 'MFA Verification', 'Login', 'Session Expired', 'Login', 'Login', 'Login Failed', 'Login', 'Logout', 'Login', 'Login'];
   const statuses = ['Success', 'Success', 'Success', 'Success', 'Success', 'Success', 'Success', 'Failed', 'Success', 'Success', 'Success', 'Success', 'Info', 'Success', 'Success', 'Failed', 'Success', 'Success', 'Success', 'Success'];
   const ips = ['185.23.108.42', '185.23.108.42', '10.0.1.55', '185.23.108.42', '92.40.171.88', '185.23.108.42', '185.23.108.42', '203.45.67.89', '185.23.108.42', '10.0.1.55', '185.23.108.42', '92.40.171.88', '185.23.108.42', '185.23.108.42', '10.0.1.55', '45.33.22.11', '185.23.108.42', '185.23.108.42', '92.40.171.88', '185.23.108.42'];
   const devices = ['Chrome 124 / macOS', 'Safari 18 / iOS', 'Chrome 124 / Windows', 'Chrome 124 / macOS', 'Firefox 126 / Linux', 'Chrome 124 / macOS', 'Safari 18 / iOS', 'Chrome 122 / Android', 'Chrome 124 / macOS', 'Chrome 124 / Windows', 'Safari 18 / iOS', 'Firefox 126 / Linux', 'Chrome 124 / macOS', 'Chrome 124 / macOS', 'Chrome 124 / Windows', 'Unknown / Unknown', 'Chrome 124 / macOS', 'Chrome 124 / macOS', 'Firefox 126 / Linux', 'Safari 18 / iOS'];
   const locations = ['Manama, BH', 'Manama, BH', 'Office LAN', 'Manama, BH', 'London, GB', 'Manama, BH', 'Manama, BH', 'Mumbai, IN', 'Manama, BH', 'Office LAN', 'Manama, BH', 'London, GB', 'Manama, BH', 'Manama, BH', 'Office LAN', 'Unknown', 'Manama, BH', 'Manama, BH', 'London, GB', 'Manama, BH'];
   const now = Date.now();
   return events.map((event, i) => ({
    timestamp: new Date(now - i * 3600000 * (3 + Math.random() * 8)).toISOString(),
    event,
    status: statuses[i],
    ipAddress: ips[i],
    device: devices[i],
    location: locations[i],
    browser: devices[i].split(' / ')[0],
   }));
  }
 }

 public async getClientCommunicationLog(clientId: string): Promise<CommunicationLogEntry[]> {
  try {
   return await this.get<CommunicationLogEntry[]>(`/tenant/clients/${clientId}/communication-log`);
  } catch {
   return [
    { id: 'cl-1', date: '2026-04-20T10:30:00Z', channel: 'Email', summary: 'Sent booking confirmation for BAH-LHR flight', agentName: 'Abid Malik' },
    { id: 'cl-2', date: '2026-04-18T14:15:00Z', channel: 'Phone', summary: 'Discussed hotel upgrade options for Dubai trip', agentName: 'Arunika' },
    { id: 'cl-3', date: '2026-04-10T09:00:00Z', channel: 'Chat', summary: 'Resolved visa document query', agentName: 'Abid Malik' },
    { id: 'cl-4', date: '2026-03-28T16:45:00Z', channel: 'In-Person', summary: 'Annual account review meeting', agentName: 'Rizwan Mohamed' },
   ];
  }
 }

 public async getClientFeedback(clientId: string): Promise<ClientFeedback[]> {
  try {
   return await this.get<ClientFeedback[]>(`/tenant/clients/${clientId}/feedback`);
  } catch {
   return [
    { id: 'fb-1', clientId, type: 'Post-Booking', rating: 5, comment: 'Excellent service, very quick booking process.', npsScore: 9, createdAt: '2026-04-15T12:00:00Z' },
    { id: 'fb-2', clientId, type: 'Post-Travel', rating: 4, comment: 'Good overall but hotel check-in was delayed.', npsScore: 7, createdAt: '2026-03-20T15:30:00Z' },
    { id: 'fb-3', clientId, type: 'General', rating: 5, comment: 'Always reliable for business travel arrangements.', npsScore: 10, createdAt: '2026-02-10T09:00:00Z' },
   ];
  }
 }

 public async submitClientFeedback(clientId: string, data: Partial<ClientFeedback>): Promise<ClientFeedback> {
  return this.post<ClientFeedback>(`/tenant/clients/${clientId}/feedback`, data);
 }

 public async getClientOrders(clientId: string): Promise<ClientOrderTracking[]> {
  try {
   return await this.get<ClientOrderTracking[]>(`/tenant/clients/${clientId}/orders`);
  } catch {
   return [
    { id: 'ord-1', clientId, bookingRef: 'BK-2026-0891', serviceType: 'Flight', status: 'Confirmed', amount: 485.500, currency: 'BHD', bookingDate: '2026-04-20', travelDate: '2026-05-15' },
    { id: 'ord-2', clientId, bookingRef: 'BK-2026-0744', serviceType: 'Hotel', status: 'Completed', amount: 320.000, currency: 'BHD', bookingDate: '2026-03-10', travelDate: '2026-03-25' },
    { id: 'ord-3', clientId, bookingRef: 'BK-2026-0612', serviceType: 'Flight', status: 'Ticketed', amount: 1250.000, currency: 'BHD', bookingDate: '2026-02-28', travelDate: '2026-04-01' },
    { id: 'ord-4', clientId, bookingRef: 'BK-2025-1893', serviceType: 'Package', status: 'Cancelled', amount: 890.000, currency: 'BHD', bookingDate: '2025-12-15', travelDate: '2026-01-10' },
   ];
  }
 }

 public async getEscalationRules(): Promise<EscalationRule[]> {
  try {
   return await this.get<EscalationRule[]>('/tenant/suppliers/escalation-rules');
  } catch {
   return [
    { id: 'esc-1', trigger: 'API latency exceeds 500ms for 5 consecutive minutes', action: 'Email alert to admin + auto-failover', severity: 'High', isActive: true },
    { id: 'esc-2', trigger: 'Error rate exceeds 5% of total requests', action: 'Auto-disable supplier + SMS alert to ops', severity: 'Critical', isActive: true },
    { id: 'esc-3', trigger: 'Credit balance falls below 10% of limit', action: 'Dashboard warning + email notification', severity: 'Medium', isActive: true },
    { id: 'esc-4', trigger: 'No booking activity for 72 hours', action: 'Flag for manual review', severity: 'Low', isActive: false },
   ];
  }
 }

 public async createEscalationRule(data: Partial<EscalationRule>): Promise<EscalationRule> {
  return this.post<EscalationRule>('/tenant/suppliers/escalation-rules', data);
 }

 public async getSupplierPerformanceHistory(code: string, months: number = 12): Promise<{ month: string; score: number }[]> {
  try {
   return await this.get<{ month: string; score: number }[]>(`/tenant/suppliers/${code}/performance-history?months=${months}`);
  } catch {
   const labels = ['May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr'];
   return labels.map(month => ({ month, score: 75 + Math.floor(Math.random() * 20) }));
  }
 }

 public async getSubUserCompliance(): Promise<ComplianceCheck[]> {
  try {
   return await this.get<ComplianceCheck[]>('/tenant/sub-users/compliance');
  } catch {
   return [];
  }
 }

 public async getRegulatoryReports(): Promise<RegulatoryReport[]> {
  try {
   return await this.get<RegulatoryReport[]>('/tenant/reports/regulatory');
  } catch {
   return [
    { id: 'rr-1', name: 'Q1 2026 Compliance Summary', date: '2026-03-31', status: 'Generated' },
    { id: 'rr-2', name: 'Annual Regulatory Filing 2025', date: '2025-12-31', status: 'Generated' },
    { id: 'rr-3', name: 'Q2 2026 Compliance Summary', date: '', status: 'Pending' },
   ];
  }
 }

 // --- WICKED GATEWAY INTERNAL/EXTERNAL ENDPOINTS --- //

 public async getSubUsers(): Promise<SubUser[]> {
 return this.get<SubUser[]>('/tenant/sub-users');
 }

 public async getTravellers(): Promise<readonly TravellerProfile[]> {
 return this.get<readonly TravellerProfile[]>('/tenant/travellers');
 }



 public async getTransactions(): Promise<readonly Transaction[]> {
 return this.get<readonly Transaction[]>('/tenant/transactions');
 }

 // --- REPORTING NEXUS & SYSTEMIC AUDIT --- //

 public async getSystemicAudit(): Promise<AuditEntry[]> {
 return this.get<AuditEntry[]>('/tenant/reports/audit');
 }

 private generateMockCsv(headers: string[], rows: string[][]): Blob {
 const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
 return new Blob([csv], { type: 'text/csv' });
 }

 public async getGrossSalesExport(): Promise<Blob> {
 try {
 const response = await this.client.get<Blob>('/tenant/reports/gross-sales', { responseType: 'blob' });
 return response.data;
 } catch {
 console.warn('[API Manager] Gross Sales export API unavailable — generating local system');
 return this.generateMockCsv(
 ['Reference', 'Service', 'Status', 'Booking_Date', 'Travel_Date', 'Currency', 'Sale_Amount', 'Net_Fare', 'Supplier_Cost', 'Markup', 'Yield_Margin'],
 [
 ['FL-482901', 'Flight', 'Confirmed', '2026-03-28', '2026-04-11', 'BHD', '4550.00', '3900.00', '3510.00', '650.00', '22.86%'],
 ['HT-339102', 'Hotel', 'Issued', '2026-03-15', '2026-04-18', 'BHD', '12400.00', '11200.00', '10080.00', '1200.00', '18.75%'],
 ['FL-558723', 'Flight', 'Paid', '2026-03-20', '2026-04-05', 'BHD', '3200.00', '2800.00', '2520.00', '400.00', '21.25%'],
 ['HT-221044', 'Hotel', 'Confirmed', '2026-04-01', '2026-04-22', 'BHD', '8900.00', '7600.00', '6840.00', '1300.00', '23.15%'],
 ['FL-671505', 'Flight', 'Pending', '2026-04-02', '2026-04-15', 'BHD', '2100.00', '1850.00', '1665.00', '250.00', '20.71%'],
 ]
 );
 }
 }

 public async getSupplierHealthExport(): Promise<Blob> {
 try {
 const response = await this.client.get<Blob>('/tenant/reports/supplier-health', { responseType: 'blob' });
 return response.data;
 } catch {
 console.warn('[API Manager] Supplier Health export API unavailable — generating local system');
 return this.generateMockCsv(
 ['Node_Code', 'Supplier_Name', 'Type', 'Operational_Status', 'Latency_ms', 'Success_Rate', 'PNR_Velocity_hr', 'Errors_Last_Hour'],
 [
 ['SABRE', 'Sabre GDS Hub', 'GDS', 'ACTIVE', '124', '99.2%', '45', '0'],
 ['LITEAPI', 'LiteAPI Hospitality', 'Bedbank', '210', '97.8%', '22', '1'],
 ['AMADEUS', 'Amadeus NDC System', 'NDC', 'ACTIVE', '185', '98.5%', '38', '0'],
 ['TRAVELPORT', 'Travelport Fusion', 'GDS', 'ACTIVE', '156', '97.1%', '28', '2'],
 ['HOTELBEDS', 'Hotelbeds Nexus', 'Bedbank', 'ACTIVE', '340', '95.4%', '15', '3'],
 ['Ek Ndc', 'Emirates NDC Direct', 'NDC', 'RESTRICTED', '890', '89.2%', '5', '12'],
 ]
 );
 }
 }

 public async getComplianceExport(): Promise<Blob> {
 try {
 const response = await this.client.get<Blob>('/tenant/reports/compliance', { responseType: 'blob' });
 return response.data;
 } catch {
 console.warn('[API Manager] Compliance export API unavailable — generating local system');
 return this.generateMockCsv(
 ['Node_Code', 'Supplier_Name', 'Authorization_State', 'PAN_Tax_ID', 'Service_Tax_No', 'ATOL_License', 'Settlement_Period', 'Security_Deposit_Held'],
 [
 ['SABRE', 'Sabre GDS Hub', 'ACTIVE', 'PAN-SABRE-001', 'ST-SABRE-001', 'ATOL-5221', 'Monthly', '50000.00'],
 ['LITEAPI', 'LiteAPI Hospitality', 'AUTHORIZED', 'PAN-LITE-002', 'ST-LITE-002', 'ATOL-7832', 'Fortnightly', '25000.00'],
 ['AMADEUS', 'Amadeus NDC System', 'ACTIVE', 'PAN-AMA-003', 'ST-AMA-003', 'ATOL-1144', 'Monthly', '40000.00'],
 ['TRAVELPORT', 'Travelport Fusion', 'ACTIVE', 'PAN-TP-004', 'ST-TP-004', 'ATOL-3399', 'Weekly', '35000.00'],
 ['HOTELBEDS', 'Hotelbeds Nexus', 'PENDING', 'MISSING', 'ST-HB-005', 'MISSING', 'On Request', '15000.00'],
 ['Ek Ndc', 'Emirates NDC Direct', 'PENDING', 'PAN-EK-006', 'MISSING', 'MISSING', 'Monthly', '20000.00'],
 ]
 );
 }
 }

 public async getBookings(): Promise<readonly Booking[]> {
 return this.get<readonly Booking[]>('/tenant/bookings');
 }

 public async getBookingById(id: string): Promise<Booking | null> {
 const bookings: readonly Booking[] = await this.getBookings();
 return bookings.find((b: Booking) => b.id === id || b.referenceNo === id) || null;
 }

 public async recordPayment(bookingId: string, data: { method: string, amount: number }): Promise<{ success: boolean; receiptNo: string }> {
 return this.post<{ success: boolean; receiptNo: string }>(`/tenant/bookings/${bookingId}/payment`, data);
 }

 public async issueBooking(id: string): Promise<unknown> {
 return this.post<any>(`/tenant/bookings/${id}/issue`, {});
 }

 public async payBooking(id: string, data: { method: string }): Promise<unknown> {
 return this.post<any>(`/tenant/bookings/${id}/pay`, data);
 }

 public async refundBooking(id: string, data: { note: string, amount: number }): Promise<unknown> {
 return this.post<any>(`/tenant/bookings/${id}/refund`, data);
 }

 // --- INVENTORY MANAGEMENT ENDPOINTS --- //

 public async getInventoryBlocks(): Promise<readonly InventoryBlock[]> {
 return this.get<readonly InventoryBlock[]>('/tenant/inventory/blocks');
 }

 public async carryForwardInventory(id: string): Promise<unknown> {
 return this.post<any>(`/tenant/inventory/blocks/${id}/carry-forward`, {});
 }

 // --- WICKED GATEWAY: INVENTORY SERVICES (Currently emulated via Wicked Connector) --- //

 public async getFlights(_searchParams?: FlightSearch): Promise<readonly FlightResult[]> {
 const params = _searchParams ? `?origin=${_searchParams.fromCode}&destination=${_searchParams.toCode}&departureDate=${_searchParams.departureDate}` : '?origin=DXB&destination=LHR&departureDate=2026-10-15';
 return this.get<readonly FlightResult[]>(`/tenant/search/flights${params}`);
 }

 public async getFlightById(id: string): Promise<FlightResult | null> {
 const flights: readonly FlightResult[] = await this.getFlights();
 const result: FlightResult | undefined = flights.find((f: FlightResult): boolean => f.id === id);
 return result || null;
 }

 public async getHotels(_searchParams?: HotelSearch): Promise<readonly Hotel[]> {
 const params = _searchParams ? `?location=${_searchParams.destination}&checkIn=${_searchParams.checkIn}&checkOut=${_searchParams.checkOut}&guests=${_searchParams.adults + _searchParams.children}` : '?location=Dubai&checkIn=2026-10-15&checkOut=2026-10-20&guests=2';
 return this.get<readonly Hotel[]>(`/tenant/search/hotels${params}`);
 }

 public async getHotelById(id: string): Promise<Hotel | null> {
 const hotels: readonly Hotel[] = await this.getHotels();
 const result: Hotel | undefined = hotels.find((h: Hotel): boolean => h.id === id);
 return result || null;
 }

 // --- MPIN / SECURITY ENDPOINTS --- //

 public async setMPin(pin: string): Promise<{ success: boolean }> {
 return this.post<{ success: boolean }>('/tenant/mpin/set', { pin });
 }

 public async verifyMPin(pin: string): Promise<{ success: boolean }> {
 return this.post<{ success: boolean }>('/tenant/mpin/verify', { pin });
 }

 public async resetMPin(oldPin: string, newPin: string): Promise<{ success: boolean }> {
 return this.post<{ success: boolean }>('/tenant/mpin/reset', { oldPin, newPin });
 }

 public async getMPinStatus(): Promise<{ hasPin: boolean; biometricLinked: boolean }> {
 return this.get<{ hasPin: boolean; biometricLinked: boolean }>('/tenant/mpin/status');
 }

 public async linkBiometric(deviceToken: string): Promise<{ success: boolean }> {
 return this.post<{ success: boolean }>('/tenant/mpin/biometric', { deviceToken });
 }

 // --- SALES REP / SUPPORT ENDPOINTS --- //

 public async getAccountBalance(): Promise<{ available: number; pending: number; monthlyVolume: number; currency: string }> {
 return this.get<{ available: number; pending: number; monthlyVolume: number; currency: string }>('/tenant/accounts/balance');
 }

 public async getWalletAccounts(): Promise<readonly WalletAccount[]> {
 return this.get<readonly WalletAccount[]>('/tenant/accounts/wallet');
 }

 public async processSplitPayment(data: { primaryAccountId: string; secondaryAccountId: string; primaryAmount: number; secondaryAmount: number; bookingId: string }): Promise<{ success: boolean; transactionIds: string[] }> {
 return this.post<{ success: boolean; transactionIds: string[] }>('/tenant/accounts/split-pay', data);
 }

 public async topUpBalance(amount: number, method: string): Promise<{ success: boolean; transactionId: string }> {
 return this.post<{ success: boolean; transactionId: string }>('/tenant/accounts/topup', { amount, method });
 }

 public async getSalesAnalytics(period: string): Promise<{ grossSales: number; totalMarkup: number; activeClients: number; conversionRate: number; monthlyData: number[] }> {
 return this.get<{ grossSales: number; totalMarkup: number; activeClients: number; conversionRate: number; monthlyData: number[] }>(`/tenant/analytics/sales?period=${period}`);
 }

 public async exportSalesData(period: string): Promise<Blob> {
 const response = await this.client.get(`/tenant/analytics/export?period=${period}`, { responseType: 'blob' });
 return response.data;
 }

 // --- SUB-USER CRUD ENDPOINTS --- //

 public async createSubUser(data: { name: string; email: string; role: string; password: string; firstName?: string; lastName?: string; username?: string; isActive?: boolean }): Promise<SubUser> {
 return this.post<SubUser>('/tenant/sub-users', data);
 }

 public async updateSubUser(id: string, data: Partial<SubUser>): Promise<SubUser> {
 return this.post<SubUser>(`/tenant/sub-users/${id}`, data);
 }

 public async deleteSubUser(id: string): Promise<{ success: boolean }> {
 return this.post<{ success: boolean }>(`/tenant/sub-users/${id}/delete`, {});
 }

 public async toggleSubUserStatus(id: string, status: 'Active' | 'Restricted'): Promise<SubUser> {
 return this.post<SubUser>(`/tenant/sub-users/${id}/status`, { status });
 }

 // --- TRAVELLER CRUD ENDPOINTS --- //

 public async createTraveller(data: { firstName: string; lastName: string; title: string; dob: string; nationality: string; passportNumber: string; issuingCountry: string; passportExpiry: string; type: 'Adult' | 'Child' | 'Infant' }): Promise<TravellerProfile> {
 return this.post<TravellerProfile>('/tenant/travellers', data);
 }

 public async updateTraveller(id: string, data: Partial<TravellerProfile>): Promise<TravellerProfile> {
 return this.post<TravellerProfile>(`/tenant/travellers/${id}`, data);
 }

 public async deleteTraveller(id: string): Promise<{ success: boolean }> {
 return this.post<{ success: boolean }>(`/tenant/travellers/${id}/delete`, {});
 }

 public async searchTravellers(query: string): Promise<readonly TravellerProfile[]> {
 return this.get<readonly TravellerProfile[]>(`/tenant/travellers/search?q=${encodeURIComponent(query)}`);
 }

 // --- MARKUP CRUD ENDPOINTS --- //

 public async getMarkupRules(serviceType?: string, isActive?: boolean): Promise<readonly MarkupRule[]> {
 const params = new URLSearchParams();
 if (serviceType) params.append('serviceType', serviceType);
 if (isActive !== undefined) params.append('isActive', String(isActive));
 
 const queryString = params.toString();
 return this.get<readonly MarkupRule[]>(`/tenant/markup-rules${queryString ? `?${queryString}` : ''}`);
 }

 public async getMarkupRuleById(id: string): Promise<MarkupRule> {
 return this.get<MarkupRule>(`/tenant/markup-rules/${id}`);
 }

 public async createMarkupRule(data: {
 name: string;
 description?: string;
 serviceType: string;
 valueType: string;
 value: number;
 isActive?: boolean;
 priority?: number;
 ruleLevel?: string;
 airlineCode?: string;
 airlineGroup?: string;
 originCode?: string;
 destinationCode?: string;
 marketRegion?: string;
 rbdClass?: string;
 journeyType?: string;
 cabinClass?: string;
 hotelId?: string;
 hotelChain?: string;
 hotelStars?: number;
 mealPlan?: string;
 supplierCode?: string;
 customerId?: string;
 customerType?: string;
 customerTier?: string;
 effectiveFrom?: string;
 effectiveTo?: string;
 }): Promise<MarkupRule> {
 return this.post<MarkupRule>('/tenant/markup-rules', data);
 }

 public async updateMarkupRule(id: string, data: Partial<MarkupRule>): Promise<MarkupRule> {
 return this.put<MarkupRule>(`/tenant/markup-rules/${id}`, data);
 }

 public async deleteMarkupRule(id: string): Promise<void> {
 return this.delete<void>(`/tenant/markup-rules/${id}`);
 }

 public async toggleMarkupRule(id: string): Promise<MarkupRule> {
 return this.post<MarkupRule>(`/tenant/markup-rules/${id}/toggle`, {});
 }

 public async simulateMarkup(data: {
 netFare: number;
 serviceType: string;
 conditions: Record<string, unknown>;
 }): Promise<{
 simulatedPrice: number;
 appliedRules: Array<{ ruleName: string; markupAmount: number }>;
 totalMarkup: number;
 }> {
 return this.post<any>('/tenant/markup-rules/simulate', data);
 }

 public async getMarkupAuditLogs(limit?: number, offset?: number, action?: string): Promise<{
 logs: Array<unknown>;
 total: number;
 limit: number;
 offset: number;
 }> {
 const params = new URLSearchParams();
 if (limit) params.append('limit', String(limit));
 if (offset) params.append('offset', String(offset));
 if (action) params.append('action', action);
 
 const queryString = params.toString();
 return this.get<any>(`/tenant/markup-rules/audit-logs${queryString ? `?${queryString}` : ''}`);
 }

 public async getMarkupRuleAuditHistory(id: string): Promise<Array<unknown>> {
 return this.get<Array<unknown>>(`/tenant/markup-rules/${id}/audit-history`);
 }

 // --- COMMISSION MANAGEMENT ENDPOINTS --- //

 public async getCommissionRules(serviceType?: string, isActive?: boolean, sourceType?: string): Promise<CommissionRule[]> {
 const params = new URLSearchParams();
 if (serviceType) params.append('serviceType', serviceType);
 if (isActive !== undefined) params.append('isActive', String(isActive));
 if (sourceType) params.append('sourceType', sourceType);
 
 const queryString = params.toString();
 return this.get<CommissionRule[]>(`/tenant/commission-rules${queryString ? `?${queryString}` : ''}`);
 }

 public async getCommissionRuleById(id: string): Promise<CommissionRule> {
 return this.get<CommissionRule>(`/tenant/commission-rules/${id}`);
 }

 public async createCommissionRule(data: {
 name: string;
 description?: string;
 sourceType: string;
 serviceType: string;
 commissionType: string;
 baseCommission: number;
 isActive?: boolean;
 supplierCode?: string;
 airlineCode?: string;
 destinationCode?: string;
 cabinClass?: string;
 hotelChain?: string;
 hotelStars?: number;
 effectiveFrom?: string;
 effectiveTo?: string;
 }): Promise<CommissionRule> {
 return this.post<CommissionRule>('/tenant/commission-rules', data);
 }

 public async updateCommissionRule(id: string, data: Partial<CommissionRule>): Promise<CommissionRule> {
 return this.put<CommissionRule>(`/tenant/commission-rules/${id}`, data);
 }

 public async deleteCommissionRule(id: string): Promise<void> {
 return this.delete<void>(`/tenant/commission-rules/${id}`);
 }

 public async toggleCommissionRule(id: string): Promise<CommissionRule> {
 return this.post<CommissionRule>(`/tenant/commission-rules/${id}/toggle`, {});
 }

 public async getCommissionSharingRules(commissionRuleId: string): Promise<CommissionSharingRule[]> {
 return this.get<CommissionSharingRule[]>(`/tenant/commission-rules/${commissionRuleId}/sharing-rules`);
 }

 public async createCommissionSharingRule(commissionRuleId: string, data: {
 shareType: string;
 shareValue: number;
 recipientType: string;
 customerId?: string;
 customerType?: string;
 minBookingValue?: number;
 maxShareValue?: number;
 priority?: number;
 isActive?: boolean;
 }): Promise<CommissionSharingRule> {
 return this.post<CommissionSharingRule>(`/tenant/commission-rules/${commissionRuleId}/sharing-rules`, data);
 }

 public async updateCommissionSharingRule(commissionRuleId: string, sharingRuleId: string, data: Partial<CommissionSharingRule>): Promise<CommissionSharingRule> {
 return this.put<CommissionSharingRule>(`/tenant/commission-rules/${commissionRuleId}/sharing-rules/${sharingRuleId}`, data);
 }

 public async deleteCommissionSharingRule(commissionRuleId: string, sharingRuleId: string): Promise<void> {
 return this.delete<void>(`/tenant/commission-rules/${commissionRuleId}/sharing-rules/${sharingRuleId}`);
 }

 public async simulateCommission(data: {
 bookingValue: number;
 serviceType: string;
 conditions: Record<string, unknown>;
 currency?: string;
 }): Promise<{
 bookingValue: number;
 baseCommission: number;
 commissionRate: number;
 sharedAmount: number;
 retainedAmount: number;
 sharePercentage: number;
 appliedSharingRules: Array<{
 ruleId: string;
 ruleName: string;
 recipientType: string;
 shareAmount: number;
 }>;
 currency: string;
 }> {
 return this.post<any>('/tenant/commission-rules/simulate', data);
 }

 public async getCommissionTransactions(limit?: number, offset?: number, status?: string, recipientType?: string): Promise<{
 transactions: CommissionTransaction[];
 total: number;
 limit: number;
 offset: number;
 }> {
 const params = new URLSearchParams();
 if (limit) params.append('limit', String(limit));
 if (offset) params.append('offset', String(offset));
 if (status) params.append('status', status);
 if (recipientType) params.append('recipientType', recipientType);
 
 const queryString = params.toString();
 return this.get<any>(`/tenant/commission-transactions${queryString ? `?${queryString}` : ''}`);
 }

 public async getBookingCommissions(bookingRef: string): Promise<CommissionTransaction[]> {
 return this.get<CommissionTransaction[]>(`/tenant/bookings/${bookingRef}/commissions`);
 }

 public async markCommissionAsPaid(id: string): Promise<CommissionTransaction> {
 return this.post<CommissionTransaction>(`/tenant/commission-transactions/${id}/mark-paid`, {});
 }

 public async reverseCommissionTransaction(id: string, reason?: string): Promise<CommissionTransaction> {
 return this.post<CommissionTransaction>(`/tenant/commission-transactions/${id}/reverse`, { reason });
 }

 public async getCommissionSummary(startDate?: string, endDate?: string): Promise<CommissionSummary> {
 const params = new URLSearchParams();
 if (startDate) params.append('startDate', startDate);
 if (endDate) params.append('endDate', endDate);
 
 const queryString = params.toString();
 return this.get<CommissionSummary>(`/tenant/commission-summary${queryString ? `?${queryString}` : ''}`);
 }

 // --- PROVIDER MANAGEMENT ENDPOINTS --- //

 public async getProviders(): Promise<{ aviation: readonly { id: string; name: string; code: string; status: boolean }[]; hospitality: readonly { id: string; name: string; status: boolean }[] }> {
 return this.get<{ aviation: readonly { id: string; name: string; code: string; status: boolean }[]; hospitality: readonly { id: string; name: string; status: boolean }[] }>('/tenant/providers');
 }

 public async toggleProvider(id: string, status: boolean): Promise<{ success: boolean }> {
 return this.post<{ success: boolean }>(`/tenant/providers/${id}/toggle`, { status });
 }

 public async resetProvidersToDefault(): Promise<{ success: boolean }> {
 return this.post<{ success: boolean }>('/tenant/providers/reset', {});
 }

 // --- SUPPLIER GOVERNANCE (v12) --- //

 public async getSuppliers(): Promise<SupplierSearchResult[]> {
 return this.get<SupplierSearchResult[]>('/tenant/suppliers');
 }

 public async searchSuppliers(query: string, type?: string, status?: string): Promise<SupplierSearchResult[]> {
 const params = new URLSearchParams();
 if (query) params.append('q', query);
 if (type) params.append('type', type);
 if (status) params.append('status', status);
 return this.get<SupplierSearchResult[]>(`/tenant/suppliers/search?${params.toString()}`);
 }

 public async getSupplierByCode(code: string): Promise<SupplierProfile | null> {
 try {
 return await this.get<SupplierProfile>(`/tenant/suppliers/${code}`);
 } catch {
 return null;
 }
 }

 public async onboardSupplier(data: Record<string, unknown>): Promise<SupplierProfile> {
 return this.post<SupplierProfile>('/tenant/suppliers/onboard', data);
 }

 public async updateSupplier(code: string, data: Record<string, unknown>): Promise<SupplierProfile> {
 return this.put<SupplierProfile>(`/tenant/suppliers/${code}`, data);
 }

 public async deactivateSupplier(code: string): Promise<SupplierProfile> {
 return this.delete<SupplierProfile>(`/tenant/suppliers/${code}`);
 }

 public async authorizeSupplier(code: string): Promise<SupplierProfile> {
 return this.post<SupplierProfile>('/tenant/suppliers/authorize', { code });
 }

 public async activateSupplier(code: string): Promise<SupplierProfile> {
 return this.post<SupplierProfile>('/tenant/suppliers/activate', { code });
 }

 public async toggleSupplierLogin(code: string, status: boolean): Promise<SupplierProfile> {
 return this.post<SupplierProfile>('/tenant/suppliers/login-status', { code, status });
 }

 public async updateSupplierCredit(code: string, data: { amount: number, isLimitUpdate?: boolean }): Promise<SupplierProfile> {
 return this.post<SupplierProfile>('/tenant/suppliers/credit', { code, ...data });
 }

 public async updateSupplierMetrics(code: string, metrics: Record<string, unknown>): Promise<Record<string, unknown>> {
 return this.post<Record<string, unknown>>('/tenant/suppliers/metrics', { code, metrics });
 }

 public async registerSupplierContract(data: Record<string, unknown>): Promise<Record<string, unknown>> {
 return this.post<Record<string, unknown>>('/tenant/suppliers/contracts', data);
 }

 public async getSupplierContracts(code: string): Promise<unknown[]> {
 return this.get<unknown[]>(`/tenant/suppliers/${code}/contracts`);
 }

 public async getSupplierMetrics(code: string, days: number = 7): Promise<unknown[]> {
 return this.get<unknown[]>(`/tenant/suppliers/${code}/metrics?days=${days}`);
 }

 public async getSupplierAlerts(code: string): Promise<unknown[]> {
 return this.get<unknown[]>(`/tenant/suppliers/${code}/alerts`);
 }

 public async getSupplierHealth(): Promise<{
 totalSuppliers: number;
 activeSuppliers: number;
 averageLatency: number;
 averageSuccessRate: number;
 suppliersWithIssues: number;
 }> {
 return this.get<any>('/tenant/dashboard/supplier-health');
 }

 public async getSupplierPerformanceMatrix(): Promise<{
 matrix: unknown[];
 summary: {
 totalSuppliers: number;
 activeSuppliers: number;
 overallAvgLatency: number;
 overallSuccessRate: number;
 criticalSuppliers: number;
 degradedSuppliers: number;
 healthySuppliers: number;
 };
 }> {
 return this.get<any>('/tenant/suppliers/performance-matrix');
 }

 public async getSupplierDashboard(): Promise<{
 overview: { totalSuppliers: number; activeSuppliers: number; pendingSuppliers: number; authorizedSuppliers: number };
 financial: { totalCreditLimit: number; totalAvailableCredit: number; totalUtilizedCredit: number; utilizationPercent: string };
 performance: { avgLatency: number; avgSuccessRate: number; totalPnrVelocity: number; suppliersWithIssues: number };
 alerts: { totalActiveAlerts: number; criticalAlerts: number; recentAlerts: unknown[] };
 contracts: { totalActiveContracts: number };
 topPerformers: unknown[];
 worstPerformers: unknown[];
 }> {
 return this.get<any>('/tenant/suppliers/dashboard');
 }

 // --- SYSTEM ADMIN ENDPOINTS --- //


 public async getSystemStatus(): Promise<{ clusters: string; nodes: readonly { id: string; cpu: number; memory: number; status: string }[] }> {
 return this.get<{ clusters: string; nodes: readonly { id: string; cpu: number; memory: number; status: string }[] }>('/admin/system/status');
 }

 // --- SALES REP / SUPPORT ENDPOINTS --- //

 public async getAssignedRep(): Promise<{ name: string; title: string; phone: string; email: string; region: string; supportHours: string }> {
 return this.get<{ name: string; title: string; phone: string; email: string; region: string; supportHours: string }>('/tenant/support/rep');
 }

 public async requestCallback(): Promise<{ success: boolean }> {
 return this.post<{ success: boolean }>('/tenant/support/callback', {});
 }

 public async reportIssue(issue: { subject: string; description: string; priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' }): Promise<{ success: boolean; ticketId: string }> {
 return this.post<{ success: boolean; ticketId: string }>('/tenant/support/issue', issue);
 }

 // --- NEWSLETTER ENDPOINTS --- //

 public async getNewsletters(): Promise<readonly { id: string; title: string; date: string; thumbnail?: string; status: 'draft' | 'sent' | 'scheduled' }[]> {
 return this.get<readonly { id: string; title: string; date: string; thumbnail?: string; status: 'draft' | 'sent' | 'scheduled' }[]>('/tenant/newsletter');
 }

 public async createNewsletter(data: { subject: string; content: string; imageUrl?: string; scheduledAt?: string }): Promise<{ id: string; success: boolean }> {
 return this.post<{ id: string; success: boolean }>('/tenant/newsletter', data);
 }

 public async sendNewsletter(id: string): Promise<{ success: boolean }> {
 return this.post<{ success: boolean }>(`/tenant/newsletter/${id}/send`, {});
 }

 public async scheduleNewsletter(id: string, scheduledAt: string): Promise<{ success: boolean }> {
 return this.post<{ success: boolean }>(`/tenant/newsletter/${id}/schedule`, { scheduledAt });
 }

 public async deleteNewsletter(id: string): Promise<{ success: boolean }> {
 return this.post<{ success: boolean }>(`/tenant/newsletter/${id}/delete`, {});
 }

 // --- COMMUNICATION GOVERNANCE ENDPOINTS --- //

 public async getBoardNotices(): Promise<BoardNotice[]> {
 try {
 return await this.get<BoardNotice[]>('/tenant/communication/notices');
 } catch {
 return [
 { 
 id: 'n-1', 
 title: 'System Maintenance - Apr 15', 
 content: 'The GDS system for Sabre will undergo scheduled maintenance on April 15 from 02:00 to 04:00 UTC.', 
 urgency: 'High', 
 targets: ['*'], 
 isAcknowledgeRequired: true, 
 createdAt: '2026-04-10T09:00:00Z' 
 },
 { 
 id: 'n-2', 
 title: 'Ramadan Working Hours', 
 content: 'Support desk will be available from 08:00 to 14:00 and 19:00 to 01:00 during the holy month.', 
 urgency: 'Medium', 
 targets: ['*'], 
 isAcknowledgeRequired: false, 
 createdAt: '2026-04-11T08:00:00Z' 
 }
 ];
 }
 }

 public async createBoardNotice(data: Partial<BoardNotice>): Promise<BoardNotice> {
 return this.post<BoardNotice>('/tenant/communication/notices', data);
 }

 public async getPromotionalBanners(): Promise<PromotionalBanner[]> {
 try {
 return await this.get<PromotionalBanner[]>('/tenant/communication/banners');
 } catch {
 return [
 { 
 id: 'b-1', 
 imageUrl: 'https://images.unsplash.com/photo-1436491865332-7a61a109c0f3?auto=format&fit=crop&q=80&w=1200&h=400', 
 title: 'Fly Gulf Air - Double Miles', 
 targets: ['*'], 
 isActive: true, 
 sortOrder: 1 
 },
 { 
 id: 'b-2', 
 imageUrl: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=1200&h=400', 
 title: 'Summer Paradise - 15% Off Hotels', 
 targets: ['*'], 
 isActive: true, 
 sortOrder: 2 
 }
 ];
 }
 }

 public async updateBanner(id: string, data: Partial<PromotionalBanner>): Promise<PromotionalBanner> {
 return this.post<PromotionalBanner>(`/tenant/communication/banners/${id}`, data);
 }

 public async getAuditLogs(): Promise<AuditEntry[]> {
 return this.get<AuditEntry[]>('/tenant/audit-logs');
 }


 // --- AGENCY HIERARCHY & MULTI-TENANT ENDPOINTS --- //

 public async getSubAgencies(): Promise<readonly Agent[]> {
 return this.get<readonly Agent[]>('/tenant/agency/sub-agencies');
 }

 // --- BOOKING MODIFICATION ENDPOINTS --- //

 public async requestBookingModification(id: string, data: { newTravelDate?: string; newRoute?: string }): Promise<{ success: boolean; fareDelta: number; newBookingId: string }> {
 return this.post<{ success: boolean; fareDelta: number; newBookingId: string }>(`/tenant/bookings/${id}/modify`, data);
 }

 // --- QUEUE MANAGEMENT ENDPOINTS --- //

 public async getQueueTasks(): Promise<readonly { id: string; type: string; status: string; retries: number; error?: string }[]> {
 return this.get<readonly { id: string; type: string; status: string; retries: number; error?: string }[]>('/tenant/queues/tasks');
 }

 public async retryQueueTask(id: string): Promise<{ success: boolean }> {
 return this.post<{ success: boolean }>(`/tenant/queues/tasks/${id}/retry`, {});
 }

 // --- PAYMENT HOLD QUEUE ENDPOINTS --- //

 public async getPaymentHoldBookings(params?: { status?: string; search?: string }): Promise<readonly PaymentHoldBooking[]> {
 const queryParams = new URLSearchParams();
 if (params?.status) queryParams.set('status', params.status);
 if (params?.search) queryParams.set('search', params.search);
 const query = queryParams.toString();
 return this.get<readonly PaymentHoldBooking[]>(`/tenant/bookings/queue/payment-hold${query ? `?${query}` : ''}`);
 }

 public async sendPaymentReminder(bookingId: string): Promise<{ success: boolean; reminderId: string; message: string; sentAt: string }> {
 return this.post<{ success: boolean; reminderId: string; message: string; sentAt: string }>(`/tenant/bookings/${bookingId}/send-reminder`, {});
 }

 public async extendPaymentHold(bookingId: string, hours: number = 24): Promise<{ success: boolean; message: string; newExpiry: string }> {
 return this.post<{ success: boolean; message: string; newExpiry: string }>(`/tenant/bookings/${bookingId}/extend-hold`, { hours });
 }

 // --- REFUND TRACKING QUEUE ENDPOINTS --- //

 public async getRefundBookings(params?: { status?: string; search?: string; dateFrom?: string; dateTo?: string }): Promise<readonly RefundTrackingBooking[]> {
 const queryParams = new URLSearchParams();
 if (params?.status) queryParams.set('status', params.status);
 if (params?.search) queryParams.set('search', params.search);
 if (params?.dateFrom) queryParams.set('dateFrom', params.dateFrom);
 if (params?.dateTo) queryParams.set('dateTo', params.dateTo);
 const query = queryParams.toString();
 return this.get<readonly RefundTrackingBooking[]>(`/tenant/bookings/queue/refund${query ? `?${query}` : ''}`);
 }

  public async getRefundStats(): Promise<{
  pendingCount: number;
  pendingAmount: number;
  processedCount: number;
  processedAmount: number;
  failedCount: number;
  failedAmount: number;
  totalRefundedToday: number;
  currency: string;
  }> {
  return this.get<{
  pendingCount: number;
  pendingAmount: number;
  processedCount: number;
  processedAmount: number;
  failedCount: number;
  failedAmount: number;
  totalRefundedToday: number;
  currency: string;
  }>('/tenant/bookings/queue/refund/stats');
  }

 public async exportRefundQueue(format: string = 'csv'): Promise<Blob> {
 try {
 const response = await this.client.get<Blob>(`/tenant/bookings/queue/refund/export?format=${format}`, { responseType: 'blob' });
 return response.data;
 } catch {
 console.warn('[API Manager] Refund export API unavailable — generating local system');
 const headers = ['Reference', 'Service', 'Status', 'Refund Status', 'Passenger', 'Original Amount', 'Refund Amount', 'Penalty %', 'Transaction ID', 'Refund Date'];
 const rows = [
 ['FL-482901', 'Flight', 'Refunded', 'Processed', 'John Smith', '4550.00', '4095.00', '10%', 'TXN-REF-001', '2026-04-01'],
 ['HT-339102', 'Hotel', 'Refunded', 'Processed', 'Jane Doe', '12400.00', '11160.00', '10%', 'TXN-REF-002', '2026-04-02'],
 ['FL-558723', 'Flight', 'Pending Refund', 'Pending', 'Mike Brown', '3200.00', '2880.00', '10%', '', ''],
 ];
 return this.generateMockCsv(headers, rows);
 }
 }

 public async retryFailedRefund(bookingId: string): Promise<{ success: boolean; message: string; booking: Record<string, unknown> }> {
 return this.post<{ success: boolean; message: string; booking: Record<string, unknown> }>(`/tenant/bookings/${bookingId}/retry-refund`, {});
 }

 // ============================================================
 // Agency Hierarchy (admin routes)
 // ============================================================
 public async getAgencyHierarchy(): Promise<AgencyHierarchyItem | null> {
 try {
 const response = await fetch(`${this.baseUrl}/admin/hierarchy`, {
 method: 'GET',
 headers: this.getHeaders(),
 });
 if (!response.ok) throw new Error('Hierarchy API unavailable');
 return response.json();
 } catch {
 // Fallback to mock data
 return null;
 }
 }

 public async syncHierarchy(): Promise<{ status: string; syncedAt: string }> {
 try {
 const response = await fetch(`${this.baseUrl}/admin/hierarchy/sync`, {
 method: 'POST',
 headers: this.getHeaders(),
 });
 if (!response.ok) throw new Error('Sync API unavailable');
 return response.json();
 } catch {
 return { status: 'sync_complete_simulated', syncedAt: new Date().toISOString() };
 }
 }

 // ============================================================
 // Favorites / Preference Matrix
 // ============================================================
 public async getFavorites(): Promise<Record<string, unknown>[]> {
 try {
 return await this.get<Record<string, unknown>[]>('/tenant/favorites');
 } catch {
 return [];
 }
 }

 public async addFavorite(payload: { type: string; assetId: string; name: string; details: object }): Promise<Record<string, unknown>> {
 return this.post<Record<string, unknown>>('/tenant/favorites', payload);
 }

 public async removeFavorite(id: string): Promise<{ success: boolean }> {
 return this.delete<{ success: boolean }>(`/tenant/favorites/${id}`);
 }

 public async broadcastFavorite(id: string): Promise<{ status: string; asset: string; broadcastedAt: string; reachedNodes: number }> {
 try {
 return await this.post<{ status: string; asset: string; broadcastedAt: string; reachedNodes: number }>(`/tenant/favorites/${id}/broadcast`, {});
 } catch {
 return { status: 'broadcast_complete_simulated', asset: id, broadcastedAt: new Date().toISOString(), reachedNodes: 3 };
 }
 }

 // ============================================================
 // Dispatch Ledger
 // ============================================================
 public async getDispatchLedger(bookingId: string): Promise<Record<string, unknown>[]> {
 try {
 return await this.get<Record<string, unknown>[]>(`/tenant/bookings/${bookingId}/dispatch`);
 } catch {
 return [];
 }
 }

 public async createDispatchEvent(bookingId: string, payload: { type: string; label: string; recipient?: string }): Promise<Record<string, unknown>> {
 try {
 return await this.post<Record<string, unknown>>(`/tenant/bookings/${bookingId}/dispatch`, payload);
 } catch {
 // return simulated event
 return { id: Date.now().toString(), bookingId, ...payload, timestamp: new Date().toISOString() };
 }
 }

 // --- ADMINISTRATIVE GOVERNANCE (PHASE 9) --- //

 public async authorizeBooking(id: string): Promise<{ success: boolean; pnr: string }> {
 return this.post<{ success: boolean; pnr: string }>(`/tenant/bookings/${id}/authorize`, {});
 }

 public async rejectBooking(id: string, reason: string): Promise<{ success: boolean }> {
 return this.post<{ success: boolean }>(`/tenant/bookings/${id}/reject`, { reason });
 }

 public async lockBooking(id: string, userId: string): Promise<{ success: boolean; lockedBy: string }> {
 return this.post<{ success: boolean; lockedBy: string }>(`/tenant/bookings/${id}/lock`, { userId });
 }

 public async unlockBooking(id: string): Promise<{ success: boolean }> {
 return this.post<{ success: boolean }>(`/tenant/bookings/${id}/unlock`, {});
 }

 public async getBookingNotes(id: string): Promise<BookingNote[]> {
 try {
 return await this.get<BookingNote[]>(`/tenant/bookings/${id}/notes`);
 } catch {
 return [
 { id: 'n1', author: 'Bindu', content: 'Customer requested bulkhead seat on the BAH-COK segment.', level: 'Internal', timestamp: new Date(Date.now() - 3600000).toISOString() },
 { id: 'n2', author: 'System', content: 'GDS segment validation successful.', level: 'System', timestamp: new Date(Date.now() - 7200000).toISOString() }
 ];
 }
 }

  public async createBookingNote(id: string, note: Partial<BookingNote>): Promise<BookingNote> {
  return this.post<BookingNote>(`/tenant/bookings/${id}/notes`, note);
  }
  
  // --- B2B PORTAL MANUAL BOOKING ENDPOINTS --- //
  
  public async createBlankBooking(data: {
    clientName: string;
    travelType: 'Business' | 'Personal';
    passengerType: 'Individual' | 'Dependent' | 'MultiplePassengers' | 'GuestUser';
    salesChannel: string;
    productType: 'Flight' | 'Hotel' | 'Car';
    remarks: string;
  }): Promise<{ success: boolean; booking: Booking }> {
  return this.post<{ success: boolean; booking: Booking }>('/tenant/bookings/blank', data);
  }
  
  public async addManualFlightSegment(
    bookingId: string,
    data: {
      originAirport: string;
      destinationAirport: string;
      validatingCarrier: string;
      duration: string;
      tripType: 'One-Way' | 'Return' | 'Multi-City';
      segments: Array<{
        airline: string;
        flightNumber: string;
        originAirport: string;
        destinationAirport: string;
        departureDateTime: string;
        arrivalDateTime: string;
        class: string;
        status: string;
      }>;
      passengerIds: string[];
      calculationMode: 'Auto' | 'Manual';
      baseFareADT?: number;
      taxYQ?: number;
      wsNett?: number;
      gross?: number;
    }
  ): Promise<{ success: boolean }> {
  return this.post<{ success: boolean }>(`/tenant/bookings/${bookingId}/manual-flight`, data);
  }
  
  public async addManualHotelSegment(
    bookingId: string,
    data: {
      supplier: string;
      hotelName: string;
      starCategory: number;
      cityCode: string;
      checkInDate: string;
      checkOutDate: string;
      status: string;
      confirmationNo: string;
      confirmedWithSupplier: boolean;
      calculationMode: 'Auto' | 'Manual';
      rooms: Array<{
        roomType: string;
        meal?: string;
        noOfRooms: number;
        noOfOccupantsADT: number;
        noOfOccupantsCHD: number;
        baseFare: number;
        tax?: number;
      }>;
    }
  ): Promise<{ success: boolean }> {
  return this.post<{ success: boolean }>(`/tenant/bookings/${bookingId}/manual-hotel`, data);
  }
  
   public async addManualCarSegment(
     bookingId: string,
     data: {
       supplier: string;
       pickupLocation: string;
       dropOffLocation: string;
       pickupDateTime: string;
       dropOffDateTime: string;
       baseFare: number;
     }
   ): Promise<{ success: boolean }> {
   return this.post<{ success: boolean }>(`/tenant/bookings/${bookingId}/manual-car`, data);
   }

    // --- CORPORATE QUEUE & APPROVAL (PHASE 9) ---

    public async getCorporateQueue(filters?: { status?: string; bookingDateFrom?: string; bookingDateTo?: string; corporateId?: string }): Promise<import('../types').Booking[]> {
      try {
        return await this.get<import('../types').Booking[]>('/tenant/management/corporate-queue', { params: filters });
      } catch {
        const today = new Date();
        return [
          {
            id: 'TA-482901' as any,
            tenantId: 'saba',
            referenceNo: 'TA-482901',
            service: 'Flight' as const,
            passengerName: 'Mohammed Al-Balushi',
            amount: 4550,
            currency: 'BHD',
            status: 'Pending' as const,
            bookingDate: today.toISOString(),
            travelDate: new Date(today.getTime() + 2 * 86400000).toISOString(),
            route: 'BAH-LHR',
            approvalStatus: 'Pending',
            approvedCount: 0,
            approvalCount: 3
          },
          {
            id: 'TA-339102',
            tenantId: 'saba',
            referenceNo: 'TA-339102',
            service: 'Hotel' as const,
            passengerName: 'Fatima Ali',
            amount: 12400,
            currency: 'BHD',
            status: 'Confirmed' as const,
            bookingDate: today.toISOString(),
            travelDate: new Date(today.getTime() + 5 * 86400000).toISOString(),
            hotelName: 'Grand Hyatt Dubai',
            approvalStatus: 'Approved',
            approvedCount: 3,
            approvalCount: 3
          }
        ];
      }
    }

    public async repriceBooking(bookingId: string, baseFare: number, tax: number): Promise<{ success: boolean; sameFare?: boolean; fareDifference?: number }> {
      try {
        return await this.post<{ success: boolean; sameFare: boolean; fareDifference: number }>(`/tenant/bookings/${bookingId}/reprice`, { baseFare, tax });
      } catch {
        return { success: true, sameFare: false, fareDifference: 150 };
      }
    }

    public async fulfilBooking(bookingId: string): Promise<{ success: boolean; ticketNo?: string; invoiceNo?: string }> {
      try {
        return await this.post<{ success: boolean; ticketNo: string; invoiceNo: string }>(`/tenant/bookings/${bookingId}/fulfil`, {});
      } catch {
        return { success: true, ticketNo: `TKT-${Date.now()}`, invoiceNo: `INV-${Date.now()}` };
      }
    }

    public async getBookingMessages(id: string): Promise<BookingMessage[]> {
 try {
 return await this.get<BookingMessage[]>(`/tenant/bookings/${id}/messages`);
 } catch {
 return [
 { id: 'm1', sender: 'Ahmed Khan', content: 'Is the ticket issued yet?', timestamp: new Date(Date.now() - 1800000).toISOString(), isInternal: false, status: 'read' },
 { id: 'm2', sender: 'Support', content: 'Payment verification in progress. Will issue soon.', timestamp: new Date(Date.now() - 900000).toISOString(), isInternal: true, status: 'sent' }
 ];
 }
 }

 public async sendBookingMessage(id: string, message: Partial<BookingMessage>): Promise<BookingMessage> {
 return this.post<BookingMessage>(`/tenant/bookings/${id}/messages`, message);
 }

 // --- COMPLIANCE & AUTHORIZATION (PHASE 10) --- //

 public async getProvisionalQueue(): Promise<Booking[]> {
 try {
 return await this.get<Booking[]>('/tenant/management/provisional-queue');
 } catch {
 // Mocked provisional queue with some "stale" bookings for compliance demo
 return [
 { 
 id: 'TA-882910', 
 tenantId: 'hub-001',
 referenceNo: 'TA-882910', 
 service: 'Flight' as const, 
 passengerName: 'Ahmed Khan', 
 amount: 450.500, 
 currency: 'BHD', 
 status: 'Confirmed' as const, 
 authorizationStatus: 'Provisional' as const, 
 bookingDate: new Date(Date.now() - 2 * 86400000).toISOString(),
 route: 'BAH-DXB',
 travelDate: '2026-05-15'
 } as Booking,
 { 
 id: 'TA-992011', 
 tenantId: 'hub-001',
 referenceNo: 'TA-992011', 
 service: 'Hotel' as const, 
 passengerName: 'Sara Ahmed', 
 amount: 120.000, 
 currency: 'BHD', 
 status: 'Paid' as const, 
 authorizationStatus: 'Provisional' as const, 
 bookingDate: new Date().toISOString(),
 hotelName: 'The Ritz-Carlton',
 travelDate: '2026-06-01'
 } as Booking
 ];
 }
 }

 public async bulkAuthorizeBookings(ids: string[]): Promise<{ success: boolean; authorizedCount: number }> {
 return this.post<{ success: boolean; authorizedCount: number }>('/tenant/management/bulk-authorize', { ids });
 }

 public async getComplianceSummary(): Promise<AgencyCompliance> {
 try {
 return await this.get<AgencyCompliance>('/tenant/management/compliance');
 } catch {
 return {
 isGated: true,
 reason: 'StaleProvisional',
 staleBookingCount: 1,
 totalProvisionalAmount: 570.500,
 lastSync: new Date().toISOString()
 };
 }
 }

 // --- AMENDMENT & CANCELLATION LIFECYCLE (PHASE 11) --- //

 public async getAmendments(filters?: { type?: string; status?: string }): Promise<AmendmentRequest[]> {
 try {
 return await this.get<AmendmentRequest[]>('/tenant/management/amendments', { params: filters });
 } catch {
 // Mocked amendment ledger
 return [
 {
 id: 'AM-77291-A',
 bookingId: 'TA-772910',
 type: 'NameChange',
 status: 'Pending',
 requestedAt: new Date(Date.now() - 3600000).toISOString(),
 requestedBy: 'Support Team',
 description: 'Correct passenger last name to "Al-Sayed"',
 estimatedPenalty: 25.00
 } satisfies Partial<AmendmentRequest>,
 {
 id: 'AM-33921-C',
 bookingId: 'TA-339210',
 type: 'FullCancel' as const,
 status: 'Approved' as const,
 requestedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
 requestedBy: 'System Auto',
 description: 'Booking cancelled due to non-payment within Time-To-Live window.',
 estimatedPenalty: 0.00,
 resolutionNote: 'Booking purged from GDS branch.'
 } satisfies Partial<AmendmentRequest>
 ];
 }
 }

 public async submitAmendment(bookingId: string, payload: Partial<AmendmentRequest>): Promise<{ success: boolean; amendmentId: string }> {
 return this.post<{ success: boolean; amendmentId: string }>(`/tenant/bookings/${bookingId}/amendments`, payload);
 }

 // ============================================================
 // B2B WALLET SYSTEM ENDPOINTS
 // ============================================================

 public async getWalletClients(): Promise<import('../types').WalletClient[]> {
 try {
 return await this.get<import('../types').WalletClient[]>('/tenant/wallet/clients');
 } catch {
 return [
 { id: 'wc-1', tenantId: 'saba', clientName: 'Corporate ABZ', clientCode: 'C-ABZ-001', contactName: 'Ahmed Al-Zahrawi', contactEmail: 'ahmed@corpabz.bh', contactPhone: '+973 1700 1234', clientType: 'Corporate', status: 'Active', tier: 'Elite', loyaltyScore: 94, kycVerified: true, walletBalance: 8450.750, pendingBalance: 210.000, currency: 'BHD', creditEnabled: true, creditLimit: 4000.000, creditUsed: 1200.000, creditAvailable: 2800.000, annualSpend: 98400.000, monthlyAvgSpend: 8200.000, totalTransactions: 312, lastActivityAt: new Date(Date.now() - 86400000).toISOString(), createdAt: '2023-01-15T09:00:00Z', linkedBankAccounts: 2, autoTopUpEnabled: true, autoTopUpThreshold: 1000, autoTopUpAmount: 3000 },
 { id: 'wc-2', tenantId: 'saba', clientName: 'Gulf Holdings Ltd', clientCode: 'C-GH-002', contactName: 'Fatima Al-Mansoori', contactEmail: 'fatima@gulfholdings.bh', contactPhone: '+973 1700 5678', clientType: 'Corporate', status: 'Active', tier: 'Premium', loyaltyScore: 82, kycVerified: true, walletBalance: 3220.500, pendingBalance: 0, currency: 'BHD', creditEnabled: true, creditLimit: 2000.000, creditUsed: 850.000, creditAvailable: 1150.000, annualSpend: 54200.000, monthlyAvgSpend: 4516.000, totalTransactions: 187, lastActivityAt: new Date(Date.now() - 172800000).toISOString(), createdAt: '2023-04-20T09:00:00Z', linkedBankAccounts: 1, autoTopUpEnabled: false },
 { id: 'wc-3', tenantId: 'saba', clientName: 'Al Bahrain Travel Co.', clientCode: 'C-ABT-003', contactName: 'Khalid Hassan', contactEmail: 'khalid@albahraintravel.bh', contactPhone: '+973 1700 9012', clientType: 'Sub-Agent', status: 'Active', tier: 'Preferred', loyaltyScore: 71, kycVerified: true, walletBalance: 1875.250, pendingBalance: 120.000, currency: 'BHD', creditEnabled: false, creditLimit: 0, creditUsed: 0, creditAvailable: 0, annualSpend: 28600.000, monthlyAvgSpend: 2383.000, totalTransactions: 98, lastActivityAt: new Date(Date.now() - 259200000).toISOString(), createdAt: '2023-08-10T09:00:00Z', linkedBankAccounts: 1, autoTopUpEnabled: false },
 { id: 'wc-4', tenantId: 'saba', clientName: 'Emirates Corp Partners', clientCode: 'C-ECP-004', contactName: 'Sara Al-Qassimi', contactEmail: 'sara@emiratescorp.ae', contactPhone: '+971 4 500 1234', clientType: 'Corporate', status: 'Restricted', tier: 'Preferred', loyaltyScore: 58, kycVerified: true, walletBalance: 450.000, pendingBalance: 0, currency: 'BHD', creditEnabled: true, creditLimit: 1000.000, creditUsed: 980.000, creditAvailable: 20.000, annualSpend: 19200.000, monthlyAvgSpend: 1600.000, totalTransactions: 64, lastActivityAt: new Date(Date.now() - 604800000).toISOString(), createdAt: '2024-01-05T09:00:00Z', linkedBankAccounts: 0, autoTopUpEnabled: false },
 { id: 'wc-5', tenantId: 'saba', clientName: 'Manama Biz Solutions', clientCode: 'C-MBS-005', contactName: 'Yousuf Al-Shehab', contactEmail: 'yousuf@manamabizsol.bh', contactPhone: '+973 1700 3456', clientType: 'Sub-Agent', status: 'Pending KYC', tier: 'Standard', loyaltyScore: 30, kycVerified: false, walletBalance: 200.000, pendingBalance: 0, currency: 'BHD', creditEnabled: false, creditLimit: 0, creditUsed: 0, creditAvailable: 0, annualSpend: 3400.000, monthlyAvgSpend: 283.000, totalTransactions: 12, lastActivityAt: new Date(Date.now() - 1209600000).toISOString(), createdAt: '2025-10-01T09:00:00Z', linkedBankAccounts: 0, autoTopUpEnabled: false },
 ];
 }
 }

 public async getClientCreditFacility(clientId: string): Promise<import('../types').CreditFacility | null> {
 try {
 return await this.get<import('../types').CreditFacility>(`/tenant/wallet/clients/${clientId}/credit`);
 } catch {
 const facilities: Record<string, import('../types').CreditFacility> = {
 'wc-1': { id: 'cf-1', clientId: 'wc-1', clientName: 'Corporate ABZ', depositAmount: 2000.000, creditLimit: 4000.000, creditUsed: 1200.000, creditAvailable: 2800.000, apr: 7.5, gracePeriodDays: 30, repaymentDueDate: new Date(Date.now() + 86400000 * 12).toISOString(), outstandingInterest: 7.50, autoRepayEnabled: true, autoRepayAccountId: 'ob-1', lastReviewedAt: new Date(Date.now() - 86400000 * 30).toISOString(), nextReviewAt: new Date(Date.now() + 86400000 * 60).toISOString(), currency: 'BHD' },
 'wc-2': { id: 'cf-2', clientId: 'wc-2', clientName: 'Gulf Holdings Ltd', depositAmount: 1000.000, creditLimit: 2000.000, creditUsed: 850.000, creditAvailable: 1150.000, apr: 8.5, gracePeriodDays: 30, autoRepayEnabled: false, lastReviewedAt: new Date(Date.now() - 86400000 * 15).toISOString(), nextReviewAt: new Date(Date.now() + 86400000 * 75).toISOString(), currency: 'BHD' },
 'wc-4': { id: 'cf-4', clientId: 'wc-4', clientName: 'Emirates Corp Partners', depositAmount: 500.000, creditLimit: 1000.000, creditUsed: 980.000, creditAvailable: 20.000, apr: 9.5, gracePeriodDays: 30, repaymentDueDate: new Date(Date.now() - 86400000 * 5).toISOString(), outstandingInterest: 38.23, autoRepayEnabled: false, lastReviewedAt: new Date(Date.now() - 86400000 * 60).toISOString(), nextReviewAt: new Date(Date.now() + 86400000 * 30).toISOString(), currency: 'BHD' },
 };
 return facilities[clientId] ?? null;
 }
 }

   public async processWalletTopUp(data: { amount: number; currency?: string; clientId?: string; method: WalletPaymentMethod; cashReceiptRef?: string }): Promise<{ success: boolean; transactionId: string; newBalance: number }> {
 try {
 return await this.post<{ success: boolean; transactionId: string; newBalance: number }>('/tenant/wallet/topup', data);
 } catch {
 return { success: true, transactionId: `TXN-W-${Date.now()}`, newBalance: data.amount + 1200 };
 }
 }

 public async getWalletTransactions(clientId?: string): Promise<import('../types').WalletTransaction[]> {
 try {
 const q = clientId ? `?clientId=${clientId}` : '';
 return await this.get<import('../types').WalletTransaction[]>(`/tenant/wallet/transactions${q}`);
 } catch {
 const now = Date.now();
 return [
 { id: 'wt-1', clientId: clientId ?? 'wc-1', clientName: 'Corporate ABZ', tenantId: 'saba', date: new Date(now - 86400000).toISOString(), description: 'OpenBanking top-up from AUB account', reference: 'TOP-W-88231', category: 'Top-Up', type: 'Credit', method: 'OpenBanking', amount: 3000.000, currency: 'BHD', runningBalance: 8450.750, status: 'Settled', openBankingRef: 'OB-AUB-20260411-001' },
 { id: 'wt-2', clientId: clientId ?? 'wc-1', clientName: 'Corporate ABZ', tenantId: 'saba', date: new Date(now - 172800000).toISOString(), description: 'Flight booking BAH-LHR-BAH (x4 pax)', reference: 'TA-482901', category: 'Service Payment', type: 'Debit', method: 'WalletBalance', amount: 1840.000, currency: 'BHD', runningBalance: 5450.750, status: 'Settled', bookingRef: 'TA-482901' },
 { id: 'wt-3', clientId: clientId ?? 'wc-1', clientName: 'Corporate ABZ', tenantId: 'saba', date: new Date(now - 259200000).toISOString(), description: 'Credit draw for hotel block booking', reference: 'CDR-W-00182', category: 'Credit Draw', type: 'Credit', method: 'WalletBalance', amount: 1200.000, currency: 'BHD', runningBalance: 7290.750, status: 'Settled' },
 { id: 'wt-4', clientId: clientId ?? 'wc-1', clientName: 'Corporate ABZ', tenantId: 'saba', date: new Date(now - 345600000).toISOString(), description: 'Monthly interest charge', reference: 'INT-W-00041', category: 'Interest Charge', type: 'Debit', method: 'WalletBalance', amount: 7.500, currency: 'BHD', runningBalance: 6090.750, status: 'Settled' },
 { id: 'wt-5', clientId: clientId ?? 'wc-1', clientName: 'Corporate ABZ', tenantId: 'saba', date: new Date(now - 432000000).toISOString(), description: 'Bulk payroll disbursement Q1', reference: 'BPY-W-00012', category: 'Bulk Payout', type: 'Debit', method: 'WalletBalance', amount: 4200.000, currency: 'BHD', runningBalance: 6098.250, status: 'Settled' },
 { id: 'wt-6', clientId: clientId ?? 'wc-1', clientName: 'Corporate ABZ', tenantId: 'saba', date: new Date(now - 518400000).toISOString(), description: 'Card top-up via Benefit gateway', reference: 'TOP-C-77102', category: 'Top-Up', type: 'Credit', method: 'Card', amount: 2000.000, currency: 'BHD', runningBalance: 10298.250, status: 'Settled' },
 { id: 'wt-7', clientId: clientId ?? 'wc-1', clientName: 'Corporate ABZ', tenantId: 'saba', date: new Date(now - 604800000).toISOString(), description: 'Hotel booking refund - Ritz Carlton', reference: 'REF-W-00331', category: 'Refund', type: 'Credit', method: 'WalletBalance', amount: 410.000, currency: 'BHD', runningBalance: 8298.250, status: 'Settled', bookingRef: 'TA-339102' },
 ];
 }
 }

 public async getCreditEligibility(clientId: string): Promise<import('../types').CreditEligibilityResult | null> {
 try {
 return await this.get<import('../types').CreditEligibilityResult>(`/tenant/wallet/clients/${clientId}/eligibility`);
 } catch {
 const results: Record<string, import('../types').CreditEligibilityResult> = {
 'wc-1': { clientId: 'wc-1', clientName: 'Corporate ABZ', eligible: true, recommendedLimit: 4000, recommendedApr: 7.5, maxRatio: 2.0, riskTier: 'Low', loyaltyScore: 94, scoringFactors: [ { factor: 'Transaction History', weight: 30, score: 95, impact: 'Positive', description: '312 settled transactions, avg 26/month' }, { factor: 'Loyalty Score', weight: 25, score: 94, impact: 'Positive', description: 'Elite tier client since Jan 2023' }, { factor: 'Payment Timeliness', weight: 25, score: 98, impact: 'Positive', description: '0 overdue payments in 36 months' }, { factor: 'Annual Spend Volume', weight: 15, score: 92, impact: 'Positive', description: 'BHD 98,400 annual spend' }, { factor: 'OpenBanking Data', weight: 5, score: 88, impact: 'Positive', description: '2 linked accounts, stable cash flow' } ], lastComputedAt: new Date(Date.now() - 86400000 * 3).toISOString(), reviewRequiredAt: new Date(Date.now() + 86400000 * 87).toISOString() },
 'wc-2': { clientId: 'wc-2', clientName: 'Gulf Holdings Ltd', eligible: true, recommendedLimit: 2000, recommendedApr: 8.5, maxRatio: 2.0, riskTier: 'Low', loyaltyScore: 82, scoringFactors: [ { factor: 'Transaction History', weight: 30, score: 84, impact: 'Positive', description: '187 settled transactions' }, { factor: 'Loyalty Score', weight: 25, score: 82, impact: 'Positive', description: 'Premium tier client since Apr 2023' }, { factor: 'Payment Timeliness', weight: 25, score: 90, impact: 'Positive', description: '1 late payment in 24 months' }, { factor: 'Annual Spend Volume', weight: 15, score: 78, impact: 'Positive', description: 'BHD 54,200 annual spend' }, { factor: 'OpenBanking Data', weight: 5, score: 60, impact: 'Neutral', description: '1 linked account' } ], lastComputedAt: new Date(Date.now() - 86400000 * 7).toISOString(), reviewRequiredAt: new Date(Date.now() + 86400000 * 83).toISOString() },
 'wc-3': { clientId: 'wc-3', clientName: 'Al Bahrain Travel Co.', eligible: false, recommendedLimit: 0, recommendedApr: 0, maxRatio: 1.5, riskTier: 'Medium', loyaltyScore: 71, scoringFactors: [ { factor: 'Transaction History', weight: 30, score: 70, impact: 'Neutral', description: '98 transactions, 8/month average' }, { factor: 'Loyalty Score', weight: 25, score: 71, impact: 'Neutral', description: 'Preferred tier — minimum 75 for credit' }, { factor: 'Payment Timeliness', weight: 25, score: 82, impact: 'Positive', description: '2 late payments in 18 months' }, { factor: 'Annual Spend Volume', weight: 15, score: 55, impact: 'Negative', description: 'Below BHD 30,000 threshold' }, { factor: 'OpenBanking Data', weight: 5, score: 40, impact: 'Negative', description: 'No bank account linked' } ], lastComputedAt: new Date(Date.now() - 86400000 * 1).toISOString(), reviewRequiredAt: new Date(Date.now() + 86400000 * 89).toISOString() },
 'wc-4': { clientId: 'wc-4', clientName: 'Emirates Corp Partners', eligible: false, recommendedLimit: 0, recommendedApr: 9.5, maxRatio: 1.0, riskTier: 'High', loyaltyScore: 58, scoringFactors: [ { factor: 'Transaction History', weight: 30, score: 55, impact: 'Neutral', description: '64 transactions, irregular pattern' }, { factor: 'Loyalty Score', weight: 25, score: 58, impact: 'Negative', description: 'Preferred but high utilization risk' }, { factor: 'Payment Timeliness', weight: 25, score: 40, impact: 'Negative', description: '5 overdue in 12 months — BLOCKED' }, { factor: 'Annual Spend Volume', weight: 15, score: 50, impact: 'Neutral', description: 'BHD 19,200 annual spend' }, { factor: 'OpenBanking Data', weight: 5, score: 0, impact: 'Negative', description: 'No linked bank accounts' } ], lastComputedAt: new Date(Date.now() - 86400000 * 2).toISOString(), reviewRequiredAt: new Date(Date.now() + 86400000 * 28).toISOString() },
 };
 return results[clientId] ?? null;
 }
 }

 public async adjustCreditLine(clientId: string, data: { creditLimit: number; apr: number; gracePeriodDays: number; autoRepayEnabled: boolean }): Promise<{ success: boolean }> {
 try {
 return await this.post<{ success: boolean }>(`/tenant/wallet/clients/${clientId}/credit`, data);
 } catch {
 return { success: true };
 }
 }

 public async processBulkPayout(data: Omit<import('../types').BulkPayout, 'id' | 'tenantId' | 'createdAt' | 'status'>): Promise<{ success: boolean; payoutId: string; processedAt: string }> {
 try {
 return await this.post<{ success: boolean; payoutId: string; processedAt: string }>('/tenant/wallet/bulk-payout', data);
 } catch {
 return { success: true, payoutId: `BPY-${Date.now()}`, processedAt: new Date().toISOString() };
 }
 }

 public async getBulkPayouts(): Promise<import('../types').BulkPayout[]> {
 try {
 return await this.get<import('../types').BulkPayout[]>('/tenant/wallet/bulk-payouts');
 } catch {
 return [
 { id: 'bp-1', tenantId: 'saba', clientId: 'wc-1', title: 'Q1 Supplier Settlement', type: 'Supplier Settlement', status: 'Completed', totalAmount: 12400.000, currency: 'BHD', lineItems: [ { id: 'li-1', payee: 'Sabre GDS', accountRef: 'ACC-SABRE-01', bank: 'AUB', amount: 7200.000, currency: 'BHD', reference: 'SAB-Q1-2026', status: 'Sent' }, { id: 'li-2', payee: 'Hotelbeds MENA', accountRef: 'ACC-HB-02', bank: 'BBK', amount: 5200.000, currency: 'BHD', reference: 'HB-Q1-2026', status: 'Sent' } ], isEscrow: false, createdAt: new Date(Date.now() - 86400000 * 7).toISOString(), processedAt: new Date(Date.now() - 86400000 * 6).toISOString(), createdBy: 'Ahmed Al-Zahrawi' },
 { id: 'bp-2', tenantId: 'saba', title: 'April Payroll Run', type: 'Payroll', status: 'Processing', totalAmount: 18650.000, currency: 'BHD', lineItems: [ { id: 'li-3', payee: 'Ali Hassan Mohammed', accountRef: 'IBAN-BH-001', bank: 'NBB', amount: 850.000, currency: 'BHD', reference: 'SAL-APR-001', status: 'Sent' }, { id: 'li-4', payee: 'Sara Khalid Yusuf', accountRef: 'IBAN-BH-002', bank: 'Ithmaar', amount: 720.000, currency: 'BHD', reference: 'SAL-APR-002', status: 'Queued' } ], isEscrow: false, createdAt: new Date(Date.now() - 86400000 * 1).toISOString(), createdBy: 'Admin' },
 ];
 }
 }

 public async getOpenBankingConsents(): Promise<import('../types').OpenBankingConsent[]> {
 try {
 return await this.get<import('../types').OpenBankingConsent[]>('/tenant/wallet/ob-consents');
 } catch {
 return [
 { id: 'ob-1', clientId: 'wc-1', clientName: 'Corporate ABZ', bankName: 'Ahli United Bank', bankCode: 'AUB', accountNickname: 'AUB Corporate Current', maskedAccountNo: '****4821', iban: 'BH29MOBL00001299***', currency: 'BHD', status: 'Active', permissions: ['ReadBalances', 'ReadTransactions', 'CreatePayments'], consentGrantedAt: new Date(Date.now() - 86400000 * 60).toISOString(), consentExpiresAt: new Date(Date.now() + 86400000 * 305).toISOString(), autoTopUpEnabled: true, autoTopUpThreshold: 1000, autoTopUpAmount: 3000, lastUsedAt: new Date(Date.now() - 86400000).toISOString() },
 { id: 'ob-2', clientId: 'wc-1', clientName: 'Corporate ABZ', bankName: 'Bank of Bahrain and Kuwait', bankCode: 'BBK', accountNickname: 'BBK Savings USD', maskedAccountNo: '****9034', currency: 'USD', status: 'Active', permissions: ['ReadBalances', 'ReadTransactions'], consentGrantedAt: new Date(Date.now() - 86400000 * 30).toISOString(), consentExpiresAt: new Date(Date.now() + 86400000 * 335).toISOString(), autoTopUpEnabled: false, lastUsedAt: new Date(Date.now() - 86400000 * 5).toISOString() },
 { id: 'ob-3', clientId: 'wc-2', clientName: 'Gulf Holdings Ltd', bankName: 'National Bank of Bahrain', bankCode: 'NBB', accountNickname: 'NBB Main Account', maskedAccountNo: '****2210', currency: 'BHD', status: 'Active', permissions: ['ReadBalances', 'ReadTransactions', 'CreatePayments'], consentGrantedAt: new Date(Date.now() - 86400000 * 45).toISOString(), consentExpiresAt: new Date(Date.now() + 86400000 * 320).toISOString(), autoTopUpEnabled: false, lastUsedAt: new Date(Date.now() - 86400000 * 3).toISOString() },
 { id: 'ob-4', clientId: 'wc-3', clientName: 'Al Bahrain Travel Co.', bankName: 'Ithmaar Bank', bankCode: 'ITH', accountNickname: 'Ithmaar Business', maskedAccountNo: '****7755', currency: 'BHD', status: 'Expired', permissions: ['ReadBalances'], consentGrantedAt: new Date(Date.now() - 86400000 * 400).toISOString(), consentExpiresAt: new Date(Date.now() - 86400000 * 35).toISOString(), autoTopUpEnabled: false },
 ];
 }
 }

 public async initOpenBankingLink(clientId: string, bankCode: string): Promise<{ success: boolean; consentUrl: string; consentId: string }> {
 try {
 return await this.post<{ success: boolean; consentUrl: string; consentId: string }>('/tenant/wallet/ob-link', { clientId, bankCode });
 } catch {
 return { success: true, consentUrl: `https://openbanking.${bankCode.toLowerCase()}.bh/consent?ref=${Date.now()}`, consentId: `ob-new-${Date.now()}` };
 }
 }

 public async revokeOpenBankingConsent(consentId: string): Promise<{ success: boolean }> {
 try {
 return await this.delete<{ success: boolean }>(`/tenant/wallet/ob-consents/${consentId}`);
 } catch {
 return { success: true };
 }
 }

 public async getWalletAnalytics(): Promise<import('../types').WalletAnalytics> {
 try {
 return await this.get<import('../types').WalletAnalytics>('/tenant/wallet/analytics');
 } catch {
 return {
 totalWalletVolume: 14196.500,
 totalCreditExtended: 7000.000,
 totalCreditUsed: 3030.000,
 avgUtilizationPct: 43.3,
 activeClients: 3,
 atRiskClients: 1,
 frozenClients: 0,
 monthlyVolume: [8200, 9400, 7800, 11200, 10500, 9800, 12400, 14100, 13200, 11800, 12900, 14196],
 topUpVolume: [3000, 5000, 2500, 6000, 4500, 3800, 7000, 8500, 6200, 5400, 7200, 9000],
 currency: 'BHD',
 lastUpdatedAt: new Date().toISOString()
 };
 }
 }

 // ============================================================
 // CLIENT MANAGEMENT v12 ENDPOINTS
 // ============================================================

 /**
 * List all client/traveller profiles with filtering and pagination
 */
 public async getClients(filters?: {
 query?: string;
 email?: string;
 mobile?: string;
 travellerType?: string;
 status?: string;
 nationality?: string;
 page?: number;
 limit?: number;
 }): Promise<{
 success: boolean;
 data: ClientProfile[];
 pagination: { page: number; limit: number; total: number; totalPages: number };
 }> {
 const params = new URLSearchParams();
 if (filters?.query) params.append('query', filters.query);
 if (filters?.email) params.append('email', filters.email);
 if (filters?.mobile) params.append('mobile', filters.mobile);
 if (filters?.travellerType) params.append('travellerType', filters.travellerType);
 if (filters?.status) params.append('status', filters.status);
 if (filters?.nationality) params.append('nationality', filters.nationality);
 if (filters?.page) params.append('page', String(filters.page));
 if (filters?.limit) params.append('limit', String(filters.limit));

 const queryString = params.toString();
 return this.get<any>(`/tenant/clients${queryString ? `?${queryString}` : ''}`);
 }

 /**
 * Search client profiles
 */
 public async searchClients(searchParams: {
 name?: string;
 email?: string;
 phone?: string;
 passportNumber?: string;
 nationality?: string;
 travellerType?: string;
 }): Promise<{ success: boolean; data: ClientSearchResult[] }> {
 const params = new URLSearchParams();
 if (searchParams.name) params.append('name', searchParams.name);
 if (searchParams.email) params.append('email', searchParams.email);
 if (searchParams.phone) params.append('phone', searchParams.phone);
 if (searchParams.passportNumber) params.append('passportNumber', searchParams.passportNumber);
 if (searchParams.nationality) params.append('nationality', searchParams.nationality);
 if (searchParams.travellerType) params.append('travellerType', searchParams.travellerType);

 return this.get<any>(`/tenant/clients/search?${params.toString()}`);
 }

 /**
 * Get a single client profile with all related data
 */
 public async getClient(id: string): Promise<{ success: boolean; data: ClientProfile }> {
 return this.get<any>(`/tenant/clients/${id}`);
 }

 /**
 * Create a new client profile
 */
 public async createClient(data: Partial<ClientProfile>): Promise<{ success: boolean; data: ClientProfile }> {
 return this.post<any>('/tenant/clients', data);
 }

 /**
 * Update a client profile
 */
 public async updateClient(id: string, data: Partial<ClientProfile>): Promise<{ success: boolean; data: ClientProfile }> {
 return this.put<any>(`/tenant/clients/${id}`, data);
 }

 /**
 * Deactivate a client profile (soft delete)
 */
 public async deactivateClient(id: string, reason?: string): Promise<unknown> {
 return this.post<any>(`/tenant/clients/${id}/deactivate`, { reason });
 }

 /**
 * Delete a client profile (hard delete - GDPR)
 */
 public async deleteClient(id: string, reason?: string): Promise<unknown> {
 return this.delete<any>(`/tenant/clients/${id}`, { data: { reason } });
 }

 /**
 * Get client passports
 */
 public async getClientPassports(clientId: string): Promise<{ success: boolean; data: ClientPassport[] }> {
 return this.get<any>(`/tenant/clients/${clientId}/passports`);
 }

 /**
 * Get client visas
 */
 public async getClientVisas(clientId: string): Promise<{ success: boolean; data: ClientVisa[] }> {
 return this.get<any>(`/tenant/clients/${clientId}/visas`);
 }

 /**
 * Get client dependents
 */
 public async getClientDependents(clientId: string): Promise<{ success: boolean; data: ClientDependent[] }> {
 return this.get<any>(`/tenant/clients/${clientId}/dependents`);
 }

 /**
 * Get client preferences
 */
 public async getClientPreferences(clientId: string): Promise<{ success: boolean; data: ClientPreferences }> {
 return this.get<any>(`/tenant/clients/${clientId}/preferences`);
 }

 /**
 * Get client documents
 */
 public async getClientDocuments(clientId: string, documentType?: string): Promise<{ success: boolean; data: ClientDocument[] }> {
 const params = documentType ? `?documentType=${documentType}` : '';
 return this.get<any>(`/tenant/clients/${clientId}/documents${params}`);
 }

 /**
 * Upload a document for a client
 */
 public async uploadClientDocument(clientId: string, document: {
 title: string;
 fileName: string;
 fileSize: number;
 fileType: string;
 fileUrl: string;
 documentType?: string;
 }): Promise<{ success: boolean; data: ClientDocument }> {
 return this.post<any>(`/tenant/clients/${clientId}/documents`, document);
 }

 /**
 * Delete a client document
 */
 public async deleteClientDocument(clientId: string, documentId: string): Promise<unknown> {
 return this.delete<any>(`/tenant/clients/${clientId}/documents/${documentId}`);
 }

 /**
 * Get client payment cards (masked by default)
 */
 public async getClientCards(clientId: string, showFullNumber: boolean = false): Promise<{ success: boolean; data: ClientPersonalCard[] }> {
 return this.get<any>(`/tenant/clients/${clientId}/cards?showFullNumber=${showFullNumber}`);
 }

 /**
 * Get client associations
 */
 public async getClientAssociations(clientId: string): Promise<{ success: boolean; data: ClientAssociation[] }> {
 return this.get<any>(`/tenant/clients/${clientId}/associations`);
 }

 /**
 * Associate client with another client
 */
 public async associateClient(clientId: string, data: {
 associatedClientId: string;
 associatedClientName: string;
 associationType?: string;
 }): Promise<{ success: boolean; data: ClientAssociation }> {
 return this.post<any>(`/tenant/clients/${clientId}/associations`, data);
 }

 /**
 * Update client's preferred language
 */
 public async updateClientLanguage(clientId: string, language: string): Promise<unknown> {
 return this.put<any>(`/tenant/clients/${clientId}/language`, { language });
 }

 /**
 * Get localized labels for UI
 */
 public async getLocalizedLabels(clientId: string, language: string): Promise<{ success: boolean; data: Record<string, string>; language: string }> {
 return this.get<any>(`/tenant/clients/${clientId}/localized-labels?language=${language}`);
 }

 /**
 * Update GDPR consent
 */
 public async updateGDPRConsent(clientId: string, consent: boolean): Promise<unknown> {
 return this.put<any>(`/tenant/clients/${clientId}/gdpr-consent`, { consent });
 }

 /**
 * Export all client data (GDPR right to access)
 */
 public async exportClientData(clientId: string): Promise<{ success: boolean; data: unknown }> {
 return this.get<any>(`/tenant/clients/${clientId}/export`);
 }

 /**
 * Check data retention compliance
 */
 public async checkDataRetention(): Promise<{ success: boolean; data: unknown[] }> {
 return this.get<any>('/tenant/clients/compliance/retention-check');
 }

 /**
 * Trigger synchronization to external systems
 */
 public async syncClient(clientId: string, target: 'CRM' | 'GDS' | 'LOYALTY' | 'ALL' = 'ALL'): Promise<unknown> {
 return this.post<any>(`/tenant/clients/${clientId}/sync`, { target });
 }

 /**
 * Get client sync status
 */
 public async getClientSyncStatus(clientId: string): Promise<{ success: boolean; data: unknown }> {
 return this.get<any>(`/tenant/clients/${clientId}/sync-status`);
 }

 /**
 * Get client alerts
 */
 public async getClientAlerts(clientId: string): Promise<{ success: boolean; data: CustomAlert[] }> {
 return this.get<any>(`/tenant/clients/${clientId}/alerts`);
 }

 /**
 * Create a custom alert for a client
 */
 public async createClientAlert(clientId: string, alert: {
 alertType: string;
 title: string;
 message: string;
 severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
 triggerDate: string;
 isRecurring?: boolean;
 recurrenceRule?: string;
 notificationChannels?: string[];
 metadata?: unknown;
 }): Promise<{ success: boolean; data: CustomAlert }> {
 return this.post<any>(`/tenant/clients/${clientId}/alerts`, alert);
 }

 /**
 * Dismiss an alert
 */
 public async dismissAlert(alertId: string): Promise<unknown> {
 return this.post<any>(`/tenant/alerts/${alertId}/dismiss`, {});
 }

 /**
 * Get alerts summary
 */
 public async getAlertsSummary(clientId?: string): Promise<{ success: boolean; data: { critical: number; high: number; medium: number; low: number; total: number } }> {
 const params = clientId ? `?client_id=${clientId}` : '';
 return this.get<any>(`/tenant/alerts/summary${params}`);
 }

 /**
 * Get client management summary report
 */
 public async getClientReportSummary(): Promise<{ success: boolean; data: {
 totalClients: number;
 activeClients: number;
 vipClients: number;
 cipClients: number;
 regularClients: number;
 expiringPassports: number;
 expiringVisas: number;
 alertsSummary: { critical: number; high: number; medium: number; low: number; total: number };
 } }> {
 return this.get<any>('/tenant/clients/reports/summary');
 }


 // ============================================================
 // SUB-AGENT MANAGEMENT ENDPOINTS (NEW)
 // ============================================================

 /**
 * Get tenant by ID
 */
 public async getTenantById(tenantId: string): Promise<{ success: boolean; data: unknown }> {
 return this.get<any>(`/admin/tenants/${tenantId}`);
 }

 /**
 * Update tenant configuration
 */
 public async updateTenant(tenantId: string, data: unknown): Promise<unknown> {
 return this.put<any>(`/admin/tenants/${tenantId}`, data);
 }

 /**
 * Suspend tenant
 */
 public async suspendTenant(tenantId: string, reason: string): Promise<unknown> {
 return this.post<any>(`/admin/tenants/${tenantId}/suspend`, { reason });
 }

 /**
 * Reactivate tenant
 */
 public async reactivateTenant(tenantId: string): Promise<unknown> {
 return this.post<any>(`/admin/tenants/${tenantId}/reactivate`, {});
 }

 /**
 * Get tenant analytics
 */
 public async getTenantAnalytics(tenantId: string): Promise<unknown> {
 return this.get<any>(`/admin/tenants/${tenantId}/analytics`);
 }

 /**
 * Update tenant product access
 */
 public async updateTenantProductAccess(tenantId: string, access: unknown): Promise<unknown> {
 return this.post<any>(`/admin/tenants/${tenantId}/sync-product-access`, { access });
 }

 /**
 * Update tenant permissions
 */
 public async updateTenantPermissions(tenantId: string, permissions: unknown): Promise<unknown> {
 return this.post<any>(`/admin/tenants/${tenantId}/sync-permissions`, { permissions });
 }

 /**
 * Update tenant credit limit
 */
 public async updateTenantCredit(tenantId: string, credit: unknown): Promise<unknown> {
 return this.post<any>(`/admin/tenants/${tenantId}/credit`, credit);
 }

 /**
 * Search tenants
 */
 public async searchTenants(query: string, type?: string): Promise<unknown> {
 const params = `?q=${encodeURIComponent(query)}${type ? `&type=${type}` : ''}`;
 return this.get<any>(`/admin/tenants/search${params}`);
 }

 /**
 * Get tenant sub-users
 */
 public async getTenantSubUsers(tenantId: string): Promise<unknown> {
 return this.get<any>(`/admin/tenants/${tenantId}/sub-users`);
 }

 /**
 * Bulk sync tenants
 */
 public async bulkSyncTenants(tenantIds: string[]): Promise<unknown> {
 return this.post<any>('/admin/tenants/bulk-sync', { tenantIds });
 }

 // ============================================================
 // DASHBOARD ENDPOINTS (NEW)
 // ============================================================

 /**
 * Get dashboard statistics
 */
 public async getDashboardStats(): Promise<{ success: boolean; data: {
 grossLedgerVolume: number;
 yieldReconciliation: number;
 outstandingTranches: number;
 totalBookings: number;
 activeClients: number;
 pendingBookings: number;
 issuedBookings: number;
 cancelledBookings: number;
 refundPending: number;
 currency: string;
 lastSync: string;
 } }> {
 return this.get<any>('/tenant/dashboard/stats');
 }

 /**
 * Get financial KPIs
 */
 public async getFinancialKPIs(): Promise<{ success: boolean; data: unknown }> {
 return this.get<any>('/tenant/dashboard/financial-kpis');
 }

 /**
 * Get volumetric data for charts
 */
 public async getVolumetricData(days?: number): Promise<{ success: boolean; data: unknown }> {
 return this.get<any>(`/tenant/dashboard/volumetric-data${days ? `?days=${days}` : ''}`);
 }

 /**
 * Get service dispersal breakdown
 */
 public async getServiceDispersal(): Promise<{ success: boolean; data: unknown }> {
 return this.get<any>('/tenant/dashboard/service-dispersal');
 }

 /**
 * Get throughput metrics
 */
 public async getThroughputMetrics(): Promise<{ success: boolean; data: unknown }> {
 return this.get<any>('/tenant/dashboard/throughput');
 }

 /**
 * Get recent bookings
 */
 public async getRecentBookings(limit?: number): Promise<{ success: boolean; data: unknown[] }> {
 return this.get<any>(`/tenant/dashboard/recent-bookings${limit ? `?limit=${limit}` : ''}`);
 }

 /**
 * Get top clients
 */
 public async getTopClients(limit?: number): Promise<{ success: boolean; data: unknown[] }> {
 return this.get<any>(`/tenant/dashboard/top-clients${limit ? `?limit=${limit}` : ''}`);
 }

 /**
 * Get dashboard alerts
 */
 public async getDashboardAlerts(): Promise<{ success: boolean; data: unknown[] }> {
 return this.get<any>('/tenant/dashboard/alerts');
 }

 /**
 * Get compliance status
 */
 public async getComplianceStatus(): Promise<{ success: boolean; data: unknown }> {
 return this.get<any>('/tenant/dashboard/compliance');
 }


 /**
 * Get wallet summary
 */
 public async getWalletSummary(): Promise<{ success: boolean; data: unknown }> {
 return this.get<any>('/tenant/dashboard/wallet-summary');
 }

 /**
 * Refresh dashboard cache
 */
 public async refreshDashboard(): Promise<unknown> {
 return this.post<any>('/tenant/dashboard/refresh', {});
 }

 /**
 * Get booking status breakdown for donut chart
 */
 public async getBookingStatusBreakdown(): Promise<{ success: boolean; data: unknown }> {
 return this.get<any>('/tenant/dashboard/booking-status-breakdown');
 }

 /**
 * Get revenue trend data for line chart
 */
 public async getRevenueTrend(days?: number): Promise<{ success: boolean; data: unknown }> {
 return this.get<any>(`/tenant/dashboard/revenue-trend${days ? `?days=${days}` : ''}`);
 }

 /**
 * Get payment collection status with aging
 */
 public async getPaymentCollectionStatus(): Promise<{ success: boolean; data: unknown }> {
 return this.get<any>('/tenant/dashboard/payment-collection');
 }

 /**
 * Get agent performance metrics
 */
 public async getAgentPerformance(): Promise<{ success: boolean; data: unknown[] }> {
 return this.get<any>('/tenant/dashboard/agent-performance');
 }

 /**
 * Get upcoming bookings for calendar widget
 */
 public async getUpcomingBookings(days?: number): Promise<{ success: boolean; data: unknown[] }> {
 return this.get<any>(`/tenant/dashboard/upcoming-bookings${days ? `?days=${days}` : ''}`);
 }

 // ============================================================
 // PNR IMPORT ENDPOINTS
 // ============================================================

  /**
   * Import PNR from CSV file
   */
  public async importPNR(file: File): Promise<unknown> {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.client.post('/tenant/pnr/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then(res => res.data);
  }

  /**
   * Retrieve PNR from GDS
   */
  public async retrievePNRFromGDS(provider: string, pnrNumber: string, lastName: string): Promise<{ success: boolean; message?: string; data?: any }> {
    return this.post<any>('/tenant/pnr/retrieve', {
      provider,
      pnrNumber,
      lastName
    });
  }

  /**
   * Import PNR to booking
   */
  public async importPNRToBooking(pnrNumber: string, provider: string): Promise<{ success: boolean; message?: string }> {
    return this.post<any>('/tenant/pnr/import-to-booking', {
      pnrNumber,
      provider
    });
  }

 /**
 * Get PNR import history
 */
 public async getPNRImportHistory(limit?: number): Promise<unknown> {
 return this.get<any>(`/tenant/pnr/history${limit ? `?limit=${limit}` : ''}`);
 }

 /**
 * Download PNR import template
 */
 public async downloadPNRTemplate(): Promise<void> {
 const response = await this.client.get('/tenant/pnr/template', { responseType: 'blob' });
 const url = window.URL.createObjectURL(new Blob([response.data]));
 const link = document.createElement('a');
 link.href = url;
 link.setAttribute('download', 'pnr_import_template.csv');
 document.body.appendChild(link);
 link.click();
 link.remove();
 }

 // ============================================================
 // CREDIT FACILITY ENDPOINTS
 // ============================================================

 /**
 * Get credit facility for client
 */
 public async getCreditFacility(clientId: string): Promise<unknown> {
 return this.get<any>(`/tenant/credit/${clientId}`);
 }

 /**
 * Apply for credit
 */
 public async applyForCredit(data: {
 clientId: string;
 requestedLimit: number;
 purpose: string;
 repaymentTerms: string;
 }): Promise<unknown> {
 return this.post<any>('/tenant/credit/apply', data);
 }

 /**
 * Approve credit application
 */
 public async approveCredit(data: {
 applicationId: string;
 approvedLimit: number;
 interestRate: number;
 approvalNotes?: string;
 }): Promise<unknown> {
 return this.post<any>('/tenant/credit/approve', data);
 }

 /**
 * Process payment settlement
 */
 public async processPaymentSettlement(data: {
 clientId: string;
 amount: number;
 paymentMethod: string;
 referenceNo?: string;
 }): Promise<unknown> {
 return this.post<any>('/tenant/credit/settlement', data);
 }

 /**
 * Get credit applications
 */
 public async getCreditApplications(status?: string): Promise<unknown> {
 return this.get<any>(`/tenant/credit/applications${status ? `?status=${status}` : ''}`);
 }

 /**
 * Get payment history for client
 */
 public async getPaymentHistory(clientId: string, limit?: number): Promise<unknown> {
 return this.get<any>(`/tenant/credit/${clientId}/payments${limit ? `?limit=${limit}` : ''}`);
 }

 /**
 * Get credit utilization alerts
 */
 public async getCreditAlerts(): Promise<unknown> {
 return this.get<any>('/tenant/credit/alerts');
 }

 // ============================================================
 // COMPANY PROFILE ENDPOINTS (Master Agency)
 // ============================================================

 /**
 * Get company profile
 */
 public async getCompanyProfile(companyId: string): Promise<unknown> {
 return this.get<any>(`/admin/companies/${companyId}`);
 }

 /**
 * Update company profile
 */
 public async updateCompanyProfile(companyId: string, data: unknown): Promise<unknown> {
 return this.put<any>(`/admin/companies/${companyId}`, data);
 }

 /**
 * Update company product access
 */
 public async updateCompanyProductAccess(companyId: string, access: unknown): Promise<unknown> {
 return this.put<any>(`/admin/companies/${companyId}/product-access`, { access });
 }

 /**
 * Update company permissions
 */
 public async updateCompanyPermissions(companyId: string, permissions: unknown): Promise<unknown> {
 return this.put<any>(`/admin/companies/${companyId}/permissions`, { permissions });
 }

 /**
 * Get company documents
 */
 public async getCompanyDocuments(companyId: string): Promise<unknown> {
 return this.get<any>(`/admin/companies/${companyId}/documents`);
 }

 /**
 * Upload company document
 */
 public async uploadCompanyDocument(companyId: string, data: unknown): Promise<unknown> {
 return this.post<any>(`/admin/companies/${companyId}/documents`, data);
 }

 /**
 * Get company analytics
 */
 public async getCompanyAnalytics(companyId: string): Promise<unknown> {
 return this.get<any>(`/admin/companies/${companyId}/analytics`);
 }

 // ============================================================
 // ROLE & PERMISSION ENDPOINTS
 // ============================================================

 /**
 * Get all roles
 */
 public async getRoles(): Promise<unknown> {
 return this.get<any>('/admin/roles');
 }

 /**
 * Get role by ID
 */
 public async getRoleById(roleId: string): Promise<unknown> {
 return this.get<any>(`/admin/roles/${roleId}`);
 }

 /**
 * Create role
 */
 public async createRole(data: {
 name: string;
 description?: string;
 permissions: Record<string, boolean>;
 }): Promise<unknown> {
 return this.post<any>('/admin/roles', data);
 }

 /**
 * Update role
 */
 public async updateRole(roleId: string, data: unknown): Promise<unknown> {
 return this.put<any>(`/admin/roles/${roleId}`, data);
 }

 /**
 * Delete role
 */
 public async deleteRole(roleId: string): Promise<unknown> {
 return this.delete<any>(`/admin/roles/${roleId}`);
 }

 /**
 * Assign role to user
 */
 public async assignRoleToUser(roleId: string, userId: string): Promise<unknown> {
 return this.post<any>(`/admin/roles/${roleId}/assign`, { userId });
 }

 /**
 * Get role permissions report
 */
 public async getRolePermissions(roleId: string): Promise<unknown> {
 return this.get<any>(`/admin/roles/${roleId}/permissions`);
 }

 /**
 * Get permission template
 */
 public async getPermissionTemplate(): Promise<unknown> {
 return this.get<any>('/admin/permissions/template');
 }

 /**
 * Check user permission
 */
 public async checkPermission(userId: string, roleId: string, permission: string): Promise<unknown> {
 return this.post<any>('/admin/permissions/check', { userId, roleId, permission });
 }

 /**
 * Get pending payments queue
 */
 public async getPendingPaymentsQueue(filters?: Record<string, unknown>): Promise<any[]> {
 return this.get<any[]>('/payments/queue/pending', { params: filters });
 }

 /**
 * Get part-payment queue
 */
 public async getPartPaymentQueue(filters?: Record<string, unknown>): Promise<any[]> {
 return this.get<any[]>('/payments/queue/part', { params: filters });
 }

 /**
 * Get refund due queue
 */
 public async getRefundDueQueue(filters?: Record<string, unknown>): Promise<any[]> {
 return this.get<any[]>('/payments/queue/refund', { params: filters });
 }

 /**
 * Process a refund payment
 */
 public async processRefundPayment(bookingId: string, amount: number, paymentMethod: string): Promise<unknown> {
 return this.post<any>('/payments/refund', { bookingId, amount, paymentMethod });
 }

 /**
 * Receive a payment
 */
 public async receivePayment(bookingId: string, amount: number, paymentMethod: string, receiptNo?: string): Promise<unknown> {
 return this.post<any>('/payments/receive', { bookingId, amount, paymentMethod, receiptNo });
 }

 /**
 * Get unconfirmed bookings
 */
 public async getUnconfirmedBookings(productType?: string): Promise<any[]> {
 const params = productType ? { productType } : undefined;
 return this.get<any[]>('/bookings/unconfirmed', { params });
 }

 /**
 * Get service requests
 */
 public async getServiceRequests(type?: string, status?: string, bookingId?: string): Promise<any[]> {
 const params: Record<string, string> = {};
 if (type) params.type = type;
 if (status) params.status = status;
 if (bookingId) params.bookingId = bookingId;
 return this.get<any[]>('/service-requests', { params: Object.keys(params).length > 0 ? params : undefined });
 }

 /**
 * Process a service request
 */
 public async processServiceRequest(serviceRequestId: string, action: string, remarks?: string): Promise<unknown> {
 return this.post<any>(`/service-requests/${serviceRequestId}/process`, { action, remarks });
 }

 /**
 * Get cancel and reschedule requests
 */
 public async getCancelAndRescheduleRequests(filters?: Record<string, unknown>): Promise<any[]> {
 return this.get<any[]>('/service-requests/cancel-reschedule', { params: filters });
 }
}


export const apiManager = ApiManager.getInstance();
