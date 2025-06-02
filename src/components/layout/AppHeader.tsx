
'use client';

import Link from 'next/link';
// useRouter removed as logout is removed
// import { useRouter } from 'next/navigation';
import { Logo } from '@/components/icons/Logo';
import { Button } from '@/components/ui/button';
import { Settings2, PanelLeft } from 'lucide-react'; // LogIn, LogOut, UserCircle removed
// useAuth and signOutUser removed
// import { useAuth } from '@/context/AuthContext';
// import { signOutUser } from '@/app/login/actions';
// useToast removed
// import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton'; // Kept for consistency if loading state was ever re-added elsewhere
import { SidebarTrigger } from '@/components/ui/sidebar';

export default function AppHeader() {
  // const { user, loading } = useAuth(); // Removed useAuth
  // const router = useRouter(); // Removed
  // const { toast } = useToast(); // Removed

  // handleLogout function removed

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          {/* SidebarTrigger is now always visible as user is always "admin" */}
          <SidebarTrigger />
          <Link href="/" className="flex items-center gap-2 md:pl-2">
            <Logo />
          </Link>
        </div>
        <div className="flex items-center gap-2">
          {/* Removed loading and user checks, no login/logout buttons */}
          <span className="text-sm text-muted-foreground hidden sm:inline">
            Admin
          </span>
          <Button variant="ghost" size="icon" aria-label="Settings" disabled> {/* Settings page not implemented */}
            <Settings2 className="h-5 w-5" />
          </Button>
          {/* Logout button removed */}
        </div>
      </div>
    </header>
  );
}
