import React, { useState, useEffect, useContext, createContext } from 'react';

// Mock user data for development
const mockUser = {
  id: 'user_123',
  name: 'John Doe',
  email: 'john.doe@example.com',
  role: 'SUPER_ADMIN',
  companyId: 'company_123',
  permissions: [
    'company:companies:manage',
    'company:departments:manage',
    'company:kyc:documents:manage',
    'company:virtual_card:cards:manage'
  ],
  avatar: 'https://via.placeholder.com/40x40',
  lastLogin: '2024-01-01T10:00:00Z'
};

// Auth Context
export interface AuthContextType {
  user: typeof mockUser | null;
  userId: string | null; // Compatibility
  setUserId: (id: string | null) => void; // Compatibility
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (userData: Partial<typeof mockUser>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth Provider Component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<typeof mockUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  console.log('AuthProvider rendering, isLoading:', isLoading);

  useEffect(() => {
    const loadUser = async () => {
      console.log('AuthProvider loadUser starting');
      setIsLoading(true);
      try {
        console.log('AuthProvider setting mock user');
        setUser(mockUser);
      } catch (error) {
        console.error('Failed to load user:', error);
      } finally {
        console.log('AuthProvider loadUser finished');
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  if (isLoading) {
    console.log('AuthProvider returning loading indicator due to isLoading');
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '24px',
        fontFamily: 'sans-serif',
        backgroundColor: '#f0f0f0'
      }}>
        Loading Authentication...
      </div>
    );
  }

  console.log('AuthProvider ready');

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      if (email === 'admin@example.com' && password === 'password') {
        setUser(mockUser);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
  };

  const updateUser = (userData: Partial<typeof mockUser>) => {
    setUser(prevUser => (prevUser ? { ...prevUser, ...userData } : null));
  };

  const setUserId = (id: string | null) => {
    if (id) {
      setUser({ ...mockUser, id });
    } else {
      setUser(null);
    }
  };

  const value: AuthContextType = {
    user,
    userId: user?.id || null,
    setUserId,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Auth Hook
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
