import React, { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Filter, List, Grid3X3, ChevronDown, Users, CheckSquare, Square, X, FileWarning } from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import Link from 'next/link';

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
  user: any;
  rejectedLeads?: any[];
  showingRejected?: boolean;
  onShowRejected?: () => void;
}

export default function LeadsListWithFilter({
  leads,
  onLeadConverted,
  onLeadAdded,
  onLeadDeleted,
  onBulkAssignmentComplete,
  user,
  rejectedLeads = [],
  showingRejected = false,
  onShowRejected
}: LeadsListWithFilterProps) {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All Statuses');
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [localLeads, setLocalLeads] = useState<Lead[]>(leads);
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [bulkAssignDialogOpen, setBulkAssignDialogOpen] = useState(false);
  const [isSelectMode, setIsSelectMode] = useState(false);
  
  // Modal states for list view
  const [showModal, setShowModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logContent, setLogContent] = useState("");
  const [logDate, setLogDate] = useState("");
  const [logSubmitting, setLogSubmitting] = useState(false);
  const [updateType, setUpdateType] = useState('');
  const [fetchedRejectedLeads, setFetchedRejectedLeads] = useState<any[]>([]);
  const [fetchingRejected, setFetchingRejected] = useState(false);

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
    setSelectedLeads((prev) => {
      const newSet = new Set(prev);
      newSet.delete(leadId);
      return newSet;
    });
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

  // Fetch logs for selected lead
  const fetchLogs = async (leadId: string) => {
    setLogsLoading(true);
    try {
      const res = await fetch(`/api/updates?lead_id=${leadId}`);
      const result = await res.json();
      setLogs(result.data || []);
    } catch (e) {
      setLogs([]);
    } finally {
      setLogsLoading(false);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  // Log new activity
  const handleLogActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logContent.trim() || !selectedLead) return;
    if (logDate && logDate < todayStr) {
      toast({ title: "Invalid Date", description: "Please select today or a future date.", variant: "destructive" });
      return;
    }
    setLogSubmitting(true);
    const newLog = {
      id: `temp-${Date.now()}`,
      content: logContent,
      date: logDate ? new Date(logDate).toISOString() : new Date().toISOString(),
    };
    setLogs(prev => [newLog, ...prev]); // Optimistically add log
    try {
      const res = await fetch("/api/updates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lead_id: selectedLead.id,
          type: updateType || "General",
          content: logContent,
          date: logDate ? new Date(logDate).toISOString() : new Date().toISOString(),
          updated_by_user_id: user?.id,
        }),
      });
      if (res.ok) {
        setLogContent("");
        setLogDate("");
        const result = await res.json();
        if (result.data) {
          setLogs(prev => [result.data, ...prev.filter(l => l.id !== newLog.id)]);
        } else {
          fetchLogs(selectedLead.id); // fallback if no data returned
        }
        toast({ title: "Activity Logged", description: "Activity has been added to records." });
      } else {
        setLogs(prev => prev.filter(l => l.id !== newLog.id)); // Remove optimistic log on error
        toast({ title: "Failed to log activity", variant: "destructive" });
      }
    } catch (e) {
      setLogs(prev => prev.filter(l => l.id !== newLog.id)); // Remove optimistic log on error
      toast({ title: "Failed to log activity", variant: "destructive" });
    } finally {
      setLogSubmitting(false);
    }
  };

  const openLeadModal = (lead: Lead) => {
    setSelectedLead(lead);
    setShowModal(true);
    fetchLogs(lead.id);
  };

  const handleShowRejected = async () => {
    if (showingRejected || fetchingRejected) return;
    setFetchingRejected(true);
    try {
      const res = await fetch('/api/leads?status=Unqualified&limit=100');
      const result = await res.json();
      setFetchedRejectedLeads(result.data || []);
      if (onShowRejected) onShowRejected();
    } catch (e) {
      toast({ title: 'Failed to fetch rejected leads', variant: 'destructive' });
    } finally {
      setFetchingRejected(false);
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
            <Button
              variant="outline"
              className={`ml-4 border-red-500 text-red-600 hover:bg-red-50 ${showingRejected || fetchingRejected ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={handleShowRejected}
              disabled={showingRejected || fetchingRejected}
            >
              {fetchingRejected ? 'Loading...' : 'View Rejected'}
            </Button>
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
                className="flex items-center gap-2 h-10 border border-border text-[#2B2521] bg-[#FAF9F6] hover:bg-[#97A88C]/10 rounded-md font-medium"
              >
                <CheckSquare className="h-5 w-5" strokeWidth={2} />
                Select
              </Button>
            )}
            {isSelectMode && (
              <Button
                variant="outline"
                onClick={exitSelectMode}
                className="flex items-center gap-2 h-10 bg-[#97A88C]/20 border-[#97A88C] text-[#2B2521] hover:bg-[#97A88C]/30 rounded-md font-medium"
              >
                <X className="h-4 w-4" />
                {selectedCount > 0 ? `${selectedCount} Selected` : 'Cancel'}
              </Button>
            )}
          </div>
        </div>
      </div>

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

      {/* Show rejected leads cards below filter/search if showingRejected is true */}
      {showingRejected && (
        <div className="space-y-4 mt-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-red-700">Rejected Leads</h2>
            <Button onClick={() => { setFetchedRejectedLeads([]); if (onShowRejected) onShowRejected(); }} className="bg-[#2B2521] text-white px-6 py-2 rounded hover:bg-gray-800">Back</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(fetchedRejectedLeads.length > 0 ? fetchedRejectedLeads : rejectedLeads).map((lead, idx) => (
              <div key={lead.id || idx} className="bg-white rounded-[12px] p-6 shadow border border-red-200 flex flex-col justify-between min-h-[340px]">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xl text-[#97A88C]">{lead.company_name || lead.companyName || 'No Company Name'}</span>
                    </div>
                    <span className="bg-red-100 text-red-700 text-xs font-semibold px-3 py-1 rounded-full">Rejected</span>
                  </div>
                  <div className="flex items-center text-muted-foreground mb-1">
                    {lead.person_name || lead.personName || 'N/A'}
                  </div>
                  <div className="flex items-center text-muted-foreground mb-1">
                    {lead.email || 'N/A'}
                  </div>
                  <div className="flex items-center text-muted-foreground mb-1">
                    {lead.country || 'N/A'}
                  </div>
                </div>
              </div>
            ))}
            {(fetchedRejectedLeads.length === 0 && rejectedLeads.length === 0) && (
              <div className="col-span-full text-center text-muted-foreground mt-12">No rejected leads found.</div>
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
                      ref={(el) => {
                        if (el && 'indeterminate' in el) {
                          (el as HTMLInputElement).indeterminate = isIndeterminate;
                        }
                      }}
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
                filteredLeads.map(lead => (
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
            <div className="col-span-full text-center text-muted-foreground mt-12">No leads found.</div>
          ) : (
            filteredLeads.map(lead => (
              <div 
                key={lead.id} 
                className={`relative transition-all duration-200 ${
                  isSelectMode && selectedLeads.has(lead.id)
                    ? 'border-2 border-[#97A88C] scale-[1.01] bg-[#97A88C]/10 rounded-[8px] shadow-lg'
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

      {/* Modal for List View */}
      <Dialog open={showModal} onOpenChange={(open) => {
        setShowModal(open);
        if (!open) {
          setSelectedLead(null);
          setLogs([]);
        }
      }}>
        <DialogContent className="max-w-xl w-full bg-white text-black">
          {selectedLead && (
            <>
              <DialogHeader>
                <DialogTitle className="text-black">{selectedLead.companyName}</DialogTitle>
                <DialogDescription className="text-gray-600">
                  <div className="mt-2 grid grid-cols-2 gap-4">
                    <div className="p-2 bg-gray-50 rounded">
                      <span className="text-black font-semibold">Name: </span>
                      {selectedLead.personName}
                    </div>
                    <div className="p-2 bg-gray-50 rounded">
                      <span className="text-black font-semibold">Email: </span>
                      {selectedLead.email}
                    </div>
                    <div className="p-2 bg-gray-50 rounded">
                      {selectedLead.phone && (
                        <>
                          <span className="text-black font-semibold">Number: </span>
                          {selectedLead.phone}
                        </>
                      )}
                    </div>
                    <div className="p-2 bg-gray-50 rounded">
                      {selectedLead.country && (
                        <>
                          <span className="text-black font-semibold">Location: </span>
                          {selectedLead.country}
                        </>
                      )}
                    </div>
                  </div>
                </DialogDescription>
              </DialogHeader>
              <div className="mt-4">
                <div className="flex items-center mb-4">
                  <span className="mr-2 text-lg"><FileWarning className="inline-block mr-1" /></span>
                  <span className="text-lg font-medium text-gray-800">Lead: <span className="font-bold text-black text-2xl">{selectedLead.companyName}</span></span>
                </div>
                {logsLoading ? (
                  <div className="text-black">Loading...</div>
                ) : logs.length === 0 ? (
                  <div className="text-gray-600">No log found</div>
                ) : (
                  <div className="space-y-3 max-h-80 min-h-0 overflow-y-scroll pr-2">
                    {logs.map((log) => (
                      <div key={log.id} className="bg-[#EAF4FF] rounded-lg px-5 py-3 flex items-center justify-between">
                        <div>
                          <div className="font-bold text-lg text-gray-900 mb-1">{log.content}</div>
                          <div className="text-xs text-gray-600">Logged on: {log.date ? new Date(log.date).toISOString().slice(0, 10) : "-"}</div>
                        </div>
                        {log.type && (
                          <span className="ml-4 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
                            {log.type}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <form className="mt-6" onSubmit={handleLogActivity}>
                <div className="mb-4">
                  <label className="block font-semibold mb-1 text-black" htmlFor="lead-input">
                    Lead <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="lead-input"
                    type="text"
                    value={selectedLead.companyName}
                    disabled
                    className="w-full rounded bg-white border border-black px-4 py-2 text-black text-base cursor-not-allowed mb-2"
                  />
                </div>
                <div className="mb-4">
                  <label className="block font-semibold mb-1 text-black" htmlFor="update-type">
                    Update Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="update-type"
                    value={updateType}
                    onChange={e => setUpdateType(e.target.value)}
                    required
                    className="w-full rounded bg-white border border-black px-4 py-2 text-black text-base mb-2"
                  >
                    <option value="" disabled>Select update type</option>
                    <option value="General">General</option>
                    <option value="Call">Call</option>
                    <option value="Meeting">Meeting</option>
                    <option value="Email">Email</option>
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block font-semibold mb-1 text-black" htmlFor="log-content">
                    Content <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="log-content"
                    className="w-full border border-black rounded p-2 mb-2 text-black bg-white placeholder:text-gray-400"
                    rows={4}
                    placeholder="Describe the call, meeting, email, or general update..."
                    value={logContent}
                    onChange={e => setLogContent(e.target.value)}
                    required
                  />
                </div>
                <input
                  type="date"
                  className="w-full border border-black rounded p-2 mb-2 text-black bg-white"
                  value={logDate}
                  onChange={e => setLogDate(e.target.value)}
                  min={todayStr}
                />
                <DialogFooter>
                  <Button type="submit" className="bg-green-600 text-white" disabled={logSubmitting}>
                    {logSubmitting ? "Logging..." : "Log Activity"}
                  </Button>
                </DialogFooter>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
