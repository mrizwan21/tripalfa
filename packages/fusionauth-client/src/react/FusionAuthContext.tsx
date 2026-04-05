/**
 * FusionAuth React Context
 */

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { FusionAuthClient } from '../client.js';
import type { AuthState, LoginOptions, LogoutOptions } from '../types.js';
import type { FusionAuthProviderProps, UseFusionAuthReturn, LoginResult } from './types.js';

const FusionAuthContext = createContext<UseFusionAuthReturn | null>(null);

/**
 * FusionAuth Provider Component
 */
export function FusionAuthProvider({
  children,
  fallback,
  loadingComponent,
  ...config
}: FusionAuthProviderProps) {
  const [client] = useState(() => new FusionAuthClient(config));
  const [state, setState] = useState<AuthState>(client.getState());

  useEffect(() => {
    const unsubscribe = client.addEventListener((_event) => {
      setState(client.getState());
    });

    return unsubscribe;
  }, [client]);

  const login = useCallback((options?: LoginOptions) => {
    client.login(options);
  }, [client]);

  const loginWithCredentials = useCallback(
    async (email: string, password: string, userType?: 'B2B' | 'B2C') => {
      return client.loginWithCredentials(email, password, userType);
    },
    [client]
  );

  const logout = useCallback(async (options?: LogoutOptions) => {
    await client.logout(options);
  }, [client]);

  const getAccessToken = useCallback(async () => {
    return client.getAccessToken();
  }, [client]);

  const refreshTokens = useCallback(async () => {
    return client.refreshTokens();
  }, [client]);

  const fetchUserInfo = useCallback(async () => {
    return client.fetchUserInfo();
  }, [client]);

  const handleCallback = useCallback(
    async (code: string, state?: string): Promise<LoginResult> => {
      return client.handleCallback(code, state);
    },
    [client]
  );

  const value = useMemo<UseFusionAuthReturn>(
    () => ({
      isAuthenticated: state.isAuthenticated,
      isLoading: state.isLoading,
      user: state.user,
      tokens: state.tokens,
      error: state.error,
      login,
      loginWithCredentials,
      logout,
      getAccessToken,
      refreshTokens,
      fetchUserInfo,
      handleCallback,
    }),
    [state, login, loginWithCredentials, logout, getAccessToken, refreshTokens, fetchUserInfo, handleCallback]
  );

  if (state.isLoading && loadingComponent) {
    return <>{loadingComponent}</>;
  }

  if (!state.isAuthenticated && fallback) {
    return <FusionAuthContext.Provider value={value}>{fallback}</FusionAuthContext.Provider>;
  }

  return <FusionAuthContext.Provider value={value}>{children}</FusionAuthContext.Provider>;
}

/**
 * Hook to use FusionAuth
 */
export function useFusionAuth(): UseFusionAuthReturn {
  const context = useContext(FusionAuthContext);
  if (!context) {
    throw new Error('useFusionAuth must be used within a FusionAuthProvider');
  }
  return context;
}