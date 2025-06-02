
'use client';

import React, { useState, useEffect, useMemo, type ChangeEvent, type FormEvent } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// Checkbox import removed as it's no longer used for permissions
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Loader2, ShieldCheck, Users2, Search, Trash2, UserPlus } from 'lucide-react'; // CheckSquare, XCircle removed
import { useToast } from '@/hooks/use-toast';
import { getSystemUsers, createUserWithRole } from './actions';
import type { UserRole, NewUserFormData, ConceptualUser } from '@/lib/types';


const initialNewUserState: NewUserFormData = {
  email: '',
  role: 'technician', // Default role
  password: '',
  // Permission fields removed
};


export default function AdminPage() {
  const { user: authUser, loading: authLoading, isAdmin } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  // State for user management
  const [systemUsers, setSystemUsers] = useState<ConceptualUser[]>([]);
  const [isLoadingSystemUsers, setIsLoadingSystemUsers] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // State for creating user
  const [newUser, setNewUser] = useState<NewUserFormData>(initialNewUserState);
  const [isCreateUserDialogOpen, setIsCreateUserDialogOpen] = useState(false);
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  // State for deleting user
  const [deletingUser, setDeletingUser] = useState<ConceptualUser | null>(null);
  const [isDeleteUserConfirmOpen, setIsDeleteUserConfirmOpen] = useState(false);


  useEffect(() => {
    if (!authLoading && (!authUser || !isAdmin)) {
      router.replace('/login?redirect=/admin');
    }
  }, [authUser, authLoading, isAdmin, router]);

  useEffect(() => {
    async function fetchUsers() {
      if (isAdmin) {
        setIsLoadingSystemUsers(true);
        try {
          const users = await getSystemUsers();
          setSystemUsers(users);
        } catch (error) {
          console.error("Failed to fetch system users:", error);
          toast({ variant: "destructive", title: "Error", description: "Could not load system users." });
        } finally {
          setIsLoadingSystemUsers(false);
        }
      }
    }
    if (!authLoading && authUser && isAdmin) {
      fetchUsers();
    }
  }, [isAdmin, authUser, authLoading, toast]);
  
  const handleOpenDeleteConfirm = (userToDelete: ConceptualUser) => {
    setDeletingUser(userToDelete);
    setIsDeleteUserConfirmOpen(true);
  };

  const handleDeleteUser = () => {
    if (!deletingUser) return;

    const isOriginalHardcoded = deletingUser.isSystemUser;
    
    setSystemUsers(prevUsers => prevUsers.filter(u => u.id !== deletingUser.id));

    let toastDescription = `User ${deletingUser.email} removed from admin view for this session.`;
    if (isOriginalHardcoded) {
        toastDescription += ` This user can still log in with original credentials.`;
    }
    toast({ title: 'User Removed (Session)', description: toastDescription });
    setIsDeleteUserConfirmOpen(false);
    setDeletingUser(null);
  };

  const handleCreateUserInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewUser(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCreateUserRoleChange = (value: UserRole) => {
    setNewUser(prev => ({ ...prev, role: value }));
  };

  // handleCreateUserPermissionChange removed

  const handleCreateUserSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsCreatingUser(true);
    try {
      // NewUserFormData no longer includes explicit permissions, they will be set by the action
      const result = await createUserWithRole(newUser);
      if (result.success && result.userId && result.email && result.role) {
        const createdConceptualUser: ConceptualUser = {
            id: result.userId,
            email: result.email,
            role: result.role,
            password: newUser.password, 
            // Permissions are now set by the action based on role
            canUploadDocs: result.canUploadDocs,
            canReviewDocs: result.canReviewDocs,
            canApproveMedication: result.canApproveMedication,
            isSystemUser: false, 
        };
        setSystemUsers(prev => [createdConceptualUser, ...prev]);
        toast({ title: "User Created (Session)", description: result.message });
        setIsCreateUserDialogOpen(false);
        setNewUser(initialNewUserState); // Reset form
      } else {
        toast({ variant: "destructive", title: "Creation Failed", description: result.message });
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: `Failed to create user: ${error.message}` });
    } finally {
      setIsCreatingUser(false);
    }
  };

  const filteredUsers = useMemo(() => {
    if (!searchTerm) return systemUsers;
    return systemUsers.filter(user => 
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [systemUsers, searchTerm]);


  if (authLoading || (!authUser && !authLoading) || (isAdmin && isLoadingSystemUsers)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-24">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading admin panel...</p>
      </div>
    );
  }
  
  if (!authUser || !isAdmin) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
            <Card className="max-w-md">
                <CardHeader>
                    <CardTitle>Access Denied</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>You do not have permission to view this page.</p>
                    <Button onClick={() => router.push('/login?redirect=/admin')} className="mt-4 w-full">
                        Go to Login
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
  }

  return (
    <div className="space-y-8 p-4 md:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                <ShieldCheck className="h-8 w-8 text-primary" />
                Admin Dashboard
            </h1>
            <p className="text-muted-foreground">Manage system settings and view users. Permissions are based on role.</p>
        </div>
        <Dialog open={isCreateUserDialogOpen} onOpenChange={setIsCreateUserDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-5 w-5" /> Add New User (Session)
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Create New User (Conceptual)</DialogTitle>
              <DialogDescription>
                This user will be added to the admin view for this session only and is conceptual. Default permissions based on role will be assigned.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateUserSubmit} className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="newUserEmail" className="text-right">Email</Label>
                <Input id="newUserEmail" name="email" value={newUser.email} onChange={handleCreateUserInputChange} className="col-span-3" required type="email" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="newUserPassword" className="text-right">Password</Label>
                <Input id="newUserPassword" name="password" value={newUser.password || ''} onChange={handleCreateUserInputChange} className="col-span-3" required type="password" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="newUserRole" className="text-right">Role</Label>
                <Select name="role" value={newUser.role} onValueChange={(value: UserRole) => handleCreateUserRoleChange(value)}>
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
              {/* Permissions Checkboxes Removed */}
              <DialogFooter>
                <Button type="submit" disabled={isCreatingUser}>
                  {isCreatingUser && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create User
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users2 className="mr-2 h-5 w-5" />
            System Users
          </CardTitle>
          <CardDescription>
            View and search system users. Users removed from this view are for this session only and can still log in if they are hardcoded system users. Newly created users are conceptual and only exist for this session. Permissions are based on role.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5 text-muted-foreground" />
            <Input 
              placeholder="Search users by email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          {isLoadingSystemUsers ? (
             <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-3 text-muted-foreground">Loading users...</p>
            </div>
          ) : filteredUsers.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    {/* Permission columns (Upload, Review, Approve) removed */}
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.email} {user.isSystemUser && <Badge variant="outline" className="ml-2">System</Badge>}
                      </TableCell>
                      <TableCell><Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>{user.role}</Badge></TableCell>
                      {/* Permission cells (CheckSquare/XCircle) removed */}
                      <TableCell className="space-x-2">
                        <Button variant="destructive" size="icon" onClick={() => handleOpenDeleteConfirm(user)} aria-label={`Delete user ${user.email}`}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">
              {systemUsers.length === 0 ? "No system users found or loaded." : "No users match your search."}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Delete User Confirmation Dialog */}
      {deletingUser && (
        <AlertDialog open={isDeleteUserConfirmOpen} onOpenChange={setIsDeleteUserConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action will remove user <span className="font-semibold">{deletingUser.email}</span> from the admin view for this session. 
                {deletingUser.isSystemUser 
                    ? " This user is a system user and can still log in with their original credentials."
                    : " This user was conceptually created and will be removed."
                }
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => { setDeletingUser(null); setIsDeleteUserConfirmOpen(false);}}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteUser} className={buttonVariants({variant: "destructive"})}>Remove from View</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

    </div>
  );
}
