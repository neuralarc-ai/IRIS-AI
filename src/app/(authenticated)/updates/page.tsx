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
import { useAuth } from '@/hooks/use-auth';
import { useSearchParams } from 'next/navigation';

// Local type for updates with account and opportunity objects
interface UpdateWithEntities extends Omit<Update, 'accountId' | 'opportunityId' | 'updatedByUserId'> {
  account?: { id: string; name: string };
  opportunity?: { id: string; name: string };
  updatedByUser?: { id: string; name: string };
  [key: string]: any;
}

export default function UpdatesPage() {
  const searchParams = useSearchParams();
  const [updates, setUpdates] = useState<UpdateWithEntities[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [searchTerm, setSearchTerm] = useState(''); 
  const [typeFilter, setTypeFilter] = useState<UpdateType | 'all'>('all');
  const [opportunityFilter, setOpportunityFilter] = useState<string | 'all'>('all');
  const [dateFilter, setDateFilter] = useState<string>(''); 
  const [entityTypeFilter, setEntityTypeFilter] = useState<'all' | 'lead' | 'opportunity' | 'account'>(
    (searchParams.get('entity_type') as 'all' | 'lead' | 'opportunity' | 'account') || 'all'
  );
  const [isAddUpdateDialogOpen, setIsAddUpdateDialogOpen] = useState(false);
  const [newActivities, setNewActivities] = useState<{ [accountId: string]: string }>({});
  const [isSaving, setIsSaving] = useState<{ [accountId: string]: boolean }>({});
  const [newActivityTypes, setNewActivityTypes] = useState<{ [accountId: string]: string }>({});
  const [aiLoading, setAiLoading] = useState<{ [accountId: string]: boolean }>({});
  const { user, isAdmin } = useAuth();

  // Centralized fetchUpdates function
    const fetchUpdates = async () => {
    const response = await fetch('/api/updates', {
      headers: {
        'x-user-id': user?.id || '',
        'x-user-admin': isAdmin() ? 'true' : 'false',
      },
    });
      const result = await response.json();
      setUpdates((result.data || []).map((apiUpdate: any) => ({
        id: apiUpdate.id,
        type: apiUpdate.type,
        content: apiUpdate.content,
        date: apiUpdate.date,
        account: apiUpdate.account,
        opportunity: apiUpdate.opportunity,
        updatedByUser: apiUpdate.user,
      lead: apiUpdate.lead,
      leadId: apiUpdate.lead_id,
      leadName: apiUpdate.lead?.company_name || apiUpdate.lead?.person_name || '',
      })));
    };

  useEffect(() => {
    if (user) {
    fetchUpdates();
    }
  }, [user]);

  const handleUpdateAdded = async () => {
    await fetchUpdates();
  };

  useEffect(() => {
    const fetchOpportunities = async () => {
      const response = await fetch('/api/opportunities');
      const result = await response.json();
      setOpportunities(result.data || []);
    };
    fetchOpportunities();
  }, []);

  const updateTypeOptions: UpdateType[] = ["General", "Call", "Meeting", "Email"];

  // Filter updates by entity type and ID
  const filteredUpdates = updates.filter(update => {
    // Get entity IDs from URL parameters
    const leadId = searchParams.get('lead_id');
    const opportunityId = searchParams.get('opportunity_id');
    const accountId = searchParams.get('account_id');
    
    // Filter by specific entity ID if provided
    if (leadId) return update.leadId === leadId;
    if (opportunityId) return update.opportunity?.id === opportunityId;
    if (accountId) return update.account?.id === accountId;
    
    // If no specific ID provided, filter by entity type
    if (entityTypeFilter === 'lead') return !!update.leadId;
    if (entityTypeFilter === 'opportunity') return !!update.opportunity?.id;
    if (entityTypeFilter === 'account') return !!update.account?.id;
    return true;
  });

  // Group updates by entity (account, opportunity, or lead)
  const grouped = React.useMemo(() => {
    const acc: any = {};
    // First, collect all lead and opportunity IDs and their names
    const leadMap: Record<string, { id: string; name: string }> = {};
    const opportunityMap: Record<string, { id: string; name: string }> = {};
    filteredUpdates.forEach(update => {
      if (update.leadId && update.leadName) {
        leadMap[update.leadId] = { id: update.leadId, name: update.leadName };
      }
      if (update.opportunity?.id && update.opportunity?.name) {
        opportunityMap[update.opportunity.id] = { id: update.opportunity.id, name: update.opportunity.name };
      }
    });
    // Group by account, opportunity, or lead
    for (const update of filteredUpdates) {
      if (update.account?.id) {
        if (!acc[update.account.id]) {
          acc[update.account.id] = {
            entity: { id: update.account.id, name: update.account.name, type: 'account' },
            updates: [],
          };
        }
        acc[update.account.id].updates.push(update);
      } else if (update.opportunity?.id) {
        if (!acc[update.opportunity.id]) {
          acc[update.opportunity.id] = {
            entity: { id: update.opportunity.id, name: update.opportunity.name, type: 'opportunity' },
            updates: [],
          };
        }
        acc[update.opportunity.id].updates.push(update);
      } else if (update.leadId && leadMap[update.leadId]) {
        if (!acc[update.leadId]) {
          acc[update.leadId] = {
            entity: { id: update.leadId, name: update.leadName, type: 'lead' },
          updates: [],
        };
        }
        acc[update.leadId].updates.push(update);
      }
    }
    return acc;
  }, [filteredUpdates]);

  // Handler for logging new activity
  const handleLogActivity = async (entityId: string, entityType: string) => {
    if (!newActivities[entityId]?.trim()) return;
    setIsSaving(prev => ({ ...prev, [entityId]: true }));
    try {
      const body: any = {
        content: newActivities[entityId],
        type: newActivityTypes[entityId] || 'General',
        date: new Date().toISOString(),
      };
      if (entityType === 'account') {
        body.account_id = entityId;
      } else if (entityType === 'lead') {
        body.lead_id = entityId;
      }
      await fetch('/api/updates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...body,
          updated_by_user_id: user?.id,
        }),
      });
      setNewActivities(prev => ({ ...prev, [entityId]: '' }));
      setNewActivityTypes(prev => ({ ...prev, [entityId]: '' }));
      // Refetch updates
      await fetchUpdates();
    } finally {
      setIsSaving(prev => ({ ...prev, [entityId]: false }));
    }
  };

  const handleGetAIAdvice = async (accountId: string, updates: any[], accountName: string) => {
    setAiLoading(prev => ({ ...prev, [accountId]: true }));
    try {
      // Collect logs as an array of update content
      const logs = updates.map(u => u.content);
      const response = await fetch('/api/ai/get-advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logs, context: { accountName } }),
      });
      const data = await response.json();
      setNewActivities(prev => ({
        ...prev,
        [accountId]: data.advice
          ? data.advice
          : (data.warning || 'AI advice could not be generated.')
      }));
    } catch (e) {
      setNewActivities(prev => ({ ...prev, [accountId]: 'AI advice could not be generated.' }));
    } finally {
      setAiLoading(prev => ({ ...prev, [accountId]: false }));
    }
  };

  return (
    <div className="container mx-auto space-y-6 mt-6">
      <PageTitle title="Communication Updates" subtitle="Log and review all opportunity-related communications.">
        <Button onClick={() => setIsAddUpdateDialogOpen(true)} variant="dark"> 
          <PlusCircle className="mr-2 h-4 w-4" /> New Record
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
          <div>
            <Label htmlFor="entity-type-filter">Entity Type</Label>
            <Select value={entityTypeFilter} onValueChange={value => setEntityTypeFilter(value as 'all' | 'lead' | 'opportunity' | 'account')}>
              <SelectTrigger id="entity-type-filter" className="w-full mt-1">
                <SelectValue placeholder="Filter by entity type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="lead">Lead</SelectItem>
                <SelectItem value="opportunity">Opportunity</SelectItem>
                <SelectItem value="account">Account</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Grouped Account Cards */}
      {Object.keys(grouped).length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-8">
          {Object.values(grouped).map(({ entity, updates }: any) => (
            <div key={entity.id} className="p-6 rounded-xl border border-gray-200 bg-white shadow relative">
              <div className="flex items-center mb-2 gap-2">
                {entity.type === 'lead' ? (
                  <>
                    <MessageSquare className="h-5 w-5 text-black" />
                    <span className="text-base font-medium text-gray-700">Lead:</span>
                  </>
                ) : entity.type === 'opportunity' ? (
                  <>
                    <Briefcase className="h-5 w-5 text-blue-700" />
                    <span className="text-base font-medium text-blue-700">Opportunity:</span>
                  </>
                ) : (
                  <>
                    <Briefcase className="h-5 w-5 text-black" />
                    <span className="text-base font-medium text-gray-700">Account:</span>
                  </>
                )}
                <h2 className="text-2xl font-bold text-black ml-2">{entity.name}</h2>
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
                    </div>
                  </div>
                ))}
              </div>
              {/* Log New Activity Section */}
              <div className="mt-6">
                <div className="font-bold text-lg mb-2">Log New Activity</div>
                <label className="block text-sm font-medium mb-1" htmlFor={`activity-desc-${entity.id}`}>Description</label>
                <textarea
                  id={`activity-desc-${entity.id}`}
                  className="w-full border rounded p-2 mb-2"
                  rows={3}
                  placeholder="e.g., Follow-up call, sent proposal..."
                  value={newActivities[entity.id] || ''}
                  onChange={e => setNewActivities(prev => ({ ...prev, [entity.id]: e.target.value }))}
                  disabled={isSaving[entity.id]}
                />
                {/* Update Type Dropdown */}
                <label className="block text-sm font-medium mb-1" htmlFor={`activity-type-${entity.id}`}>Update Type</label>
                <select
                  id={`activity-type-${entity.id}`}
                  className="w-full border rounded p-2 mb-4"
                  value={newActivityTypes[entity.id] || 'General'}
                  onChange={e => setNewActivityTypes(prev => ({ ...prev, [entity.id]: e.target.value }))}
                  disabled={isSaving[entity.id]}
                >
                  {updateTypeOptions.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                <div className="flex items-center gap-4 justify-between mt-2">
               <button
                    className="bg-[#6FCF97] text-white px-4 py-2 rounded font-semibold"
                    disabled={isSaving[entity.id] || !(newActivities[entity.id]?.trim())}
                    onClick={() => handleLogActivity(entity.id, entity.type === 'lead' ? 'lead' : entity.type === 'opportunity' ? 'opportunity' : 'account')}
                  >
                    {isSaving[entity.id] ? 'Saving...' : 'Log Activity'}
                </button>
              <button
                    className="flex items-center gap-2 bg-[#E2D4C3] hover:bg-[#C8B89B] text-black px-4 py-2 rounded shadow font-semibold"
                    onClick={() => handleGetAIAdvice(entity.id, updates, entity.name)}
                type="button"
                    disabled={aiLoading[entity.id]}
              >
                <Wand2 className="h-5 w-5" />
                    {aiLoading[entity.id] ? 'Thinking...' : 'Get AI Advice'}
              </button>
                </div>
                {newActivities[entity.id] && (
                  <div className={
                    newActivities[entity.id] === 'AI could not generate advice. Try adding more activity or context.' ||
                    newActivities[entity.id] === 'AI advice could not be generated.'
                      ? 'mt-3 text-xs text-muted-foreground'
                      : 'mt-3 p-3 rounded bg-yellow-50 border border-yellow-200 text-sm text-yellow-900 font-medium'
                  }>
                    {newActivities[entity.id]}
                  </div>
                )}
              </div>
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
