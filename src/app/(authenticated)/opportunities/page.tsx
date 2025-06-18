"use client";

import React, { useState, useEffect } from 'react';
import PageTitle from '@/components/common/PageTitle';
import OpportunityCard from '@/components/opportunities/OpportunityCard';
import type { Opportunity, OpportunityStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { PlusCircle, ListFilter, Search, BarChartBig } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import AddOpportunityDialog from '@/components/opportunities/AddOpportunityDialog';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

export default function OpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<OpportunityStatus | 'all'>('all');
  const [accountFilter, setAccountFilter] = useState<string | 'all'>('all'); 
  const [isAddOpportunityDialogOpen, setIsAddOpportunityDialogOpen] = useState(false);
  const [accounts, setAccounts] = useState<{id: string, name: string, type: string}[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const opportunityStatusOptions: OpportunityStatus[] = ["Need Analysis", "Negotiation", "In Progress", "On Hold", "Completed", "Cancelled"];

  // Fetch opportunities from API
  const fetchOpportunities = async () => {
    const response = await fetch('/api/opportunities');
    const result = await response.json();
    setOpportunities(result.data || []);
  };

  // Fetch accounts for the filter dropdown
  const fetchAccounts = async () => {
    const response = await fetch('/api/accounts');
    const result = await response.json();
    setAccounts((result.data || []).map((acc: any) => ({ id: acc.id, name: acc.name, type: acc.type })));
  };

  useEffect(() => {
    setIsLoading(true);
    Promise.all([fetchOpportunities(), fetchAccounts()]).finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    console.log("Accounts fetched for dropdown:", accounts);
  }, [accounts]);

  const filteredOpportunities = opportunities.filter(opportunity => {
    const matchesSearch = opportunity.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || opportunity.status === statusFilter;
    const matchesAccount = accountFilter === 'all' || opportunity.associated_account_id === accountFilter;
    return matchesSearch && matchesStatus && matchesAccount;
  }).sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

  const handleOpportunityAdded = async () => {
    await fetchOpportunities();
  };

  if (isLoading) {
    return (
      <div className="container mx-auto space-y-6 mt-6">
        <PageTitle title="Opportunity Management" subtitle="Track and manage all ongoing and potential sales opportunities." />
        <div className="flex items-center justify-center h-[60vh]">
          <LoadingSpinner size={32} />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6 mt-6">
      <PageTitle title="Opportunity Management" subtitle="Track and manage all ongoing and potential sales opportunities.">
        <div className="flex gap-2">
          <Button onClick={() => {
            setIsAddOpportunityDialogOpen(true);
          }}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Opportunity
          </Button>
        </div>
      </PageTitle>

      <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center">
                <ListFilter className="mr-2 h-5 w-5 text-primary"/> Filter & Search Opportunities
            </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <Label htmlFor="search-opportunities">Search Opportunities</Label>
              <div className="relative mt-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search-opportunities"
                  type="text"
                  placeholder="Search by name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="status-filter">Status</Label>
              <Select value={statusFilter} onValueChange={(value: OpportunityStatus | 'all') => setStatusFilter(value)}>
                <SelectTrigger id="status-filter" className="w-full mt-1">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {opportunityStatusOptions.map(status => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="account-filter">Account</Label>
              <Select value={accountFilter} onValueChange={(value: string | 'all') => setAccountFilter(value)}>
                <SelectTrigger id="account-filter" className="w-full mt-1">
                  <SelectValue placeholder="Filter by account" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Accounts</SelectItem>
                  {accounts.map(account => (
                    <SelectItem key={account.id} value={account.id}>{account.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {filteredOpportunities.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-8">
          {filteredOpportunities.map((opportunity) => (
            <OpportunityCard key={opportunity.id} opportunity={opportunity} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <BarChartBig className="mx-auto h-16 w-16 text-muted-foreground/50 mb-6" />
          <p className="text-xl font-semibold text-foreground mb-2">No Opportunities Found</p>
          <p className="text-muted-foreground">Try adjusting your search or filter criteria, or add a new opportunity.</p>
        </div>
      )}
      <AddOpportunityDialog 
        open={isAddOpportunityDialogOpen} 
        onOpenChange={setIsAddOpportunityDialogOpen}
        onOpportunityAdded={handleOpportunityAdded}
        accounts={accounts}
      />
    </div>
  );
}
