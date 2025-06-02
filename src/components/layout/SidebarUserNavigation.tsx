
'use client';

import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import { SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { useAuth } from '@/context/AuthContext';
import { usePathname } from 'next/navigation';

export function SidebarUserNavigation() {
  const { user, isAdmin, loading, claims } = useAuth(); // Added claims for logging
  const pathname = usePathname();

  // Log the state from useAuth
  console.log('[SidebarUserNavigation] State from useAuth - loading:', loading, 'user:', user?.email, 'isAdmin:', isAdmin, 'claims:', claims);

  if (loading) {
    console.log('[SidebarUserNavigation] Auth is loading. Not rendering admin link yet.');
    return null;
  }

  if (!user) {
    console.log('[SidebarUserNavigation] User not logged in. Not rendering admin link.');
    return null;
  }

  // Explicitly log the isAdmin value being checked
  console.log('[SidebarUserNavigation] Checking isAdmin value:', isAdmin);
  if (!isAdmin) {
    console.log('[SidebarUserNavigation] User is not admin. Not rendering admin link. Current claims:', claims);
    return null;
  }
  
  console.log('[SidebarUserNavigation] User is admin. Rendering Admin Panel link.');
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
