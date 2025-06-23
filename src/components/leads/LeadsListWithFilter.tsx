import React, { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Filter } from 'lucide-react';
import LeadCard from './LeadCard';
import AddLeadDialog from './AddLeadDialog';
import type { Lead } from '@/types';

const STATUS_OPTIONS = [
  'All Statuses',
  'New',
  'Contacted',
  'Qualified',
  'Proposal Sent',
  'Lost',
];

interface LeadsListWithFilterProps {
  leads: Lead[];
  onLeadConverted: (leadId: string, newAccountId: string) => void;
  onLeadAdded?: (newLead: Lead) => void;
  onLeadDeleted: (leadId: string) => void;
}

export default function LeadsListWithFilter({ leads, onLeadConverted, onLeadAdded, onLeadDeleted }: LeadsListWithFilterProps) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All Statuses');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [localLeads, setLocalLeads] = useState<Lead[]>(leads);

  React.useEffect(() => {
    setLocalLeads(leads);
  }, [leads]);

  const handleStatusChange = (leadId: string, newStatus: Lead["status"]) => {
    setLocalLeads((prev) => prev.map((lead) =>
      lead.id === leadId ? { ...lead, status: newStatus } : lead
    ));
  };

  const handleLeadConversion = (leadId: string, newAccountId: string) => {
    setLocalLeads((prev) => prev.filter((lead) => lead.id !== leadId));
    onLeadConverted(leadId, newAccountId);
  };

  const filteredLeads = useMemo(() => {
    return localLeads.filter(lead => {
      // First filter out converted leads
      if (lead.status === "Converted to Account") return false;
      
      // Then apply other filters
      const matchesStatus = status === 'All Statuses' || lead.status === status;
      const matchesSearch =
        lead.companyName.toLowerCase().includes(search.toLowerCase()) ||
        lead.personName.toLowerCase().includes(search.toLowerCase()) ||
        (lead.email && lead.email.toLowerCase().includes(search.toLowerCase())) ||
        (lead.country && lead.country.toLowerCase().includes(search.toLowerCase()));
      return matchesStatus && matchesSearch;
    });
  }, [localLeads, search, status]);

  const handleDelete = (leadId: string) => {
    setLocalLeads((prev) => prev.filter((l) => l.id !== leadId));
    onLeadDeleted(leadId);
  };

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Filter/Search Full Width */}
      <div className="w-full bg-white rounded-lg shadow p-5">
        <div className="flex items-center mb-4">
          <Filter className="mr-2 h-5 w-5 text-primary" />
          <span className="font-semibold text-lg">Filter & Search Leads</span>
        </div>
        <div className="flex flex-row gap-4">
          <div className="flex-1">
            <Label htmlFor="lead-search" className="text-sm font-medium mb-1 block">Search Leads</Label>
            <Input
              id="lead-search"
              placeholder="Search by company, name, email, country..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="w-60">
            <Label htmlFor="lead-status" className="text-sm font-medium mb-1 block">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id="lead-status">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Status</SelectLabel>
                  {STATUS_OPTIONS.map(opt => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      {/* Leads List/Grid */}
      <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredLeads.length === 0 ? (
          <div className="col-span-full text-center text-muted-foreground mt-12">No leads found.</div>
        ) : (
          filteredLeads.map(lead => (
            <LeadCard 
              key={lead.id} 
              lead={lead} 
              onLeadConverted={handleLeadConversion} 
              onStatusChange={handleStatusChange} 
              onDelete={handleDelete} 
            />
          ))
        )}
      </div>
    </div>
  );
} 