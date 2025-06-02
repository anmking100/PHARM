
'use client';

import Link from 'next/link';
import { ShieldCheck, Users, Activity } from 'lucide-react'; // Added Activity icon
import { SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { useAuth } from '@/context/AuthContext';
import { usePathname } from 'next/navigation';

export function SidebarUserNavigation() {
  const { user, isAdmin, isPharmacist, loading } = useAuth();
  const pathname = usePathname();

  if (loading) {
    return null; 
  }

  const canSeePatientsLink = isAdmin || isPharmacist;

  return (
    <>
      {user && canSeePatientsLink && (
        <SidebarMenuItem>
          <SidebarMenuButton asChild tooltip="Patient Records" isActive={pathname === '/patients'} size="lg">
            <Link href="/patients">
              <Users />
              <span>Patients</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      )}
       {user && isAdmin && (
        <SidebarMenuItem>
          <SidebarMenuButton asChild tooltip="App Status" isActive={pathname === '/app-status'} size="lg">
            <Link href="/app-status">
              <Activity />
              <span>App Status</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      )}
      {user && isAdmin && (
        <SidebarMenuItem>
          <SidebarMenuButton asChild tooltip="Admin Panel" isActive={pathname === '/admin'} size="lg">
            <Link href="/admin">
              <ShieldCheck />
              <span>Admin Panel</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      )}
    </>
  );
}
