
'use client';

import { createContext, useContext, useState, type ReactNode, useEffect, useCallback } from 'react';
import type { UserRole } from '@/lib/types';

// Simplified AppUser for hardcoded admin
export interface AppUser {
  uid: string;
  email: string;
  source: 'hardcoded';
  customClaims?: { role?: UserRole; admin?: boolean };
}

interface AuthContextType {
  user: AppUser | null;
  isAdmin: boolean;
  loading: boolean;
  loginAdmin: () => void; // Simplified login
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const HARDCODED_ADMIN_EMAIL = 'admin@example.com';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  const loginAdmin = useCallback(() => {
    console.log('[AuthContext] Logging in as hardcoded admin.');
    const adminUser: AppUser = {
      uid: 'hardcoded-admin-uid',
      email: HARDCODED_ADMIN_EMAIL,
      source: 'hardcoded',
      customClaims: { admin: true, role: 'admin' },
    };
    setUser(adminUser);
    setIsAdmin(true);
    localStorage.setItem('isHardcodedAdminLoggedIn', 'true');
    setLoading(false);
  }, []);

  const logout = useCallback(() => {
    console.log('[AuthContext] Logging out hardcoded admin.');
    setUser(null);
    setIsAdmin(false);
    localStorage.removeItem('isHardcodedAdminLoggedIn');
    setLoading(false);
  }, []);

  useEffect(() => {
    setLoading(true);
    console.log('[AuthContext] Initializing auth state.');
    try {
      const adminLoggedIn = localStorage.getItem('isHardcodedAdminLoggedIn');
      if (adminLoggedIn === 'true') {
        console.log('[AuthContext] Restoring hardcoded admin session.');
        loginAdmin(); // This will set user, isAdmin, and loading to false
      } else {
        setLoading(false); // Not logged in
      }
    } catch (e) {
      console.error('[AuthContext] Error reading from localStorage:', e);
      setLoading(false);
    }
  }, [loginAdmin]); // loginAdmin is stable

  console.log('[AuthContext] Provider render. User:', user?.email, 'IsAdmin:', isAdmin, 'Loading:', loading);

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, loginAdmin, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
