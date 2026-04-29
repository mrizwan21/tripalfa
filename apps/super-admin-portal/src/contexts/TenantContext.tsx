import React, { createContext, useState, ReactNode } from 'react';

interface Tenant {
  id: string;
  name: string;
  domain: string;
  type: string;
  status: string;
}

interface TenantContextType {
  currentTenant: Tenant | null;
  setCurrentTenant: (tenant: Tenant | null) => void;
  tenants: Tenant[];
  setTenants: (tenants: Tenant[]) => void;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const TenantProvider = ({ children }: { children: ReactNode }) => {
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);

  const value: TenantContextType = {
    currentTenant,
    setCurrentTenant,
    tenants,
    setTenants,
  };

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
};