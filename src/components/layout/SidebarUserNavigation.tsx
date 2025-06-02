
'use client';

import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import { SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
// useAuth removed
// import { useAuth } from '@/context/AuthContext';
import { usePathname } from 'next/navigation';

export function SidebarUserNavigation() {
  // const { user, isAdmin, loading, claims } = useAuth(); // Removed useAuth
  const pathname = usePathname();

  // console.log('[SidebarUserNavigation] Render cycle (hardcoded admin).'); // Simplified log

  // All checks for loading, user, isAdmin are removed as admin access is assumed.
  
  console.log('[SidebarUserNavigation] Hardcoded admin: Rendering Admin Panel link.');
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
