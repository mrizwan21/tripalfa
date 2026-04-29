import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { apiManager } from '../services/apiManager';

import type { TenantConfig } from '../types';
export type { TenantConfig };

const DEFAULT_TENANTS: Record<string, TenantConfig> = {
  'saba': {
    id: 'saba',
    name: 'Saba Travel & Holidays',
    logo: 'SABA',
    primaryColor: '#0f172a', // Navy
    secondaryColor: '#f0c040', // Gold
    accentColor: '#3b82f6', // Blue
    currency: 'BHD',
    supportPhone: '+973 1234 5678',
    supportEmail: 'support@sabatravel.com'
  },
  'elite': {
    id: 'elite',
    name: 'Elite World Holidays',
    logo: 'ELITE',
    primaryColor: '#4c0519', // Maroon/Wine
    secondaryColor: '#9f1239', // Rose
    accentColor: '#10b981', // Emerald
    currency: 'USD',
    supportPhone: '+44 20 7946 0958',
    supportEmail: 'vip@eliteholidays.com'
  },
  'global': {
    id: 'global',
    name: 'Global Reach B2B',
    logo: 'GLOBAL',
    primaryColor: '#064e3b', // Dark Emerald
    secondaryColor: '#059669', // Medium Emerald
    accentColor: '#f59e0b', // Amber
    currency: 'SAR',
    supportPhone: '+966 50 123 4567',
    supportEmail: 'contact@globalreach.sa'
  }
};

interface TenantContextType {
 tenant: TenantConfig;
 setTenantById: (id: string) => void;
 availableTenants: string[];
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: ReactNode }) {
 const [tenant, setTenant] = useState<TenantConfig>(DEFAULT_TENANTS['saba']);

 const setTenantById = (id: string) => {
 if (DEFAULT_TENANTS[id]) {
 setTenant(DEFAULT_TENANTS[id]);
 }
 };

 useEffect(() => {
 // Inject CSS variables for dynamic branding
 const root = document.documentElement;
 root.style.setProperty('--navy', tenant.primaryColor);
 root.style.setProperty('--gold', tenant.secondaryColor);
 root.style.setProperty('--gold-dark', tenant.secondaryColor); // Shorthand for now
 root.style.setProperty('--accent-color', tenant.accentColor);
 
 // Update document title for the tenant
 document.title = `${tenant.name} | B2B Portal`;

 // Inject active tenant ID into centralized API gateway configuration
 apiManager.setTenantContext(tenant.id);
 }, [tenant]);

 return (
 <TenantContext.Provider value={{ tenant, setTenantById, availableTenants: Object.keys(DEFAULT_TENANTS) }}>
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
