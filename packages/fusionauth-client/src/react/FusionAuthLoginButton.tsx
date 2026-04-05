/**
 * FusionAuth Login Button Component
 */

import React from 'react';
import { useFusionAuth } from './FusionAuthContext.js';
import type { LoginOptions } from '../types.js';

interface FusionAuthLoginButtonProps extends LoginOptions {
  children?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  variant?: 'default' | 'outline' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function FusionAuthLoginButton({
  children,
  className,
  disabled,
  userType,
  state,
  redirectUri,
  ...props
}: FusionAuthLoginButtonProps) {
  const { login, isLoading } = useFusionAuth();

  const handleClick = () => {
    login({ userType, state, redirectUri });
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled || isLoading}
      className={className}
      {...props}
    >
      {children || (isLoading ? 'Signing in...' : 'Sign In')}
    </button>
  );
}