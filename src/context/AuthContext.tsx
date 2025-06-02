
'use client';

import { createContext, useContext, useState, type ReactNode, useEffect, useCallback } from 'react';
import { type User as FirebaseUser, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { auth as firebaseAuthClient } from '@/lib/firebase/client'; // Firebase client auth instance
import type { UserRole } from '@/lib/types';

interface HardcodedAdminUser {
  uid: string;
  email: string;
  source: 'hardcoded';
}

// This AppUser type will now represent the structure of our user object in the context
export type AppUser = (FirebaseUser & { source: 'firebase'; customClaims?: { role?: UserRole, admin?: boolean } }) | (HardcodedAdminUser & { customClaims?: { role?: UserRole, admin?: boolean } });


interface AuthContextType {
  user: AppUser | null;
  isAdmin: boolean;
  loading: boolean;
  loginHardcodedAdmin: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  // We don't need a specific firebaseLogin function here,
  // as onAuthStateChanged will handle Firebase user logins.
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const HARDCODED_ADMIN_EMAIL = 'admin@example.com';
const HARDCODED_ADMIN_PASSWORD = 'password123';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  const loginHardcodedAdmin = useCallback(async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    console.log('[AuthContext] Attempting hardcoded admin login for:', email);
    if (email.toLowerCase() === HARDCODED_ADMIN_EMAIL && pass === HARDCODED_ADMIN_PASSWORD) {
      const hardcodedUser: AppUser = {
        uid: 'hardcoded-admin-uid',
        email: HARDCODED_ADMIN_EMAIL,
        source: 'hardcoded',
        customClaims: { admin: true, role: 'admin' }
      };
      setUser(hardcodedUser);
      setIsAdmin(true);
      localStorage.setItem('loggedInUserType', 'hardcoded');
      localStorage.setItem('hardcodedAdminUser', JSON.stringify(hardcodedUser));
      console.log('[AuthContext] Hardcoded admin login successful.');
      setLoading(false);
      return { success: true };
    }
    setLoading(false);
    return { success: false, error: 'Invalid credentials for hardcoded admin.' };
  }, []);

  const logout = useCallback(async () => {
    console.log('[AuthContext] logout function called. Current user source:', user?.source);
    if (user?.source === 'firebase') {
      await firebaseSignOut(firebaseAuthClient);
      // onAuthStateChanged will handle resetting user and isAdmin state
    } else if (user?.source === 'hardcoded') {
      setUser(null);
      setIsAdmin(false);
      localStorage.removeItem('loggedInUserType');
      localStorage.removeItem('hardcodedAdminUser');
    }
    // If user is null already, do nothing
    if (!user) {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    console.log('[AuthContext] Initializing and setting up onAuthStateChanged listener.');
    setLoading(true);
    const storedUserType = localStorage.getItem('loggedInUserType');

    if (storedUserType === 'hardcoded') {
      const storedAdmin = localStorage.getItem('hardcodedAdminUser');
      if (storedAdmin) {
        try {
          const parsedAdmin: AppUser = JSON.parse(storedAdmin);
          if (parsedAdmin.source === 'hardcoded' && parsedAdmin.email.toLowerCase() === HARDCODED_ADMIN_EMAIL) {
            setUser(parsedAdmin);
            setIsAdmin(true);
            console.log('[AuthContext] Restored hardcoded admin session.');
          }
        } catch (e) {
          localStorage.removeItem('hardcodedAdminUser');
          localStorage.removeItem('loggedInUserType');
        }
      }
    }

    const unsubscribe = onAuthStateChanged(firebaseAuthClient, async (firebaseUser: FirebaseUser | null) => {
      // Only process Firebase users if a hardcoded admin is not already in control
      const currentSessionIsHardcoded = localStorage.getItem('loggedInUserType') === 'hardcoded';

      if (currentSessionIsHardcoded && firebaseUser) {
         console.log('[AuthContext] Hardcoded admin session active, ignoring Firebase auth state change for user:', firebaseUser.email);
         // Potentially sign out the Firebase user if a hardcoded session is active and a Firebase session tries to start.
         // Or, decide which session takes precedence. For now, hardcoded takes precedence if already set.
         setLoading(false);
         return;
      }
      
      if (firebaseUser) {
        console.log('[AuthContext] Firebase user logged in:', firebaseUser.email);
        // Fetch custom claims
        const idTokenResult = await firebaseUser.getIdTokenResult(true); // Force refresh
        const claims = idTokenResult.claims;
        
        setUser({ ...firebaseUser, source: 'firebase', customClaims: { role: claims.role as UserRole, admin: claims.admin as boolean } });
        setIsAdmin(!!claims.admin); // Regular Firebase users are admin only if claim says so
        localStorage.setItem('loggedInUserType', 'firebase');
        localStorage.removeItem('hardcodedAdminUser');
      } else {
        // Only clear user if not a hardcoded admin session
        if (!currentSessionIsHardcoded) {
            console.log('[AuthContext] No Firebase user logged in, and no hardcoded admin session active.');
            setUser(null);
            setIsAdmin(false);
            localStorage.removeItem('loggedInUserType');
        }
      }
      setLoading(false);
    });
    
    // Cleanup subscription on unmount
    return () => {
      console.log('[AuthContext] Unsubscribing from onAuthStateChanged.');
      unsubscribe();
    };
  }, []); // Empty dependency array ensures this runs once on mount

  console.log('[AuthContext] Rendering Provider. User:', user?.email, 'IsAdmin:', isAdmin, 'Loading:', loading);

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, loginHardcodedAdmin, logout }}>
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
