import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { FusionAuthService } from '@tripalfa/auth-client';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  tenantId?: string;
  isAdmin: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const authService = new FusionAuthService({
  baseUrl: import.meta.env.VITE_FUSIONAUTH_URL || 'http://localhost:9011',
  apiKey: import.meta.env.VITE_FUSIONAUTH_API_KEY || 'test-api-key',
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('authToken'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if token exists and validate it
    const storedToken = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('authUser');
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Failed to parse stored user', e);
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const result = await authService.login(email, password);
      localStorage.setItem('authToken', result.token);
      const userData: User = {
        id: 'temp', // Would come from auth service response
        email,
        firstName: '', // Would come from response
        lastName: '',
        roles: result.roles || [],
        tenantId: result.tenantId,
        isAdmin: result.isAdmin || false,
      };
      localStorage.setItem('authUser', JSON.stringify(userData));
      setToken(result.token);
      setUser(userData);
    } catch (error) {
      console.error('Login failed', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    setToken(null);
    setUser(null);
    window.location.href = '/login';
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    login,
    logout,
    isAuthenticated: !!token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export { AuthContext };