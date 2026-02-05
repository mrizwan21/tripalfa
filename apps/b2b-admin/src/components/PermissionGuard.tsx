import React from 'react';
import { useMarketingPermissions } from '@/hooks/useMarketingPermissions';
import { toast } from 'sonner';
import { Shield, Lock, AlertTriangle } from 'lucide-react';
import { Button } from './ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/Card';

interface PermissionGuardProps {
  children: React.ReactNode;
  permission?: string;
  permissions?: string[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
  onError?: (message: string) => void;
}

/**
 * PermissionGuard component for protecting routes and components based on user permissions
 */
const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  permission,
  permissions = [],
  requireAll = false,
  fallback,
  onError
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions, isLoading } = useMarketingPermissions();

  // Determine if user has required permissions
  const hasRequiredPermissions = React.useMemo(() => {
    if (permission) {
      return hasPermission(permission);
    }
    
    if (permissions.length === 0) {
      return true; // No specific permissions required
    }

    if (requireAll) {
      return hasAllPermissions(permissions);
    }

    return hasAnyPermission(permissions);
  }, [permission, permissions, requireAll, hasPermission, hasAnyPermission, hasAllPermissions]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-500 font-medium">Checking permissions...</p>
        </div>
      </div>
    );
  }

  // Show fallback or error if permissions are denied
  if (!hasRequiredPermissions) {
    if (fallback) {
      return <>{fallback}</>;
    }

    const errorMessage = permission 
      ? `Access denied: You need the "${permission}" permission to view this content.`
      : `Access denied: You need one of the following permissions: ${permissions.join(', ')}`;

    onError?.(errorMessage);

    return (
      <Card className="border-none shadow-lg bg-white rounded-3xl overflow-hidden">
        <CardHeader className="bg-red-50/50 border-b border-red-100">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-red-900 font-bold">Access Denied</CardTitle>
              <CardDescription className="text-red-600">You don't have permission to access this content</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex items-start gap-3 mb-4">
            <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
            <p className="text-red-700 text-sm">{errorMessage}</p>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => window.history.back()}
              className="border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300"
            >
              Go Back
            </Button>
            <Button 
              onClick={() => toast.info('Please contact your administrator to request access')}
              className="bg-red-500 hover:bg-red-600 text-white" >
              Request Access
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Render children if permissions are granted
  return <>{children}</>;
};

/**
 * Higher-order component for wrapping components with permission checks
 */
export const withPermissionGuard = <P extends object>(
  Component: React.ComponentType<P>,
  permission: string,
  options?: {
    requireAll?: boolean;
    fallback?: React.ReactNode;
    onError?: (message: string) => void;
  }
) => {
  const WrappedComponent = (props: P) => (
    <PermissionGuard permission={permission} {...options}>
      <Component {...props} />
    </PermissionGuard>
  );

  WrappedComponent.displayName = `withPermissionGuard(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

/**
 * Permission-aware button component that only renders if user has required permissions
 */
interface PermissionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  permission?: string;
  permissions?: string[];
  requireAll?: boolean;
  className?: string;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export const PermissionButton: React.FC<PermissionButtonProps> = ({
  children,
  permission,
  permissions = [],
  requireAll = false,
  onClick,
  className,
  variant = 'default',
  size = 'default',
  ...props
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = useMarketingPermissions();

  // Determine if user has required permissions
  const hasRequiredPermissions = React.useMemo(() => {
    if (permission) {
      return hasPermission(permission);
    }
    
    if (permissions.length === 0) {
      return true; // No specific permissions required
    }

    if (requireAll) {
      return hasAllPermissions(permissions);
    }

    return hasAnyPermission(permissions);
  }, [permission, permissions, requireAll, hasPermission, hasAnyPermission, hasAllPermissions]);

  // Don't render button if user doesn't have permissions
  if (!hasRequiredPermissions) {
    return null;
  }

  return (
    <Button 
      onClick={onClick}
      className={className}
      variant={variant}
      size={size}
      {...props}
    >
      {children}
    </Button>
  );
};

/**
 * Permission-aware menu item component
 */
interface PermissionMenuItemProps {
  children: React.ReactNode;
  permission?: string;
  permissions?: string[];
  requireAll?: boolean;
  onClick?: () => void;
  className?: string;
}

export const PermissionMenuItem: React.FC<PermissionMenuItemProps> = ({
  children,
  permission,
  permissions = [],
  requireAll = false,
  onClick,
  className,
  ...props
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = useMarketingPermissions();

  // Determine if user has required permissions
  const hasRequiredPermissions = React.useMemo(() => {
    if (permission) {
      return hasPermission(permission);
    }
    
    if (permissions.length === 0) {
      return true; // No specific permissions required
    }

    if (requireAll) {
      return hasAllPermissions(permissions);
    }

    return hasAnyPermission(permissions);
  }, [permission, permissions, requireAll, hasPermission, hasAnyPermission, hasAllPermissions]);

  // Don't render menu item if user doesn't have permissions
  if (!hasRequiredPermissions) {
    return null;
  }

  return (
    <div 
      onClick={onClick}
      className={`cursor-pointer ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * Permission status indicator component
 */
interface PermissionStatusProps {
  permission: string;
  label?: string;
  showIcon?: boolean;
}

export const PermissionStatus: React.FC<PermissionStatusProps> = ({
  permission,
  label,
  showIcon = true
}) => {
  const { hasPermission } = useMarketingPermissions();
  const hasPerm = hasPermission(permission);

  return (
    <div className="flex items-center gap-2">
      {showIcon && (
        <div className={`h-3 w-3 rounded-full ${hasPerm ? 'bg-green-500' : 'bg-red-500'}`}></div>
      )}
      <span className={`text-sm font-medium ${hasPerm ? 'text-green-600' : 'text-red-600'}`}>
        {label || permission}: {hasPerm ? 'Allowed' : 'Denied'}
      </span>
    </div>
  );
};

export default PermissionGuard;