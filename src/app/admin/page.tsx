
'use client';

import React, { useState, useEffect, type FormEvent, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertTriangle, ShieldCheck, UserPlus, UploadCloud, ClipboardCheck, CheckSquare, Users2, Search, Edit3, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createUserWithRole, getSystemUsers } from './actions';
import type { UserRole, NewUserFormData, ConceptualUser } from '@/lib/types';
// Removed import of HARDCODED_USERS_FOR_ADMIN_VIEW

// Helper icon for XCircle, as it's not directly in lucide-react by that name
const XCircleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="15" y1="9" x2="9" y2="15" />
    <line x1="9" y1="9" x2="15" y2="15" />
  </svg>
);

export default function AdminPage() {
  const { user: authUser, loading: authLoading, isAdmin } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  // State for new user form
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('technician');
  const [canUploadDocs, setCanUploadDocs] = useState(false);
  const [canReviewDocs, setCanReviewDocs] = useState(false);
  const [canApproveMedication, setCanApproveMedication] = useState(false);
  const [isSubmittingUser, setIsSubmittingUser] = useState(false);
  const [createUserError, setCreateUserError] = useState<string | null>(null);

  // State for user management
  const [systemUsers, setSystemUsers] = useState<ConceptualUser[]>([]);
  const [isLoadingSystemUsers, setIsLoadingSystemUsers] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // State for editing user
  const [editingUser, setEditingUser] = useState<ConceptualUser | null>(null);
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false);
  const [editUserForm, setEditUserForm] = useState<Partial<ConceptualUser>>({});

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
     if (systemUsers.some(user => user.email.toLowerCase() === newUserEmail.toLowerCase())) {
      setCreateUserError("A user with this email already exists in the list.");
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

    if (result.success && result.email && result.role && result.userId) {
      const newConceptualUser: ConceptualUser = {
        id: result.userId, 
        email: result.email,
        role: result.role,
        password: newUserPassword,
        canUploadDocs: result.canUploadDocs,
        canReviewDocs: result.canReviewDocs,
        canApproveMedication: result.canApproveMedication,
        isSystemUser: result.isSystemUser, // Should be false
      };
      setSystemUsers(prev => [...prev, newConceptualUser]);
      toast({
        title: 'User Created (Session)',
        description: result.message || `User ${result.email} (${result.role}) added to admin view for this session.`,
      });
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

  const handleOpenEditDialog = (userToEdit: ConceptualUser) => {
    setEditingUser(userToEdit);
    setEditUserForm({ 
      role: userToEdit.role,
      canUploadDocs: userToEdit.canUploadDocs,
      canReviewDocs: userToEdit.canReviewDocs,
      canApproveMedication: userToEdit.canApproveMedication,
    });
    setIsEditUserDialogOpen(true);
  };

  const handleEditUserFormChange = (field: keyof ConceptualUser, value: string | boolean | undefined) => {
     if (typeof value === 'boolean' || typeof value === 'string') {
        setEditUserForm(prev => ({ ...prev, [field]: value }));
     }
  };

  const handleSaveUserChanges = () => {
    if (!editingUser || !editUserForm.role) return;
    
    // Use the isSystemUser flag from the user object
    const isOriginalHardcoded = editingUser.isSystemUser; 
    
    setSystemUsers(prevUsers => 
      prevUsers.map(u => 
        u.id === editingUser.id 
        ? { ...u, 
            role: editUserForm.role as UserRole, 
            canUploadDocs: editUserForm.canUploadDocs,
            canReviewDocs: editUserForm.canReviewDocs,
            canApproveMedication: editUserForm.canApproveMedication,
          } 
        : u
      )
    );
    let toastDescription = `Permissions and/or role for ${editingUser.email} updated for this session.`;
    if (isOriginalHardcoded && editingUser.role !== editUserForm.role) {
        toastDescription += ` Original login role from system remains '${editingUser.role}'.`;
    }
    toast({ title: 'User Updated (Session)', description: toastDescription });
    setIsEditUserDialogOpen(false);
    setEditingUser(null);
  };
  
  const handleOpenDeleteConfirm = (userToDelete: ConceptualUser) => {
    setDeletingUser(userToDelete);
    setIsDeleteUserConfirmOpen(true);
  };

  const handleDeleteUser = () => {
    if (!deletingUser) return;

    // Use the isSystemUser flag from the user object
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users2 className="mr-2 h-5 w-5" />
            Manage System Users
          </CardTitle>
          <CardDescription>
            View, search, and manage roles & permissions for system users. 
            Changes to hardcoded users are for this session's view only.
            Newly created users are also session-only.
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
                    <TableHead>Role (Session)</TableHead>
                    <TableHead>Upload</TableHead>
                    <TableHead>Review</TableHead>
                    <TableHead>Approve</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.email} {user.isSystemUser && <Badge variant="outline" className="ml-2">System</Badge>}</TableCell>
                      <TableCell><Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>{user.role}</Badge></TableCell>
                      <TableCell>{user.canUploadDocs ? <CheckSquare className="h-5 w-5 text-green-600"/> : <XCircleIcon className="h-5 w-5 text-red-600"/>}</TableCell>
                      <TableCell>{user.canReviewDocs ? <CheckSquare className="h-5 w-5 text-green-600"/> : <XCircleIcon className="h-5 w-5 text-red-600"/>}</TableCell>
                      <TableCell>{user.canApproveMedication ? <CheckSquare className="h-5 w-5 text-green-600"/> : <XCircleIcon className="h-5 w-5 text-red-600"/>}</TableCell>
                      <TableCell className="space-x-2">
                        <Button variant="outline" size="icon" onClick={() => handleOpenEditDialog(user)} aria-label={`Edit user ${user.email}`}>
                          <Edit3 className="h-4 w-4" />
                        </Button>
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

      {/* Edit User Dialog */}
      {editingUser && (
        <Dialog open={isEditUserDialogOpen} onOpenChange={setIsEditUserDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit User (Session): {editingUser.email}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-role">Role</Label>
                <Select 
                  value={editUserForm.role} 
                  onValueChange={(value) => handleEditUserFormChange('role', value as UserRole)}
                >
                  <SelectTrigger id="edit-role">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="pharmacist">Pharmacist</SelectItem>
                    <SelectItem value="technician">Technician</SelectItem>
                  </SelectContent>
                </Select>
                 {editingUser.isSystemUser && editingUser.role !== editUserForm.role && (
                    <p className="text-xs text-muted-foreground pt-1">Note: Changing role here is for session view only. Original login role is '{editingUser.role}'.</p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="font-medium">Permissions (Session)</Label>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="edit-canUploadDocs" 
                    checked={!!editUserForm.canUploadDocs} 
                    onCheckedChange={(checked) => handleEditUserFormChange('canUploadDocs', checked as boolean)}
                  />
                  <Label htmlFor="edit-canUploadDocs" className="font-normal flex items-center gap-1">
                    <UploadCloud className="h-4 w-4 text-muted-foreground" /> Upload Docs
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="edit-canReviewDocs" 
                    checked={!!editUserForm.canReviewDocs} 
                    onCheckedChange={(checked) => handleEditUserFormChange('canReviewDocs', checked as boolean)}
                  />
                  <Label htmlFor="edit-canReviewDocs" className="font-normal flex items-center gap-1">
                    <ClipboardCheck className="h-4 w-4 text-muted-foreground" /> Review Docs
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="edit-canApproveMedication" 
                    checked={!!editUserForm.canApproveMedication} 
                    onCheckedChange={(checked) => handleEditUserFormChange('canApproveMedication', checked as boolean)}
                  />
                  <Label htmlFor="edit-canApproveMedication" className="font-normal flex items-center gap-1">
                    <CheckSquare className="h-4 w-4 text-muted-foreground" /> Approve Medication
                  </Label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditUserDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveUserChanges}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

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
              <AlertDialogCancel onClick={() => setDeletingUser(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteUser} className={buttonVariants({variant: "destructive"})}>Remove from View</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

    </div>
  );
}
