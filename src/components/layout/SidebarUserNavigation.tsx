
'use client';

import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import { SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { useAuth } from '@/context/AuthContext';
import { usePathname } from 'next/navigation';

export function SidebarUserNavigation() {
  const { user, loading } = useAuth();
  const pathname = usePathname();

  console.log('[SidebarUserNavigation] Auth state: loading =', loading, ', user =', user ? user.email : null);

  if (loading) {
    console.log('[SidebarUserNavigation] Not rendering: Auth is loading.');
    return null;
  }

  if (!user) {
    console.log('[SidebarUserNavigation] Not rendering: User is not logged in.');
    return null;
  }

  // Conceptual: In a real app, check for admin role here
  // const isAdmin = (user as any).customClaims?.admin === true;
  // For now, any logged-in user can see the Admin Panel link
  const isAdmin = true;
  console.log('[SidebarUserNavigation] isAdmin =', isAdmin);

  if (!isAdmin) {
    console.log('[SidebarUserNavigation] Not rendering: User is not admin.');
    return null;
  }

  console.log('[SidebarUserNavigation] Rendering Admin Panel link.');
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild tooltip="Admin Panel" isActive={pathname === '/admin'}>
        <Link href="/admin">
          <ShieldCheck />
          <span>Admin Panel</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
