import {
    Company, Branch, Department, Designation, CostCenter,
    WalletAccount, WalletTransaction, BankAccount, PaymentGateway, VirtualCreditCard
} from './types';

// Initial Mock Data
const INITIAL_COMPANIES: Company[] = [
    {
        id: '1',
        name: 'TravelPro International',
        legalName: 'TravelPro International Inc.',
        registrationNumber: 'REG-2023-001',
        taxId: 'TAX-001',
        email: 'contact@travelpro.com',
        phone: '+1 555-0123',
        website: 'https://travelpro.com',
        address: '123 Business Ave',
        city: 'New York',
        country: 'USA',
        status: 'active',
        tier: 'enterprise',
        usersCount: 150,
        bookingsCount: 1250,
        totalRevenue: 5000000,
        createdAt: '2023-01-15T10:00:00Z',
    },
    {
        id: '2',
        name: 'Global Voyages',
        legalName: 'Global Voyages LLC',
        registrationNumber: 'REG-2023-002',
        taxId: 'TAX-002',
        email: 'info@globalvoyages.com',
        phone: '+44 20 7123 4567',
        website: 'https://globalvoyages.com',
        address: '456 Tech Park',
        city: 'London',
        country: 'UK',
        status: 'active',
        tier: 'premium',
        usersCount: 45,
        bookingsCount: 320,
        totalRevenue: 850000,
        createdAt: '2023-03-20T14:30:00Z',
    },
    {
        id: '3',
        name: 'Elite Travel Group',
        legalName: 'Elite Travel Group Ltd.',
        registrationNumber: 'REG-2023-003',
        taxId: 'TAX-003',
        email: 'support@elitetravel.com',
        phone: '+971 4 321 0987',
        website: 'https://elitetravel.com',
        address: '789 Harbor View',
        city: 'Dubai',
        country: 'UAE',
        status: 'pending',
        tier: 'standard',
        usersCount: 12,
        bookingsCount: 85,
        totalRevenue: 120000,
        createdAt: '2024-01-05T09:15:00Z',
    },
];

const INITIAL_BRANCHES: Branch[] = [
    {
        id: '1',
        companyId: '1',
        name: 'New York HQ',
        code: 'HQ-NYC',
        iataCode: 'NYC01',
        officeId: 'OFF-NYC-01',
        address: {
            formattedAddress: '123 Business Ave, New York, NY, USA',
            street: '123 Business Ave',
            city: 'New York',
            country: 'USA',
            postalCode: '10001',
            coordinates: { lng: -74.006, lat: 40.7128 },
        },
        phone: '+1 212-555-0123',
        email: 'nyc@company.com',
        managerId: 'user-001',
        status: 'active',
        createdAt: '2023-01-15T10:00:00Z',
    },
    {
        id: '2',
        companyId: '1',
        name: 'London Office',
        code: 'LDN-001',
        iataCode: 'LON01',
        officeId: 'OFF-LON-01',
        address: {
            formattedAddress: '456 Tech Park, London, UK',
            street: '456 Tech Park',
            city: 'London',
            country: 'UK',
            postalCode: 'SW1',
            coordinates: { lng: -0.1278, lat: 51.5074 },
        },
        phone: '+44 20 7123 4567',
        email: 'london@company.com',
        managerId: 'user-002',
        status: 'active',
        createdAt: '2023-03-20T14:30:00Z',
    },
    {
        id: '3',
        companyId: '1',
        name: 'Dubai Hub',
        code: 'DXB-001',
        iataCode: 'DXB01',
        officeId: 'OFF-DXB-01',
        address: {
            formattedAddress: '789 Business Bay, Dubai, UAE',
            street: '789 Business Bay',
            city: 'Dubai',
            country: 'UAE',
            postalCode: '00000',
            coordinates: { lng: 55.2708, lat: 25.2048 },
        },
        phone: '+971 4 555 1234',
        email: 'dubai@company.com',
        managerId: 'user-003',
        status: 'active',
        createdAt: '2024-01-05T09:15:00Z',
    },
];

const INITIAL_DEPARTMENTS: Department[] = [
    { id: '1', companyId: '1', name: 'Executive Management', code: 'EXEC', employeeCount: 5, status: 'active' },
    { id: '2', companyId: '1', name: 'Sales & Marketing', code: 'SALES', employeeCount: 25, status: 'active' },
    { id: '3', companyId: '1', name: 'Tech & Product', code: 'TECH', employeeCount: 15, status: 'active' },
    { id: '4', companyId: '1', name: 'Finance & HR', code: 'FIN-HR', employeeCount: 8, status: 'active' },
];

const INITIAL_DESIGNATIONS: Designation[] = [
    { id: '1', companyId: '1', name: 'Chief Executive Officer', level: 1, departmentName: 'Executive Management', employeeCount: 1 },
    { id: '2', companyId: '1', name: 'VP of Engineering', level: 2, departmentName: 'Tech & Product', employeeCount: 1 },
    { id: '3', companyId: '1', name: 'Senior Sales Manager', level: 3, departmentName: 'Sales & Marketing', employeeCount: 4 },
    { id: '4', companyId: '1', name: 'Direct Sales', level: 4, departmentName: 'Sales & Marketing', employeeCount: 20 },
];

const INITIAL_COST_CENTERS: CostCenter[] = [
    { id: '1', companyId: '1', name: 'Global Sales', code: 'CC-SALES-01', departmentName: 'Sales & Marketing', budget: 150000, spent: 45000, currency: 'USD', status: 'active' },
    { id: '2', companyId: '1', name: 'Tech Infrastructure', code: 'CC-TECH-01', departmentName: 'Tech & Product', budget: 80000, spent: 25000, currency: 'USD', status: 'active' },
    { id: '3', companyId: '1', name: 'Marketing Campaigns', code: 'CC-MKT-01', departmentName: 'Sales & Marketing', budget: 50000, spent: 15000, currency: 'USD', status: 'active' },
    { id: '4', companyId: '1', name: 'HR Operations', code: 'CC-HR-01', departmentName: 'Finance & HR', budget: 25000, spent: 12000, currency: 'USD', status: 'active' },
];

const INITIAL_WALLET_ACCOUNTS: WalletAccount[] = [
    { id: '1', walletId: 'w_123', name: 'Main Corporate Wallet', balance: 50000, currency: 'USD', status: 'active' },
    { id: '2', walletId: 'w_456', name: 'Travel Fund - Sales', balance: 15000, currency: 'USD', status: 'active', branchName: 'New York HQ' },
    { id: '3', walletId: 'w_789', name: 'Marketing Fund', balance: 8000, currency: 'USD', status: 'active', branchName: 'London Office' },
];

const INITIAL_WALLET_TRANSACTIONS: WalletTransaction[] = [
    { id: '1', fromAccountId: 'deposit', fromAccountName: 'Bank Deposit', toAccountId: '1', toAccountName: 'Main Corporate Wallet', amount: 50000, currency: 'USD', note: 'Initial Deposit', status: 'completed', createdAt: '2024-03-15T10:00:00Z' },
    { id: '2', fromAccountId: '1', fromAccountName: 'Main Corporate Wallet', toAccountId: '3', toAccountName: 'Marketing Fund', amount: 2000, currency: 'USD', note: 'Q1 Campaign', status: 'completed', createdAt: '2024-03-14T15:30:00Z' },
];

const INITIAL_BANK_ACCOUNTS: BankAccount[] = [
    { id: '1', companyId: '1', bankName: 'Chase Bank', accountNumber: '****6789', accountName: 'TravelPro Operating', currency: 'USD', isPrimary: true, status: 'active' },
    { id: '2', companyId: '1', bankName: 'HSBC UK', accountNumber: '****4321', accountName: 'TravelPro UK Ltd', currency: 'GBP', isPrimary: false, status: 'active' },
];

const INITIAL_PAYMENT_GATEWAYS: PaymentGateway[] = [
    { id: '1', companyId: '1', provider: 'stripe', merchantId: 'acct_123456789', isLive: true, supportedCurrencies: ['USD', 'EUR', 'GBP'], status: 'active' },
    { id: '2', companyId: '1', provider: 'paypal', merchantId: 'merchant@travelpro.com', isLive: true, supportedCurrencies: ['USD'], status: 'active' },
];

const INITIAL_VIRTUAL_CARDS: VirtualCreditCard[] = [
    { id: '1', companyId: '1', cardholderName: 'John Smith', cardNumber: '**** **** **** 4242', expiryDate: '12/25', provider: 'Visa', creditLimit: 5000, availableBalance: 3200, currency: 'USD', status: 'active' },
    { id: '2', companyId: '1', cardholderName: 'Marketing Team', cardNumber: '**** **** **** 1234', expiryDate: '08/25', provider: 'Mastercard', creditLimit: 2000, availableBalance: 1500, currency: 'USD', status: 'active' },
];

class MockCompanyServiceData {
    companies = INITIAL_COMPANIES;
    branches = INITIAL_BRANCHES;
    departments = INITIAL_DEPARTMENTS;
    designations = INITIAL_DESIGNATIONS;
    costCenters = INITIAL_COST_CENTERS;
    walletAccounts = INITIAL_WALLET_ACCOUNTS;
    walletTransactions = INITIAL_WALLET_TRANSACTIONS;
    bankAccounts = INITIAL_BANK_ACCOUNTS;
    paymentGateways = INITIAL_PAYMENT_GATEWAYS;
    virtualCards = INITIAL_VIRTUAL_CARDS;
}

const mockData = new MockCompanyServiceData();

const API_BASE = 'http://localhost:3004';

export const companyService = {
    // Companies
    getCompanies: async () => {
        const response = await fetch(`${API_BASE}/admin/companies`);
        const result = await response.json();
        return result.data || [];
    },

        createCostCenter: async (costCenter: any) => {
            const response = await fetch(`${API_BASE}/cost-centers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(costCenter),
            });
            const result = await response.json();
            return result.data;
        },
        updateCostCenter: async (id: string, updates: any) => {
            const response = await fetch(`${API_BASE}/cost-centers/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates),
            });
            const result = await response.json();
            return result.data;
        },
    getCompany: async (id: string) => {
        const response = await fetch(`${API_BASE}/admin/companies/${id}`);
        const result = await response.json();
        return result.data;
    },
    createCompany: async (company: any) => {
        const response = await fetch(`${API_BASE}/admin/companies`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(company)
        });
        const result = await response.json();
        return result.data;
    },
    updateCompany: async (id: string, updates: any) => {
        const response = await fetch(`${API_BASE}/admin/companies/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });
        const result = await response.json();
        return result.data;
    },

    // Branches
    getBranches: async (companyId?: string) => {
        const url = companyId ? `${API_BASE}/branches?companyId=${companyId}` : `${API_BASE}/branches`;
        const response = await fetch(url);
        const result = await response.json();
        return result.data || [];
    },
    createBranch: async (branch: any) => {
        const response = await fetch(`${API_BASE}/branches`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(branch)
        });
        const result = await response.json();
        return result.data;
    },
    updateBranch: async (id: string, updates: any) => {
        const response = await fetch(`${API_BASE}/branches/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });
        const result = await response.json();
        return result.data;
    },

    // Departments
    getDepartments: async (companyId?: string) => {
        const url = companyId ? `${API_BASE}/departments?companyId=${companyId}` : `${API_BASE}/departments`;
        const response = await fetch(url);
        const result = await response.json();
        return result.data || [];
    },
    createDepartment: async (dept: any) => {
        const response = await fetch(`${API_BASE}/departments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dept)
        });
        const result = await response.json();
        return result.data;
    },
    updateDepartment: async (id: string, updates: any) => {
        const response = await fetch(`${API_BASE}/departments/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
        });
        const result = await response.json();
        return result.data;
    },

    // Designations
    getDesignations: async (companyId?: string) => {
        const url = companyId ? `${API_BASE}/designations?companyId=${companyId}` : `${API_BASE}/designations`;
        const response = await fetch(url);
        const result = await response.json();
        return result.data || [];
    },
    createDesignation: async (desig: any) => {
        const response = await fetch(`${API_BASE}/designations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(desig)
        });
        const result = await response.json();
        return result.data;
    },
    updateDesignation: async (id: string, updates: any) => {
        const response = await fetch(`${API_BASE}/designations/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });
        const result = await response.json();
        return result.data;
    },

    // Cost Centers
    getCostCenters: async (companyId?: string) => {
        const url = companyId ? `${API_BASE}/cost-centers?companyId=${companyId}` : `${API_BASE}/cost-centers`;
        const response = await fetch(url);
        const result = await response.json();
        return result.data || [];
    },

    // Wallet transfer (mock)
    createWalletTransfer: async (transfer: any) => {
        const response = await fetch(`${API_BASE}/wallet-transfers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(transfer)
        });
        const result = await response.json();
        return result.data;
    },

    // Wallet (Mocked for now as it usually goes to wallet-service)
    getWalletAccounts: async (companyId?: string) => {
        return mockData.walletAccounts;
    },
    getWalletTransactions: async (accountId?: string) => {
        return mockData.walletTransactions;
    },

    // Finance (Mocked for now)
    getBankAccounts: async (companyId?: string) => {
        return mockData.bankAccounts;
    },
    createBankAccount: async (bankAccount: any) => {
        const response = await fetch(`${API_BASE}/bank-accounts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bankAccount)
        });
        const result = await response.json();
        return result.data;
    },
    updateBankAccount: async (id: string, updates: any) => {
        const response = await fetch(`${API_BASE}/bank-accounts/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });
        const result = await response.json();
        return result.data;
    },
    getPaymentGateways: async (companyId?: string) => {
        return mockData.paymentGateways;
    },
    createPaymentGateway: async (gateway: any) => {
        const response = await fetch(`${API_BASE}/payment-gateways`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(gateway)
        });
        const result = await response.json();
        return result.data;
    },
    updatePaymentGateway: async (id: string, updates: any) => {
        const response = await fetch(`${API_BASE}/payment-gateways/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });
        const result = await response.json();
        return result.data;
    },
    getVirtualCards: async (companyId?: string) => {
        return mockData.virtualCards;
    },
    createVirtualCard: async (card: any) => {
        const response = await fetch(`${API_BASE}/virtual-cards`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(card)
        });
        const result = await response.json();
        return result.data;
    },
    updateVirtualCard: async (id: string, updates: any) => {
        const response = await fetch(`${API_BASE}/virtual-cards/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });
        const result = await response.json();
        return result.data;
    },
};
