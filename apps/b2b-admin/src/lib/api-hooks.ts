import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// Base API configuration
const API_BASE = '/api';

// Generic API error handler
const handleApiError = (error: any) => {
  console.error('API Error:', error);
  toast.error(error.message || 'An error occurred');
  throw error;
};

// Generic API fetch function with error handling
const apiFetch = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

// Company API Hooks
export const useCompanies = () => {
  return useQuery({
    queryKey: ['companies'],
    queryFn: () => apiFetch<Company[]>('/admin/companies'),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    retry: 1,
  });
};

export const useCompany = (id: string) => {
  return useQuery({
    queryKey: ['company', id],
    queryFn: () => apiFetch<Company>(`/admin/companies/${id}`),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateCompany = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (company: CreateCompanyRequest) =>
      apiFetch<Company>('/admin/companies', {
        method: 'POST',
        body: JSON.stringify(company),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast.success('Company created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create company');
    },
  });
};

export const useUpdateCompany = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateCompanyRequest }) =>
      apiFetch<Company>(`/admin/companies/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['company'] });
      toast.success('Company updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update company');
    },
  });
};

export const useDeleteCompany = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/admin/companies/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast.success('Company deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete company');
    },
  });
};

// Branch API Hooks
export const useBranches = (companyId?: string) => {
  return useQuery({
    queryKey: ['branches', companyId],
    queryFn: () => {
      const endpoint = companyId ? `/branches?companyId=${companyId}` : '/branches';
      return apiFetch<Branch[]>(endpoint);
    },
    enabled: !!companyId || true,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateBranch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (branch: CreateBranchRequest) =>
      apiFetch<Branch>('/branches', {
        method: 'POST',
        body: JSON.stringify(branch),
      }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      if (variables.companyId) {
        queryClient.invalidateQueries({ queryKey: ['branches', variables.companyId] });
      }
      toast.success('Branch created successfully');
    },
  });
};

// Department API Hooks
export const useDepartments = (companyId?: string) => {
  return useQuery({
    queryKey: ['departments', companyId],
    queryFn: () => {
      const endpoint = companyId ? `/departments?companyId=${companyId}` : '/departments';
      return apiFetch<Department[]>(endpoint);
    },
    enabled: !!companyId || true,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateDepartment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (department: CreateDepartmentRequest) =>
      apiFetch<Department>('/departments', {
        method: 'POST',
        body: JSON.stringify(department),
      }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      if (variables.companyId) {
        queryClient.invalidateQueries({ queryKey: ['departments', variables.companyId] });
      }
      toast.success('Department created successfully');
    },
  });
};

// Designation API Hooks
export const useDesignations = (companyId?: string) => {
  return useQuery({
    queryKey: ['designations', companyId],
    queryFn: () => {
      const endpoint = companyId ? `/designations?companyId=${companyId}` : '/designations';
      return apiFetch<Designation[]>(endpoint);
    },
    enabled: !!companyId || true,
    staleTime: 5 * 60 * 1000,
  });
};

// Cost Center API Hooks
export const useCostCenters = (companyId?: string) => {
  return useQuery({
    queryKey: ['cost-centers', companyId],
    queryFn: () => {
      const endpoint = companyId ? `/cost-centers?companyId=${companyId}` : '/cost-centers';
      return apiFetch<CostCenter[]>(endpoint);
    },
    enabled: !!companyId || true,
    staleTime: 5 * 60 * 1000,
  });
};

// Wallet API Hooks
export const useWalletAccounts = (companyId?: string) => {
  return useQuery({
    queryKey: ['wallet-accounts', companyId],
    queryFn: () => {
      // This would typically go to the wallet service
      // For now, using mock data
      return Promise.resolve([] as WalletAccount[]);
    },
    enabled: !!companyId,
  });
};

export const useWalletTransactions = (accountId?: string) => {
  return useQuery({
    queryKey: ['wallet-transactions', accountId],
    queryFn: () => {
      // This would typically go to the wallet service
      // For now, using mock data
      return Promise.resolve([] as WalletTransaction[]);
    },
    enabled: !!accountId,
  });
};

// Finance API Hooks
export const useBankAccounts = (companyId?: string) => {
  return useQuery({
    queryKey: ['bank-accounts', companyId],
    queryFn: () => {
      // This would typically go to the finance service
      // For now, using mock data
      return Promise.resolve([] as BankAccount[]);
    },
    enabled: !!companyId,
  });
};

export const usePaymentGateways = (companyId?: string) => {
  return useQuery({
    queryKey: ['payment-gateways', companyId],
    queryFn: () => {
      // This would typically go to the finance service
      // For now, using mock data
      return Promise.resolve([] as PaymentGateway[]);
    },
    enabled: !!companyId,
  });
};

export const useVirtualCards = (companyId?: string) => {
  return useQuery({
    queryKey: ['virtual-cards', companyId],
    queryFn: () => {
      // This would typically go to the finance service
      // For now, using mock data
      return Promise.resolve([] as VirtualCreditCard[]);
    },
    enabled: !!companyId,
  });
};

// Booking API Hooks
export const useBookings = () => {
  return useQuery({
    queryKey: ['bookings'],
    queryFn: () => apiFetch<Booking[]>('/bookings'),
    staleTime: 2 * 60 * 1000, // 2 minutes for real-time data
  });
};

export const useBooking = (id: string) => {
  return useQuery({
    queryKey: ['booking', id],
    queryFn: () => apiFetch<Booking>(`/bookings/${id}`),
    enabled: !!id,
  });
};

export const useCreateBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (booking: CreateBookingRequest) =>
      apiFetch<Booking>('/bookings', {
        method: 'POST',
        body: JSON.stringify(booking),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast.success('Booking created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create booking');
    },
  });
};

// User API Hooks
export const useUsers = () => {
  return useQuery({
    queryKey: ['users'],
    queryFn: () => apiFetch<User[]>('/users'),
    staleTime: 5 * 60 * 1000,
  });
};

export const useUser = (id: string) => {
  return useQuery({
    queryKey: ['user', id],
    queryFn: () => apiFetch<User>(`/users/${id}`),
    enabled: !!id,
  });
};

// Audit Log API Hooks
export const useAuditLogs = () => {
  return useQuery({
    queryKey: ['audit-logs'],
    queryFn: () => apiFetch<AuditLog[]>('/audit-logs'),
    staleTime: 1 * 60 * 1000, // 1 minute for real-time data
  });
};

// Inventory API Hooks
export const useHotels = () => {
  return useQuery({
    queryKey: ['hotels'],
    queryFn: () => apiFetch<Hotel[]>('/inventory/hotels'),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useHotel = (id: string) => {
  return useQuery({
    queryKey: ['hotel', id],
    queryFn: () => apiFetch<Hotel>(`/inventory/hotels/${id}`),
    enabled: !!id,
  });
};

// Marketing API Hooks
export const useMarketingCampaigns = () => {
  return useQuery({
    queryKey: ['marketing-campaigns'],
    queryFn: () => apiFetch<MarketingCampaign[]>('/marketing/campaigns'),
    staleTime: 5 * 60 * 1000,
  });
};

// Supplier API Hooks
export const useSuppliers = () => {
  return useQuery({
    queryKey: ['suppliers'],
    queryFn: () => apiFetch<Supplier[]>('/suppliers'),
    staleTime: 5 * 60 * 1000,
  });
};

// Notification API Hooks
export const useNotifications = () => {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: () => apiFetch<Notification[]>('/notifications'),
    staleTime: 1 * 60 * 1000, // Real-time notifications
  });
};

// Utility hooks for common patterns
export const useInvalidateQueries = () => {
  const queryClient = useQueryClient();

  return {
    invalidateCompanies: () => queryClient.invalidateQueries({ queryKey: ['companies'] }),
    invalidateBookings: () => queryClient.invalidateQueries({ queryKey: ['bookings'] }),
    invalidateUsers: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
    invalidateAll: () => queryClient.invalidateQueries(),
  };
};

// Type definitions (these would typically be in a shared types package)
interface Company {
  id: string;
  name: string;
  legalName: string;
  registrationNumber: string;
  taxId: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  city: string;
  country: string;
  status: 'active' | 'inactive' | 'pending';
  tier: 'standard' | 'premium' | 'enterprise';
  usersCount: number;
  bookingsCount: number;
  totalRevenue: number;
  createdAt: string;
}

interface CreateCompanyRequest {
  name: string;
  legalName: string;
  registrationNumber: string;
  taxId: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  city: string;
  country: string;
  status: 'active' | 'inactive' | 'pending';
  tier: 'standard' | 'premium' | 'enterprise';
}

interface UpdateCompanyRequest {
  name?: string;
  legalName?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  country?: string;
  status?: 'active' | 'inactive' | 'pending';
  tier?: 'standard' | 'premium' | 'enterprise';
}

interface Branch {
  id: string;
  companyId: string;
  name: string;
  code: string;
  iataCode: string;
  officeId: string;
  address: {
    formattedAddress: string;
    street: string;
    city: string;
    country: string;
    postalCode: string;
    coordinates: { lng: number; lat: number };
  };
  phone: string;
  email: string;
  managerId: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

interface CreateBranchRequest {
  companyId: string;
  name: string;
  code: string;
  iataCode: string;
  officeId: string;
  address: {
    formattedAddress: string;
    street: string;
    city: string;
    country: string;
    postalCode: string;
    coordinates: { lng: number; lat: number };
  };
  phone: string;
  email: string;
  managerId: string;
}

interface Department {
  id: string;
  companyId: string;
  name: string;
  code: string;
  employeeCount: number;
  status: 'active' | 'inactive';
}

interface CreateDepartmentRequest {
  companyId: string;
  name: string;
  code: string;
  employeeCount: number;
}

interface Designation {
  id: string;
  companyId: string;
  name: string;
  level: number;
  departmentName: string;
  employeeCount: number;
}

interface CostCenter {
  id: string;
  companyId: string;
  name: string;
  code: string;
  departmentName: string;
  budget: number;
  spent: number;
  currency: string;
  status: 'active' | 'inactive';
}

interface WalletAccount {
  id: string;
  walletId: string;
  name: string;
  balance: number;
  currency: string;
  status: 'active' | 'inactive';
  branchName?: string;
}

interface WalletTransaction {
  id: string;
  fromAccountId: string;
  fromAccountName: string;
  toAccountId: string;
  toAccountName: string;
  amount: number;
  currency: string;
  note: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
}

interface BankAccount {
  id: string;
  companyId: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  currency: string;
  isPrimary: boolean;
  status: 'active' | 'inactive';
}

interface PaymentGateway {
  id: string;
  companyId: string;
  provider: string;
  merchantId: string;
  isLive: boolean;
  supportedCurrencies: string[];
  status: 'active' | 'inactive';
}

interface VirtualCreditCard {
  id: string;
  companyId: string;
  cardholderName: string;
  cardNumber: string;
  expiryDate: string;
  provider: string;
  creditLimit: number;
  availableBalance: number;
  currency: string;
  status: 'active' | 'inactive';
}

interface Booking {
  id: string;
  companyId: string;
  customerId: string;
  bookingRef: string;
  status: string;
  totalAmount: number;
  currency: string;
  createdAt: string;
}

interface CreateBookingRequest {
  companyId: string;
  customerId: string;
  bookingRef: string;
  status: string;
  totalAmount: number;
  currency: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  companyId?: string;
  createdAt: string;
}

interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  userId: string;
  timestamp: string;
  details: any;
}

interface Hotel {
  id: string;
  name: string;
  address: string;
  city: string;
  country: string;
  rating: number;
  amenities: string[];
  status: string;
}

interface MarketingCampaign {
  id: string;
  name: string;
  type: string;
  budget: number;
  startDate: string;
  endDate: string;
  status: string;
}

interface Supplier {
  id: string;
  name: string;
  type: string;
  contactEmail: string;
  contactPhone: string;
  status: string;
}

interface Notification {
  id: string;
  type: string;
  message: string;
  userId: string;
  read: boolean;
  createdAt: string;
}