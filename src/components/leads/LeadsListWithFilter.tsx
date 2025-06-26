import React, { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Filter, List, Grid3X3, ChevronDown, Users, CheckSquare, Square, X } from 'lucide-react';
import LeadCard from './LeadCard';
import AddLeadDialog from './AddLeadDialog';
import BulkAssignDialog from './BulkAssignDialog';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';

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
  onBulkAssignmentComplete?: () => void;
  backButton?: React.ReactNode;
  onStatusChange?: (leadId: string, newStatus: Lead["status"]) => void;
}

export default function LeadsListWithFilter({ leads, onLeadConverted, onLeadAdded, onLeadDeleted, onBulkAssignmentComplete, backButton, onStatusChange }: LeadsListWithFilterProps) {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All Statuses');
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [localLeads, setLocalLeads] = useState<Lead[]>(leads);
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [bulkAssignDialogOpen, setBulkAssignDialogOpen] = useState(false);
  const [isSelectMode, setIsSelectMode] = useState(false);

  React.useEffect(() => {
    setLocalLeads(leads);
  }, [leads]);

  const handleStatusChange = (leadId: string, newStatus: Lead["status"]) => {
    setLocalLeads((prev) => prev.map((lead) =>
      lead.id === leadId ? { ...lead, status: newStatus } : lead
    ));
    if (onStatusChange) onStatusChange(leadId, newStatus);
  };

  const handleLeadConversion = (leadId: string, newAccountId: string) => {
    setLocalLeads((prev) => prev.filter((lead) => lead.id !== leadId));
    setSelectedLeads((prev) => {
      const newSet = new Set(prev);
      newSet.delete(leadId);
      return newSet;
    });
    onLeadConverted(leadId, newAccountId);
  };

  // Use correct data source based on showingRejected
  const displayLeads = localLeads;

  // Filtered leads logic only applies to normal leads
  const filteredLeads = useMemo(() => {
    return localLeads.filter((lead: Lead) => {
      if (lead.status === "Converted to Account") return false;
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
    setSelectedLeads((prev) => {
      const newSet = new Set(prev);
      newSet.delete(leadId);
      return newSet;
    });
    onLeadDeleted(leadId);
  };

  // Selection handlers
  const handleSelectLead = (leadId: string, checked: boolean) => {
    setSelectedLeads((prev) => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(leadId);
      } else {
        newSet.delete(leadId);
      }
      return newSet;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedLeads(new Set(filteredLeads.map(lead => lead.id)));
    } else {
      setSelectedLeads(new Set());
    }
  };

  const handleCardClick = (leadId: string) => {
    if (!isSelectMode) return;
    
    setSelectedLeads((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(leadId)) {
        newSet.delete(leadId);
      } else {
        newSet.add(leadId);
      }
      return newSet;
    });
  };

  const handleBulkAssignmentComplete = () => {
    // Refresh the leads data to show updated assignments
    setSelectedLeads(new Set());
    setIsSelectMode(false);
    onBulkAssignmentComplete?.();
  };

  const exitSelectMode = () => {
    setIsSelectMode(false);
    setSelectedLeads(new Set());
  };

  const enterSelectMode = () => {
    setIsSelectMode(true);
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

  const selectedCount = selectedLeads.size;
  const isAllSelected = filteredLeads.length > 0 && selectedCount === filteredLeads.length;
  const isIndeterminate = selectedCount > 0 && selectedCount < filteredLeads.length;

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Filter/Search Full Width */}
      <div className="w-full bg-white rounded-lg shadow p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
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
          <div className="flex items-end">
            {!isSelectMode && (
              <Button
                variant="outline"
                onClick={enterSelectMode}
                className="flex items-center gap-2 h-10 border-[#97A88C] text-[#2B2521] hover:bg-[#97A88C]/10"
              >
                <CheckSquare className="h-4 w-4" />
                Select
              </Button>
            )}
            {isSelectMode && (
              <Button
                variant="outline"
                onClick={exitSelectMode}
                className="flex items-center gap-2 h-10 bg-[#97A88C]/20 border-[#97A88C] text-[#2B2521] hover:bg-[#97A88C]/30"
              >
                <X className="h-4 w-4" />
                {selectedCount > 0 ? `${selectedCount} Selected` : 'Cancel'}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Back button injected above cards if provided */}
      {backButton}

      {/* Bulk Actions Bar (Card & List View) */}
      {isSelectMode && (
        <div className="w-full bg-[#E5E7E0] border border-[#97A88C] rounded-lg p-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-[#2B2521]">
                {selectedCount > 0
                  ? `${selectedCount} lead${selectedCount !== 1 ? 's' : ''} selected`
                  : 'Select leads to assign'}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSelectAll(true)}
                className="text-[#2B2521] border-[#97A88C] hover:bg-[#97A88C]/10"
              >
                <CheckSquare className="mr-1 h-3 w-3" />
                Select All ({filteredLeads.length})
              </Button>
              {selectedCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedLeads(new Set())}
                  className="text-[#2B2521] border-[#97A88C] hover:bg-[#97A88C]/10"
                >
                  Clear Selection
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={exitSelectMode}
                className="text-[#2B2521] border-[#97A88C] hover:bg-[#97A88C]/10"
              >
                <X className="mr-1 h-3 w-3" />
                Exit Select Mode
              </Button>
            </div>
            {selectedCount > 0 && (
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setBulkAssignDialogOpen(true)}
                  className="bg-[#2B2521] hover:bg-[#2B2521]/90 text-white"
                  size="sm"
                >
                  <Users className="mr-2 h-4 w-4" />
                  Assign to User
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* View Mode Content */}
      {viewMode === 'list' ? (
        // List View
        <div className="w-full bg-white rounded-lg shadow overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                {isSelectMode && (
                  <TableHead className="w-12">
                    <Checkbox
                      checked={isAllSelected}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                )}
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
                  <TableCell colSpan={isSelectMode ? 9 : 8} className="text-center text-muted-foreground py-8">
                    No leads found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredLeads.map((lead: Lead) => (
                  <TableRow key={lead.id} className="hover:bg-gray-50">
                    {isSelectMode && (
                      <TableCell>
                        <Checkbox
                          checked={selectedLeads.has(lead.id)}
                          onCheckedChange={(checked) => handleSelectLead(lead.id, checked as boolean)}
                        />
                      </TableCell>
                    )}
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
                          asChild
                        >
                          <Link href={`/leads/${lead.id}`}>
                            View
                          </Link>
                        </Button>
                        {lead.status !== "Converted to Account" && lead.status !== "Lost" && (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLeadConversion(lead.id, '');
                            }}
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
            <div className="col-span-full text-center text-muted-foreground mt-12">
              No leads found.
            </div>
          ) : (
            filteredLeads.map((lead: Lead) => (
              <div 
                key={lead.id} 
                className={`relative transition-all duration-200 ${
                  isSelectMode && selectedLeads.has(lead.id)
                    ? 'shadow-[0_0_0_4px_rgba(151,168,140,0.25)] border border-[#97A88C] scale-[1.02] bg-[#97A88C]/10 rounded-[8px]'
                    : isSelectMode
                    ? 'cursor-pointer hover:shadow-md hover:bg-[#E5E7E0]/50 rounded-[8px]'
                    : 'rounded-[8px]'
                }`}
                onClick={() => handleCardClick(lead.id)}
              >
                <LeadCard 
                  lead={lead} 
                  onLeadConverted={handleLeadConversion} 
                  onStatusChange={handleStatusChange} 
                  onDelete={handleDelete} 
                  isSelectMode={isSelectMode}
                />
              </div>
            ))
          )}
        </div>
      )}

      {/* Dialogs */}
      {user && (
        <AddLeadDialog
          open={addDialogOpen}
          onOpenChange={setAddDialogOpen}
          onLeadAdded={onLeadAdded}
          user={user}
        />
      )}

      <BulkAssignDialog
        open={bulkAssignDialogOpen}
        onOpenChange={setBulkAssignDialogOpen}
        selectedLeadIds={Array.from(selectedLeads)}
        onAssignmentComplete={handleBulkAssignmentComplete}
      />
    </div>
  );
} 