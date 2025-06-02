
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
import { signInUser } from './actions'; // Server action for checking credentials

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading, loginUser } = useAuth();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    console.log('[LoginPage] useEffect check. User:', user?.email, 'AuthLoading:', authLoading);
    if (!authLoading && user) {
      const redirectParam = searchParams.get('redirect');
      let targetUrl = redirectParam || 
                      (user.role === 'admin' ? '/admin' : 
                      (user.role === 'technician' ? '/patients' : 
                      '/'));

      // Prevent non-admins from being sent directly to /admin if that was the redirect param
      if (user.role !== 'admin' && targetUrl === '/admin') {
        console.log(`[LoginPage] Non-admin (${user.role}) attempted redirect to /admin. Overriding to /.`);
        targetUrl = '/';
      }
      
      console.log(`[LoginPage] User logged in (${user.role}). Redirecting to ${targetUrl}`);
      router.replace(targetUrl);
    }
  }, [user, authLoading, router, searchParams]);

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
      const result = await signInUser({ email, password });
      if (result.success && result.role && result.email) {
        loginUser(result.email, result.role); // Update AuthContext
        toast({ title: 'Login Successful', description: `Welcome back, ${result.role}!` });
        // useEffect will handle the redirect
      } else {
        setError(result.error || 'Invalid credentials.');
        toast({ variant: 'destructive', title: 'Login Failed', description: result.error || 'Invalid credentials.' });
      }
    } catch (e: any) {
      console.error('[LoginPage] Login submit error:', e);
      setError('An unexpected error occurred during login.');
      toast({ variant: 'destructive', title: 'Login Error', description: 'An unexpected error occurred.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading && !user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-24">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (user) { // If user is already set (e.g. by AuthContext restore or after successful login)
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
            User Login
          </CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to access the system.
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
        <CardFooter className="text-center text-xs text-muted-foreground space-y-1 flex flex-col">
          <p>Hint: admin@example.com / password123</p>
          <p>pharmacist@example.com / password123</p>
          <p>technician@example.com / password123</p>
        </CardFooter>
      </Card>
    </div>
  );
}
