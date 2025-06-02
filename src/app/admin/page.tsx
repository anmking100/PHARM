
'use client';

import { useState, useEffect, type FormEvent } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ShieldCheck, Users, UserPlus, Settings, Loader2, Edit, Trash2, PlusCircle } from "lucide-react"; // ShieldAlert removed
import Link from "next/link";
// useAuth, useRouter removed
// import { useAuth } from "@/context/AuthContext";
// import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { createUserWithRole } from "./actions";
import type { AppUser, UserRole, NewUserFormData } from "@/lib/types";

const initialUsers: AppUser[] = [
  { id: '1', email: 'admin@example.com', role: 'admin' },
  { id: '2', email: 'pharmacist.jane@example.com', role: 'pharmacist' },
  { id: '3', email: 'tech.joe@example.com', role: 'technician' },
];

const availableRoles: UserRole[] = ['admin', 'pharmacist', 'technician'];

export default function AdminPage() {
  // const { user, isAdmin, loading: authLoading } = useAuth(); // Removed useAuth
  // const router = useRouter(); // Removed
  const { toast } = useToast();

  const [users, setUsers] = useState<AppUser[]>(initialUsers);
  const [isCreateUserDialogOpen, setIsCreateUserDialogOpen] = useState(false);
  const [isSubmittingUser, setIsSubmittingUser] = useState(false);
  
  const [newUserForm, setNewUserForm] = useState<NewUserFormData & { password?: string }>({
    email: '',
    password: '',
    role: 'technician',
  });

  // useEffect for redirection removed
  // console.log('[AdminPage] Render cycle. Auth checks removed (hardcoded admin).');


  const handleNewUserInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewUserForm(prev => ({ ...prev, [name]: value }));
  };

  const handleNewUserRoleChange = (value: UserRole) => {
    setNewUserForm(prev => ({ ...prev, role: value }));
  };

  const handleCreateUserSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!newUserForm.email || !newUserForm.password || !newUserForm.role) {
      toast({ variant: "destructive", title: "Missing Fields", description: "Please fill in all fields." });
      return;
    }
    setIsSubmittingUser(true);
    try {
      // createUserWithRole is still conceptual
      const result = await createUserWithRole({ email: newUserForm.email, role: newUserForm.role }, newUserForm.password);
      if (result.success && result.userId) {
        setUsers(prevUsers => [...prevUsers, { id: result.userId as string, email: newUserForm.email, role: newUserForm.role }]);
        toast({ title: "User Created (Conceptual)", description: result.message });
        setIsCreateUserDialogOpen(false);
        setNewUserForm({ email: '', password: '', role: 'technician' }); 
      } else {
        toast({ variant: "destructive", title: "Creation Failed", description: result.message });
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message || "Could not create user." });
    } finally {
      setIsSubmittingUser(false);
    }
  };

  // All loading, user, and isAdmin checks are removed. The page content is rendered directly.
  console.log('[AdminPage] Rendering admin dashboard content (hardcoded admin access).');
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

      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              User Management
            </CardTitle>
            <CardDescription>View, add, and manage user roles. Current user list is mock data.</CardDescription>
          </div>
          <Dialog open={isCreateUserDialogOpen} onOpenChange={setIsCreateUserDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" /> Create New User
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />Create New User
                </DialogTitle>
                <DialogDescription>
                  Fill in the details to add a new user and assign them a role.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateUserSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="email" className="text-right">
                      Email
                    </Label>
                    <Input id="email" name="email" type="email" value={newUserForm.email} onChange={handleNewUserInputChange} className="col-span-3" placeholder="user@example.com" required disabled={isSubmittingUser} />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="password" className="text-right">
                      Password
                    </Label>
                    <Input id="password" name="password" type="password" value={newUserForm.password ?? ''} onChange={handleNewUserInputChange} className="col-span-3" placeholder="••••••••" required disabled={isSubmittingUser}/>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="role" className="text-right">
                      Role
                    </Label>
                    <Select name="role" value={newUserForm.role} onValueChange={handleNewUserRoleChange} disabled={isSubmittingUser}>
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableRoles.map(role => (
                          <SelectItem key={role} value={role} className="capitalize">{role}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                     <Button type="button" variant="outline" disabled={isSubmittingUser}>Cancel</Button>
                  </DialogClose>
                  <Button type="submit" disabled={isSubmittingUser}>
                    {isSubmittingUser ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                    {isSubmittingUser ? 'Creating...' : 'Create User'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                    No users found.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((appUser) => (
                  <TableRow key={appUser.id}>
                    <TableCell className="font-medium">{appUser.email}</TableCell>
                    <TableCell className="capitalize">{appUser.role}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="sm" disabled> 
                        <Edit className="mr-1 h-3 w-3" /> Edit Role
                      </Button>
                       <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" disabled> 
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
         <CardFooter>
          <p className="text-xs text-muted-foreground">
            Note: User creation and role assignment are conceptual. Full implementation requires backend Firebase Admin SDK setup.
          </p>
        </CardFooter>
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

       <div className="mt-8 p-6 bg-card border rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold mb-3 text-primary flex items-center gap-2"><ShieldCheck className="h-5 w-5" />Next Steps & Considerations:</h3>
        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2">
            <li>
              <strong>Authentication Removed:</strong> The application now assumes a single admin user is always active. For a real app, re-implement Firebase Authentication.
            </li>
            <li>
              <strong>Secure User Creation:</strong> Implement actual user creation and role assignment using Firebase Admin SDK in a secure backend environment (e.g., Firebase Callable Function or a Next.js API route protected for admins). The current `createUserWithRole` server action is conceptual.
            </li>
            <li>
              <strong>Role & Permission Management:</strong>
                <ul>
                    <li>Define roles (e.g., 'admin', 'pharmacist') and associated permissions.</li>
                    <li>Store roles/permissions in Firestore and link them to users, or use Firebase Custom Claims for roles.</li>
                    <li>Implement UI for editing roles/permissions (the "Edit Role" button is a placeholder).</li>
                </ul>
            </li>
            <li>
              <strong>Fetch Real Users:</strong> Replace mock user data with actual users fetched from Firebase Authentication (requires Admin SDK for full list or careful client-side management for limited views) if auth is re-added.
            </li>
            <li>
              <strong>Security Rules:</strong> Ensure Firestore/Storage security rules are set up to enforce role-based access control once roles are implemented with real authentication.
            </li>
        </ul>
      </div>
    </div>
  );
}
