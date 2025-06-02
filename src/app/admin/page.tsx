
'use client';

import { useState, useEffect, type FormEvent } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ShieldCheck, Users, UserPlus, Settings, ShieldAlert, Loader2, Edit, Trash2, PlusCircle } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
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
  const { user, isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [users, setUsers] = useState<AppUser[]>(initialUsers);
  const [isCreateUserDialogOpen, setIsCreateUserDialogOpen] = useState(false);
  const [isSubmittingUser, setIsSubmittingUser] = useState(false);
  
  const [newUserForm, setNewUserForm] = useState<NewUserFormData & { password?: string }>({
    email: '',
    password: '',
    role: 'technician',
  });

  useEffect(() => {
    console.log('[AdminPage] Auth state - authLoading:', authLoading, 'user:', user?.email, 'isAdmin:', isAdmin);
    if (!authLoading) {
      if (!user) {
        console.log('[AdminPage] No user, redirecting to login.');
        router.push('/login?redirect=/admin'); 
      } else if (!isAdmin) {
        console.log('[AdminPage] User is not admin, access denied will be shown.');
        // If user is logged in but not admin, redirect or show access denied
        // For now, we show access denied directly within the component.
      } else {
        console.log('[AdminPage] User is admin, proceeding to render dashboard.');
      }
    }
  }, [user, isAdmin, authLoading, router]);

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

  if (authLoading) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
            <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading Admin Dashboard...</p>
        </div>
    );
  }
  
  if (!user && !authLoading) { 
     console.log('[AdminPage] Rendering redirect to login (user null, not loading).');
     return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
             <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Redirecting to login...</p>
        </div>
    );
  }
  
  if (user && !isAdmin && !authLoading) {
     console.log('[AdminPage] Rendering Access Denied (user present, not admin, not loading).');
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

  // If we reach here, user must be admin or something is still loading/in transition
  if (!isAdmin && user) { // Final check before rendering admin content
    console.log('[AdminPage] Fallback Access Denied just before render.');
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


  console.log('[AdminPage] Rendering admin dashboard content.');
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
              <strong>Fetch Real Users:</strong> Replace mock user data with actual users fetched from Firebase Authentication (requires Admin SDK for full list or careful client-side management for limited views).
            </li>
            <li>
              <strong>Security Rules:</strong> Ensure Firestore/Storage security rules are set up to enforce role-based access control once roles are implemented.
            </li>
            <li>
              <strong>Admin Role Check:</strong> The app now checks for `admin@example.com` (hardcoded) or `customClaims.admin === true` on the logged-in user. For custom claims, you'll need to set this claim for your admin users.
            </li>
        </ul>
      </div>
    </div>
  );
}
