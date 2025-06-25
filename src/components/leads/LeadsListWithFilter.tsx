import React, { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Filter, List, Grid3X3, ChevronDown, FileWarning } from 'lucide-react';
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
}

export default function LeadsListWithFilter({ leads, onLeadConverted, onLeadAdded, onLeadDeleted }: LeadsListWithFilterProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All Statuses');
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [localLeads, setLocalLeads] = useState<Lead[]>(leads);
  
  // Modal states for list view
  const [showModal, setShowModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logContent, setLogContent] = useState("");
  const [logDate, setLogDate] = useState("");
  const [logSubmitting, setLogSubmitting] = useState(false);
  const [updateType, setUpdateType] = useState('');

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
                  <TableRow 
                    key={lead.id} 
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={(e) => {
                      // Prevent modal open on action button clicks
                      if ((e.target as HTMLElement).closest("button, a")) return;
                      openLeadModal(lead);
                    }}
                  >
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