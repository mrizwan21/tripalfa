import { createContext, PropsWithChildren, useContext, useMemo, useState } from 'react';
import { matchPath } from 'react-router-dom';
import { routeConfig } from '@/config/routing';
import api from '@/shared/lib/api';

type AccessControlContextValue = {
  token: string | null;
  user: Record<string, any> | null;
  role: string;
  permissions: string[];
  isAuthenticated: boolean;
  setSession: (payload: {
    token: string;
    user?: Record<string, any> | null;
    permissions?: string[];
  }) => void;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (required: string[]) => boolean;
  canAccessRoute: (path: string) => boolean;
  canManageRoute: (path: string) => boolean;
};

const STORAGE_KEYS = {
  token: 'accessToken',
  user: 'b2b_admin_user',
  role: 'b2b_admin_role',
  permissions: 'b2b_admin_permissions',
  rolePermissions: 'b2b_admin_role_permissions',
};

const DEFAULT_ROLE = 'ADMIN';

const defaultValue: AccessControlContextValue = {
  token: null,
  user: null,
  role: DEFAULT_ROLE,
  permissions: [],
  isAuthenticated: false,
  setSession: () => {},
  logout: () => {},
  hasPermission: () => false,
  hasAnyPermission: () => false,
  canAccessRoute: () => false,
  canManageRoute: () => false,
};

const AccessControlContext = createContext<AccessControlContextValue>(defaultValue);

function safeParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function getRolePermissions(role: string): string[] {
  const rolePermissions = safeParse<Record<string, string[]>>(
    localStorage.getItem(STORAGE_KEYS.rolePermissions),
    {}
  );
  return rolePermissions[role] ?? [];
}

function derivePermissions(
  user: Record<string, any> | null,
  role: string,
  explicitPermissions?: string[]
): string[] {
  const fromUser = Array.isArray(user?.permissions) ? user.permissions : [];
  const fromExplicit = Array.isArray(explicitPermissions) ? explicitPermissions : [];
  const fromRole = getRolePermissions(role);
  const combined = [...fromExplicit, ...fromUser, ...fromRole].filter(
    (value): value is string => typeof value === 'string'
  );
  return Array.from(new Set(combined));
}

export function AccessControlProvider({ children }: PropsWithChildren) {
  const initialToken = localStorage.getItem(STORAGE_KEYS.token);
  const initialUser = safeParse<Record<string, any> | null>(
    localStorage.getItem(STORAGE_KEYS.user),
    null
  );
  const initialRole = localStorage.getItem(STORAGE_KEYS.role) || initialUser?.role || DEFAULT_ROLE;
  const initialPermissions = safeParse<string[]>(
    localStorage.getItem(STORAGE_KEYS.permissions),
    []
  );

  const [token, setToken] = useState<string | null>(initialToken);
  const [user, setUser] = useState<Record<string, any> | null>(initialUser);
  const [role, setRole] = useState<string>(initialRole);
  const [permissions, setPermissions] = useState<string[]>(
    initialPermissions.length ? initialPermissions : derivePermissions(initialUser, initialRole)
  );

  const setSession: AccessControlContextValue['setSession'] = ({
    token: nextToken,
    user: nextUser,
    permissions: nextPermissions,
  }) => {
    const resolvedUser = nextUser ?? null;
    const resolvedRole = String(resolvedUser?.role || DEFAULT_ROLE);
    const resolvedPermissions = derivePermissions(resolvedUser, resolvedRole, nextPermissions);

    localStorage.setItem(STORAGE_KEYS.token, nextToken);
    localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(resolvedUser));
    localStorage.setItem(STORAGE_KEYS.role, resolvedRole);
    localStorage.setItem(STORAGE_KEYS.permissions, JSON.stringify(resolvedPermissions));

    setToken(nextToken);
    setUser(resolvedUser);
    setRole(resolvedRole);
    setPermissions(resolvedPermissions);
  };

  const logout = async () => {
    const token = localStorage.getItem(STORAGE_KEYS.token);

    if (token) {
      try {
        await api.post(
          '/auth/fusionauth/logout',
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      } catch (error) {
        console.error('FusionAuth logout error:', error);
      }
    }

    localStorage.removeItem(STORAGE_KEYS.token);
    localStorage.removeItem(STORAGE_KEYS.user);
    localStorage.removeItem(STORAGE_KEYS.role);
    localStorage.removeItem(STORAGE_KEYS.permissions);

    setToken(null);
    setUser(null);
    setRole(DEFAULT_ROLE);
    setPermissions([]);
  };

  const hasPermission = (permission: string): boolean => {
    if (!permission) return true;
    if (permissions.includes('*')) return true;
    return permissions.includes(permission);
  };

  const hasAnyPermission = (required: string[]): boolean => {
    if (!required?.length) return true;
    return required.some(permission => hasPermission(permission));
  };

  const getMatchedRoute = (path: string) => {
    return routeConfig.find(route => matchPath({ path: route.path, end: true }, path));
  };

  const canAccessRoute = (path: string): boolean => {
    const matchedRoute = getMatchedRoute(path);
    if (!matchedRoute?.permissions?.length) return true;
    return hasAnyPermission(matchedRoute.permissions);
  };

  const canManageRoute = (path: string): boolean => {
    const matchedRoute = getMatchedRoute(path);
    if (!matchedRoute?.permissions?.length) return false;
    const managePermissions = matchedRoute.permissions.filter(permission =>
      permission.includes(':manage')
    );
    return managePermissions.length > 0 && hasAnyPermission(managePermissions);
  };

  const value = useMemo(
    () => ({
      token,
      user,
      role,
      permissions,
      isAuthenticated: Boolean(token),
      setSession,
      logout,
      hasPermission,
      hasAnyPermission,
      canAccessRoute,
      canManageRoute,
    }),
    [token, user, role, permissions]
  );

  return <AccessControlContext.Provider value={value}>{children}</AccessControlContext.Provider>;
}

export function useAccessControl() {
  return useContext(AccessControlContext);
}
