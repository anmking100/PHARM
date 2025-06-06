
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import AppHeader from '@/components/layout/AppHeader';
import { AuthProvider } from '@/context/AuthContext';
import { SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarInset } from '@/components/ui/sidebar';
// Logo import removed from here, AppHeader handles it.
// Home icon import is removed from here, SidebarUserNavigation handles its own icons.
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
                {/* Content of SidebarHeader (Logo and Link) is managed by AppHeader or direct link if needed */}
              </SidebarHeader>
              <SidebarContent>
                <SidebarMenu>
                  {/* General Home link is removed from here; SidebarUserNavigation will conditionally render it */}
                  <SidebarUserNavigation />
                </SidebarMenu>
              </SidebarContent>
            </Sidebar>
            <SidebarInset className="flex flex-col min-h-0"> {/* Ensure SidebarInset can flex its children */}
              <AppHeader />
              <main className="flex-grow container mx-auto px-4 py-8">
                {children}
              </main>
              <footer className="py-4 px-6 text-center text-xs text-muted-foreground border-t">
                <p>Version 1.0.0</p>
                <p>&copy; 2024 Your Pharmacy Solutions</p>
              </footer>
              <Toaster />
            </SidebarInset>
          </SidebarProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
