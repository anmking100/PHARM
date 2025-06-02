
'use client';

import { createContext, useContext, useState, type ReactNode, useEffect, useCallback } from 'react';

// Define a simpler user type for our hardcoded scenario
interface AppUser {
  uid: string;
  email: string;
  // Add any other user properties you might need from a real User object
}

interface AuthContextType {
  user: AppUser | null;
  isAdmin: boolean;
  loading: boolean;
  login: (userData: { uid: string; email: string; isAdmin?: boolean }) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const HARDCODED_ADMIN_EMAIL = 'admin@example.com';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true); // Start as true to check for persisted session

  // Simulate checking for a persisted session on initial load (e.g., from localStorage)
  useEffect(() => {
    console.log('[AuthContext] Initializing, checking for persisted session.');
    const storedUser = localStorage.getItem('loggedInUser');
    if (storedUser) {
      try {
        const parsedUser: AppUser = JSON.parse(storedUser);
        if (parsedUser && parsedUser.email) {
            console.log('[AuthContext] Found persisted user:', parsedUser.email);
            setUser(parsedUser);
            if (parsedUser.email.toLowerCase() === HARDCODED_ADMIN_EMAIL.toLowerCase()) {
                console.log('[AuthContext] Persisted user is admin.');
                setIsAdmin(true);
            }
        }
      } catch (e) {
        console.error('[AuthContext] Error parsing stored user:', e);
        localStorage.removeItem('loggedInUser');
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback((userData: { uid: string; email: string; isAdmin?: boolean }) => {
    console.log('[AuthContext] login function called for:', userData.email);
    const appUser: AppUser = { uid: userData.uid, email: userData.email };
    setUser(appUser);
    localStorage.setItem('loggedInUser', JSON.stringify(appUser));

    if (userData.email.toLowerCase() === HARDCODED_ADMIN_EMAIL.toLowerCase()) {
      console.log('[AuthContext] User is hardcoded admin. Setting isAdmin = true.');
      setIsAdmin(true);
    } else {
      setIsAdmin(false); // Ensure isAdmin is false for non-admin users
    }
    setLoading(false); // Ensure loading is false after login attempt
  }, []);

  const logout = useCallback(() => {
    console.log('[AuthContext] logout function called.');
    setUser(null);
    setIsAdmin(false);
    localStorage.removeItem('loggedInUser');
    setLoading(false); // Ensure loading is false
     // Optionally, redirect to login page using window.location or a router instance if available here
    // For now, components will handle redirection based on user state.
  }, []);
  
  console.log('[AuthContext] Rendering Provider. User:', user?.email, 'IsAdmin:', isAdmin, 'Loading:', loading);

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, login, logout }}>
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
