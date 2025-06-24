"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import { useToast } from "@/hooks/use-toast";

export default function OpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<OpportunityStatus | 'all'>('all');
  const [accountFilter, setAccountFilter] = useState<string | 'all'>('all'); 
  const [isAddOpportunityDialogOpen, setIsAddOpportunityDialogOpen] = useState(false);
  const [accounts, setAccounts] = useState<{id: string, name: string, type: string}[]>([]);
  const { toast } = useToast();
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastOpportunityElementRef = useCallback((node: HTMLDivElement | null) => {
    if (isLoading || isFetchingMore) return;
    
    if (observerRef.current) observerRef.current.disconnect();
    
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    });
    
    if (node) observerRef.current.observe(node);
  }, [isLoading, isFetchingMore, hasMore]);

  const opportunityStatusOptions: OpportunityStatus[] = ["Scope Of Work", "Proposal", "Negotiation", "Win", "Loss"];

  // Fetch opportunities from API
  const fetchOpportunities = async (pageNum: number, isInitial: boolean = false) => {
    try {
      if (!isInitial) {
        setIsFetchingMore(true);
      } else {
        setIsLoading(true);
      }

      const response = await fetch(
        `/api/opportunities?page=${pageNum}&limit=10${statusFilter !== 'all' ? `&status=${statusFilter}` : ''}${accountFilter !== 'all' ? `&account_id=${accountFilter}` : ''}`
      );
      const result = await response.json();
      
      if (result.data) {
        setOpportunities(prev => isInitial ? result.data : [...prev, ...result.data]);
        setHasMore(result.hasMore);
      }
    } catch (error) {
      console.error('Error fetching opportunities:', error);
      toast({
        title: "Error",
        description: "Failed to load opportunities. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsFetchingMore(false);
    }
  };

  // Fetch accounts for the filter dropdown
  const fetchAccounts = async () => {
    const response = await fetch('/api/accounts');
    const result = await response.json();
    setAccounts((result.data || []).map((acc: any) => ({ id: acc.id, name: acc.name, type: acc.type })));
  };

  useEffect(() => {
    Promise.all([fetchOpportunities(1, true), fetchAccounts()]);
  }, []);

  useEffect(() => {
    if (page > 1) {
      fetchOpportunities(page);
    }
  }, [page]);

  useEffect(() => {
    setPage(1);
    fetchOpportunities(1, true);
  }, [statusFilter, accountFilter]);

  const filteredOpportunities = opportunities.filter(opportunity => {
    const matchesSearch = opportunity.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || opportunity.status === statusFilter;
    const matchesAccount = accountFilter === 'all' || opportunity.associated_account_id === accountFilter;
    return matchesSearch && matchesStatus && matchesAccount;
  }).sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

  const handleOpportunityAdded = async () => {
    setPage(1);
    await fetchOpportunities(1, true);
  };

  const handleOpportunityDeleted = (opportunityId: string) => {
    setOpportunities(prevOpportunities => prevOpportunities.filter(opp => opp.id !== opportunityId));
    toast({
      title: "Opportunity Deleted",
      description: "Opportunity has been successfully deleted.",
    });
  };

  if (isLoading && opportunities.length === 0) {
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
          <Button onClick={() => setIsAddOpportunityDialogOpen(true)} variant="beige">
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Opportunity
          </Button>
        </div>
      </PageTitle>

      <div className="w-full bg-white rounded-lg shadow p-5 mb-6">
        <div className="flex items-center mb-4">
          <ListFilter className="mr-2 h-5 w-5 text-primary" />
          <span className="font-semibold text-lg">Filter & Search Opportunities</span>
        </div>
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
      </div>

      {filteredOpportunities.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-8">
          {filteredOpportunities.map((opportunity, index) => (
            <div
              key={opportunity.id}
              ref={index === filteredOpportunities.length - 1 ? lastOpportunityElementRef : null}
            >
              <OpportunityCard 
                opportunity={opportunity} 
                onDelete={handleOpportunityDeleted}
              />
            </div>
          ))}

          {(isLoading || isFetchingMore) && (
            <div className="col-span-full flex justify-center py-8">
              <div className="space-y-4">
                <LoadingSpinner />
                <p className="text-sm text-muted-foreground animate-pulse">
                  {isLoading ? 'Loading opportunities...' : 'Loading more opportunities...'}
                </p>
              </div>
            </div>
          )}

          {!hasMore && opportunities.length > 0 && (
            <div className="col-span-full text-center py-8">
              <p className="text-sm text-muted-foreground">You've reached the end of the list.</p>
            </div>
          )}
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
