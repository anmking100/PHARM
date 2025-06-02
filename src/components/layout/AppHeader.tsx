'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/icons/Logo';
import { Button } from '@/components/ui/button';
import { UserCircle, Settings2, LogIn, LogOut, PanelLeft } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { signOutUser } from '@/app/login/actions';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { SidebarTrigger } from '@/components/ui/sidebar';

export default function AppHeader() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleLogout = async () => {
    const result = await signOutUser();
    if (result.success) {
      toast({
        title: 'Logged Out',
        description: 'You have been successfully logged out.',
      });
      router.push('/login'); 
    } else {
      toast({
        variant: 'destructive',
        title: 'Logout Failed',
        description: result.error || 'Could not log you out. Please try again.',
      });
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          {user && !loading && <SidebarTrigger />}
          <Link href="/" className="flex items-center gap-2 md:pl-2">
            <Logo />
          </Link>
        </div>
        <div className="flex items-center gap-2">
          {loading ? (
            <>
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </>
          ) : user ? (
            <>
              <span className="text-sm text-muted-foreground hidden sm:inline">
                {user.email?.split('@')[0] || 'User'}
              </span>
              <Button variant="ghost" size="icon" aria-label="Settings" disabled> {/* Settings page not implemented */}
                <Settings2 className="h-5 w-5" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </>
          ) : (
            <Button asChild variant="default" size="sm">
              <Link href="/login">
                <LogIn className="mr-2 h-4 w-4" />
                Login
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
