import * as React from "react";
import { createContext, useContext, useState, useCallback, useEffect } from "react";

export interface TenantHierarchyNode {
  id: string;
  name: string;
  type: "MASTER_AGENCY" | "SUB_AGENT" | "INDIVIDUAL_AGENT";
  status: "ACTIVE" | "SUSPENDED" | "ARCHIVED";
  children?: TenantHierarchyNode[];
  domain?: string;
  creditLimit?: number;
  agentCode?: string;
  parentId?: string;
}

export interface TenantContextValue {
  currentTenant: TenantHierarchyNode | null;
  tenantTree: TenantHierarchyNode[];
  selectedTenantId: string | null;
  isSuperAdmin: boolean;
  selectTenant: (tenantId: string | null) => void;
  getTenantById: (id: string) => TenantHierarchyNode | undefined;
  getTenantChildren: (parentId: string) => TenantHierarchyNode[];
  canAccessTenant: (tenantId: string) => boolean;
  isLoading: boolean;
  error: string | null;
  refreshTenantTree: () => Promise<void>;
}

const TenantContext = createContext<TenantContextValue | undefined>(undefined);

export interface TenantProviderProps {
  children: React.ReactNode;
  initialTenantId?: string | null;
  apiBaseUrl?: string;
  adminId?: string;
  onTenantChange?: (tenant: TenantHierarchyNode | null) => void;
}

function buildHierarchy(flatTenants: TenantHierarchyNode[]): TenantHierarchyNode[] {
  const nodeMap = new Map<string, TenantHierarchyNode>();
  const roots: TenantHierarchyNode[] = [];

  flatTenants.forEach((tenant) => {
    nodeMap.set(tenant.id, { ...tenant, children: [] });
  });

  flatTenants.forEach((tenant) => {
    const node = nodeMap.get(tenant.id)!;
    if (tenant.parentId && nodeMap.has(tenant.parentId)) {
      nodeMap.get(tenant.parentId)!.children!.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}

export function TenantProvider({
  children,
  initialTenantId = null,
  apiBaseUrl,
  adminId,
  onTenantChange,
}: TenantProviderProps) {
  const [tenantTree, setTenantTree] = useState<TenantHierarchyNode[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(initialTenantId);
  const [currentTenant, setCurrentTenant] = useState<TenantHierarchyNode | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flatTenants, setFlatTenants] = useState<TenantHierarchyNode[]>([]);

  const isSuperAdmin = true;

  const fetchTenantTree = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const baseUrl = apiBaseUrl || "http://localhost:4005";
      const headersObj: HeadersInit = {
        "Content-Type": "application/json",
      };
      if (adminId) {
        headersObj["x-admin-id"] = adminId;
      }

      const res = await fetch(`${baseUrl}/api/admin/tenants/tree`, { headers: headersObj });
      if (!res.ok) {
        throw new Error(`Failed to fetch tenant tree: ${res.statusText}`);
      }
      const data: TenantHierarchyNode[] = await res.json();
      setFlatTenants(data);
      setTenantTree(buildHierarchy(data));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tenant tree");
      setTenantTree([]);
    } finally {
      setIsLoading(false);
    }
  }, [apiBaseUrl, adminId]);

  useEffect(() => {
    fetchTenantTree();
  }, [fetchTenantTree]);

  useEffect(() => {
    if (selectedTenantId) {
      const tenant = flatTenants.find((t) => t.id === selectedTenantId);
      setCurrentTenant(tenant || null);
      onTenantChange?.(tenant || null);
    } else {
      setCurrentTenant(null);
      onTenantChange?.(null);
    }
  }, [selectedTenantId, flatTenants, onTenantChange]);

  const selectTenant = useCallback((tenantId: string | null) => {
    setSelectedTenantId(tenantId);
  }, []);

  const getTenantById = useCallback(
    (id: string): TenantHierarchyNode | undefined => {
      return flatTenants.find((t) => t.id === id);
    },
    [flatTenants]
  );

  const getTenantChildren = useCallback(
    (parentId: string): TenantHierarchyNode[] => {
      return flatTenants.filter((t) => t.parentId === parentId);
    },
    [flatTenants]
  );

  const canAccessTenant = useCallback(
    (tenantId: string): boolean => {
      if (isSuperAdmin) return true;
      return tenantId === selectedTenantId;
    },
    [isSuperAdmin, selectedTenantId]
  );

  const value: TenantContextValue = {
    currentTenant,
    tenantTree,
    selectedTenantId,
    isSuperAdmin,
    selectTenant,
    getTenantById,
    getTenantChildren,
    canAccessTenant,
    isLoading,
    error,
    refreshTenantTree: fetchTenantTree,
  };

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
}

export function useTenant(): TenantContextValue {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error("useTenant must be used within a TenantProvider");
  }
  return context;
}

export function useCurrentTenant(): TenantHierarchyNode | null {
  const { currentTenant } = useTenant();
  return currentTenant;
}

export function useIsSuperAdmin(): boolean {
  const { isSuperAdmin } = useTenant();
  return isSuperAdmin;
}

export function useTenantSelector(): (tenantId: string | null) => void {
  const { selectTenant } = useTenant();
  return selectTenant;
}