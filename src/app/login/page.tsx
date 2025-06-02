
'use client';

import { useState, type FormEvent, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, LogIn, Loader2 } from 'lucide-react';
import { signInUser } from './actions'; // Server action for hardcoded admin
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth as firebaseAuthClient } from '@/lib/firebase/client';
import { useToast } from '@/hooks/use-toast';

const HARDCODED_ADMIN_EMAIL = 'admin@example.com';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAdmin, loading: authLoading, loginHardcodedAdmin } = useAuth();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    console.log('[LoginPage] useEffect - User:', user?.email, 'IsAdmin:', isAdmin, 'AuthLoading:', authLoading);
    if (!authLoading && user) {
      const redirectUrl = searchParams.get('redirect') || (isAdmin ? '/admin' : '/');
      console.log(`[LoginPage] User logged in (${user.email}, admin: ${isAdmin}). Redirecting to ${redirectUrl}`);
      router.replace(redirectUrl);
    }
  }, [user, isAdmin, authLoading, router, searchParams]);


  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    if (!email || !password) {
      setError('Please enter both email and password.');
      setIsSubmitting(false);
      return;
    }

    try {
      if (email.toLowerCase() === HARDCODED_ADMIN_EMAIL.toLowerCase()) {
        // Attempt hardcoded admin login via AuthContext
        const result = await loginHardcodedAdmin(email, password);
        if (result.success) {
          toast({ title: 'Admin Login Successful', description: 'Welcome back, Admin!' });
          // useEffect will handle redirect
        } else {
          setError(result.error || 'Invalid admin credentials.');
          toast({ variant: 'destructive', title: 'Admin Login Failed', description: result.error });
        }
      } else {
        // Attempt Firebase login for regular users
        await signInWithEmailAndPassword(firebaseAuthClient, email, password);
        // onAuthStateChanged in AuthContext will pick this up and update user state
        toast({ title: 'Login Successful', description: 'Welcome back!' });
        // useEffect will handle redirect
      }
    } catch (err: any) {
      console.error('Login page caught error:', err);
      let message = 'An unexpected error occurred. Please try again.';
      if (err.code) {
        switch (err.code) {
          case 'auth/user-not-found':
          case 'auth/wrong-password':
          case 'auth/invalid-credential':
            message = 'Invalid email or password.';
            break;
          case 'auth/invalid-email':
            message = 'Invalid email format.';
            break;
          default:
            message = err.message || message;
        }
      }
      setError(message);
      toast({ variant: 'destructive', title: 'Login Failed', description: message });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (authLoading && !user) {
    console.log('[LoginPage] Render: Auth loading, showing spinner.');
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-24">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading...</p>
      </div>
    );
  }
  
  // If user becomes available while still on login page (e.g. due to fast redirect issue), show loading
  if (user) {
     console.log('[LoginPage] Render: User is already defined, showing spinner for redirect.');
     return (
      <div className="flex min-h-screen flex-col items-center justify-center p-24">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Finalizing login...</p>
      </div>
    );
  }

  console.log('[LoginPage] Render: Showing login form.');
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold tracking-tight text-center flex items-center justify-center gap-2">
            <LogIn className="h-6 w-6 text-primary" />
            Login
          </CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to access your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Login Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting || authLoading}>
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <LogIn className="mr-2 h-4 w-4" />
              )}
              {isSubmitting ? 'Logging in...' : 'Login'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="text-center text-xs text-muted-foreground">
          <p>Admin: admin@example.com / password123</p>
        </CardFooter>
      </Card>
    </div>
  );
}
