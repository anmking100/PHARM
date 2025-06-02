
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/icons/Logo';
import { Button } from '@/components/ui/button';
import { LogOut, UserCircle, ShieldCheck } from 'lucide-react'; // Settings2 icon removed
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { SidebarTrigger } from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function AppHeader() {
  const { user, role, isAdmin, logout, loading } = useAuth();
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

  // Settings handler is no longer needed here as the option is removed
  // const handleSettings = () => {
  //   toast({
  //     title: 'Settings Clicked',
  //     description: 'Settings functionality is not yet implemented.',
  //   });
  // };

  const handleAppStatus = () => {
    router.push('/app-status');
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="User Menu">
                    <UserCircle className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {isAdmin && (
                    <DropdownMenuItem onClick={handleAppStatus} className="cursor-pointer">
                      <ShieldCheck className="mr-2 h-4 w-4" />
                      <span>App Status</span>
                    </DropdownMenuItem>
                  )}
                  {/* Settings DropdownMenuItem removed */}
                  {isAdmin && <DropdownMenuSeparator />}
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            null
          )}
        </div>
      </div>
    </header>
  );
}
