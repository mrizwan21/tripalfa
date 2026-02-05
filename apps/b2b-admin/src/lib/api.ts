import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import {
  Booking,
  Customer,
  Supplier,
  User,
  BookingSearchResult,
  CustomerSearchResult,
  SupplierSearchResult,
  AgentSearchResult,
  SystemHealth,
  BookingFormData,
  CustomerFormData,
  SupplierFormData
} from '../types';

class ApiClient {
  private client: AxiosInstance;
  private baseURL: string;

  constructor() {
    // Route through Kong API Gateway (WickedHauffe)
    // In development: Kong gateway at localhost:8000
    // Kong routes to internal services: /booking, /inventory, /users, /payments, /analytics, /metrics
    const useGateway = import.meta.env.VITE_USE_API_GATEWAY !== 'false';
    this.baseURL = useGateway ? 'http://localhost:8000' : '/api';

    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        // Kong key-auth header when using Wicked/Kong
        ...(import.meta.env.VITE_API_KEY ? { 'X-ApiKey': String(import.meta.env.VITE_API_KEY) } : {}),
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        // If an API key is provided at runtime (e.g., injected into localStorage), ensure it's sent
        const apiKey = (import.meta.env.VITE_API_KEY as string) || (typeof window !== 'undefined' ? localStorage.getItem('X-ApiKey') : null);
        if (apiKey && config.headers) {
          config.headers['X-ApiKey'] = apiKey;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle errors
    this.client.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error) => {
        if (error.response?.status === 401) {
          this.handleAuthError();
        }
        return Promise.reject(this.handleError(error));
      }
    );
  }

  private getAuthToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  private handleAuthError() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }

  private handleError(error: any) {
    if (error.response) {
      // Server responded with error status
      return new Error(error.response.data?.message || 'Server error');
    } else if (error.request) {
      // Network error
      return new Error('Network error. Please check your connection.');
    } else {
      // Other error
      return new Error(error.message || 'An unexpected error occurred');
    }
  }

  // Booking Management API
  async searchBookings(params: any): Promise<BookingSearchResult> {
    const response = await this.client.get('/admin/search', { params });
    return response.data;
  }

  async createBooking(bookingData: BookingFormData): Promise<Booking> {
    const response = await this.client.post('/admin/book', bookingData);
    return response.data.data;
  }

  async updateBooking(bookingId: string, updates: Partial<Booking>): Promise<Booking> {
    const response = await this.client.put(`/admin/bookings/${bookingId}`, updates);
    return response.data.data;
  }

  async assignAgent(bookingId: string, agentId: string): Promise<any> {
    const response = await this.client.post(`/admin/workflow/${bookingId}/assign`, { agentId });
    return response.data.data;
  }

  async updatePriority(bookingId: string, priority: 'low' | 'medium' | 'high' | 'urgent'): Promise<any> {
    const response = await this.client.post(`/admin/workflow/${bookingId}/priority`, { priority });
    return response.data.data;
  }

  async getBookingsByQueue(queueType: string, params: any): Promise<BookingSearchResult> {
    const response = await this.client.get(`/admin/queues/${queueType}`, { params });
    return response.data;
  }

  async holdInventory(holdData: any): Promise<any> {
    const response = await this.client.post('/admin/hold', holdData);
    return response.data.data;
  }

  async confirmBooking(bookingId: string, confirmationData: any): Promise<any> {
    const response = await this.client.post(`/admin/confirm/${bookingId}`, confirmationData);
    return response.data.data;
  }

  async issueTicket(bookingId: string, ticketData: any): Promise<any> {
    const response = await this.client.post(`/admin/issue-ticket/${bookingId}`, ticketData);
    return response.data.data;
  }

  async updateWorkflowStatus(bookingId: string, statusData: any): Promise<any> {
    const response = await this.client.post(`/admin/workflow/${bookingId}/status`, statusData);
    return response.data.data;
  }

  async getBookingStatistics(dateRange: any): Promise<any> {
    const response = await this.client.get('/admin/reports/bookings', { params: dateRange });
    return response.data.data;
  }

  // Customer Management API
  async searchCustomers(params: any): Promise<CustomerSearchResult> {
    const response = await this.client.get('/admin/customers', { params });
    return response.data;
  }

  async createCustomer(customerData: CustomerFormData): Promise<Customer> {
    const response = await this.client.post('/admin/customers', customerData);
    return response.data.data;
  }

  async updateCustomer(customerId: string, updates: Partial<Customer>): Promise<Customer> {
    const response = await this.client.put(`/admin/customers/${customerId}`, updates);
    return response.data.data;
  }

  async getCustomerById(customerId: string): Promise<Customer> {
    const response = await this.client.get(`/admin/customers/${customerId}`);
    return response.data.data;
  }

  // Supplier Management API
  async searchSuppliers(params: any): Promise<SupplierSearchResult> {
    const response = await this.client.get('/admin/suppliers', { params });
    return response.data;
  }

  async createSupplier(supplierData: SupplierFormData): Promise<Supplier> {
    const response = await this.client.post('/admin/suppliers', supplierData);
    return response.data.data;
  }

  async updateSupplier(supplierId: string, updates: Partial<Supplier>): Promise<Supplier> {
    const response = await this.client.put(`/admin/suppliers/${supplierId}`, updates);
    return response.data.data;
  }

  async getSupplierById(supplierId: string): Promise<Supplier> {
    const response = await this.client.get(`/admin/suppliers/${supplierId}`);
    return response.data.data;
  }

  // Agent Management API
  async getAgents(params?: any): Promise<AgentSearchResult> {
    const response = await this.client.get('/admin/agents', { params });
    return response.data;
  }

  async getAgentById(agentId: string): Promise<User> {
    const response = await this.client.get(`/admin/agents/${agentId}`);
    return response.data.data;
  }

  // Permission Management API
  async getPermissions(): Promise<any> {
    const response = await this.client.get('/admin/permissions');
    return response.data.data;
  }

  async assignPermissions(userId: string, permissions: string[]): Promise<any> {
    const response = await this.client.post('/admin/permissions', { userId, permissions });
    return response.data.data;
  }

  async getRoles(): Promise<any> {
    const response = await this.client.get('/admin/roles');
    return response.data.data;
  }

  async createRole(roleData: any): Promise<any> {
    const response = await this.client.post('/admin/roles', roleData);
    return response.data.data;
  }

  async updateRole(roleId: string, updates: any): Promise<any> {
    const response = await this.client.put(`/admin/roles/${roleId}`, updates);
    return response.data.data;
  }

  async deleteRole(roleId: string): Promise<any> {
    const response = await this.client.delete(`/admin/roles/${roleId}`);
    return response.data.data;
  }

  async getUserRoles(userId: string): Promise<any> {
    const response = await this.client.get(`/admin/users/${userId}/roles`);
    return response.data.data;
  }

  async assignUserRole(userId: string, roleId: string): Promise<any> {
    const response = await this.client.post(`/admin/users/${userId}/roles`, { roleId });
    return response.data.data;
  }

  async removeUserRole(userId: string, roleId: string): Promise<any> {
    const response = await this.client.delete(`/admin/users/${userId}/roles/${roleId}`);
    return response.data.data;
  }

  // System Management API
  async getSystemHealth(): Promise<SystemHealth> {
    const response = await this.client.get('/admin/health');
    return response.data.data;
  }

  async getAuditLogs(params?: any): Promise<any> {
    const response = await this.client.get('/admin/audit', { params });
    return response.data;
  }

  async getComplianceReports(params?: any): Promise<any> {
    const response = await this.client.get('/admin/compliance', { params });
    return response.data;
  }

  // Static Data API (Direct to API Gateway)
  async getStaticData(type: 'airports' | 'airlines' | 'currencies' | 'loyalty-programs', params?: any): Promise<any[]> {
    // Gateway runs on port 3000, but client is configured for 8000 or /api
    // We'll use a direct full URL override for these specific calls if needed,
    // or rely on the gateway routing if it was set up (it's not yet).
    // For now, we'll direct call the static gateway port 3000 for these resources.
    const GATEWAY_URL = 'http://localhost:3000';
    const response = await axios.get(`${GATEWAY_URL}/${type}`, { params });
    return response.data;
  }

  // Authentication API
  async login(credentials: { email: string; password: string }): Promise<any> {
    const response = await this.client.post('/auth/login', credentials);
    const { token, user } = response.data.data;

    localStorage.setItem('auth_token', token);
    localStorage.setItem('user', JSON.stringify(user));

    return { token, user };
  }

  async logout(): Promise<void> {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
  }

  async refreshToken(): Promise<any> {
    const response = await this.client.post('/auth/refresh');
    const { token } = response.data.data;

    localStorage.setItem('auth_token', token);
    return response.data.data;
  }

  async changePassword(data: { currentPassword: string; newPassword: string }): Promise<any> {
    const response = await this.client.post('/auth/change-password', data);
    return response.data.data;
  }

  // Utility methods
  async uploadFile(file: File, type: 'document' | 'image'): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    const response = await this.client.post('/admin/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.data;
  }

  async downloadFile(fileId: string): Promise<Blob> {
    const response = await this.client.get(`/admin/files/${fileId}`, {
      responseType: 'blob',
    });
    return response.data;
  }

  // Health check
  async ping(): Promise<boolean> {
    try {
      await this.client.get('/health');
      return true;
    } catch (error) {
      return false;
    }
  }
}

export const apiClient = new ApiClient();
export const bookingApi = {
  searchBookings: apiClient.searchBookings.bind(apiClient),
  createBooking: apiClient.createBooking.bind(apiClient),
  updateBooking: apiClient.updateBooking.bind(apiClient),
  assignAgent: apiClient.assignAgent.bind(apiClient),
  updatePriority: apiClient.updatePriority.bind(apiClient),
  getBookingsByQueue: apiClient.getBookingsByQueue.bind(apiClient),
  holdInventory: apiClient.holdInventory.bind(apiClient),
  confirmBooking: apiClient.confirmBooking.bind(apiClient),
  issueTicket: apiClient.issueTicket.bind(apiClient),
  updateWorkflowStatus: apiClient.updateWorkflowStatus.bind(apiClient),
  getBookingStatistics: apiClient.getBookingStatistics.bind(apiClient),
};

export const customerApi = {
  searchCustomers: apiClient.searchCustomers.bind(apiClient),
  createCustomer: apiClient.createCustomer.bind(apiClient),
  updateCustomer: apiClient.updateCustomer.bind(apiClient),
  getCustomerById: apiClient.getCustomerById.bind(apiClient),
};

export const supplierApi = {
  searchSuppliers: apiClient.searchSuppliers.bind(apiClient),
  createSupplier: apiClient.createSupplier.bind(apiClient),
  updateSupplier: apiClient.updateSupplier.bind(apiClient),
  getSupplierById: apiClient.getSupplierById.bind(apiClient),
};

export const agentApi = {
  getAgents: apiClient.getAgents.bind(apiClient),
  getAgentById: apiClient.getAgentById.bind(apiClient),
};

export const permissionApi = {
  getPermissions: apiClient.getPermissions.bind(apiClient),
  assignPermissions: apiClient.assignPermissions.bind(apiClient),
  getRoles: apiClient.getRoles.bind(apiClient),
  createRole: apiClient.createRole.bind(apiClient),
  updateRole: apiClient.updateRole.bind(apiClient),
  deleteRole: apiClient.deleteRole.bind(apiClient),
  getUserRoles: apiClient.getUserRoles.bind(apiClient),
  assignUserRole: apiClient.assignUserRole.bind(apiClient),
  removeUserRole: apiClient.removeUserRole.bind(apiClient),
};

export const systemApi = {
  getSystemHealth: apiClient.getSystemHealth.bind(apiClient),
  getAuditLogs: apiClient.getAuditLogs.bind(apiClient),
  getComplianceReports: apiClient.getComplianceReports.bind(apiClient),
};

export const authApi = {
  login: apiClient.login.bind(apiClient),
  logout: apiClient.logout.bind(apiClient),
  refreshToken: apiClient.refreshToken.bind(apiClient),
  changePassword: apiClient.changePassword.bind(apiClient),
};

export const fileApi = {
  uploadFile: apiClient.uploadFile.bind(apiClient),
  downloadFile: apiClient.downloadFile.bind(apiClient),
};

export default apiClient;