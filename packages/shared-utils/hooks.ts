// Super Admin Panel - React Query Hooks
import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from 'react-query';
import { api, queryKeys } from './api';
import { API_ENDPOINTS } from './constants';
import { buildQueryString } from './utils';
import type {
  Company,
  CompanyCreate,
  CompanyUpdate,
  User,
  UserCreate,
  UserUpdate,
  Role,
  RoleCreate,
  RoleUpdate,
  Booking,
  Supplier,
  SupplierCreate,
  SupplierUpdate,
  Wallet,
  Transaction,
  Invoice,
  DashboardStats,
  PaginatedResponse,
  PaginationParams,
} from './types';

// ============================================================================
// Generic List Hook
// ============================================================================

interface UseListOptions<T> extends Omit<UseQueryOptions<PaginatedResponse<T>>, 'queryKey' | 'queryFn'> {
  params?: PaginationParams & Record<string, unknown>;
}

function useList<T>(
  endpoint: string,
  queryKey: readonly unknown[],
  options?: UseListOptions<T>
) {
  const { params, ...queryOptions } = options || {};
  const queryString = params ? `?${buildQueryString(params)}` : '';

  return useQuery<PaginatedResponse<T>>({
    queryKey: [...queryKey, params],
    queryFn: () => api.get<PaginatedResponse<T>>(`${endpoint}${queryString}`),
    ...queryOptions,
  });
}

// ============================================================================
// Auth Hooks
// ============================================================================

export function useCurrentUser() {
  return useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: () => api.get<User>(API_ENDPOINTS.auth.me),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: { email: string; password: string }) =>
      api.post<{ accessToken: string; refreshToken: string; user: User }>(
        API_ENDPOINTS.auth.login,
        credentials
      ),
    onSuccess: (data) => {
      api.setAccessToken(data.accessToken);
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      queryClient.setQueryData(queryKeys.auth.me, data.user);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.post(API_ENDPOINTS.auth.logout),
    onSuccess: () => {
      api.setAccessToken(null);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      queryClient.clear();
    },
  });
}

// ============================================================================
// Company Hooks
// ============================================================================

export function useCompanies(params?: PaginationParams & Record<string, unknown>) {
  return useList<Company>(API_ENDPOINTS.companies, queryKeys.companies.list(params), { params });
}

export function useCompany(id: string) {
  return useQuery({
    queryKey: queryKeys.companies.detail(id),
    queryFn: () => api.get<Company>(`${API_ENDPOINTS.companies}/${id}`),
    enabled: !!id,
  });
}

export function useCreateCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CompanyCreate) => api.post<Company>(API_ENDPOINTS.companies, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.companies.all });
    },
  });
}

export function useUpdateCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CompanyUpdate }) =>
      api.patch<Company>(`${API_ENDPOINTS.companies}/${id}`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.companies.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.companies.all });
    },
  });
}

export function useDeleteCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete(`${API_ENDPOINTS.companies}/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.companies.all });
    },
  });
}

// ============================================================================
// User Hooks
// ============================================================================

export function useUsers(params?: PaginationParams & Record<string, unknown>) {
  return useList<User>(API_ENDPOINTS.users, queryKeys.users.list(params), { params });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: queryKeys.users.detail(id),
    queryFn: () => api.get<User>(`${API_ENDPOINTS.users}/${id}`),
    enabled: !!id,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UserCreate) => api.post<User>(API_ENDPOINTS.users, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UserUpdate }) =>
      api.patch<User>(`${API_ENDPOINTS.users}/${id}`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete(`${API_ENDPOINTS.users}/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
  });
}

// ============================================================================
// Role Hooks
// ============================================================================

export function useRoles(params?: PaginationParams & Record<string, unknown>) {
  return useList<Role>(API_ENDPOINTS.roles, queryKeys.roles.list(params), { params });
}

export function useRole(id: string) {
  return useQuery({
    queryKey: queryKeys.roles.detail(id),
    queryFn: () => api.get<Role>(`${API_ENDPOINTS.roles}/${id}`),
    enabled: !!id,
  });
}

export function usePermissions() {
  return useQuery({
    queryKey: queryKeys.roles.permissions,
    queryFn: () => api.get<{ permissions: Record<string, string[]> }>(API_ENDPOINTS.permissions),
    staleTime: Infinity,
  });
}

export function useCreateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RoleCreate) => api.post<Role>(API_ENDPOINTS.roles, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.roles.all });
    },
  });
}

export function useUpdateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: RoleUpdate }) =>
      api.patch<Role>(`${API_ENDPOINTS.roles}/${id}`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.roles.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.roles.all });
    },
  });
}

// ============================================================================
// Booking Hooks
// ============================================================================

export function useBookings(params?: PaginationParams & Record<string, unknown>) {
  return useList<Booking>(API_ENDPOINTS.bookings, queryKeys.bookings.list(params), { params });
}

export function useBooking(id: string) {
  return useQuery({
    queryKey: queryKeys.bookings.detail(id),
    queryFn: () => api.get<Booking>(`${API_ENDPOINTS.bookings}/${id}`),
    enabled: !!id,
  });
}

export function useBookingQueue(params?: PaginationParams & Record<string, unknown>) {
  return useList<Booking>(API_ENDPOINTS.bookingQueue, queryKeys.bookings.queue(params), { params });
}

export function useUpdateBookingStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status, remarks }: { id: string; status: string; remarks?: string }) =>
      api.patch<Booking>(`${API_ENDPOINTS.bookings}/${id}/status`, { status, remarks }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all });
    },
  });
}

// ============================================================================
// Supplier Hooks
// ============================================================================

export function useSuppliers(params?: PaginationParams & Record<string, unknown>) {
  return useList<Supplier>(API_ENDPOINTS.suppliers, queryKeys.suppliers.list(params), { params });
}

export function useSupplier(id: string) {
  return useQuery({
    queryKey: queryKeys.suppliers.detail(id),
    queryFn: () => api.get<Supplier>(`${API_ENDPOINTS.suppliers}/${id}`),
    enabled: !!id,
  });
}

export function useCreateSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SupplierCreate) => api.post<Supplier>(API_ENDPOINTS.suppliers, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.suppliers.all });
    },
  });
}

export function useUpdateSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: SupplierUpdate }) =>
      api.patch<Supplier>(`${API_ENDPOINTS.suppliers}/${id}`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.suppliers.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.suppliers.all });
    },
  });
}

// ============================================================================
// Finance Hooks
// ============================================================================

export function useWallets(params?: PaginationParams & Record<string, unknown>) {
  return useList<Wallet>(API_ENDPOINTS.wallets, queryKeys.finance.wallets(params), { params });
}

export function useWallet(id: string) {
  return useQuery({
    queryKey: queryKeys.finance.wallet(id),
    queryFn: () => api.get<Wallet>(`${API_ENDPOINTS.wallets}/${id}`),
    enabled: !!id,
  });
}

export function useTransactions(params?: PaginationParams & Record<string, unknown>) {
  return useList<Transaction>(API_ENDPOINTS.transactions, queryKeys.finance.transactions(params), { params });
}

export function useInvoices(params?: PaginationParams & Record<string, unknown>) {
  return useList<Invoice>(API_ENDPOINTS.invoices, queryKeys.finance.invoices(params), { params });
}

// ============================================================================
// Dashboard Hooks
// ============================================================================

export function useDashboardStats() {
  return useQuery({
    queryKey: queryKeys.dashboard.stats,
    queryFn: () => api.get<DashboardStats>('/dashboard/stats'),
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useRevenueChart(period: 'week' | 'month' | 'quarter' | 'year' = 'month') {
  return useQuery({
    queryKey: queryKeys.dashboard.revenue(period),
    queryFn: () => api.get<{ data: { date: string; revenue: number; bookings: number }[] }>(
      `/dashboard/revenue?period=${period}`
    ),
  });
}

export function useRecentActivity() {
  return useQuery({
    queryKey: queryKeys.dashboard.activity,
    queryFn: () => api.get<{ activities: unknown[] }>('/dashboard/activity'),
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  });
}

// ============================================================================
// Reference Data Hooks
// ============================================================================

export function useAirlines() {
  return useQuery({
    queryKey: queryKeys.reference.airlines,
    queryFn: () => api.get<{ airlines: { code: string; name: string }[] }>(API_ENDPOINTS.airlines),
    staleTime: Infinity,
  });
}

export function useAirports(search?: string) {
  return useQuery({
    queryKey: [...queryKeys.reference.airports, search],
    queryFn: () => api.get<{ airports: { code: string; name: string; city: string }[] }>(
      `${API_ENDPOINTS.airports}${search ? `?search=${search}` : ''}`
    ),
    enabled: !search || search.length >= 2,
    staleTime: search ? 5 * 60 * 1000 : Infinity,
  });
}

export function useCurrencies() {
  return useQuery({
    queryKey: queryKeys.reference.currencies,
    queryFn: () => api.get<{ currencies: { code: string; name: string; symbol: string }[] }>(
      API_ENDPOINTS.admin.currencies
    ),
    staleTime: Infinity,
  });
}

// ============================================================================
// Audit Log Hooks
// ============================================================================

export function useAuditLogs(params?: PaginationParams & Record<string, unknown>) {
  return useList<unknown>(API_ENDPOINTS.auditLogs.list, queryKeys.audit.logs(params), { params });
}
