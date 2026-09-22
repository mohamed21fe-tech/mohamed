import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, UserRole } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  loginWithPinOrUsername: (identifier: string) => Promise<boolean>;
  logout: () => void;
  switchRoleQuick: (role: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_USER_STORAGE = 'alshami_active_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check saved session or default to Ahmad Al-Shami (Waiter) for instant mobile readiness
    try {
      const saved = localStorage.getItem(DEMO_USER_STORAGE);
      if (saved) {
        setUser(JSON.parse(saved));
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

   const loginWithPinOrUsername = async (identifier: string, section: string) => {
    const response = await api.login(identifier, section);
    
    if (response.success && response.user) {
      setUser(response.user);
      localStorage.setItem('restaurant_user', JSON.stringify(response.user));
      return { success: true };
    }
    
    return { success: false, error: response.error };
  };

  const switchRoleQuick = async (targetRole: UserRole) => {
    const users = await api.getUsers();
    const found = users.find((u) => u.role === targetRole);
    if (found) {
      setUser(found);
      localStorage.setItem(DEMO_USER_STORAGE, JSON.stringify(found));
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(DEMO_USER_STORAGE);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        loginWithPinOrUsername,
        logout,
        switchRoleQuick,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
