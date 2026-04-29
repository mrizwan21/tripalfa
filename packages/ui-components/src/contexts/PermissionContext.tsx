import * as React from "react";
import { createContext, useContext, useState, useCallback, useEffect } from "react";

export type Permission =
  | "tenant:read"
  | "tenant:write"
  | "tenant:delete"
  | "tenant:manage-access"
  | "staff:read"
  | "staff:write"
  | "staff:delete"
  | "role:read"
  | "role:write"
  | "role:delete"
  | "supplier:read"
  | "supplier:write"
  | "supplier:delete"
  | "revenue:read"
  | "revenue:write"
  | "revenue:delete"
  | "tax:read"
  | "tax:write"
  | "tax:delete"
  | "markup:read"
  | "markup:write"
  | "markup:delete"
  | "commission:read"
  | "commission:write"
  | "commission:delete"
  | "config:read"
  | "config:write"
  | "config:delete"
  | "payment:read"
  | "payment:write"
  | "payment:delete"
  | "theme:read"
  | "theme:write"
  | "theme:delete"
  | "booking:read"
  | "booking:write"
  | "booking:delete"
  | "report:read"
  | "audit:read"
  | "settings:read"
  | "settings:write";

export type RoleType = "SUPER_ADMIN" | "ADMIN" | "MANAGER" | "AGENT" | "SUPPORT";

export interface Role {
  id: string;
  name: string;
  type: RoleType;
  permissions: Permission[];
  description?: string;
  isSystem?: boolean;
}

export interface PermissionContextValue {
  roles: Role[];
  currentRole: Role | null;
  permissions: Permission[];
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasAllPermissions: (permissions: Permission[]) => boolean;
  canAccess: (resource: string, action: "read" | "write" | "delete") => boolean;
  getRoleById: (id: string) => Role | undefined;
  getRoleByType: (type: RoleType) => Role | undefined;
  isLoading: boolean;
  error: string | null;
  refreshRoles: () => Promise<void>;
}

const PermissionContext = createContext<PermissionContextValue | undefined>(undefined);

const SUPER_ADMIN_ROLE: Role = {
  id: "super-admin",
  name: "Super Administrator",
  type: "SUPER_ADMIN",
  permissions: [
    "tenant:read",
    "tenant:write",
    "tenant:delete",
    "tenant:manage-access",
    "staff:read",
    "staff:write",
    "staff:delete",
    "role:read",
    "role:write",
    "role:delete",
    "supplier:read",
    "supplier:write",
    "supplier:delete",
    "revenue:read",
    "revenue:write",
    "revenue:delete",
    "tax:read",
    "tax:write",
    "tax:delete",
    "markup:read",
    "markup:write",
    "markup:delete",
    "commission:read",
    "commission:write",
    "commission:delete",
    "config:read",
    "config:write",
    "config:delete",
    "payment:read",
    "payment:write",
    "payment:delete",
    "theme:read",
    "theme:write",
    "theme:delete",
    "booking:read",
    "booking:write",
    "booking:delete",
    "report:read",
    "audit:read",
    "settings:read",
    "settings:write",
  ],
  description: "Full access to all platform resources",
  isSystem: true,
};

export interface PermissionProviderProps {
  children: React.ReactNode;
  initialRoleType?: RoleType;
  apiBaseUrl?: string;
  adminId?: string;
  onRoleChange?: (role: Role | null) => void;
}

export function PermissionProvider({
  children,
  initialRoleType = "SUPER_ADMIN",
  apiBaseUrl,
  adminId,
  onRoleChange,
}: PermissionProviderProps) {
  const [roles, setRoles] = useState<Role[]>([SUPER_ADMIN_ROLE]);
  const [currentRole, setCurrentRole] = useState<Role | null>(SUPER_ADMIN_ROLE);
  const [permissions, setPermissions] = useState<Permission[]>(SUPER_ADMIN_ROLE.permissions);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRoles = useCallback(async () => {
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

      const res = await fetch(`${baseUrl}/api/admin/roles`, { headers: headersObj });
      if (!res.ok) {
        if (res.status === 404) {
          setRoles([SUPER_ADMIN_ROLE]);
          return;
        }
        throw new Error(`Failed to fetch roles: ${res.statusText}`);
      }
      const data: Role[] = await res.json();
      setRoles([SUPER_ADMIN_ROLE, ...data.filter((r) => r.type !== "SUPER_ADMIN")]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load roles");
      setRoles([SUPER_ADMIN_ROLE]);
    } finally {
      setIsLoading(false);
    }
  }, [apiBaseUrl, adminId]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  useEffect(() => {
    const role = roles.find((r) => r.type === initialRoleType) || SUPER_ADMIN_ROLE;
    setCurrentRole(role);
    setPermissions(role.permissions);
    onRoleChange?.(role);
  }, [initialRoleType, roles, onRoleChange]);

  const hasPermission = useCallback(
    (permission: Permission): boolean => {
      return permissions.includes(permission) || (permissions as string[]).includes("*");
    },
    [permissions]
  );

  const hasAnyPermission = useCallback(
    (perms: Permission[]): boolean => {
      return perms.some((p) => permissions.includes(p));
    },
    [permissions]
  );

  const hasAllPermissions = useCallback(
    (perms: Permission[]): boolean => {
      return perms.every((p) => permissions.includes(p));
    },
    [permissions]
  );

  const canAccess = useCallback(
    (resource: string, action: "read" | "write" | "delete"): boolean => {
      const permission = `${resource}:${action}` as Permission;
      return hasPermission(permission);
    },
    [hasPermission]
  );

  const getRoleById = useCallback(
    (id: string): Role | undefined => {
      return roles.find((r) => r.id === id);
    },
    [roles]
  );

  const getRoleByType = useCallback(
    (type: RoleType): Role | undefined => {
      return roles.find((r) => r.type === type);
    },
    [roles]
  );

  const value: PermissionContextValue = {
    roles,
    currentRole,
    permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canAccess,
    getRoleById,
    getRoleByType,
    isLoading,
    error,
    refreshRoles: fetchRoles,
  };

  return <PermissionContext.Provider value={value}>{children}</PermissionContext.Provider>;
}

export function usePermission(): PermissionContextValue {
  const context = useContext(PermissionContext);
  if (context === undefined) {
    throw new Error("usePermission must be used within a PermissionProvider");
  }
  return context;
}

export function useHasPermission(): (permission: Permission) => boolean {
  const { hasPermission } = usePermission();
  return hasPermission;
}

export function useHasAnyPermission(): (permissions: Permission[]) => boolean {
  const { hasAnyPermission } = usePermission();
  return hasAnyPermission;
}

export function useCanAccess(): (resource: string, action: "read" | "write" | "delete") => boolean {
  const { canAccess } = usePermission();
  return canAccess;
}

export function useCurrentRole(): Role | null {
  const { currentRole } = usePermission();
  return currentRole;
}

export { SUPER_ADMIN_ROLE };