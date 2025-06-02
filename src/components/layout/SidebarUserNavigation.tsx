
'use client';

import Link from 'next/link';
import { ShieldCheck, Users } from 'lucide-react'; // Added Users icon
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
          <SidebarMenuButton asChild tooltip="Patient Records" isActive={pathname === '/patients'}>
            <Link href="/patients">
              <Users />
              <span>Patients</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      )}
      {user && isAdmin && (
        <SidebarMenuItem>
          <SidebarMenuButton asChild tooltip="Admin Panel" isActive={pathname === '/admin'}>
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
