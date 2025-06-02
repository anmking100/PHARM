
'use client';

import Link from 'next/link';
import { ShieldCheck, Users, Activity, Home } from 'lucide-react'; 
import { SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { useAuth } from '@/context/AuthContext';
import { usePathname } from 'next/navigation';

export function SidebarUserNavigation() {
  const { user, isAdmin, isPharmacist, isTechnician, loading } = useAuth();
  const pathname = usePathname();

  if (loading) {
    return null; 
  }

  const canSeeHomeLink = isAdmin || isPharmacist;
  const canSeePatientsLink = isAdmin || isPharmacist || isTechnician;
  const canSeeAppStatusLink = isAdmin;
  const canSeeAdminPanelLink = isAdmin;

  return (
    <>
      {user && canSeeHomeLink && (
         <SidebarMenuItem>
          <SidebarMenuButton asChild tooltip="Home" isActive={pathname === '/'} size="lg">
            <Link href="/">
              <Home /> 
              <span>Home</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      )}
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
       {user && canSeeAppStatusLink && (
        <SidebarMenuItem>
          <SidebarMenuButton asChild tooltip="App Status" isActive={pathname === '/app-status'} size="lg">
            <Link href="/app-status">
              <Activity />
              <span>App Status</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      )}
      {user && canSeeAdminPanelLink && (
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
