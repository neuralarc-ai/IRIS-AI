"use client";

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Users, UserCheck } from "lucide-react";
import type { User } from "@/types";

interface BulkAssignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedLeadIds: string[];
  onAssignmentComplete: () => void;
}

export default function BulkAssignDialog({
  open,
  onOpenChange,
  selectedLeadIds,
  onAssignmentComplete,
}: BulkAssignDialogProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const { toast } = useToast();

  // Fetch users when dialog opens
  useEffect(() => {
    if (open) {
      fetchUsers();
    }
  }, [open]);

  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const response = await fetch('/api/users');
      const data = await response.json();
      
      if (data.data) {
        const transformedUsers: User[] = data.data.map((user: any) => ({
          id: user.id,
          name: user.name,
          email: user.email,
          pin: user.pin,
          createdAt: user.created_at,
          role: user.role,
          isActive: user.is_active,
          lastLoginAt: user.last_login_at,
          is_admin: user.is_admin,
        }));
        setUsers(transformedUsers);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to load users. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedUserId) {
      toast({
        title: "No User Selected",
        description: "Please select a user to assign the leads to.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/leads/bulk-assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          leadIds: selectedLeadIds,
          assignedUserId: selectedUserId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to assign leads');
      }

      toast({
        title: "Leads Assigned Successfully!",
        description: result.message,
        className: "bg-green-100 dark:bg-green-900 border-green-500",
      });

      // Reset form and close dialog
      setSelectedUserId('');
      onOpenChange(false);
      onAssignmentComplete();
    } catch (error) {
      console.error('Error assigning leads:', error);
      toast({
        title: "Assignment Failed",
        description: error instanceof Error ? error.message : "Failed to assign leads. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const selectedUser = users.find(user => user.id === selectedUserId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white text-black">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#2B2521]">
            <Users className="h-5 w-5" />
            Bulk Assign Leads
          </DialogTitle>
          <DialogDescription className="text-[#2B2521]/70">
            Assign {selectedLeadIds.length} selected lead{selectedLeadIds.length !== 1 ? 's' : ''} to a team member.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="user-select" className="text-sm font-medium text-[#2B2521]">
              Select User
            </Label>
            <Select
              value={selectedUserId}
              onValueChange={setSelectedUserId}
              disabled={isLoadingUsers}
            >
              <SelectTrigger id="user-select" className="w-full bg-gray-50 border-gray-300">
                <SelectValue placeholder={isLoadingUsers ? "Loading users..." : "Choose a user"} />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4" />
                      <span>{user.name}</span>
                      <span className="text-gray-500 text-xs">({user.email})</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedUser && (
            <div className="p-3 bg-[#E5E7E0] rounded-lg border border-[#97A88C]">
              <div className="flex items-center gap-2 text-sm">
                <UserCheck className="h-4 w-4 text-[#97A88C]" />
                <span className="font-medium text-[#2B2521]">
                  {selectedUser.name}
                </span>
              </div>
              <p className="text-xs text-[#2B2521]/70 mt-1">
                {selectedUser.email}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="border-[#97A88C] text-[#2B2521] hover:bg-[#97A88C]/10"
          >
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            disabled={isLoading || !selectedUserId}
            className="bg-[#2B2521] hover:bg-[#2B2521]/90 text-white"
          >
            {isLoading ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Assigning...
              </>
            ) : (
              `Assign ${selectedLeadIds.length} Lead${selectedLeadIds.length !== 1 ? 's' : ''}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 