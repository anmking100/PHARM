
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import AppHeader from '@/components/layout/AppHeader';
import { AuthProvider } from '@/context/AuthContext';
import { SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarInset } from '@/components/ui/sidebar';
import { Logo } from '@/components/icons/Logo';
import Link from 'next/link';
import { Home } from 'lucide-react'; // Removed ShieldCheck as admin link is handled by SidebarUserNavigation
import { SidebarUserNavigation } from '@/components/layout/SidebarUserNavigation';


export const metadata: Metadata = {
  title: 'RxFlow Assist',
  description: 'AI-Powered Fax-to-System Medication Entry',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased min-h-screen flex flex-col">
        <AuthProvider>
          <SidebarProvider>
            <Sidebar>
              <SidebarHeader className="p-4">
                <Link href="/" className="flex items-center gap-2">
                  <Logo />
                </Link>
              </SidebarHeader>
              <SidebarContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Home">
                      <Link href="/">
                        <Home />
                        <span>Home</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  {/* SidebarUserNavigation will handle Patients and Admin link visibility */}
                  <SidebarUserNavigation />
                </SidebarMenu>
              </SidebarContent>
              {/* Footer can be added here if needed */}
            </Sidebar>
            <SidebarInset>
              <AppHeader />
              <main className="flex-grow container mx-auto px-4 py-8">
                {children}
              </main>
              <Toaster />
            </SidebarInset>
          </SidebarProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
