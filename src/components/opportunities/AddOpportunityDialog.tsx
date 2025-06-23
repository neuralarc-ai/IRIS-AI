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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

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
  const [isLoading, setIsLoading] = useState(false);
  const [expectedCloseDate, setExpectedCloseDate] = useState('');
  const [status, setStatus] = useState('Scope Of Work');
  const { toast } = useToast();
  const [selectedSourceType, setSelectedSourceType] = useState<'account' | 'lead'>('account');
  const [leads, setLeads] = useState<any[]>([]);

  // Debug logging
  console.log('AddOpportunityDialog render - open:', open);
  console.log('Accounts prop in AddOpportunityDialog:', accounts);

  // Fetch account name if initialAccountId is provided
  useEffect(() => {
    if (initialAccountId) {
      setSelectedAccountId(initialAccountId);
    }
  }, [initialAccountId]);

  // Fetch leads if needed
  useEffect(() => {
    if (selectedSourceType === 'lead' && leads.length === 0) {
      fetch('/api/leads')
        .then(res => res.json())
        .then(data => setLeads(data.data || []));
    }
  }, [selectedSourceType, leads.length]);

  // Filtered options for dropdown
  const filteredAccounts = selectedSourceType === 'account'
    ? accounts
    : [];
  const filteredLeads = selectedSourceType === 'lead'
    ? leads.filter(lead => lead.status !== 'Converted to Account' && lead.status !== 'Lost')
    : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !selectedAccountId || value === '' || Number(value) <= 0 || !expectedCloseDate || !status) {
      toast({ title: "Error", description: "Opportunity Name, associated Account/Lead, a valid positive Quoted Amount, Status, and Expected Close Date are required.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      const requestBody: any = {
        name,
        description,
        amount: Number(value),
        expected_close_date: expectedCloseDate,
        status,
      };
      if (selectedSourceType === 'account') {
        requestBody.associated_account_id = selectedAccountId;
      } else if (selectedSourceType === 'lead') {
        requestBody.associated_lead_id = selectedAccountId;
      }
      const response = await fetch('/api/opportunities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create opportunity');
      }
      const result = await response.json();
      const newOpportunity = result.data;
      toast({
        title: "Opportunity Created",
        description: `Opportunity "${name}" has been successfully added.`,
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
    setExpectedCloseDate('');
    setStatus('Scope Of Work');
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) resetForm();
      onOpenChange(isOpen);
    }}>
      <DialogContent className="sm:max-w-[525px] bg-[#FAF8F5]">
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
            <Input id="opportunity-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Q4 Enterprise Deal" disabled={isLoading} className="bg-[#E2D4C3]/60" />
          </div>

          {/* Source Type Radio Filter */}
          <div>
            <Label>Source</Label>
            <RadioGroup
              value={selectedSourceType}
              onValueChange={val => setSelectedSourceType(val as 'account' | 'lead')}
              className="flex flex-row gap-4 mt-2"
            >
              <div className="flex items-center">
                <RadioGroupItem value="account" id="source-account" />
                <Label htmlFor="source-account" className="ml-1 mr-4">Account</Label>
              </div>
              <div className="flex items-center">
                <RadioGroupItem value="lead" id="source-lead" />
                <Label htmlFor="source-lead" className="ml-1">Lead</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Associated Account selection */}
          <div>
            <Label htmlFor="opportunity-account">{selectedSourceType === 'account' ? 'Associated Account' : 'Associated Lead'} <span className="text-destructive">*</span></Label>
            {selectedSourceType === 'account' && initialAccountId ? (
              <Input
                id="opportunity-account"
                value={accounts.find(acc => acc.id === initialAccountId)?.name || ''}
                disabled
                className="bg-[#E2D4C3]/60"
              />
            ) : selectedSourceType === 'account' ? (
              <Select
                value={selectedAccountId}
                onValueChange={setSelectedAccountId}
                disabled={isLoading || filteredAccounts.length === 0}
                required
              >
                <SelectTrigger id="opportunity-account" className="bg-[#E2D4C3]/60">
                  <SelectValue placeholder={filteredAccounts.length === 0 ? 'No active accounts' : 'Select account'} />
                </SelectTrigger>
                <SelectContent>
                  {filteredAccounts.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Select
                value={selectedAccountId}
                onValueChange={setSelectedAccountId}
                disabled={isLoading || filteredLeads.length === 0}
                required
              >
                <SelectTrigger id="opportunity-lead" className="bg-[#E2D4C3]/60">
                  <SelectValue placeholder={filteredLeads.length === 0 ? 'No available leads' : 'Select lead'} />
                </SelectTrigger>
                <SelectContent>
                  {filteredLeads.map((lead) => (
                    <SelectItem key={lead.id} value={lead.id}>{lead.company_name || lead.companyName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div>
            <Label htmlFor="opportunity-description">Description</Label>
            <Textarea
              id="opportunity-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief overview of the opportunity, client needs, etc."
              disabled={isLoading}
              rows={3}
              className="bg-[#E2D4C3]/60"
            />
          </div>
          <div>
            <Label htmlFor="opportunity-value">Quoted Amount (USD) <span className="text-destructive">*</span></Label>
            <Input
              id="opportunity-value"
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="e.g., 50000 (USD)"
              disabled={isLoading}
              min="0"
              className="bg-[#E2D4C3]/60"
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
              className="bg-[#E2D4C3]/60"
            />
          </div>
          {/* Status Dropdown */}
          <div>
            <Label htmlFor="opportunity-status">Status <span className="text-destructive">*</span></Label>
            <Select
              onValueChange={setStatus}
              value={status}
              disabled={isLoading}
            >
              <SelectTrigger id="opportunity-status" className="w-full bg-[#E2D4C3]/60">
                <SelectValue placeholder="Select a status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Scope Of Work">Scope Of Work</SelectItem>
                <SelectItem value="Proposal">Proposal</SelectItem>
                <SelectItem value="Negotiation">Negotiation</SelectItem>
                <SelectItem value="Win">Win</SelectItem>
                <SelectItem value="Loss">Loss</SelectItem>
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
