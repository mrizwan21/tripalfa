import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { apiManager } from '../services/apiManager';

import type { TenantConfig } from '../types';
export type { TenantConfig };

interface TenantContextType {
  tenant: TenantConfig;
  setTenantById: (id: string) => void;
  availableTenants: TenantConfig[];
  isLoading: boolean;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: ReactNode }) {
  const [tenant, setTenant] = useState<TenantConfig | null>(null);
  const [availableTenants, setAvailableTenants] = useState<TenantConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTenants = async () => {
      try {
        const response = await apiManager.getTenants();
        const tenants = response.data || [];
        setAvailableTenants(tenants);
        if (tenants.length > 0 && !tenant) {
          setTenant(tenants[0]);
        }
      } catch (error) {
        if (import.meta.env.DEV) console.error('Failed to load tenants:', error);
        // Fallback to default tenant
        const defaultTenant: TenantConfig = {
          id: 'default',
          name: 'Default Travel',
          logo: 'DEFAULT',
          primaryColor: '#003b95',
          secondaryColor: '#f0c040',
          accentColor: '#10b981',
          currency: 'USD',
          supportPhone: '',
          supportEmail: ''
        };
        setTenant(defaultTenant);
        setAvailableTenants([defaultTenant]);
      } finally {
        setIsLoading(false);
      }
    };
    loadTenants();
  }, []);

  const setTenantById = (id: string) => {
    const found = availableTenants.find(t => t.id === id);
    if (found) {
      setTenant(found);
    }
  };

  useEffect(() => {
    if (!tenant) return;
    // Inject CSS variables for dynamic branding
    const root = document.documentElement;
    root.style.setProperty('--navy', tenant.primaryColor);
    root.style.setProperty('--gold', tenant.secondaryColor);
    root.style.setProperty('--gold-dark', tenant.secondaryColor);
    root.style.setProperty('--accent-color', tenant.accentColor);

    // Update document title for the tenant
    document.title = `${tenant.name} | B2B Portal`;

    // Inject active tenant ID into centralized API gateway configuration
    apiManager.setTenantContext(tenant.id);
  }, [tenant]);

  if (isLoading || !tenant) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <TenantContext.Provider value={{ tenant, setTenantById, availableTenants, isLoading }}>
      {children}
    </TenantContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTenant() {
 const context = useContext(TenantContext);
 if (context === undefined) {
 throw new Error('useTenant must be used within a TenantProvider');
 }
 return context;
}
