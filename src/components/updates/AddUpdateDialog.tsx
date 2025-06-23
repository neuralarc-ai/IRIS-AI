"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import type { Account, Opportunity, Update, UpdateType, Lead, LeadApiResponse } from '@/types';
import { Loader2, MessageSquarePlus, Briefcase, BarChartBig, User } from 'lucide-react';
import { useAuth } from "@/hooks/use-auth";

interface AddUpdateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateAdded?: () => void;
}

const updateTypeOptions: UpdateType[] = ["General", "Call", "Meeting", "Email"];
type EntityType = "lead" | "accountOpportunity";

export default function AddUpdateDialog({ open, onOpenChange, onUpdateAdded }: AddUpdateDialogProps) {
  const [entityType, setEntityType] = useState<EntityType>("accountOpportunity");
  const [selectedLeadId, setSelectedLeadId] = useState<string>('');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [availableOpportunities, setAvailableOpportunities] = useState<Opportunity[]>([]);
  const [selectedOpportunityId, setSelectedOpportunityId] = useState<string>('');
  const [updateType, setUpdateTypeState] = useState<UpdateType | ''>('');
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [leads, setLeads] = useState<LeadApiResponse[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingData(true);
      try {
        // Fetch accounts
        const accountsResponse = await fetch('/api/accounts');
        if (accountsResponse.ok) {
          const accountsData = await accountsResponse.json();
          setAccounts(accountsData.data || []);
        }

        // Fetch opportunities
        const opportunitiesResponse = await fetch('/api/opportunities');
        if (opportunitiesResponse.ok) {
          const opportunitiesData = await opportunitiesResponse.json();
          setOpportunities(opportunitiesData.data || []);
        }

        // Fetch leads
        const leadsResponse = await fetch('/api/leads');
        if (leadsResponse.ok) {
          const leadsData = await leadsResponse.json();
          setLeads(leadsData.data || []);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({ title: "Error", description: "Failed to load data." });
      } finally {
        setIsLoadingData(false);
      }
    };

    if (open) {
      fetchData();
    }
  }, [open, toast]);

  const activeLeads = leads.filter(lead => lead.status !== 'Converted to Account' && lead.status !== 'Lost');
  const activeAccounts = accounts.filter(acc => acc.status === 'Active');

  useEffect(() => {
    if (entityType === "accountOpportunity" && selectedAccountId) {
      const accountOpportunities = opportunities.filter(opp => opp.associated_account_id === selectedAccountId);
      setAvailableOpportunities(accountOpportunities);
      setSelectedOpportunityId(''); 
    } else {
      setAvailableOpportunities([]);
      setSelectedOpportunityId('');
    }
    // Reset other fields when entity type changes
    if (entityType === "lead") {
        setSelectedAccountId('');
        setAvailableOpportunities([]);
        setSelectedOpportunityId('');
    } else {
        setSelectedLeadId('');
    }

  }, [selectedAccountId, entityType, opportunities]);

  const resetForm = () => {
    setEntityType("accountOpportunity");
    setSelectedLeadId('');
    setSelectedAccountId('');
    setAvailableOpportunities([]);
    setSelectedOpportunityId('');
    setUpdateTypeState('');
    setContent('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch('/api/updates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account_id: selectedAccountId || null,
          opportunity_id: selectedOpportunityId || null,
          lead_id: selectedLeadId || null,
          type: updateType,
          content,
          date: new Date().toISOString(),
          updated_by_user_id: user?.id,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create update');
      }
      
      if (onUpdateAdded) onUpdateAdded();
      onOpenChange(false);
      resetForm();
      toast({ title: "Success", description: "Update created successfully." });
    } catch (error) {
      console.error('Error creating update:', error);
      toast({ title: "Error", description: error instanceof Error ? error.message : "Failed to create update." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) resetForm();
      onOpenChange(isOpen);
    }}>
      <DialogContent className="sm:max-w-xl bg-[#FAF8F5]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <MessageSquarePlus className="mr-2 h-5 w-5" /> Log New Communication Update
          </DialogTitle>
          <DialogDescription>
            Choose to log an update for a lead or for an account's opportunity.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-3">
          
          <div>
            <Label className="mb-2 block">Log Update For:</Label>
            <RadioGroup defaultValue="accountOpportunity" value={entityType} onValueChange={(value: EntityType) => setEntityType(value)} className="flex space-x-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="accountOpportunity" id="rAccountOpp" />
                <Label htmlFor="rAccountOpp" className="font-normal">Account & Opportunity</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="lead" id="rLead" />
                <Label htmlFor="rLead" className="font-normal">Lead</Label>
              </div>
            </RadioGroup>
          </div>

          {isLoadingData && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading data...</span>
            </div>
          )}

          {entityType === 'lead' && (
            <div>
              <Label htmlFor="update-lead">Lead <span className="text-destructive">*</span></Label>
              <Select value={selectedLeadId} onValueChange={setSelectedLeadId} disabled={isLoading || isLoadingData}>
                <SelectTrigger id="update-lead" className="bg-[#E2D4C3]/60">
                  <SelectValue placeholder={isLoadingData ? "Loading leads..." : "Select a lead"} />
                </SelectTrigger>
                <SelectContent>
                  {activeLeads.map(lead => (
                    <SelectItem key={lead.id} value={lead.id}>
                      <div className="flex items-center">
                        <User className="mr-2 h-4 w-4 text-muted-foreground" />
                        {lead.person_name} ({lead.company_name})
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {entityType === 'accountOpportunity' && (
            <>
              <div>
                <Label htmlFor="update-account">Account <span className="text-destructive">*</span></Label>
                <Select value={selectedAccountId} onValueChange={setSelectedAccountId} disabled={isLoading || isLoadingData}>
                  <SelectTrigger id="update-account" className="bg-[#E2D4C3]/60">
                    <SelectValue placeholder={isLoadingData ? "Loading accounts..." : "Select an account"} />
                  </SelectTrigger>
                  <SelectContent>
                    {activeAccounts.map(account => (
                      <SelectItem key={account.id} value={account.id}>
                        <div className="flex items-center">
                          <Briefcase className="mr-2 h-4 w-4 text-muted-foreground" />
                          {account.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedAccountId && (
                <div>
                  <Label htmlFor="update-opportunity">Opportunity</Label>
                  <Select 
                    value={selectedOpportunityId} 
                    onValueChange={setSelectedOpportunityId} 
                    disabled={isLoading || isLoadingData}
                  >
                    <SelectTrigger id="update-opportunity" className="bg-[#E2D4C3]/60">
                      <SelectValue placeholder="Select an opportunity (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableOpportunities.map(opportunity => (
                        <SelectItem key={opportunity.id} value={opportunity.id}>
                           <div className="flex items-center">
                            <BarChartBig className="mr-2 h-4 w-4 text-muted-foreground" />
                            {opportunity.name}
                           </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {availableOpportunities.length === 0 && selectedAccountId && !isLoading && !isLoadingData && (
                    <p className="text-xs text-muted-foreground mt-1">
                      This account has no active opportunities. You can still log updates for the account.
                    </p>
                  )}
                </div>
              )}
            </>
          )}

          <div>
            <Label htmlFor="update-type">Update Type <span className="text-destructive">*</span></Label>
            <Select value={updateType} onValueChange={(value) => setUpdateTypeState(value as UpdateType)} disabled={isLoading || isLoadingData}>
              <SelectTrigger id="update-type" className="bg-[#E2D4C3]/60">
                <SelectValue placeholder="Select update type" />
              </SelectTrigger>
              <SelectContent>
                {updateTypeOptions.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="update-content">Content <span className="text-destructive">*</span></Label>
            <Textarea
              id="update-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Describe the call, meeting, email, or general update..."
              rows={5}
              disabled={isLoading || isLoadingData}
              className="bg-[#E2D4C3]/60"
            />
          </div>
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading || isLoadingData}>
              Cancel
            </Button>
            <Button 
                type="submit" 
                disabled={
                    isLoading || 
                    isLoadingData ||
                    (entityType === 'accountOpportunity' && !selectedAccountId) ||
                    (entityType === 'lead' && !selectedLeadId) ||
                    !updateType ||
                    !content.trim()
                }
            >
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Log Update"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
