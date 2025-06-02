
'use client';

import type { User } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { auth } from '@/lib/firebase/client';
import { onAuthStateChanged, type IdTokenResult } from 'firebase/auth';

interface AuthContextType {
  user: User | null;
  claims: IdTokenResult['claims'] | null;
  isAdmin: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [claims, setClaims] = useState<IdTokenResult['claims'] | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        try {
          const idTokenResult = await currentUser.getIdTokenResult(true); // Force refresh to get latest claims
          setClaims(idTokenResult.claims);
          setIsAdmin(!!idTokenResult.claims.admin); // Check for 'admin: true' claim
          console.log('User claims:', idTokenResult.claims);
        } catch (error) {
          console.error("Error fetching user claims:", error);
          setClaims(null);
          setIsAdmin(false);
        }
      } else {
        setUser(null);
        setClaims(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading && !user) { // Show loader only on initial app load when user state is unknown
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <svg className="animate-spin h-10 w-10 text-primary mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-muted-foreground">Loading application...</p>
      </div>
    );
  }

  return <AuthContext.Provider value={{ user, claims, isAdmin, loading }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
