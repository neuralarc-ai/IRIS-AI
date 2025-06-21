"use client";

import React, { useState, useEffect } from 'react';
import PageTitle from '@/components/common/PageTitle';
import UpdateItem from '@/components/updates/UpdateItem';
import type { Update, UpdateType, Opportunity } from '@/types';
import { Button } from '@/components/ui/button';
import { PlusCircle, Search, ListFilter, MessageSquare, Briefcase, Wand2 } from 'lucide-react';
import { Input } from '@/components/ui/input'; 
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {format, parseISO, isValid} from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import AddUpdateDialog from '@/components/updates/AddUpdateDialog';

// Local type for updates with account and opportunity objects
interface UpdateWithEntities extends Omit<Update, 'accountId' | 'opportunityId' | 'updatedByUserId'> {
  account?: { id: string; name: string };
  opportunity?: { id: string; name: string };
  updatedByUser?: { id: string; name: string };
  [key: string]: any;
}

export default function UpdatesPage() {
  const [updates, setUpdates] = useState<UpdateWithEntities[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [searchTerm, setSearchTerm] = useState(''); 
  const [typeFilter, setTypeFilter] = useState<UpdateType | 'all'>('all');
  const [opportunityFilter, setOpportunityFilter] = useState<string | 'all'>('all');
  const [dateFilter, setDateFilter] = useState<string>(''); 
  const [isAddUpdateDialogOpen, setIsAddUpdateDialogOpen] = useState(false);
  const [newActivities, setNewActivities] = useState<{ [accountId: string]: string }>({});
  const [isSaving, setIsSaving] = useState<{ [accountId: string]: boolean }>({});
  const [newActivityTypes, setNewActivityTypes] = useState<{ [accountId: string]: string }>({});
  const [aiLoading, setAiLoading] = useState<{ [accountId: string]: boolean }>({});

  useEffect(() => {
    const fetchUpdates = async () => {
      const response = await fetch('/api/updates');
      const result = await response.json();
      console.log('Raw /api/updates response:', result);
      setUpdates((result.data || []).map((apiUpdate: any) => ({
        id: apiUpdate.id,
        type: apiUpdate.type,
        content: apiUpdate.content,
        date: apiUpdate.date,
        account: apiUpdate.account,
        opportunity: apiUpdate.opportunity,
        updatedByUser: apiUpdate.user,
      })));
    };
    fetchUpdates();
  }, []);

  useEffect(() => {
    const fetchOpportunities = async () => {
      const response = await fetch('/api/opportunities');
      const result = await response.json();
      setOpportunities(result.data || []);
    };
    fetchOpportunities();
  }, []);

  const handleUpdateAdded = async () => {
    const response = await fetch('/api/updates');
    const result = await response.json();
    setUpdates(result.data || []);
  };

  const updateTypeOptions: UpdateType[] = ["General", "Call", "Meeting", "Email"];

  const filteredUpdates = updates.filter(update => {
    const matchesSearch = update.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || update.type === typeFilter;
    const matchesOpportunity = opportunityFilter === 'all' || update.opportunity?.id === opportunityFilter;
    let matchesDate = true;
    if (dateFilter) {
      try {
        const filterDateObj = parseISO(dateFilter);
        const updateDateObj = parseISO(update.date);
        if (isValid(filterDateObj) && isValid(updateDateObj)) {
           matchesDate = format(updateDateObj, 'yyyy-MM-dd') === format(filterDateObj, 'yyyy-MM-dd');
        } else {
            matchesDate = false; 
        }
      } catch (e) {
        matchesDate = true; 
      }
    }
    return matchesSearch && matchesType && matchesOpportunity && matchesDate;
  });

  // Group updates by account only (no grouping by opportunity)
  const grouped = React.useMemo(() => {
    const acc: any = {};
    for (const update of filteredUpdates) {
      const accountId = update.account?.id;
      if (!accountId) continue;
      if (!acc[accountId]) {
        acc[accountId] = {
          account: update.account,
          updates: [],
        };
      }
      acc[accountId].updates.push(update);
    }
    return acc;
  }, [filteredUpdates]);

  // Handler for logging new activity
  const handleLogActivity = async (accountId: string) => {
    if (!newActivities[accountId]?.trim()) return;
    setIsSaving(prev => ({ ...prev, [accountId]: true }));
    try {
      await fetch('/api/updates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account_id: accountId,
          content: newActivities[accountId],
          type: newActivityTypes[accountId] || 'General',
          date: new Date().toISOString(),
        }),
      });
      setNewActivities(prev => ({ ...prev, [accountId]: '' }));
      setNewActivityTypes(prev => ({ ...prev, [accountId]: '' }));
      // Refetch updates
      const response = await fetch('/api/updates');
      const result = await response.json();
      setUpdates((result.data || []).map((apiUpdate: any) => ({
        id: apiUpdate.id,
        type: apiUpdate.type,
        content: apiUpdate.content,
        date: apiUpdate.date,
        account: apiUpdate.account,
        opportunity: apiUpdate.opportunity,
        updatedByUser: apiUpdate.user,
      })));
    } finally {
      setIsSaving(prev => ({ ...prev, [accountId]: false }));
    }
  };

  const handleGetAIAdvice = async (accountId: string, updates: any[], accountName: string) => {
    console.log(`[AI Advice] Button clicked for accountId:`, accountId, 'accountName:', accountName);
    setAiLoading(prev => ({ ...prev, [accountId]: true }));
    try {
      const context = updates.map(u => ({
        date: format(parseISO(u.date), 'yyyy-MM-dd'),
        content: u.content,
        type: u.type
      }));
      console.log('[AI Advice] Context sent to backend:', context);
      const response = await fetch('/api/ai/gemini-advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context, accountName }),
      });
      const data = await response.json();
      console.log('[AI Advice] Response from backend:', data);
      setNewActivities(prev => ({ ...prev, [accountId]: data.aiAdvice }));
    } catch (e) {
      console.error('[AI Advice] Error:', e);
      setNewActivities(prev => ({ ...prev, [accountId]: 'AI advice could not be generated.' }));
    } finally {
      setAiLoading(prev => ({ ...prev, [accountId]: false }));
      console.log('[AI Advice] Done for accountId:', accountId);
    }
  };

  return (
    <div className="container mx-auto space-y-6 mt-6">
      <PageTitle title="Communication Updates" subtitle="Log and review all opportunity-related communications.">
        <Button onClick={() => setIsAddUpdateDialogOpen(true)} variant="beige"> 
          <PlusCircle className="mr-2 h-4 w-4" /> Log New Update
        </Button>
      </PageTitle>

      <div className="w-full bg-white rounded-lg shadow p-5 mb-6">
        <div className="flex items-center mb-4">
          <ListFilter className="mr-2 h-5 w-5 text-primary" />
          <span className="font-semibold text-lg">Filter & Search Updates</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div>
            <Label htmlFor="search-updates">Search Content</Label>
             <div className="relative mt-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                  id="search-updates"
                  type="text"
                  placeholder="Keywords..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="type-filter">Type</Label>
            <Select value={typeFilter} onValueChange={(value: UpdateType | 'all') => setTypeFilter(value)}>
              <SelectTrigger id="type-filter" className="w-full mt-1">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {updateTypeOptions.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="opportunity-filter">Opportunity</Label>
            <Select value={opportunityFilter} onValueChange={(value: string | 'all') => setOpportunityFilter(value)}>
              <SelectTrigger id="opportunity-filter" className="w-full mt-1">
                <SelectValue placeholder="Filter by opportunity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Opportunities</SelectItem>
                {opportunities.map(opportunity => ( 
                  <SelectItem key={opportunity.id} value={opportunity.id}>{opportunity.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="date-filter">Date</Label>
            <Input
              id="date-filter"
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="mt-1"
            />
          </div>
        </div>
      </div>

      {/* Grouped Account Cards */}
      {Object.keys(grouped).length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-8">
          {Object.values(grouped).map(({ account, updates }: any) => (
            <div key={account.id} className="p-6 rounded-xl border border-gray-200 bg-white shadow relative">
              <div className="flex flex-wrap items-center justify-between mb-2">
                <div className="flex items-center">
                  <span className="text-sm text-gray-600 font-medium mr-2">Account:</span>
                  <Briefcase className="h-5 w-5 text-black mr-2" />
                  <h2 className="text-2xl font-bold mb-0 text-black">{account.name}</h2>
                </div>
              </div>
              {/* Activity Log */}
              <div>
                {updates.map((update: any) => (
                  <div key={update.id} className="mb-3 bg-blue-50 p-3 rounded shadow-sm border-l-4 border-blue-200">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{update.content}</div>
                      <span className="ml-2 px-2 py-0.5 rounded text-xs font-semibold bg-blue-200 text-blue-800 whitespace-nowrap">{update.type}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      Logged on: {format(parseISO(update.date), 'yyyy-MM-dd')}
                      {update.next_action_date && ` | Next Action: ${update.next_action_date}`}
                    </div>
                  </div>
                ))}
              </div>
              {/* Log New Activity Section */}
              <div className="mt-6">
                <div className="font-bold text-lg mb-2">Log New Activity</div>
                <label className="block text-sm font-medium mb-1" htmlFor={`activity-desc-${account.id}`}>Description</label>
                <textarea
                  id={`activity-desc-${account.id}`}
                  className="w-full border rounded p-2 mb-2"
                  rows={3}
                  placeholder="e.g., Follow-up call, sent proposal..."
                  value={newActivities[account.id] || ''}
                  onChange={e => setNewActivities(prev => ({ ...prev, [account.id]: e.target.value }))}
                  disabled={isSaving[account.id]}
                />
                {/* Update Type Dropdown */}
                <label className="block text-sm font-medium mb-1" htmlFor={`activity-type-${account.id}`}>Update Type</label>
                <select
                  id={`activity-type-${account.id}`}
                  className="w-full border rounded p-2 mb-2"
                  value={newActivityTypes[account.id] || 'General'}
                  onChange={e => setNewActivityTypes(prev => ({ ...prev, [account.id]: e.target.value }))}
                  disabled={isSaving[account.id]}
                >
                  {updateTypeOptions.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
               <button
                  className="bg-[#6FCF97] text-white px-4 py-2 rounded font-semibold item-end"
                  disabled={isSaving[account.id] || !(newActivities[account.id]?.trim())}
                  onClick={() => handleLogActivity(account.id)}
                >
                  {isSaving[account.id] ? 'Saving...' : 'Log Activity'}
                </button>
              {/* Get AI Advice Button */}
              <button
                className="absolute right-6 bottom-6 flex items-center gap-2 bg-[#E2D4C3] hover:bg-[#C8B89B] text-black px-4 py-2 rounded shadow font-semibold"
                onClick={() => handleGetAIAdvice(account.id, updates, account.name)}
                type="button"
                disabled={aiLoading[account.id]}
              >
                <Wand2 className="h-5 w-5" />
                {aiLoading[account.id] ? 'Thinking...' : 'Get AI Advice'}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <MessageSquare className="mx-auto h-16 w-16 text-muted-foreground/50 mb-6" />
          <p className="text-xl font-semibold text-foreground mb-2">No Updates Found</p>
          <p className="text-muted-foreground">Try adjusting your search or filter criteria, or log a new update.</p>
        </div>
      )}
      <AddUpdateDialog
        open={isAddUpdateDialogOpen}
        onOpenChange={setIsAddUpdateDialogOpen}
        onUpdateAdded={handleUpdateAdded}
      />
    </div>
  );
}
