
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { signInUser } from './actions';
import { LogIn, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false); // Local loading state for form submission
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user, loading: authLoading, isAdmin } = useAuth();

  useEffect(() => {
    console.log(`[LoginPage] useEffect - Checking redirect. User from context: ${user?.email}, AuthLoading from context: ${authLoading}, IsAdmin from context: ${isAdmin}`);
    if (user && !authLoading) { // Condition: user exists AND auth is no longer loading
      const redirectUrl = searchParams.get('redirect') || '/';
      console.log(`[LoginPage] useEffect - Redirecting. User: ${user.email}, IsAdmin: ${isAdmin}. Redirect URL: ${redirectUrl}`);
      router.push(redirectUrl);
    } else {
      console.log(`[LoginPage] useEffect - Not redirecting. User from context: ${user?.email}, AuthLoading from context: ${authLoading}, IsAdmin from context: ${isAdmin}`);
    }
  }, [user, authLoading, router, searchParams, isAdmin]);


  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true); // Start local loading for submit button
    try {
      const result = await signInUser(email, password);
      if (result.success) {
        toast({
          title: 'Login Successful',
          description: 'Welcome back!',
        });
        // Redirection will be handled by the useEffect above once auth state updates in AuthContext
        // and propagates here.
      } else {
        let description = result.error || 'Invalid email or password.';
        if (result.errorCode === 'auth/invalid-credential') {
            description = 'Invalid email or password. Please check your credentials and try again.';
        }
        toast({
          variant: 'destructive',
          title: 'Login Failed',
          description: description,
        });
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Login Error',
        description: error.message || 'An unexpected error occurred.',
      });
    } finally {
      setIsLoading(false); // Stop local loading for submit button
    }
  };
  
  // This block handles what to render based on authentication state from AuthContext
  if (authLoading) { // If AuthContext is loading (e.g. initial app load, or during onAuthStateChanged processing)
    console.log(`[LoginPage] Render: AuthContext is loading. Displaying spinner. AuthLoading: ${authLoading}, User: ${user?.email}`);
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Authenticating...</p>
      </div>
    );
  }
  
  // If here, authLoading from AuthContext is false.
  if (user) { // User is logged in (AuthContext has user), auth is finished. Waiting for useEffect to redirect.
      console.log(`[LoginPage] Render: User is logged in, AuthContext finished loading. Waiting for redirect. User: ${user.email}, IsAdmin: ${isAdmin}`);
       return (
        <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-2 text-muted-foreground">Finalizing login...</p>
        </div>
    );
  }

  // If here, authLoading is false AND user is null. Show the login form.
  console.log(`[LoginPage] Render: Rendering login form. AuthLoading: ${authLoading}, User: ${user?.email}, IsAdmin: ${isAdmin}`);
  return (
    <div className="flex items-center justify-center py-12">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl flex items-center justify-center gap-2">
            <LogIn className="h-6 w-6" /> Login
          </CardTitle>
          <CardDescription>Enter your credentials to access RxFlow Assist.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading} // Use local isLoading for form elements
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                placeholder="••••••••"
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading} // Use local isLoading for form elements
                autoComplete="current-password"
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}> {/* Use local isLoading */}
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <LogIn className="mr-2 h-4 w-4" />
              )}
              {isLoading ? 'Logging in...' : 'Login'}
            </Button>
          </form>
        </CardContent>
         <CardFooter className="flex flex-col items-center text-sm text-muted-foreground">
           {/* For now, we are not implementing sign-up or password reset.
           <p>
            Don't have an account?{' '}
            <Link href="#" className="text-primary hover:underline">
              Sign Up
            </Link>
          </p>
          <Link href="#" className="text-primary hover:underline mt-2">
            Forgot Password?
          </Link>
          */}
        </CardFooter>
      </Card>
    </div>
  );
}
