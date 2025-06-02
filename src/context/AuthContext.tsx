
'use client';

import { createContext, useContext, useState, type ReactNode, useEffect, useCallback } from 'react';
import type { UserRole, AppUser } from '@/lib/types';

interface AuthContextType {
  user: AppUser | null;
  role: UserRole | null;
  isAdmin: boolean;
  isPharmacist: boolean;
  isTechnician: boolean;
  loading: boolean;
  loginUser: (email: string, role: UserRole) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const loginUser = useCallback((email: string, role: UserRole) => {
    const simulatedUser: AppUser = {
      uid: `hardcoded-${role}-${Date.now()}`,
      email: email,
      role: role,
      source: 'hardcoded',
    };
    setUser(simulatedUser);
    localStorage.setItem('loggedInUser', JSON.stringify(simulatedUser));
    setLoading(false);
    console.log(`[AuthContext] User logged in. Email: ${email}, Role: ${role}`);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('loggedInUser');
    setLoading(false);
    console.log('[AuthContext] User logged out.');
  }, []);

  useEffect(() => {
    setLoading(true);
    console.log('[AuthContext] Initializing auth state.');
    try {
      const storedUser = localStorage.getItem('loggedInUser');
      if (storedUser) {
        const parsedUser: AppUser = JSON.parse(storedUser);
        setUser(parsedUser);
        console.log('[AuthContext] Restored user session:', parsedUser);
      }
    } catch (e) {
      console.error('[AuthContext] Error reading from localStorage:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const role = user?.role || null;
  const isAdmin = role === 'admin';
  const isPharmacist = role === 'pharmacist';
  const isTechnician = role === 'technician';

  console.log('[AuthContext] Provider render. Email:', user?.email, 'Role:', role, 'Loading:', loading);

  return (
    <AuthContext.Provider value={{ user, role, isAdmin, isPharmacist, isTechnician, loading, loginUser, logout }}>
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
