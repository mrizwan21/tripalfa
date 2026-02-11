/**
 * Onboarding Management Hook
 * Handles supplier and customer onboarding lifecycle and notifications
 */

import { useState, useCallback } from 'react';

export interface SupplierOnboardingRecord {
  id: string;
  supplierId: string;
  supplierName: string;
  supplierEmail: string;
  registeredAt: string;
  walletAssignedAt?: string;
  walletActivatedAt?: string;
  walletType?: string;
  status: 'registered' | 'wallet_assigned' | 'wallet_activated' | 'active';
  adminNotificationSent: boolean;
  supplierNotificationSent: boolean;
}

export interface CustomerOnboardingRecord {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  registeredAt: string;
  profileCompletedAt?: string;
  accountVerifiedAt?: string;
  paymentAddedAt?: string;
  status: 'registered' | 'profile_completed' | 'account_verified' | 'payment_added' | 'active';
  adminNotificationSent: boolean;
  customerNotificationSent: boolean;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  type: 'supplier_onboarding' | 'customer_onboarding';
  eventType: string;
  subject: string;
  channels: ('email' | 'sms' | 'in_app')[];
  templateContent: {
    email?: string;
    sms?: string;
    in_app?: string;
  };
  variables: string[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export function useOnboardingManagement() {
  const [supplierRecords, setSupplierRecords] = useState<SupplierOnboardingRecord[]>([
    {
      id: 'onb_sup_001',
      supplierId: 'sup_001',
      supplierName: 'Emirates Airlines',
      supplierEmail: 'contact@emirates.com',
      registeredAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      walletAssignedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      walletActivatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      walletType: 'credit',
      status: 'wallet_activated',
      adminNotificationSent: true,
      supplierNotificationSent: true,
    },
    {
      id: 'onb_sup_002',
      supplierId: 'sup_002',
      supplierName: 'Hilton Hotels',
      supplierEmail: 'partner@hilton.com',
      registeredAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      walletAssignedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      walletType: 'prepaid',
      status: 'wallet_assigned',
      adminNotificationSent: true,
      supplierNotificationSent: true,
    },
  ]);

  const [customerRecords, setCustomerRecords] = useState<CustomerOnboardingRecord[]>([
    {
      id: 'onb_cust_001',
      customerId: 'cust_001',
      customerName: 'John Doe',
      customerEmail: 'john@example.com',
      registeredAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      profileCompletedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
      accountVerifiedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      paymentAddedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'payment_added',
      adminNotificationSent: true,
      customerNotificationSent: true,
    },
    {
      id: 'onb_cust_002',
      customerId: 'cust_002',
      customerName: 'Jane Smith',
      customerEmail: 'jane@example.com',
      registeredAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      profileCompletedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      accountVerifiedAt: undefined,
      status: 'profile_completed',
      adminNotificationSent: true,
      customerNotificationSent: true,
    },
  ]);

  const [templates, setTemplates] = useState<NotificationTemplate[]>([
    {
      id: 'tmpl_sup_registered',
      name: 'Supplier Registration Welcome',
      type: 'supplier_onboarding',
      eventType: 'supplier_registered',
      subject: 'Welcome to TripAlfa Supplier Program',
      channels: ['email', 'in_app'],
      templateContent: {
        email: '<h2>Welcome {{supplierName}}!</h2><p>Your supplier account has been created. Next step: complete wallet setup.</p>',
        in_app: 'Welcome {{supplierName}}! Complete your wallet setup to start accepting bookings.',
      },
      variables: ['supplierName', 'supplierEmail'],
      priority: 'high',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true,
    },
    {
      id: 'tmpl_cust_registered',
      name: 'Customer Registration Welcome',
      type: 'customer_onboarding',
      eventType: 'customer_registered',
      subject: 'Welcome to TripAlfa - Your Travel Starts Here',
      channels: ['email', 'in_app'],
      templateContent: {
        email: '<h2>Welcome {{customerName}}!</h2><p>Your account is ready. Complete your profile to unlock exclusive deals!</p>',
        in_app: 'Welcome {{customerName}}! Start booking amazing deals today.',
      },
      variables: ['customerName', 'customerEmail'],
      priority: 'high',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true,
    },
  ]);

  const updateSupplierStatus = useCallback((id: string, status: SupplierOnboardingRecord['status']) => {
    setSupplierRecords((prev) =>
      prev.map((record) => {
        if (record.id === id) {
          const updated: SupplierOnboardingRecord = { ...record, status };
          if (status === 'wallet_assigned' && !record.walletAssignedAt) {
            updated.walletAssignedAt = new Date().toISOString();
          }
          if (status === 'wallet_activated' && !record.walletActivatedAt) {
            updated.walletActivatedAt = new Date().toISOString();
          }
          return updated;
        }
        return record;
      })
    );
  }, []);

  const updateCustomerStatus = useCallback((id: string, status: CustomerOnboardingRecord['status']) => {
    setCustomerRecords((prev) =>
      prev.map((record) => {
        if (record.id === id) {
          const updated: CustomerOnboardingRecord = { ...record, status };
          if (status === 'profile_completed' && !record.profileCompletedAt) {
            updated.profileCompletedAt = new Date().toISOString();
          }
          if (status === 'account_verified' && !record.accountVerifiedAt) {
            updated.accountVerifiedAt = new Date().toISOString();
          }
          return updated;
        }
        return record;
      })
    );
  }, []);

  const updateTemplate = useCallback((id: string, template: Partial<NotificationTemplate>) => {
    setTemplates((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...template, updatedAt: new Date().toISOString() } : t))
    );
  }, []);

  const createTemplate = useCallback((template: Omit<NotificationTemplate, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newTemplate: NotificationTemplate = {
      ...template,
      id: `tmpl_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setTemplates((prev) => [...prev, newTemplate]);
    return newTemplate;
  }, []);

  return {
    supplierRecords,
    customerRecords,
    templates,
    updateSupplierStatus,
    updateCustomerStatus,
    updateTemplate,
    createTemplate,
  };
}
