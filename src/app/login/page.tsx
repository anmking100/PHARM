
'use client';

import { useState, type FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, LogIn, Loader2 } from 'lucide-react';
import { signInUser } from './actions';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const router = useRouter();
  const { user, login, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user && !authLoading) {
      console.log('[LoginPage] User already logged in, redirecting to /');
      router.replace('/');
    }
  }, [user, authLoading, router]);

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
      if (result.success && result.user) {
        login(result.user); // Update AuthContext with the logged-in user
        toast({
          title: 'Login Successful',
          description: 'Welcome back!',
        });
        router.push('/'); // Redirect to home page or dashboard
      } else {
        setError(result.error || 'Invalid email or password.');
        toast({
          variant: 'destructive',
          title: 'Login Failed',
          description: result.error || 'Invalid email or password.',
        });
      }
    } catch (err) {
      console.error('Login page caught error:', err);
      setError('An unexpected error occurred. Please try again.');
      toast({
        variant: 'destructive',
        title: 'Login Error',
        description: 'An unexpected error occurred.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (authLoading || user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-24">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading...</p>
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
            Enter your credentials to access the admin panel.
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
          <p>Use admin@example.com and password123 to log in.</p>
        </CardFooter>
      </Card>
    </div>
  );
}
