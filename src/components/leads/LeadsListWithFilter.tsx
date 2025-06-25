import React, { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Filter, List, Grid3X3, ChevronDown } from 'lucide-react';
import LeadCard from './LeadCard';
import AddLeadDialog from './AddLeadDialog';
import type { Lead } from '@/types';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

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
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
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

  const getStatusBadgeVariant = (status: Lead["status"]) => {
    switch (status) {
      case "New":
        return "secondary";
      case "Contacted":
        return "outline";
      case "Qualified":
        return "default";
      case "Proposal Sent":
        return "default";
      case "Lost":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      return "Unknown";
    }
  };

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Filter/Search Full Width */}
      <div className="w-full bg-white rounded-lg shadow p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Filter className="mr-2 h-5 w-5 text-primary" />
            <span className="font-semibold text-lg">Filter & Search Leads</span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                {viewMode === 'list' ? <List className="h-4 w-4" /> : <Grid3X3 className="h-4 w-4" />}
                {viewMode === 'list' ? 'List View' : 'Card View'}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setViewMode('card')}>
                <Grid3X3 className="mr-2 h-4 w-4" />
                Card View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setViewMode('list')}>
                <List className="mr-2 h-4 w-4" />
                List View
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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

      {/* View Mode Content */}
      {viewMode === 'list' ? (
        // List View
        <div className="w-full bg-white rounded-lg shadow overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="font-semibold">Company</TableHead>
                <TableHead className="font-semibold">Contact Person</TableHead>
                <TableHead className="font-semibold">Email</TableHead>
                <TableHead className="font-semibold">Phone</TableHead>
                <TableHead className="font-semibold">Country</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Created</TableHead>
                <TableHead className="font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    No leads found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredLeads.map(lead => (
                  <TableRow key={lead.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">{lead.companyName}</TableCell>
                    <TableCell>{lead.personName}</TableCell>
                    <TableCell>
                      {lead.email ? (
                        <a href={`mailto:${lead.email}`} className="text-blue-600 hover:underline">
                          {lead.email}
                        </a>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>{lead.phone || <span className="text-gray-400">-</span>}</TableCell>
                    <TableCell>{lead.country || <span className="text-gray-400">-</span>}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(lead.status)}>
                        {lead.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {formatDate(lead.createdAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            // Open lead details modal (you can implement this)
                            console.log('View details for:', lead.id);
                          }}
                        >
                          View
                        </Button>
                        {lead.status !== "Converted to Account" && lead.status !== "Lost" && (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleLeadConversion(lead.id, '')}
                          >
                            Convert
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      ) : (
        // Card View
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
      )}
    </div>
  );
} 