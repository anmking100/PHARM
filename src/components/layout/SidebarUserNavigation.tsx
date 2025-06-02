
'use client';

import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import { SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { useAuth } from '@/context/AuthContext';
import { usePathname } from 'next/navigation';

export function SidebarUserNavigation() {
  const { user, isAdmin, loading } = useAuth();
  const pathname = usePathname();

  if (loading) {
    console.log('[SidebarUserNavigation] Auth is loading. Not rendering admin link yet.');
    return null; 
  }

  if (!user) {
    console.log('[SidebarUserNavigation] User not logged in. Not rendering admin link.');
    return null;
  }

  if (!isAdmin) {
    console.log('[SidebarUserNavigation] User is not admin. Not rendering admin link. Claims:', (user as any).claims); // Log claims if needed
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
