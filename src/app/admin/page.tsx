
'use client';

import React, { useState, useEffect, type FormEvent } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertTriangle, ShieldCheck, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createUserWithRole } from './actions';
import type { UserRole, NewUserFormData } from '@/lib/types';


export default function AdminPage() {
  const { user: authUser, loading: authLoading, role: authUserRole } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [isCreateUserDialogOpen, setIsCreateUserDialogOpen] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('technician'); // Default role
  const [isSubmittingUser, setIsSubmittingUser] = useState(false);
  const [createUserError, setCreateUserError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && (!authUser || authUserRole !== 'admin')) {
      console.log('[AdminPage] Access denied or not logged in. Redirecting.');
      router.replace('/login?redirect=/admin');
    }
  }, [authUser, authLoading, authUserRole, router]);

  const handleCreateUserSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreateUserError(null);

    if (!newUserEmail || !newUserPassword || !newUserRole) {
      setCreateUserError("All fields are required.");
      return;
    }
    if (newUserPassword.length < 6) {
      setCreateUserError("Password must be at least 6 characters.");
      return;
    }

    setIsSubmittingUser(true);
    const userData: NewUserFormData = {
      email: newUserEmail,
      password: newUserPassword,
      role: newUserRole,
    };

    const result = await createUserWithRole(userData);
    setIsSubmittingUser(false);

    if (result.success) {
      toast({
        title: 'User Created (Conceptual)',
        description: result.message || `User ${result.email} (${result.role}) conceptually created.`,
      });
      setIsCreateUserDialogOpen(false);
      // Reset form fields
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserRole('technician');
    } else {
      setCreateUserError(result.message);
      toast({
        variant: 'destructive',
        title: 'Creation Failed',
        description: result.message,
      });
    }
  };

  if (authLoading || (!authUser && !authLoading)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-24">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading admin panel...</p>
      </div>
    );
  }
  
  if (!authUser || authUserRole !== 'admin') {
     // Redirect is handled by useEffect, this is a fallback message or can be a more styled "Access Denied" component.
    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
            <Alert variant="destructive" className="max-w-md">
                <AlertTriangle className="h-5 w-5" />
                <AlertTitle>Access Denied</AlertTitle>
                <AlertDescription>
                    You do not have permission to view this page. You might be redirected shortly.
                </AlertDescription>
            </Alert>
        </div>
    );
  }

  console.log('[AdminPage] Rendering admin dashboard content for:', authUser.email);
  return (
    <div className="space-y-8 p-4 md:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                <ShieldCheck className="h-8 w-8 text-primary" />
                Admin Dashboard
            </h1>
            <p className="text-muted-foreground">Manage users and system settings.</p>
        </div>
        <Dialog open={isCreateUserDialogOpen} onOpenChange={setIsCreateUserDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" /> Create New User
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
              <DialogDescription>
                Enter the details for the new user. Password must be at least 6 characters.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateUserSubmit}>
              <div className="grid gap-4 py-4">
                {createUserError && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{createUserError}</AlertDescription>
                  </Alert>
                )}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email-new" className="text-right">
                    Email
                  </Label>
                  <Input
                    id="email-new"
                    type="email"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="password-new" className="text-right">
                    Password
                  </Label>
                  <Input
                    id="password-new"
                    type="password"
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    className="col-span-3"
                    required
                    minLength={6}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="role-new" className="text-right">
                    Role
                  </Label>
                  <Select value={newUserRole} onValueChange={(value) => setNewUserRole(value as UserRole)}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="pharmacist">Pharmacist</SelectItem>
                      <SelectItem value="technician">Technician</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateUserDialogOpen(false)} disabled={isSubmittingUser}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmittingUser}>
                  {isSubmittingUser && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create User
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Management (Conceptual)</CardTitle>
          <CardDescription>
            This section is for conceptual user management. Users created here are not stored persistently.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Use the "Create New User" button above to add a conceptual user. 
            A full user list and persistent storage are not yet implemented.
          </p>
        </CardContent>
      </Card>

      {/* Future sections can be added here */}
      {/* 
      <Card>
        <CardHeader>
          <CardTitle>System Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">System settings will go here.</p>
        </CardContent>
      </Card> 
      */}
    </div>
  );
}
