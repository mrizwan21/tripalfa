import React, { ReactNode } from 'react';
import { useRulePermissions } from '../hooks/useRulePermissions';

interface RulePermissionGuardProps {
  permission?: string;
  permissions?: string[];
  requireAll?: boolean;
  fallback?: ReactNode;
  children: ReactNode;
}

/**
 * Permission guard component for rule management operations
 * Provides fine-grained access control for rule-related UI elements
 */
export const RulePermissionGuard: React.FC<RulePermissionGuardProps> = ({
  permission,
  permissions = [],
  requireAll = false,
  fallback = null,
  children
}) => {
  const {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isLoading,
    error
  } = useRulePermissions();

  // Handle loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600 text-sm" >
          Permission check failed: {error}
        </p>
      </div>
    );
  }

  // Check permissions
  let hasAccess = false;

  if (permission) {
    hasAccess = hasPermission(permission);
  } else if (permissions.length > 0) {
    hasAccess = requireAll 
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions);
  }

  // Render based on access
  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

/**
 * Higher-order component for rule permission protection
 */
export function withRulePermission<P extends object>(
  Component: React.ComponentType<P>,
  permission: string,
  fallback?: ReactNode
) {
  return function ProtectedComponent(props: P) {
    return (
      <RulePermissionGuard permission={permission} fallback={fallback}>
        <Component {...props} />
      </RulePermissionGuard>
    );
  };
}

/**
 * Specific permission guards for common rule operations
 */
export const RuleViewGuard: React.FC<{ children: ReactNode; fallback?: ReactNode }> = ({
  children,
  fallback
}) => (
  <RulePermissionGuard
    permissions={[
      'rule:markup:view',
      'rule:commission:view', 
      'rule:coupon:view',
      'rule:airline_deal:view'
    ]}
    fallback={fallback}
  >
    {children}
  </RulePermissionGuard>
);

export const RuleCreateGuard: React.FC<{ children: ReactNode; fallback?: ReactNode }> = ({
  children,
  fallback
}) => (
  <RulePermissionGuard
    permissions={[
      'rule:markup:create',
      'rule:commission:create',
      'rule:coupon:create', 
      'rule:airline_deal:create'
    ]}
    fallback={fallback}
  >
    {children}
  </RulePermissionGuard>
);

export const RuleEditGuard: React.FC<{ children: ReactNode; fallback?: ReactNode }> = ({
  children,
  fallback
}) => (
  <RulePermissionGuard
    permissions={[
      'rule:markup:edit',
      'rule:commission:edit',
      'rule:coupon:edit',
      'rule:airline_deal:edit'
    ]}
    fallback={fallback}
  >
    {children}
  </RulePermissionGuard>
);

export const RuleDeleteGuard: React.FC<{ children: ReactNode; fallback?: ReactNode }> = ({
  children,
  fallback
}) => (
  <RulePermissionGuard
    permissions={[
      'rule:markup:delete',
      'rule:commission:delete',
      'rule:coupon:delete',
      'rule:airline_deal:delete'
    ]}
    fallback={fallback}
  >
    {children}
  </RulePermissionGuard>
);

export const RuleManageGuard: React.FC<{ children: ReactNode; fallback?: ReactNode }> = ({
  children,
  fallback
}) => (
  <RulePermissionGuard
    permissions={[
      'rule:markup:manage',
      'rule:commission:manage',
      'rule:coupon:manage',
      'rule:airline_deal:manage'
    ]}
    fallback={fallback}
  >
    {children}
  </RulePermissionGuard>
);

/**
 * Category-specific permission guards
 */
export const MarkupGuard: React.FC<{ 
  permission: 'view' | 'create' | 'edit' | 'delete' | 'manage';
  children: ReactNode;
  fallback?: ReactNode;
}> = ({ permission, children, fallback }) => {
  const permissionMap = {
    view: 'rule:markup:view',
    create: 'rule:markup:create',
    edit: 'rule:markup:edit',
    delete: 'rule:markup:delete',
    manage: 'rule:markup:manage'
  };

  return (
    <RulePermissionGuard
      permission={permissionMap[permission]}
      fallback={fallback}
    >
      {children}
    </RulePermissionGuard>
  );
};

export const CommissionGuard: React.FC<{ 
  permission: 'view' | 'create' | 'edit' | 'delete' | 'manage';
  children: ReactNode;
  fallback?: ReactNode;
}> = ({ permission, children, fallback }) => {
  const permissionMap = {
    view: 'rule:commission:view',
    create: 'rule:commission:create',
    edit: 'rule:commission:edit',
    delete: 'rule:commission:delete',
    manage: 'rule:commission:manage'
  };

  return (
    <RulePermissionGuard
      permission={permissionMap[permission]}
      fallback={fallback}
    >
      {children}
    </RulePermissionGuard>
  );
};

export const CouponGuard: React.FC<{ 
  permission: 'view' | 'create' | 'edit' | 'delete' | 'manage';
  children: ReactNode;
  fallback?: ReactNode;
}> = ({ permission, children, fallback }) => {
  const permissionMap = {
    view: 'rule:coupon:view',
    create: 'rule:coupon:create',
    edit: 'rule:coupon:edit',
    delete: 'rule:coupon:delete',
    manage: 'rule:coupon:manage'
  };

  return (
    <RulePermissionGuard
      permission={permissionMap[permission]}
      fallback={fallback}
    >
      {children}
    </RulePermissionGuard>
  );
};

export const AirlineDealGuard: React.FC<{ 
  permission: 'view' | 'create' | 'edit' | 'delete' | 'manage';
  children: ReactNode;
  fallback?: ReactNode;
}> = ({ permission, children, fallback }) => {
  const permissionMap = {
    view: 'rule:airline_deal:view',
    create: 'rule:airline_deal:create',
    edit: 'rule:airline_deal:edit',
    delete: 'rule:airline_deal:delete',
    manage: 'rule:airline_deal:manage'
  };

  return (
    <RulePermissionGuard
      permission={permissionMap[permission]}
      fallback={fallback}
    >
      {children}
    </RulePermissionGuard>
  );
};