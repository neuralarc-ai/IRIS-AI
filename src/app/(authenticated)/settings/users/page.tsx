"use client";

import React, { useState, useEffect, useRef } from 'react';
import PageTitle from '@/components/common/PageTitle';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, Eye, EyeOff as EyeOffIcon, Users2, Loader2, Trash2 } from 'lucide-react';
import type { UserApiResponse } from '@/types';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const CreateUserForm = ({ onUserCreated, closeDialog }: { onUserCreated: () => void, closeDialog: () => void }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pinDisplay, setPinDisplay] = useState<string[]>(Array(6).fill('')); // 6-digit PIN
  const [isGeneratingPin, setIsGeneratingPin] = useState(false);
  const [role, setRole] = useState('user');
  const generatedPinRef = useRef<string | null>(null);
  const { toast } = useToast();

  const generatePin = () => {
    setIsGeneratingPin(true);
    // Generate 6-digit PIN
    const newPin = Math.floor(100000 + Math.random() * 900000).toString();
    generatedPinRef.current = newPin;
    setPinDisplay(newPin.split(''));
    setIsGeneratingPin(false);
  };

  const createUserWithPin = async () => {
    if (!generatedPinRef.current) {
      toast({ title: "Error", description: "Please generate a PIN first.", variant: "destructive" });
      return;
    }

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          pin: generatedPinRef.current,
          role
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create user');
      }

      const result = await response.json();
      
      toast({
        title: "User Created Successfully!",
        description: (
          <div>
            <p>{result.data.name} has been added to the system.</p>
            <p className="font-semibold">Generated PIN: <span className="font-mono text-base">{generatedPinRef.current}</span></p>
            <p className="text-xs text-muted-foreground mt-1">Please ensure the user notes down this PIN.</p>
          </div>
        ),
        duration: 7000,
      });
      
      onUserCreated();
      resetFormAndAnimation();
      closeDialog();
    } catch (error) {
      console.error('Error creating user:', error);
      toast({ 
        title: "Error", 
        description: error instanceof Error ? error.message : "Failed to create user.",
        variant: "destructive" 
      });
      resetFormAndAnimation();
    }
  };
  
  const resetFormAndAnimation = () => {
    setName('');
    setEmail('');
    setPinDisplay(Array(6).fill(''));
    setIsGeneratingPin(false);
    setRole('user');
    generatedPinRef.current = null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast({ title: "Error", description: "Name and email are required.", variant: "destructive" });
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      toast({ title: "Error", description: "Please enter a valid email address.", variant: "destructive" });
      return;
    }
    if (!generatedPinRef.current) {
      toast({ title: "Error", description: "Please generate a PIN first.", variant: "destructive" });
      return;
    }
    createUserWithPin();
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Create New User</DialogTitle>
        <DialogDescription>Enter the user's details and generate a 6-digit PIN.</DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4 pt-4">
        <div>
          <Label htmlFor="create-name">Name</Label>
          <Input id="create-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter user's name" />
        </div>
        <div>
          <Label htmlFor="create-email">Email</Label>
          <Input id="create-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter user's email" />
        </div>

        <div>
          <Label htmlFor="create-role">Role</Label>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger id="create-role">
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between">
            <Label>Generated PIN:</Label>
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={generatePin}
              disabled={isGeneratingPin}
            >
              {isGeneratingPin ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Generate PIN
            </Button>
          </div>
          <div className="flex justify-center space-x-1 sm:space-x-2 h-20 items-center rounded-md p-1 sm:p-2">
            {pinDisplay.map((digit, index) => (
              <span
                key={index}
                className={`w-8 h-12 sm:w-10 sm:h-14 text-2xl sm:text-3xl font-mono border-2 flex items-center justify-center rounded-md bg-background shadow-inner 
                  ${generatedPinRef.current ? 'border-green-500 text-green-600' : 'border-input'}
                `}
              >
                {digit || ''} 
              </span>
            ))}
          </div>
          {generatedPinRef.current && <p className="text-xs text-center text-muted-foreground">PIN generated successfully!</p>}
        </div>

        <DialogFooter className="pt-2">
          <DialogClose asChild>
            <Button type="button" variant="outline" onClick={() => {
              resetFormAndAnimation();
              closeDialog();
            }}>Cancel</Button>
          </DialogClose>
          <Button type="submit" disabled={!generatedPinRef.current}>
            Create User
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
};

const EditPinDialog = ({ user, onPinUpdated, open, onOpenChange }: { user: UserApiResponse | null, onPinUpdated: () => void, open: boolean, onOpenChange: (open: boolean) => void }) => {
  const [newPin, setNewPin] = useState('');
  const [currentPinVisible, setCurrentPinVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      setNewPin('');
    }
  }, [user, open]);

  const handleUpdatePin = async () => {
    if (!user || !newPin || newPin.length !== 6 || !/^\d{6}$/.test(newPin)) {
      toast({ title: "Error", description: "PIN must be 6 digits and contain only numbers.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: newPin }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update PIN');
      }

      toast({ title: "PIN Updated", description: `PIN for ${user.name} has been changed to ${newPin}.` });
      onPinUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating PIN:', error);
      toast({ 
        title: "Error", 
        description: error instanceof Error ? error.message : "Failed to update PIN.",
        variant: "destructive" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manage PIN for {user.name}</DialogTitle>
          <DialogDescription>View or update the 6-digit PIN for this user.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between">
            <Label>Current PIN:</Label>
            <div className="flex items-center gap-2">
              <span className="font-mono text-lg tracking-widest">
                {currentPinVisible ? user.pin : "••••••"}
              </span>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentPinVisible(!currentPinVisible)}>
                {currentPinVisible ? <EyeOffIcon className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                <span className="sr-only">{currentPinVisible ? "Hide PIN" : "Show PIN"}</span>
              </Button>
            </div>
          </div>
          <div>
            <Label htmlFor="edit-newPin">New 6-Digit PIN</Label>
            <Input
              id="edit-newPin"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Enter new 6-digit PIN"
              maxLength={6}
              className="font-mono tracking-widest"
              disabled={isLoading}
            />
          </div>
        </div>
        <DialogFooter>
           <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>Cancel</Button>
           <Button onClick={handleUpdatePin} disabled={isLoading}>
             {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Update PIN"}
           </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const DeleteUserDialog = ({ user, onUserDeleted, open, onOpenChange }: { user: UserApiResponse | null, onUserDeleted: () => void, open: boolean, onOpenChange: (open: boolean) => void }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleDeleteUser = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete user');
      }

      toast({ 
        title: "User Deleted", 
        description: `${user.name} has been removed from the system.`,
        variant: "default"
      });
      onUserDeleted();
      onOpenChange(false);
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({ 
        title: "Error", 
        description: error instanceof Error ? error.message : "Failed to delete user.",
        variant: "destructive" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete User</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete {user.name}? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            This will permanently remove the user account and all associated data.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDeleteUser} disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
            Delete User
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default function UserManagementPage() {
  const [users, setUsers] = useState<UserApiResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateUserDialogOpen, setIsCreateUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserApiResponse | null>(null);
  const [isEditPinDialogOpen, setIsEditPinDialogOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState<UserApiResponse | null>(null);
  const [isDeleteUserDialogOpen, setIsDeleteUserDialogOpen] = useState(false);
  const { toast } = useToast();
  const { isAdmin, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      const data = await response.json();
      setUsers(data.data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({ 
        title: "Error", 
        description: "Failed to load users.",
        variant: "destructive" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (!authLoading && !isAdmin()) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page.",
        variant: "destructive",
      });
      router.push('/dashboard');
    }
  }, [authLoading, isAdmin, router, toast]);

  const handleUserCreated = () => {
    fetchUsers();
  };

  const handlePinUpdated = () => {
    fetchUsers();
    setEditingUser(null);
  };

  const handleUserDeleted = () => {
    fetchUsers();
    setDeletingUser(null);
  };

  const handleOpenEditDialog = (user: UserApiResponse) => {
    setEditingUser(user);
    setIsEditPinDialogOpen(true);
  };

  const handleOpenDeleteDialog = (user: UserApiResponse) => {
    setDeletingUser(user);
    setIsDeleteUserDialogOpen(true);
  };

  const handleCreateUserDialogChange = (open: boolean) => {
    setIsCreateUserDialogOpen(open);
  };

  if (authLoading || !isAdmin()) {
    return (
      <div className="container mx-auto mt-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto mt-6">
      <PageTitle title="User Management" subtitle="Create and manage user accounts and PINs.">
        <Dialog open={isCreateUserDialogOpen} onOpenChange={handleCreateUserDialogChange}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Add New User
            </Button>
          </DialogTrigger>
          <CreateUserForm
            onUserCreated={handleUserCreated}
            closeDialog={() => setIsCreateUserDialogOpen(false)}
          />
        </Dialog>
      </PageTitle>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users2 className="mr-2 h-6 w-6 text-primary" /> User Accounts
          </CardTitle>
          <CardDescription>Overview of all registered users in the system.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading users...</span>
            </div>
          ) : users.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-left">Name</TableHead>
                  <TableHead className="text-left">Email</TableHead>
                  <TableHead className="text-left">Role</TableHead>
                  <TableHead className="text-left">PIN (Visible to Admin)</TableHead>
                  <TableHead className="text-left">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell className="capitalize">{user.role}</TableCell>
                    <TableCell className="font-mono tracking-widest">{user.pin}</TableCell>
                    <TableCell className="text-left">
                      <TooltipProvider>
                        <div className="flex items-center gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" onClick={() => handleOpenEditDialog(user)} className="h-8 w-8">
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">Manage PIN</span>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Manage PIN</p>
                            </TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" onClick={() => handleOpenDeleteDialog(user)} className="h-8 w-8 text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Delete user</span>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Delete user</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </TooltipProvider>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="p-6 text-center text-muted-foreground">No users found.</p>
          )}
        </CardContent>
      </Card>

      <EditPinDialog
        user={editingUser}
        onPinUpdated={handlePinUpdated}
        open={isEditPinDialogOpen}
        onOpenChange={setIsEditPinDialogOpen}
      />

      <DeleteUserDialog
        user={deletingUser}
        onUserDeleted={handleUserDeleted}
        open={isDeleteUserDialogOpen}
        onOpenChange={setIsDeleteUserDialogOpen}
      />
    </div>
  );
}

    