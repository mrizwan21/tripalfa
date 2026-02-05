import { Address } from '@/components/MapboxAddressPicker';

export interface Company {
    id: string;
    name: string;
    legalName: string;
    registrationNumber: string;
    taxId: string;
    email: string;
    phone: string;
    website?: string;
    address: string;
    city: string;
    country: string;
    status: 'active' | 'inactive' | 'pending';
    tier: 'standard' | 'premium' | 'enterprise';
    usersCount: number;
    bookingsCount: number;
    totalRevenue: number;
    createdAt: string;
    iataCode?: string;
    officeId?: string;
    stats?: {
        totalBranches: number;
        totalEmployees: number;
        totalBookings: number;
        totalRevenue: number;
    };
}

export interface Branch {
    id: string;
    companyId: string;
    name: string;
    code: string;
    iataCode?: string;
    officeId?: string;
    address: Address;
    phone: string;
    email: string;
    managerId?: string;
    walletAccountId?: string;
    status: 'active' | 'inactive';
    createdAt: string;
}

export interface Department {
    id: string;
    companyId: string;
    name: string;
    code: string;
    headId?: string;
    headName?: string;
    parentDepartmentId?: string;
    parentDepartmentName?: string;
    employeeCount: number;
    status: 'active' | 'inactive';
}

export interface Designation {
    id: string;
    companyId: string;
    name: string;
    level: number;
    departmentId?: string;
    departmentName?: string;
    employeeCount: number;
}

export interface CostCenter {
    id: string;
    companyId: string;
    name: string;
    code: string;
    departmentId?: string;
    departmentName?: string;
    branchId?: string;
    branchName?: string;
    budget: number;
    spent: number;
    currency: string;
    status: 'active' | 'inactive';
}

export interface WalletAccount {
    id: string;
    walletId: string;
    branchId?: string;
    branchName?: string;
    name: string;
    balance: number;
    currency: string;
    status: 'active' | 'frozen';
}

export interface WalletTransaction {
    id: string;
    fromAccountId: string;
    fromAccountName: string;
    toAccountId: string;
    toAccountName: string;
    amount: number;
    currency: string;
    note: string;
    status: 'completed' | 'pending' | 'failed';
    createdAt: string;
}

export interface BankAccount {
    id: string;
    companyId: string;
    branchId?: string;
    branchName?: string;
    bankName: string;
    accountNumber: string;
    accountName: string;
    swiftCode?: string;
    iban?: string;
    currency: string;
    isPrimary: boolean;
    status: 'active' | 'inactive';
}

export interface PaymentGateway {
    id: string;
    companyId: string;
    branchId?: string;
    branchName?: string;
    provider: 'stripe' | 'paypal' | 'adyen' | 'worldpay' | 'cybersource';
    merchantId: string;
    isLive: boolean;
    supportedCurrencies: string[];
    status: 'active' | 'inactive';
}

export interface VirtualCreditCard {
    id: string;
    companyId: string;
    branchId?: string;
    branchName?: string;
    cardNumber: string;
    expiryDate: string;
    cardholderName: string;
    provider: string;
    creditLimit: number;
    availableBalance: number;
    currency: string;
    status: 'active' | 'frozen' | 'expired';
}
