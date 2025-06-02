
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
import { useToast } from '@/hooks/use-toast';

const HARDCODED_ADMIN_EMAIL_EXPECTED = 'admin@example.com';
const HARDCODED_ADMIN_PASSWORD_EXPECTED = 'password123'; // Still check password for conceptual login

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAdmin, loading: authLoading, loginAdmin } = useAuth();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    console.log('[LoginPage] useEffect check. User:', user?.email, 'AuthLoading:', authLoading, 'IsAdmin:', isAdmin);
    if (!authLoading && user && isAdmin) {
      const redirectUrl = searchParams.get('redirect') || '/admin'; // Default to admin if admin logs in
      console.log(`[LoginPage] Admin logged in. Redirecting to ${redirectUrl}`);
      router.replace(redirectUrl);
    } else if (!authLoading && user && !isAdmin) {
      // This case should not happen with the current setup if only admin can "login"
      const redirectUrl = searchParams.get('redirect') || '/';
      console.log(`[LoginPage] Non-admin user somehow logged in. Redirecting to ${redirectUrl}`);
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

    if (email.toLowerCase() === HARDCODED_ADMIN_EMAIL_EXPECTED && password === HARDCODED_ADMIN_PASSWORD_EXPECTED) {
      loginAdmin(); // This now sets the admin state in AuthContext
      toast({ title: 'Admin Login Successful', description: 'Welcome back, Admin!' });
      // useEffect will handle the redirect
    } else {
      setError('Invalid credentials. Only the hardcoded admin can log in.');
      toast({ variant: 'destructive', title: 'Login Failed', description: 'Invalid credentials.' });
    }
    setIsSubmitting(false);
  };

  if (authLoading && !user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-24">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (user && isAdmin) {
     return (
      <div className="flex min-h-screen flex-col items-center justify-center p-24">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Finalizing login...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold tracking-tight text-center flex items-center justify-center gap-2">
            <LogIn className="h-6 w-6 text-primary" />
            Admin Login
          </CardTitle>
          <CardDescription className="text-center">
            Enter admin credentials to access the system.
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
                placeholder="admin@example.com"
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
                placeholder="password123"
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
          <p>Use admin@example.com / password123</p>
        </CardFooter>
      </Card>
    </div>
  );
}
