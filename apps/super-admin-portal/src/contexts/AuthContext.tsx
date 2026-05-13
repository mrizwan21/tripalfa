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

const fusionAuthUrl = import.meta.env.VITE_FUSIONAUTH_URL || '';
const fusionAuthApiKey = import.meta.env.VITE_FUSIONAUTH_API_KEY || '';

if (!fusionAuthUrl || !fusionAuthApiKey) {
  console.warn('Missing FusionAuth environment variables');
}

const authService = new FusionAuthService({
  baseUrl: fusionAuthUrl || 'http://localhost:9011',
  apiKey: fusionAuthApiKey || 'test-api-key',
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const validateToken = async () => {
      const storedToken = localStorage.getItem('authToken');

      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const baseUrl = fusionAuthUrl || 'http://localhost:9011';
        const response = await fetch(`${baseUrl}/oauth2/userinfo`, {
          headers: {
            Authorization: `Bearer ${storedToken}`,
          },
        });

        if (response.ok) {
          const storedUser = localStorage.getItem('authUser');
          if (storedUser) {
            try {
              const userData = JSON.parse(storedUser);
              setToken(storedToken);
              setUser(userData);
            } catch (parseError) {
              if (import.meta.env.DEV) console.error('Failed to parse stored user', parseError);
              localStorage.removeItem('authToken');
              localStorage.removeItem('authUser');
            }
          }
        } else {
          localStorage.removeItem('authToken');
          localStorage.removeItem('authUser');
        }
      } catch (e) {
        if (import.meta.env.DEV) console.error('Token validation failed', e);
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
      } finally {
        setIsLoading(false);
      }
    };

    validateToken();
  }, []);

    const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const result = await authService.login(email, password);
      const token = result.token || '';
      localStorage.setItem('authToken', token);
      const userData: User = {
        id: result.userId || result.id || 'temp',
        email,
        firstName: result.firstName || email.split('@')[0],
        lastName: result.lastName || '',
        roles: result.roles || [],
        tenantId: result.tenantId || '',
        isAdmin: result.isAdmin || false,
      };
      localStorage.setItem('authUser', JSON.stringify(userData));
      setToken(token);
      setUser(userData);
    } catch (error) {
      if (import.meta.env.DEV) console.error('Login failed', error);
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