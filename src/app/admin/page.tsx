'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Users, UserPlus, Settings, ShieldAlert, Loader2 } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login?redirect=/admin'); 
    }
    // Basic role check placeholder - replace with actual role logic
    // For example, if using custom claims:
    // if (!loading && user && !(user as any).customClaims?.admin) {
    //  router.push('/unauthorized'); // Or show an unauthorized message
    // }
  }, [user, loading, router]);

  if (loading) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
            <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading Admin Dashboard...</p>
        </div>
    );
  }
  
  if (!user) {
    // This case should ideally be handled by the redirect, but as a fallback:
     return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
             <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Redirecting to login...</p>
        </div>
    );
  }
  
  // Placeholder for role check. In a real app, you'd check if user.role === 'admin'
  // For now, any logged-in user can see this page.
  // const isUserAdmin = (user as any).customClaims?.admin === true; // Example
  const isUserAdmin = true; // TEMPORARY: Assume user is admin for UI display

  if (!isUserAdmin) {
     return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center px-4">
         <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
        <p className="text-muted-foreground">You do not have the necessary permissions to view this page.</p>
        <Button asChild className="mt-6">
          <Link href="/">Go to Homepage</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                <ShieldCheck className="h-8 w-8 text-primary" />
                Admin Dashboard
            </h1>
            <p className="text-muted-foreground">Manage users, roles, and application settings.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              User Management
            </CardTitle>
            <CardDescription>View, add, edit, and remove users. Assign roles and permissions.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Full user management capabilities including role assignments will be implemented here. This requires backend setup with Firebase Admin SDK.
            </p>
            <Button disabled className="w-full">
                <UserPlus className="mr-2 h-4 w-4" />
                Manage Users (Coming Soon)
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow opacity-60 cursor-not-allowed">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              Application Settings
            </CardTitle>
            <CardDescription>Configure application-wide settings and parameters.</CardDescription>
          </CardHeader>
          <CardContent>
             <p className="text-sm text-muted-foreground mb-4">
              System configuration options will be available here.
            </p>
            <Button disabled className="w-full">
                <Settings className="mr-2 h-4 w-4" />
                Configure Settings (Coming Soon)
            </Button>
          </CardContent>
        </Card>
      </div>

       <div className="mt-8 p-6 bg-card border rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold mb-3 text-primary flex items-center gap-2"><ShieldCheck className="h-5 w-5" />Next Steps & Considerations:</h3>
        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2">
            <li>
              <strong>User Roles:</strong> Define specific roles (e.g., 'admin', 'pharmacist', 'technician'). This typically involves using Firebase Custom Claims, set via the Firebase Admin SDK on a secure backend.
            </li>
            <li>
              <strong>User Creation by Admin:</strong> Implement a secure backend function (e.g., Firebase Callable Function or a Next.js API route protected for admins) that allows admins to create new users and assign them roles.
            </li>
            <li>
              <strong>Role Storage:</strong> Decide if roles need to be stored/managed in Firestore in addition to custom claims, especially if roles have associated permissions or metadata.
            </li>
            <li>
              <strong>UI for Management:</strong> Build out the UI for listing users, editing their details/roles, and inviting/adding new users.
            </li>
            <li>
              <strong>Security Rules:</strong> Ensure Firestore/Storage security rules are set up to enforce role-based access control.
            </li>
        </ul>
      </div>
    </div>
  );
}
