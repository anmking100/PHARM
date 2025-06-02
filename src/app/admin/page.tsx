
'use client';

import React, { useState, useEffect, type FormEvent } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertTriangle, ShieldCheck, UserPlus, UploadCloud, ClipboardCheck, CheckSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createUserWithRole } from './actions';
import type { UserRole, NewUserFormData } from '@/lib/types';


export default function AdminPage() {
  const { user: authUser, loading: authLoading, isAdmin } = useAuth(); // Use isAdmin directly
  const router = useRouter();
  const { toast } = useToast();

  // State for the inline form
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('technician'); // Default role
  const [canUploadDocs, setCanUploadDocs] = useState(false);
  const [canReviewDocs, setCanReviewDocs] = useState(false);
  const [canApproveMedication, setCanApproveMedication] = useState(false);

  const [isSubmittingUser, setIsSubmittingUser] = useState(false);
  const [createUserError, setCreateUserError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && (!authUser || !isAdmin)) { // Check against isAdmin
      console.log('[AdminPage] Access denied or not logged in. Redirecting.');
      router.replace('/login?redirect=/admin');
    }
  }, [authUser, authLoading, isAdmin, router]); // Use isAdmin in dependency array

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
      canUploadDocs: canUploadDocs,
      canReviewDocs: canReviewDocs,
      canApproveMedication: canApproveMedication,
    };

    const result = await createUserWithRole(userData);
    setIsSubmittingUser(false);

    if (result.success) {
      toast({
        title: 'User Created (Conceptual)',
        description: result.message || `User ${result.email} (${result.role}) conceptually created.`,
      });
      // Reset form fields
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserRole('technician');
      setCanUploadDocs(false);
      setCanReviewDocs(false);
      setCanApproveMedication(false);
      setCreateUserError(null);
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
  
  if (!authUser || !isAdmin) { // Check against isAdmin
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
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="mr-2 h-5 w-5" /> 
            Create New User
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateUserSubmit} className="space-y-6">
            {createUserError && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{createUserError}</AlertDescription>
              </Alert>
            )}
            <div className="grid gap-2">
              <Label htmlFor="email-new">Email</Label>
              <Input
                id="email-new"
                type="email"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                required
                placeholder="user@example.com"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password-new">Password</Label>
              <Input
                id="password-new"
                type="password"
                value={newUserPassword}
                onChange={(e) => setNewUserPassword(e.target.value)}
                required
                minLength={6}
                placeholder="min. 6 characters"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role-new">Role</Label>
              <Select value={newUserRole} onValueChange={(value) => setNewUserRole(value as UserRole)}>
                <SelectTrigger id="role-new">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="pharmacist">Pharmacist</SelectItem>
                  <SelectItem value="technician">Technician</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4 pt-2">
              <Label className="font-medium">Permissions</Label>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="canUploadDocs" 
                  checked={canUploadDocs} 
                  onCheckedChange={(checked) => setCanUploadDocs(checked as boolean)}
                />
                <Label htmlFor="canUploadDocs" className="font-normal flex items-center gap-1">
                  <UploadCloud className="h-4 w-4 text-muted-foreground" /> Upload Docs
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="canReviewDocs" 
                  checked={canReviewDocs} 
                  onCheckedChange={(checked) => setCanReviewDocs(checked as boolean)}
                />
                <Label htmlFor="canReviewDocs" className="font-normal flex items-center gap-1">
                  <ClipboardCheck className="h-4 w-4 text-muted-foreground" /> Review Docs
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="canApproveMedication" 
                  checked={canApproveMedication} 
                  onCheckedChange={(checked) => setCanApproveMedication(checked as boolean)}
                />
                <Label htmlFor="canApproveMedication" className="font-normal flex items-center gap-1">
                  <CheckSquare className="h-4 w-4 text-muted-foreground" /> Approve Medication
                </Label>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isSubmittingUser}>
                {isSubmittingUser && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create User
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

