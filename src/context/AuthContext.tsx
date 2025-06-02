
'use client';

import type { User } from 'firebase/auth'; // Keep type for mock user structure
import { createContext, useContext, useState, type ReactNode, useEffect } from 'react';
// Firebase auth import removed: import { auth } from '@/lib/firebase/client';
// Firebase onAuthStateChanged import removed: import { onAuthStateChanged, type IdTokenResult } from 'firebase/auth';

interface AuthContextType {
  user: User | null;
  claims: Record<string, any> | null; // Simplified claims type
  isAdmin: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create a mock admin user object that matches the Firebase User structure sufficiently
const mockAdminUser = {
  uid: 'hardcoded-admin-uid',
  email: 'admin@example.com',
  emailVerified: true,
  displayName: 'Admin User',
  isAnonymous: false,
  photoURL: null,
  providerData: [],
  metadata: {}, // Add other necessary User properties with mock data
  providerId: 'password', // Mock providerId
  // Mock Firebase User methods - these won't be called but satisfy the type
  getIdToken: async () => 'mock-id-token',
  getIdTokenResult: async () => ({
    token: 'mock-id-token',
    expirationTime: '',
    authTime: '',
    issuedAtTime: '',
    signInProvider: null,
    signInSecondFactor: null,
    claims: { admin: true },
  }),
  reload: async () => {},
  delete: async () => {},
  toJSON: () => ({}),
} as User;


export function AuthProvider({ children }: { children: ReactNode }) {
  // State is now static for the hardcoded admin
  const [user, setUser] = useState<User | null>(mockAdminUser);
  const [claims, setClaims] = useState<Record<string, any> | null>({ admin: true });
  const [isAdmin, setIsAdmin] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false); // Start as false, no async auth check

  useEffect(() => {
    // Simulate that authentication is immediately resolved
    console.log('[AuthContext] Hardcoded admin user initialized.');
    setUser(mockAdminUser);
    setClaims({ admin: true });
    setIsAdmin(true);
    setLoading(false);
  }, []);


  // Initial loading screen can be removed or simplified as auth is immediate
  // if (loading && user === null) { ... }

  console.log('[AuthContext] Rendering Provider with hardcoded values: user.email=', user?.email, 'isAdmin=', isAdmin, 'loading=', loading);
  return <AuthContext.Provider value={{ user, claims, isAdmin, loading }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  // Log what useAuth returns to help diagnose consuming components
  // console.log('[useAuth] Returning context:', context);
  return context;
}
