
'use client';

import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import { SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { useAuth } from '@/context/AuthContext';
import { usePathname } from 'next/navigation';

export function SidebarUserNavigation() {
  const { user, isAdmin, loading } = useAuth();
  const pathname = usePathname();

  console.log('[SidebarUserNavigation] Render. User:', user?.email, 'IsAdmin:', isAdmin, 'Loading:', loading);

  if (loading) {
    // Optionally, render a skeleton or nothing while loading
    return null; 
  }

  if (user && isAdmin) {
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

  console.log('[SidebarUserNavigation] User is not admin or not logged in. Not rendering Admin Panel link.');
  return null; // No admin link if not admin or not logged in
}
