import React, { useContext } from 'react';
import { useAuth } from '../contexts/AuthContext';

// Re-export hooks that depend on useAuth
export { useAuth };

// Permission Hook
export const usePermissions = () => {
  const { user } = useAuth();

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    return user.permissions.includes(permission);
  };

  const hasAnyPermission = (permissions: string[]): boolean => {
    if (!user) return false;
    return permissions.some(permission => user.permissions.includes(permission));
  };

  const hasAllPermissions = (permissions: string[]): boolean => {
    if (!user) return false;
    return permissions.every(permission => user.permissions.includes(permission));
  };

  const canManagePermissions = (): boolean => {
    return user?.role === 'SUPER_ADMIN';
  };

  const canViewAuditLogs = (): boolean => {
    return ['SUPER_ADMIN', 'ADMIN'].includes(user?.role || '');
  };

  const canCreateRoles = (): boolean => {
    return user?.role === 'SUPER_ADMIN';
  };

  const canDeleteRoles = (): boolean => {
    return user?.role === 'SUPER_ADMIN';
  };

  const canUpdateRoles = (): boolean => {
    return user?.role === 'SUPER_ADMIN';
  };

  const canCreatePermissions = (): boolean => {
    return user?.role === 'SUPER_ADMIN';
  };

  const canDeletePermissions = (): boolean => {
    return user?.role === 'SUPER_ADMIN';
  };

  const canUpdatePermissions = (): boolean => {
    return user?.role === 'SUPER_ADMIN';
  };

  return {
    user,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canManagePermissions,
    canViewAuditLogs,
    canCreateRoles,
    canDeleteRoles,
    canUpdateRoles,
    canCreatePermissions,
    canDeletePermissions,
    canUpdatePermissions
  };
};

// Role-based Access Control Hook
export const useRBAC = () => {
  const { user } = useAuth();

  const isAdmin = (): boolean => {
    return user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';
  };

  const isSuperAdmin = (): boolean => {
    return user?.role === 'SUPER_ADMIN';
  };

  const isB2B = (): boolean => {
    return user?.role === 'B2B';
  };

  const isViewer = (): boolean => {
    return user?.role === 'VIEWER';
  };

  const hasRole = (role: string): boolean => {
    return user?.role === role;
  };

  const hasAnyRole = (roles: string[]): boolean => {
    return roles.includes(user?.role || '');
  };

  return {
    user,
    isAdmin,
    isSuperAdmin,
    isB2B,
    isViewer,
    hasRole,
    hasAnyRole
  };
};

// Company Access Hook
export const useCompanyAccess = () => {
  const { user } = useAuth();

  const canAccessCompany = (companyId: string): boolean => {
    if (!user) return false;
    if (user.role === 'SUPER_ADMIN') return true;
    return user.companyId === companyId;
  };

  const canManageCompany = (companyId: string): boolean => {
    if (!user) return false;
    if (user.role === 'SUPER_ADMIN') return true;
    return user.role === 'ADMIN' && user.companyId === companyId;
  };

  const canViewCompany = (companyId: string): boolean => {
    if (!user) return false;
    return user.companyId === companyId;
  };

  return {
    user,
    canAccessCompany,
    canManageCompany,
    canViewCompany
  };
};
