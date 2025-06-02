
'use client';

import type { User } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { auth } from '@/lib/firebase/client';
import { onAuthStateChanged, type IdTokenResult } from 'firebase/auth';

interface AuthContextType {
  user: User | null;
  claims: IdTokenResult['claims'] | null; // We'll still store claims for other potential uses
  isAdmin: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Define the hardcoded admin email
const HARDCODED_ADMIN_EMAIL = 'admin@example.com';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [claims, setClaims] = useState<IdTokenResult['claims'] | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('[AuthContext] Setting up onAuthStateChanged listener.');
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true); 
      if (currentUser) {
        setUser(currentUser);
        const userEmail = currentUser.email;
        console.log('[AuthContext] onAuthStateChanged - User detected:', userEmail);

        // Normalize emails for comparison
        const isHardcodedAdmin = userEmail?.toLowerCase() === HARDCODED_ADMIN_EMAIL.toLowerCase();

        if (isHardcodedAdmin) {
          console.log(`[AuthContext] User ${userEmail} IS the hardcoded admin. Setting isAdmin = true.`);
          setIsAdmin(true);
          setClaims({ admin: true }); // Simulate admin claim for consistency if ever needed
        } else {
          console.log(`[AuthContext] User ${userEmail} is NOT the hardcoded admin. Setting isAdmin = false. Other claims will be fetched if necessary but admin status is false.`);
          setIsAdmin(false); // Explicitly set to false for non-hardcoded admin users
          // Fetch other claims if needed for other functionalities, but isAdmin is determined above.
          try {
            const idTokenResult = await currentUser.getIdTokenResult(true); 
            const userClaims = idTokenResult.claims;
            console.log('[AuthContext] Firebase claims for non-admin user:', userEmail, userClaims);
            setClaims(userClaims); // Store other claims
          } catch (error) {
            console.error("[AuthContext] Error fetching user claims for non-admin user:", userEmail, error);
            setClaims(null);
          }
        }
      } else {
        console.log('[AuthContext] onAuthStateChanged - No user logged in.');
        setUser(null);
        setClaims(null);
        setIsAdmin(false);
        console.log('[AuthContext] No user state: isAdmin = false, claims = null.');
      }
      setLoading(false);
      console.log('[AuthContext] Auth state processing complete. Loading set to false.');
    });
    return () => {
      console.log('[AuthContext] Cleaning up onAuthStateChanged listener.');
      unsubscribe();
    }
  }, []);

  if (loading && user === null) {
    console.log('[AuthContext] Displaying initial loading screen.');
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

  console.log('[AuthContext] Rendering Provider with values: user.email=', user?.email, 'isAdmin=', isAdmin, 'loading=', loading, 'claims=', claims);
  return <AuthContext.Provider value={{ user, claims, isAdmin, loading }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
