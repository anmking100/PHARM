
'use client';

import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import { SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { useAuth } from '@/context/AuthContext';
import { usePathname } from 'next/navigation';

export function SidebarUserNavigation() {
  const { user, isAdmin, loading, claims } = useAuth(); 
  const pathname = usePathname();

  console.log('[SidebarUserNavigation] Render cycle. loading:', loading, 'user:', user?.email, 'isAdmin:', isAdmin, 'claims:', claims);

  if (loading) {
    console.log('[SidebarUserNavigation] Auth is loading. Not rendering admin link yet.');
    return null;
  }

  if (!user) {
    console.log('[SidebarUserNavigation] User not logged in (loading is false). Not rendering admin link.');
    return null;
  }
  
  // At this point, loading is false and user is present.
  console.log('[SidebarUserNavigation] User is present, loading is false. Checking isAdmin value:', isAdmin);
  if (!isAdmin) {
    console.log('[SidebarUserNavigation] User is present, loading is false, BUT isAdmin is false. Not rendering admin link. Current claims:', claims);
    return null;
  }
  
  // If we reach here, loading is false, user is present, and isAdmin is true.
  console.log('[SidebarUserNavigation] All checks passed (loading false, user present, isAdmin true). Rendering Admin Panel link.');
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
