
'use client';

import { useState, useEffect, type FormEvent } from "react";
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogTrigger, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ShieldCheck, Users, UserPlus, Settings, Loader2, Edit, Trash2, PlusCircle, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createUserWithRole } from "./actions";
import type { UserRole } from "@/lib/types";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

interface DisplayUser {
  id: string;
  email: string;
  role: UserRole;
}

const initialUsers: DisplayUser[] = []; // Start with an empty list for conceptual users

const availableRoles: UserRole[] = ['admin', 'pharmacist', 'technician'];

export default function AdminPage() {
  const { user: authUser, isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [displayedUsers, setDisplayedUsers] = useState<DisplayUser[]>(initialUsers);
  const [isCreateUserDialogOpen, setIsCreateUserDialogOpen] = useState(false);
  const [isSubmittingUser, setIsSubmittingUser] = useState(false);
  
  const [newUserForm, setNewUserForm] = useState<{email: string; password?: string; role: UserRole }>({
    email: '',
    password: '', 
    role: 'technician',
  });

  useEffect(() => {
    console.log('[AdminPage] Auth state check. AuthLoading:', authLoading, 'AuthUser:', authUser?.email, 'IsAdmin:', isAdmin);
    if (!authLoading) {
      if (!authUser || !isAdmin) {
        console.log('[AdminPage] Not admin or not logged in, redirecting to /login.');
        router.replace('/login?redirect=/admin');
         toast({
            variant: "destructive",
            title: "Access Denied",
            description: "You do not have permission to access the admin panel. Please log in as admin.",
        });
      } else {
        console.log('[AdminPage] Admin access confirmed.');
      }
    }
  }, [authUser, isAdmin, authLoading, router, toast]);

  const handleNewUserInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewUserForm(prev => ({ ...prev, [name]: value }));
  };

  const handleNewUserRoleChange = (value: UserRole) => {
    setNewUserForm(prev => ({ ...prev, role: value }));
  };

  const handleCreateUserSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!newUserForm.email || !newUserForm.role) { // Password not strictly required for conceptual creation
      toast({ variant: "destructive", title: "Missing Fields", description: "Please fill in email and role fields." });
      return;
    }
    setIsSubmittingUser(true);
    try {
      const result = await createUserWithRole({ email: newUserForm.email, role: newUserForm.role }, newUserForm.password);
      if (result.success && result.userId && result.email && result.role) {
        setDisplayedUsers(prevUsers => [...prevUsers, { id: result.userId as string, email: result.email as string, role: result.role as UserRole }]);
        toast({ title: "User Action", description: result.message });
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

  if (authLoading && (!authUser || !isAdmin)) {
    console.log('[AdminPage] Auth loading, showing spinner.');
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-24">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading admin panel...</p>
      </div>
    );
  }

  if (!authUser || !isAdmin) {
     console.log('[AdminPage] User not authenticated as admin, showing access denied or redirecting.');
    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
            <Alert variant="destructive" className="max-w-md">
                <AlertTriangle className="h-5 w-5" />
                <AlertTitle>Access Denied</AlertTitle>
                <AlertDescription>
                    You do not have permission to view this page. Redirecting to login...
                </AlertDescription>
            </Alert>
        </div>
    );
  }

  console.log('[AdminPage] Rendering admin dashboard content for:', authUser.email);
  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                <ShieldCheck className="h-8 w-8 text-primary" />
                Admin Dashboard
            </h1>
            <p className="text-muted-foreground">Manage users (conceptual) and roles. Firebase interaction is removed.</p>
        </div>
      </div>

      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              User Management (Conceptual)
            </CardTitle>
            <CardDescription>View, add, and manage user roles. User list is local to this session. No Firebase interaction.</CardDescription>
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
                  <UserPlus className="h-5 w-5" />Create New User (Conceptual)
                </DialogTitle>
                <DialogDescription>
                  Fill in the details to add a new user conceptually. No Firebase user will be created.
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
                    <Input id="password" name="password" type="password" value={newUserForm.password ?? ''} onChange={handleNewUserInputChange} className="col-span-3" placeholder="(Optional for conceptual)" disabled={isSubmittingUser}/>
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
              {displayedUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                    No users created in this session yet.
                  </TableCell>
                </TableRow>
              ) : (
                displayedUsers.map((appUser) => (
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
            Note: User creation is now conceptual and does not interact with Firebase.
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
    </div>
  );
}
