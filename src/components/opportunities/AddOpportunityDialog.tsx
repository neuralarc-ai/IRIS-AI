"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import type { Opportunity } from '@/types';
import { Loader2, BarChartBig, Briefcase } from 'lucide-react';

interface AddOpportunityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpportunityAdded?: (newOpportunity: Opportunity) => void;
  initialAccountId?: string;
  accounts: { id: string, name: string, type: string }[];
}

export default function AddOpportunityDialog({ open, onOpenChange, onOpportunityAdded, initialAccountId, accounts = [] }: AddOpportunityDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [value, setValue] = useState<number | string>('');
  const [selectedAccountId, setSelectedAccountId] = useState<string | ''>(initialAccountId || '');
  const [accountName, setAccountName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [expectedCloseDate, setExpectedCloseDate] = useState('');
  const [status, setStatus] = useState('Need Analysis');
  const { toast } = useToast();

  // Debug logging
  console.log('AddOpportunityDialog render - open:', open);
  console.log('Accounts prop in AddOpportunityDialog:', accounts);

  // Fetch account name if initialAccountId is provided
  useEffect(() => {
    if (initialAccountId) {
      setSelectedAccountId(initialAccountId);
      // Try to get account name from accounts prop first
      const found = accounts.find(a => a.id === initialAccountId);
      if (found) {
        setAccountName(found.name);
      } else {
        // Fetch from backend if not found in prop
        fetch(`/api/accounts?id=${initialAccountId}`)
          .then(res => res.json())
          .then(data => {
            if (data.data && data.data.length > 0) {
              setAccountName(data.data[0].name);
            } else {
              setAccountName('');
            }
          })
          .catch(() => setAccountName(''));
      }
    } else {
      setAccountName('');
    }
  }, [initialAccountId, accounts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !selectedAccountId || value === '' || Number(value) <= 0 || !expectedCloseDate || !status) {
      toast({ title: "Error", description: "Opportunity Name, associated Account, a valid positive Quoted Amount, Status, and Expected Close Date are required.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch('/api/opportunities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          associated_account_id: selectedAccountId,
          description,
          amount: Number(value),
          expected_close_date: expectedCloseDate,
          status,
        })
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create opportunity');
      }
      const result = await response.json();
      const newOpportunity = result.data;
      toast({
        title: "Opportunity Created",
        description: `Opportunity "${name}" has been successfully added for account ${accounts.find(a => a.id === selectedAccountId)?.name}.`,
      });
      onOpportunityAdded?.(newOpportunity);
      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to create opportunity:", error);
      toast({ title: "Error", description: "Failed to create opportunity. Please try again.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setValue('');
    setSelectedAccountId('');
    setAccountName('');
    setExpectedCloseDate('');
    setStatus('Need Analysis');
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) resetForm();
      onOpenChange(isOpen);
    }}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <BarChartBig className="mr-2 h-5 w-5" /> Add New Opportunity
          </DialogTitle>
          <DialogDescription>
            Fill in the details below to create a new sales opportunity for an existing account.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div>
            <Label htmlFor="opportunity-name">Opportunity Name <span className="text-destructive">*</span></Label>
            <Input id="opportunity-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Q4 Enterprise Deal" disabled={isLoading} />
          </div>

          {/* Associated Account as read-only field */}
          {selectedAccountId && (
            <div>
              <Label htmlFor="opportunity-account">Associated Account <span className="text-destructive">*</span></Label>
              <Input id="opportunity-account" value={accountName} disabled />
            </div>
          )}

          <div>
            <Label htmlFor="opportunity-description">Description</Label>
            <Textarea
              id="opportunity-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief overview of the opportunity, client needs, etc."
              disabled={isLoading}
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="opportunity-value">Quoted Amount <span className="text-destructive">*</span></Label>
            <Input
              id="opportunity-value"
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="e.g., 50000"
              disabled={isLoading}
              min="0"
            />
          </div>
          {/* Expected Close Date */}
          <div>
            <Label htmlFor="expected-close-date">Expected Close Date <span className="text-destructive">*</span></Label>
            <Input
              id="expected-close-date"
              type="date"
              value={expectedCloseDate}
              onChange={(e) => setExpectedCloseDate(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>
          {/* Status Dropdown */}
          <div>
            <Label htmlFor="opportunity-status">Status <span className="text-destructive">*</span></Label>
            <Select
              value={status}
              onValueChange={setStatus}
              disabled={isLoading}
              required
            >
              <SelectTrigger id="opportunity-status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Need Analysis">Need Analysis</SelectItem>
                <SelectItem value="Negotiation">Negotiation</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="On Hold">On Hold</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Create Opportunity"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
