
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

const HARDCODED_ADMIN_EMAIL = 'admin@example.com';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [claims, setClaims] = useState<IdTokenResult['claims'] | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState(true); // Initialize to true

  useEffect(() => {
    console.log('[AuthContext] Setting up onAuthStateChanged listener.');
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true); // Set loading true at the start of processing auth state
      if (currentUser) {
        const userEmail = currentUser.email;
        console.log('[AuthContext] onAuthStateChanged - User detected:', userEmail);

        const isHardcodedAdmin = userEmail?.toLowerCase() === HARDCODED_ADMIN_EMAIL.toLowerCase();
        let newIsAdmin = false;

        if (isHardcodedAdmin) {
          console.log(`[AuthContext] User ${userEmail} IS the hardcoded admin.`);
          newIsAdmin = true;
          setClaims({ admin: true }); // Simulate admin claim for consistency
        } else {
          console.log(`[AuthContext] User ${userEmail} is NOT the hardcoded admin. Will check for Firebase claims if needed, but isAdmin set to false for this path.`);
          newIsAdmin = false; // Explicitly false for non-hardcoded admin
          // For non-hardcoded admin, you might still want to fetch other claims if your app uses them
          // For now, we are only hardcoding admin@example.com as admin.
          try {
            const idTokenResult = await currentUser.getIdTokenResult(true); // Force refresh for claims
            const userClaims = idTokenResult.claims;
            console.log('[AuthContext] Firebase claims for non-admin user:', userEmail, userClaims);
            setClaims(userClaims);
          } catch (error) {
            console.error("[AuthContext] Error fetching user claims for non-admin user:", userEmail, error);
            setClaims(null);
          }
        }
        setUser(currentUser); // Set user before isAdmin for dependent effects
        setIsAdmin(newIsAdmin);
        console.log(`[AuthContext] States PRE-setLoading(false): user.email=${currentUser?.email}, newIsAdmin=${newIsAdmin}`);
      } else {
        console.log('[AuthContext] onAuthStateChanged - No user logged in.');
        setUser(null);
        setClaims(null);
        setIsAdmin(false);
        console.log(`[AuthContext] States PRE-setLoading(false) (no user): user=null, isAdmin=false`);
      }
      setLoading(false);
      console.log('[AuthContext] Auth state processing complete. Loading set to false.');
    });
    return () => {
      console.log('[AuthContext] Cleaning up onAuthStateChanged listener.');
      unsubscribe();
    }
  }, []);

  // This initial loading screen is for the very first app load, before onAuthStateChanged has fired.
  if (loading && user === null && auth.currentUser === null) { // More precise condition for initial load
    console.log('[AuthContext] Displaying initial application loading screen (Auth context not yet initialized).');
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

  console.log('[AuthContext] Rendering Provider with values: user.email=', user?.email, 'isAdmin=', isAdmin, 'loading=', loading);
  return <AuthContext.Provider value={{ user, claims, isAdmin, loading }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
