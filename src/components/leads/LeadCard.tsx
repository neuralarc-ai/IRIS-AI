"use client";
import React, { useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  User,
  Mail,
  Phone,
  Eye,
  CheckSquare,
  FileWarning,
  CalendarPlus,
  History,
  Linkedin,
  MapPin,
  Briefcase,
  UserCheck,
  UserPlus,
  Trash2,
  Edit,
} from "lucide-react";
import type { Lead } from "@/types";
import { formatDistanceToNow, parseISO } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { countries } from '@/lib/countryData';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';

interface LeadCardProps {
  lead: Lead;
  onLeadConverted: (leadId: string, newAccountId: string) => void;
  onStatusChange?: (leadId: string, newStatus: Lead["status"]) => void;
  onDelete?: (leadId: string) => void;
  isSelectMode?: boolean;
}

const getStatusBadgeVariant = (
  status: Lead["status"]
): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case "New":
      return "secondary";
    case "Contacted":
      return "outline";
    case "Qualified":
      return "default";
    case "Proposal Sent":
      return "default";
    case "Converted to Account":
      return "default";
    case "Lost":
      return "destructive";
    default:
      return "secondary";
  }
};

const getStatusBadgeColorClasses = (status: Lead["status"]): string => {
  switch (status) {
    case "New":
      return "bg-blue-500/20 text-blue-700 border-blue-500/30";
    case "Contacted":
      return "bg-sky-500/20 text-sky-700 border-sky-500/30";
    case "Qualified":
      return "bg-teal-500/20 text-teal-700 border-teal-500/30";
    case "Proposal Sent":
      return "bg-indigo-500/20 text-indigo-700 border-indigo-500/30";
    case "Converted to Account":
      return "bg-green-500/20 text-green-700 border-green-500/30";
    case "Lost":
      return "bg-red-500/20 text-red-700 border-red-500/30";
    default:
      return "bg-slate-500/20 text-slate-700 border-slate-500/30";
  }
};

const VALID_STATUSES: Lead["status"][] = [
  "New",
  "Contacted",
  "Qualified",
  "Proposal Sent",
  "Converted to Account",
  "Lost",
];

export default function LeadCard({
  lead: initialLead,
  onLeadConverted,
  onStatusChange,
  onDelete,
  isSelectMode = false,
}: LeadCardProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [lead, setLead] = useState(initialLead);
  const [isConverting, setIsConverting] = useState(false);
  const [isStatusUpdating, setIsStatusUpdating] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logContent, setLogContent] = useState("");
  const [logDate, setLogDate] = useState("");
  const [logSubmitting, setLogSubmitting] = useState(false);
  const [updateType, setUpdateType] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState({
    companyName: initialLead.companyName,
    personName: initialLead.personName,
    email: initialLead.email,
    phone: initialLead.phone || '',
    country: initialLead.country || '',
  });
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const isAssignedToMe = lead.assigned_user_id === user?.id;
  const isCreatedByMe = lead.created_by_user_id === user?.id;

  const handleStatusChange = async (newStatus: Lead["status"]) => {
    if (lead.status === newStatus) return;
    setIsStatusUpdating(true);
    try {
      const response = await fetch(`/api/leads/${lead.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to update status");
      }
      setLead((prev) => ({
        ...prev,
        status: newStatus,
        updatedAt: new Date().toISOString(),
      }));
      if (onStatusChange) {
        onStatusChange(lead.id, newStatus);
      }
      toast({
        title: "Status Updated!",
        description: `Lead status changed to ${newStatus}.`,
        className: "bg-green-100 dark:bg-green-900 border-green-500",
      });
      if (newStatus === "Converted to Account" && result.data?.id) {
        onLeadConverted(lead.id, result.data.id);
      }
    } catch (error) {
      toast({
        title: "Status Update Failed",
        description:
          error instanceof Error ? error.message : "Could not update status.",
        variant: "destructive",
      });
    } finally {
      setIsStatusUpdating(false);
    }
  };

  const handleConvert = async () => {
    setIsConverting(true);
    try {
      const response = await fetch(`/api/leads/${lead.id}/convert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to convert lead");
      }
      setLead((prev) => ({
        ...prev,
        status: "Converted to Account",
        updatedAt: new Date().toISOString(),
      }));
      toast({
        title: "Lead Converted!",
        description: "Lead has been successfully converted to an account.",
        className: "bg-green-100 dark:bg-green-900 border-green-500",
      });
      if (result.data?.account?.id) {
        onLeadConverted(lead.id, result.data.account.id);
      }
    } catch (error) {
      toast({
        title: "Conversion Failed",
        description:
          error instanceof Error ? error.message : "Could not convert lead.",
        variant: "destructive",
      });
    } finally {
      setIsConverting(false);
    }
  };

  const handleDelete = async () => {
    setShowDeleteDialog(false);
    try {
      const response = await fetch(`/api/leads/${lead.id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Failed to delete lead");
      }
      toast({
        title: "Lead Deleted!",
        description: "Lead has been successfully deleted.",
        className: "bg-red-100 dark:bg-red-900 border-red-500",
      });
      if (onDelete) onDelete(lead.id);
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: error instanceof Error ? error.message : "Could not delete lead.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(parseISO(dateString), { addSuffix: true });
    } catch (error) {
      console.error("Error formatting date:", dateString, error);
      return "Unknown";
    }
  };

  // Fetch logs for this lead
  const fetchLogs = async () => {
    setLogsLoading(true);
    try {
      const res = await fetch(`/api/updates?lead_id=${lead.id}`);
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
    if (!logContent.trim()) return;
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
          lead_id: lead.id,
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
          fetchLogs(); // fallback if no data returned
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

  // Edit handlers
  const handleEditClick = () => {
    setIsEditing(true);
    setEditValues({
      companyName: lead.companyName,
      personName: lead.personName,
      email: lead.email,
      phone: lead.phone || '',
      country: lead.country || '',
    });
  };

  const handleEditChange = (field: string, value: string) => {
    setEditValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleEditSave = async () => {
    setIsSavingEdit(true);
    try {
      const response = await fetch(`/api/leads/${lead.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name: editValues.companyName,
          person_name: editValues.personName,
          email: editValues.email,
          phone: editValues.phone,
          country: editValues.country,
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update lead');
      }
      setLead((prev) => ({
        ...prev,
        companyName: editValues.companyName,
        personName: editValues.personName,
        email: editValues.email,
        phone: editValues.phone,
        country: editValues.country,
      }));
      setIsEditing(false);
      toast({
        title: 'Lead Updated!',
        description: 'Lead information has been updated successfully.',
        className: 'bg-green-100 dark:bg-green-900 border-green-500',
      });
    } catch (error) {
      toast({
        title: 'Update Failed',
        description: error instanceof Error ? error.message : 'Could not update lead.',
        variant: 'destructive',
      });
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    setEditValues({
      companyName: lead.companyName,
      personName: lead.personName,
      email: lead.email,
      phone: lead.phone || '',
      country: lead.country || '',
    });
  };

  return (
    <>
      <Dialog open={showModal} onOpenChange={(open) => {
        setShowModal(open);
        if (open) fetchLogs();
      }}>
        <div
          className="flex flex-col h-full bg-white text-black rounded-[8px] p-2 border-none cursor-pointer"
          onClick={e => {
            // Prevent modal open on action button clicks or when in select mode
            if ((e.target as HTMLElement).closest("button, a") || isSelectMode) return;
            setShowModal(true);
          }}
        >
          <CardHeader className="pb-3 px-6 pt-6">
            <div className="flex justify-between items-start mb-1">
              <CardTitle className="text-xl font-headline flex items-center" style={{ color: '#97A88C' }}>
                <Briefcase className="mr-2 h-5 w-5 shrink-0" style={{ color: '#97A88C' }} />
                {lead.companyName}
                {isAssignedToMe && !isCreatedByMe && (
                  <UserCheck className="ml-2 h-4 w-4 text-blue-500" />
                )}
                {isCreatedByMe && (
                  <UserPlus className="ml-2 h-4 w-4 text-green-500" />
                )}
              </CardTitle>
              <div className="flex items-center gap-2">
                <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                  <AlertDialogTrigger asChild>
                    <button
                      className={`capitalize whitespace-nowrap ml-2 focus:outline-none ${getStatusBadgeColorClasses(
                        lead.status
                      )} inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors`}
                      disabled={
                        isStatusUpdating ||
                        lead.status === "Converted to Account" ||
                        lead.status === "Lost"
                      }
                      aria-label="Change status"
                    >
                      {isStatusUpdating ? (
                        <span className="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      ) : null}
                      {lead.status}
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Lead</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this lead? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel asChild>
                        <Button variant="outline">Cancel</Button>
                      </AlertDialogCancel>
                      <AlertDialogAction asChild>
                        <Button variant="destructive" onClick={handleDelete}>Delete</Button>
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
            <CardDescription className="text-sm text-muted-foreground flex items-center">
              <Users className="mr-2 h-4 w-4 shrink-0 text-gray-700" />{" "}
              {lead.personName}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow space-y-2.5 text-sm px-6">
            {lead.email && (
              <div className="flex items-center text-muted-foreground">
                <Mail className="mr-2 h-4 w-4 shrink-0 text-gray-700" />
                <a
                  href={`mailto:${lead.email}`}
                  className="hover:text-primary hover:underline"
                >
                  {lead.email}
                </a>
              </div>
            )}
            {lead.phone && (
              <div className="flex items-center text-muted-foreground">
                <Phone className="mr-2 h-4 w-4 shrink-0 text-gray-700" />
                <span>{lead.phone}</span>
              </div>
            )}
            {lead.linkedinProfileUrl && (
              <div className="flex items-center text-muted-foreground">
                <Linkedin className="mr-2 h-4 w-4 shrink-0 text-gray-700" />
                <a
                  href={lead.linkedinProfileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary hover:underline truncate"
                >
                  {lead.linkedinProfileUrl
                    .replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, "")
                    .replace(/\/$/, "")}
                </a>
              </div>
            )}
            {lead.country && (
              <div className="flex items-center text-muted-foreground">
                <MapPin className="mr-2 h-4 w-4 shrink-0 text-gray-700" />
                <span>{lead.country}</span>
              </div>
            )}
            <div className="pt-2 space-y-1">
              <div className="text-xs text-muted-foreground flex items-center">
                <CalendarPlus className="mr-1.5 h-3.5 w-3.5 shrink-0 text-gray-700" />
                Created: {formatDate(lead.createdAt)}
              </div>
              <div className="text-xs text-muted-foreground flex items-center">
                <History className="mr-1.5 h-3.5 w-3.5 shrink-0 text-gray-700" />
                Last Updated: {formatDate(lead.updatedAt)}
              </div>
            </div>
          </CardContent>
          <CardFooter className="pt-4 border-t mt-auto px-6 pb-6 flex items-center justify-between gap-2">
            <Button
              asChild
              className="flex flex-row items-center justify-center"
              style={{
                width: '152px',
                height: '56px',
                minWidth: '128px',
                borderRadius: '4px',
                padding: '16px 27px',
                gap: '8px',
                background: '#2B2521',
                color: 'white',
                fontWeight: 500,
                fontSize: '16px',
                lineHeight: '24px',
                boxSizing: 'border-box',
              }}
            >
              <Link href={`/leads/${lead.id}`} className="flex items-center gap-2 w-full h-full" style={{ color: 'white', textDecoration: 'none' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M14 3v4a1 1 0 0 0 1 1h4" /><path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z" /><path d="M9 17h6" /><path d="M9 13h6" /></svg>
                <span>View Details</span>
              </Link>
            </Button>
            <div className="flex items-center gap-6">
              {lead.status === "Converted to Account" ? (
                <Button
                  size="sm"
                  disabled
                  variant="beige"
                  className="cursor-not-allowed opacity-70"
                >
                  <CheckSquare className="mr-2 h-4 w-4" />
                  Converted
                </Button>
              ) : (
                lead.status !== "Lost" && (
                  <>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            onClick={handleConvert}
                            disabled={isConverting}
                            variant="ghost"
                            className="p-0 bg-transparent border-none shadow-none focus:outline-none hover:bg-transparent group"
                            style={{ width: 40, height: 40 }}
                          >
                            <span className="flex items-center justify-center w-10 h-10 rounded-full transition-all duration-150 group-hover:bg-[#B89B6A]/80 group-hover:scale-110" style={{ background: 'none', position: 'relative' }}>
                              <img src="/glob.svg" alt="bg" className="absolute w-10 h-10 left-0 top-0" style={{ pointerEvents: 'none' }} />
                              <span className="flex items-center justify-center w-10 h-10 rounded-full relative z-10">
                            {isConverting ? (
                                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            ) : (
                                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 5v6a3 3 0 0 0 3 3h7" /><path d="M10 10l4 4l-4 4m5 -8l4 4l-4 4" /></svg>
                            )}
                              </span>
                            </span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Convert to Account</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setShowDeleteDialog(true)}
                            title="Delete Lead"
                            className="p-0 bg-transparent border-none shadow-none focus:outline-none hover:bg-transparent group"
                            style={{ width: 40, height: 40 }}
                          >
                            <span className="flex items-center justify-center w-10 h-10 rounded-full transition-all duration-150 group-hover:bg-black/40 group-hover:scale-110" style={{ background: 'none', position: 'relative' }}>
                              <img src="/glob.svg" alt="bg" className="absolute w-10 h-10 left-0 top-0" style={{ pointerEvents: 'none' }} />
                              <span className="flex items-center justify-center w-10 h-10 rounded-full relative z-10">
                                <Trash2 className="h-4 w-4 text-white" />
                              </span>
                            </span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Delete</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </>
                )
              )}
            </div>
          </CardFooter>
        </div>
        <DialogContent className="max-w-xl w-full bg-white text-black">
          <DialogHeader>
            <DialogTitle className="text-black flex items-center justify-between">
              <div className="flex items-center">
                {isEditing ? (
                  <input
                    className="text-xl font-semibold border-b border-[#97A88C] bg-transparent focus:outline-none px-1"
                    value={editValues.companyName}
                    onChange={e => handleEditChange('companyName', e.target.value)}
                  />
                ) : (
                  lead.companyName
                )}
              </div>
              <div className="flex items-center gap-2 mr-4">
                {!isEditing && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9 px-3 border border-[#97A88C] text-[#2B2521] hover:bg-[#97A88C]/10 rounded-lg font-medium shadow-sm flex items-center gap-1 text-base"
                    style={{ minHeight: 36 }}
                    onClick={handleEditClick}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                )}
                {isEditing && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleEditCancel}
                      disabled={isSavingEdit}
                      className="h-9 px-3 border border-[#97A88C] text-[#2B2521] hover:bg-[#97A88C]/10 rounded-lg text-base"
                      style={{ minHeight: 36 }}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      variant="default"
                      onClick={handleEditSave}
                      disabled={isSavingEdit}
                      className="h-9 px-3 bg-[#2B2521] hover:bg-[#2B2521]/90 text-white rounded-lg text-base"
                      style={{ minHeight: 36 }}
                    >
                      {isSavingEdit ? 'Saving...' : 'Save'}
                    </Button>
                  </>
                )}
              </div>
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              <div className="mt-2 grid grid-cols-2 gap-4">
                <div className="p-2 bg-gray-50 rounded">
                  <span className="text-black font-semibold">Name: </span>
                  {isEditing ? (
                    <input
                      className="border rounded px-2 py-1 w-full mt-1"
                      value={editValues.personName}
                      onChange={e => handleEditChange('personName', e.target.value)}
                    />
                  ) : (
                    lead.personName
                  )}
                </div>
                <div className="p-2 bg-gray-50 rounded">
                  <span className="text-black font-semibold">Email: </span>
                  {isEditing ? (
                    <input
                      className="border rounded px-2 py-1 w-full mt-1"
                      value={editValues.email}
                      onChange={e => handleEditChange('email', e.target.value)}
                    />
                  ) : (
                    lead.email
                  )}
                </div>
                <div className="p-2 bg-gray-50 rounded">
                  <span className="text-black font-semibold">Number: </span>
                  {isEditing ? (
                    <input
                      className="border rounded px-2 py-1 w-full mt-1"
                      value={editValues.phone}
                      onChange={e => handleEditChange('phone', e.target.value)}
                    />
                  ) : (
                    lead.phone || 'N/A'
                  )}
                </div>
                <div className="p-2 bg-gray-50 rounded">
                  <span className="text-black font-semibold">Location: </span>
                  {isEditing ? (
                    <CountryCombobox
                      value={editValues.country}
                      onChange={val => handleEditChange('country', val)}
                      countries={countries}
                    />
                  ) : (
                    lead.country || 'N/A'
                  )}
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <div className="flex items-center mb-4">
              <span className="mr-2 text-lg"><FileWarning className="inline-block mr-1" /></span>
              <span className="text-lg font-medium text-gray-800">Lead: <span className="font-bold text-black text-2xl">{lead.companyName}</span></span>
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
                value={lead.companyName}
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
        </DialogContent>
      </Dialog>
    </>
  );
}

interface CountryComboboxProps {
  value: string;
  onChange: (value: string) => void;
  countries: { code: string; name: string }[];
}

function CountryCombobox({ value, onChange, countries }: CountryComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const filtered = React.useMemo(() =>
    countries.filter(c => c.name.toLowerCase().includes(search.toLowerCase())),
    [search, countries]
  );
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="w-full border rounded px-2 py-1 bg-white text-left"
          onClick={() => setOpen(o => !o)}
        >
          {value || 'Select country'}
        </button>
      </PopoverTrigger>
      <PopoverContent className="p-2 w-64">
        <Input
          autoFocus
          placeholder="Type to search..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="mb-2"
        />
        <div className="max-h-48 overflow-y-auto">
          {filtered.length === 0 && (
            <div className="text-gray-400 px-2 py-1">No results</div>
          )}
          {filtered.map(c => (
            <div
              key={c.code}
              className={`px-2 py-1 cursor-pointer rounded hover:bg-[#E5E7E0] ${c.name === value ? 'bg-[#97A88C]/20 font-semibold' : ''}`}
              onClick={() => {
                onChange(c.name);
                setOpen(false);
                setSearch('');
              }}
            >
              {c.name}
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
