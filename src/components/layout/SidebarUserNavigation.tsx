'use client';

import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import { SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { useAuth } from '@/context/AuthContext';
import { usePathname } from 'next/navigation';

export function SidebarUserNavigation() {
  const { user, loading } = useAuth();
  const pathname = usePathname();

  if (loading || !user) {
    return null; // Don't show admin link if loading or not logged in
  }

  // Conceptual: In a real app, check for admin role here
  // const isAdmin = (user as any).customClaims?.admin === true;
  // For now, any logged-in user can see the Admin Panel link
  const isAdmin = true; 

  if (!isAdmin) {
    return null;
  }

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
