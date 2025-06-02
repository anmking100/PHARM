
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/icons/Logo';
import { Button } from '@/components/ui/button';
import { Settings2, LogIn, LogOut, UserCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
// signOutUser action is no longer needed here as AuthContext handles logout
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { SidebarTrigger } from '@/components/ui/sidebar';

export default function AppHeader() {
  const { user, isAdmin, logout, loading } = useAuth(); // user can be HardcodedAdminUser or FirebaseUser
  const router = useRouter();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await logout(); // Call the logout from AuthContext
      toast({
        title: 'Logged Out',
        description: 'You have been successfully logged out.',
      });
      router.push('/login'); // Redirect to login page
    } catch (error) {
      console.error('Logout failed:', error);
      toast({
        variant: 'destructive',
        title: 'Logout Failed',
        description: 'Could not log you out. Please try again.',
      });
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Show sidebar trigger if any user is logged in (hardcoded or Firebase) */}
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
              <span className="text-sm text-muted-foreground hidden sm:inline">
                {user.email} {/* Works for both HardcodedAdminUser and FirebaseUser */}
                {isAdmin && user.source === 'hardcoded' && ' (Admin)'}
                {user.source === 'firebase' && user.customClaims?.admin && ' (Admin)'}
                {user.source === 'firebase' && user.customClaims?.role && ` (${user.customClaims.role})`}

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
            <Button asChild variant="default" size="sm">
              <Link href="/login">
                <LogIn className="mr-1 h-4 w-4 sm:mr-2" />
                Login
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
