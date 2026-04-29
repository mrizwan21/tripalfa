import React, { createContext, useContext, useState, useCallback } from 'react';
import type { TenantConfig } from '@tripalfa/shared-features';

interface CustomerData {
  id: string;
  name: string;
  email: string;
  phone: string;
  company?: string;
  customerType: 'direct' | 'corporate' | 'sub-agent';
  creditLimit?: number;
  availableCredit?: number;
  walletBalance?: number;
}

interface CustomerContextType {
  customer: CustomerData | null;
  setCustomer: (customer: CustomerData | null) => void;
  channel: string;
  setChannel: (channel: string) => void;
  posTag: string;
  setPosTag: (tag: string) => void;
  notifications: Array<{ id: string; title: string; message: string; type: 'success' | 'error' | 'info' }>;
  addNotification: (notification: { title: string; message: string; type: 'success' | 'error' | 'info' }) => void;
  removeNotification: (id: string) => void;
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

export function CustomerProvider({ children }: { children: React.ReactNode }) {
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [channel, setChannel] = useState('B2C');
  const [posTag, setPosTag] = useState('B2C-CC');
  const [notifications, setNotifications] = useState<Array<{ id: string; title: string; message: string; type: 'success' | 'error' | 'info' }>>([]);

  const addNotification = useCallback((notification: { title: string; message: string; type: 'success' | 'error' | 'info' }) => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { ...notification, id }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  return (
    <CustomerContext.Provider value={{
      customer,
      setCustomer,
      channel,
      setChannel,
      posTag,
      setPosTag,
      notifications,
      addNotification,
      removeNotification,
    }}>
      {children}
    </CustomerContext.Provider>
  );
}

export function useCustomer() {
  const context = useContext(CustomerContext);
  if (context === undefined) {
    throw new Error('useCustomer must be used within a CustomerProvider');
  }
  return context;
}