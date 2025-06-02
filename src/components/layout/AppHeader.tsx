
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/icons/Logo';
import { Button } from '@/components/ui/button';
import { Settings2, LogOut, UserCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { SidebarTrigger } from '@/components/ui/sidebar';

export default function AppHeader() {
  const { user, role, logout, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleLogout = () => {
    logout();
    toast({
      title: 'Logged Out',
      description: 'You have been successfully logged out.',
    });
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          {user && <SidebarTrigger />}
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
              <span className="text-sm text-muted-foreground hidden sm:inline capitalize">
                {user.email} ({role})
              </span>
               <Button variant="ghost" size="icon" aria-label="User Menu" disabled>
                <UserCircle className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" aria-label="Settings" disabled>
                <Settings2 className="h-5 w-5" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="mr-1 h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </>
          ) : (
            // Login button removed
            null
          )}
        </div>
      </div>
    </header>
  );
}
