"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import PageTitle from '@/components/common/PageTitle';
import AccountCard from '@/components/accounts/AccountCard';
import type { Account, AccountType, AccountStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { PlusCircle, Search, ListFilter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AddAccountDialog from '@/components/accounts/AddAccountDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/hooks/use-auth';

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<AccountStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<AccountType | 'all'>('all');
  const [isAddAccountDialogOpen, setIsAddAccountDialogOpen] = useState(false);
  const { toast } = useToast();
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastAccountElementRef = useCallback((node: HTMLDivElement | null) => {
    if (isLoading || isFetchingMore) return;
    
    if (observerRef.current) observerRef.current.disconnect();
    
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    });
    
    if (node) observerRef.current.observe(node);
  }, [isLoading, isFetchingMore, hasMore]);

  // Fetch accounts from Supabase
  const fetchAccounts = async (pageNum: number, isInitial: boolean = false) => {
    try {
      if (!isInitial) {
        setIsFetchingMore(true);
      } else {
        setIsLoading(true);
      }

      const response = await fetch(`/api/accounts?page=${pageNum}&limit=10${statusFilter !== 'all' ? `&status=${statusFilter}` : ''}${typeFilter !== 'all' ? `&type=${typeFilter}` : ''}`, {
        headers: {
          'x-user-id': user?.id || '',
          'x-user-admin': isAdmin() ? 'true' : 'false',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch accounts');
      }
      
      const result = await response.json();
      
      // Transform API response from snake_case to camelCase
      const transformedAccounts: Account[] = (result.data || []).map((apiAccount: any) => ({
        id: apiAccount.id,
        name: apiAccount.name,
        type: apiAccount.type,
        status: apiAccount.status,
        description: apiAccount.description,
        contactEmail: apiAccount.contact_email,
        contactPersonName: apiAccount.contact_person_name,
        contactPhone: apiAccount.contact_phone,
        industry: apiAccount.industry,
        convertedFromLeadId: apiAccount.converted_from_lead_id,
        opportunityIds: [],
        createdAt: apiAccount.created_at,
        updatedAt: apiAccount.updated_at,
      }));
      
      setAccounts(prev => isInitial ? transformedAccounts : [...prev, ...transformedAccounts]);
      setHasMore(result.hasMore);
    } catch (error) {
      console.error('Error fetching accounts:', error);
      toast({
        title: "Error",
        description: "Failed to load accounts. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsFetchingMore(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      setPage(1);
      fetchAccounts(1, true);
    }
  }, [authLoading, user, statusFilter, typeFilter]);

  useEffect(() => {
    if (page > 1) {
      fetchAccounts(page);
    }
  }, [page]);

  const filteredAccounts = accounts.filter(account => {
    const matchesSearch = account.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         (account.contactEmail && account.contactEmail.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || account.status === statusFilter;
    const matchesType = typeFilter === 'all' || account.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  const handleAccountAddedOrUpdated = async (updatedAccount: Account) => {
    setAccounts(prevAccounts => {
      const existingIndex = prevAccounts.findIndex(acc => acc.id === updatedAccount.id);
      if (existingIndex > -1) {
        const newAccounts = [...prevAccounts];
        newAccounts[existingIndex] = updatedAccount;
        return newAccounts;
      }
      return [updatedAccount, ...prevAccounts];
    });
    
    toast({
      title: "Account Updated",
      description: `${updatedAccount.name} has been successfully updated.`,
    });
  };

  const handleAccountDeleted = (accountId: string) => {
    setAccounts(prevAccounts => prevAccounts.filter(acc => acc.id !== accountId));
    toast({
      title: "Account Deleted",
      description: "Account has been successfully deleted.",
    });
  };

  if (isLoading && accounts.length === 0) {
    return (
      <div className="container mx-auto space-y-6 mt-6">
        <PageTitle title="Accounts Management" subtitle="Oversee all client and partner accounts." />
        <div className="flex items-center justify-center h-[60vh]">
          <LoadingSpinner size={32} />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6 mt-6">
      <PageTitle title="Accounts Management" subtitle="Oversee all client and partner accounts.">
        <Button onClick={() => setIsAddAccountDialogOpen(true)} variant="beige">
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Account
        </Button>
      </PageTitle>

      <div className="w-full bg-white rounded-lg shadow p-5 mb-6">
        <div className="flex items-center mb-4">
          <ListFilter className="mr-2 h-5 w-5 text-primary" />
          <span className="font-semibold text-lg">Filter & Search Accounts</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <Label htmlFor="search-accounts">Search Accounts</Label>
            <div className="relative mt-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="search-accounts"
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="status-filter">Status</Label>
            <Select value={statusFilter} onValueChange={(value: AccountStatus | 'all') => setStatusFilter(value)}>
              <SelectTrigger id="status-filter" className="w-full mt-1">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="type-filter">Type</Label>
            <Select value={typeFilter} onValueChange={(value: AccountType | 'all') => setTypeFilter(value)}>
              <SelectTrigger id="type-filter" className="w-full mt-1">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Client">Client</SelectItem>
                <SelectItem value="Channel Partner">Channel Partner</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {accounts.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-muted-foreground mb-4">
            <PlusCircle className="mx-auto h-12 w-12 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No accounts yet</h3>
            <p className="text-sm">Get started by adding your first account or converting a lead.</p>
          </div>
          <Button onClick={() => setIsAddAccountDialogOpen(true)} variant="beige">
            <PlusCircle className="mr-2 h-4 w-4" /> Add First Account
          </Button>
        </div>
      ) : filteredAccounts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-8">
          {filteredAccounts.map((account, index) => (
            <div
              key={account.id}
              ref={index === filteredAccounts.length - 1 ? lastAccountElementRef : null}
            >
              <AccountCard
                account={account}
                isConverted={!!account.convertedFromLeadId}
                onDelete={handleAccountDeleted}
              />
            </div>
          ))}
          
          {(isLoading || isFetchingMore) && (
            <div className="col-span-full flex justify-center py-8">
              <div className="space-y-4">
                <LoadingSpinner />
                <p className="text-sm text-muted-foreground animate-pulse">
                  {isLoading ? 'Loading accounts...' : 'Loading more accounts...'}
                </p>
              </div>
            </div>
          )}

          {!hasMore && accounts.length > 0 && (
            <div className="col-span-full text-center py-8">
              <p className="text-sm text-muted-foreground">You've reached the end of the list.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-16">
          <Search className="mx-auto h-16 w-16 text-muted-foreground/50 mb-6" />
          <p className="text-xl font-semibold text-foreground mb-2">No Accounts Found</p>
          <p className="text-muted-foreground">Try adjusting your search or filter criteria, or add a new account.</p>
        </div>
      )}

      <AddAccountDialog
        open={isAddAccountDialogOpen}
        onOpenChange={setIsAddAccountDialogOpen}
        onAccountAdded={handleAccountAddedOrUpdated}
        onLeadConverted={async (leadId, newAccountId) => {
          // Refresh accounts after lead conversion
          setPage(1);
          await fetchAccounts(1, true);
          toast({
            title: "Lead Converted",
            description: "Lead has been successfully converted to an account.",
          });
        }}
      />
    </div>
  );
}
