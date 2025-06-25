"use client";
import React, { useState, useEffect } from "react";
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
  Briefcase,
  ListChecks,
  PlusCircle,
  Eye,
  MessageSquareHeart,
  Lightbulb,
  Users,
  Mail,
  Phone,
  Tag,
  Trash2,
  MessageSquare,
  Edit,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import type {
  Account,
  DailyAccountSummary as AIDailySummary,
  Opportunity,
} from "@/types";
import { getOpportunitiesByAccount } from "@/lib/data";
import { generateDailyAccountSummary } from "@/ai/flows/daily-account-summary";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import AddOpportunityDialog from "@/components/opportunities/AddOpportunityDialog";
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
import { useToast } from "@/hooks/use-toast";
import AddUpdateDialog from "@/components/updates/AddUpdateDialog";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';

interface AccountCardProps {
  account: Account;
  isConverted?: boolean;
  onDelete?: (accountId: string) => void;
}

export default function AccountCard({
  account,
  isConverted,
  onDelete,
}: AccountCardProps) {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [totalOpportunityAmount, setTotalOpportunityAmount] = useState<number>(0);
  const [dailySummary, setDailySummary] = useState<AIDailySummary | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [isAddOpportunityDialogOpen, setIsAddOpportunityDialogOpen] =
    useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAddUpdateDialog, setShowAddUpdateDialog] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logContent, setLogContent] = useState("");
  const [logDate, setLogDate] = useState("");
  const [logSubmitting, setLogSubmitting] = useState(false);
  const [isReverting, setIsReverting] = useState(false);
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState({
    name: account.name,
    contactPersonName: account.contactPersonName || '',
    contactEmail: account.contactEmail || '',
    contactPhone: account.contactPhone || '',
    status: account.status,
  });
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const fetchLogs = async () => {
    setLogsLoading(true);
    try {
      const res = await fetch(`/api/updates?account_id=${account.id}`);
      const result = await res.json();
      setLogs(result.data || []);
    } catch (e) {
      setLogs([]);
    } finally {
      setLogsLoading(false);
    }
  };

  const handleLogActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logContent.trim()) return;
    const todayStr = new Date().toISOString().split('T')[0];
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
    setLogs(prev => [newLog, ...prev]);
    try {
      const res = await fetch("/api/updates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          account_id: account.id,
          type: "General",
          content: logContent,
          date: logDate ? new Date(logDate).toISOString() : new Date().toISOString(),
        }),
      });
      if (res.ok) {
        setLogContent("");
        setLogDate("");
        const result = await res.json();
        if (result.data) {
          setLogs(prev => [result.data, ...prev.filter(l => l.id !== newLog.id)]);
        } else {
          fetchLogs();
        }
        toast({ title: "Activity Logged", description: "Activity has been added to records." });
      } else {
        setLogs(prev => prev.filter(l => l.id !== newLog.id));
        toast({ title: "Failed to log activity", variant: "destructive" });
      }
    } catch (e) {
      setLogs(prev => prev.filter(l => l.id !== newLog.id));
      toast({ title: "Failed to log activity", variant: "destructive" });
    } finally {
      setLogSubmitting(false);
    }
  };

  useEffect(() => {
    async function fetchOpportunities() {
      const res = await fetch(`/api/opportunities?account_id=${account.id}`);
      const result = await res.json();
      const opps = result.data || [];
      setOpportunities(opps);
      const total = opps.reduce((sum: number, opp: any) => sum + (Number(opp.amount) || 0), 0);
      setTotalOpportunityAmount(total);
    }
    fetchOpportunities();
  }, [account.id]);

  const fetchDailySummary = async () => {
    setIsLoadingSummary(true);
    try {
      const summary = await generateDailyAccountSummary({
        accountId: account.id,
        accountName: account.name,
        recentUpdates:
          "Placeholder: Recent updates indicate active engagement.",
        keyMetrics: "Placeholder: Key metrics are trending positively.",
      });
      setDailySummary(summary);
    } catch (error) {
      console.error(`Failed to fetch summary for ${account.name}:`, error);
      setDailySummary({
        summary: "Could not load AI summary.",
        relationshipHealth: "Unknown",
      });
    } finally {
      setIsLoadingSummary(false);
    }
  };

  useEffect(() => {
    if (account.status === "Active") {
      fetchDailySummary();
    }
  }, [account.id, account.name, account.status]);

  const handleOpportunityAdded = (newOpportunity: Opportunity) => {
    // Refresh the account data or update the UI as needed
    // This could be handled by a parent component if needed
  };

  const handleDelete = async () => {
    setShowDeleteDialog(false);
    try {
      const response = await fetch(`/api/accounts/${account.id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Failed to delete account");
      }
      toast({
        title: "Account Deleted",
        description: `${account.name} has been successfully deleted.`,
      });
      if (onDelete) onDelete(account.id);
    } catch (error: any) {
      console.error('Error deleting account:', error);
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete account. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRevertToLead = async () => {
    setIsReverting(true);
    try {
      const res = await fetch(`/api/accounts/${account.id}/revert-to-lead`, {
        method: 'POST',
      });
      const result = await res.json();
      if (res.ok) {
        toast({
          title: 'Reverted to Lead',
          description: 'This account has been marked inactive and the lead restored.',
          className: 'bg-green-100 dark:bg-green-900 border-green-500',
        });
        // Optionally, you can trigger a refresh or callback here
        // For now, just reload the page or remove the card from UI
        window.location.reload();
      } else {
        toast({
          title: 'Revert Failed',
          description: result.error || 'Could not revert account to lead.',
          variant: 'destructive',
        });
      }
    } catch (e) {
      toast({
        title: 'Revert Failed',
        description: 'Could not revert account to lead.',
        variant: 'destructive',
      });
    } finally {
      setIsReverting(false);
    }
  };

  // Edit handlers
  const handleEditClick = () => {
    setIsEditing(true);
    setEditValues({
      name: account.name,
      contactPersonName: account.contactPersonName || '',
      contactEmail: account.contactEmail || '',
      contactPhone: account.contactPhone || '',
      status: account.status,
    });
  };
  const handleEditChange = (field: string, value: string) => {
    setEditValues((prev) => ({ ...prev, [field]: value }));
  };
  const handleEditSave = async () => {
    setIsSavingEdit(true);
    try {
      const response = await fetch(`/api/accounts/${account.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editValues.name,
          contact_person_name: editValues.contactPersonName,
          contact_email: editValues.contactEmail,
          contact_phone: editValues.contactPhone,
          status: editValues.status,
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update account');
      }
      // Update UI
      setIsEditing(false);
      toast({
        title: 'Account Updated!',
        description: 'Account information has been updated.',
        className: 'bg-green-100 dark:bg-green-900 border-green-500',
      });
      window.location.reload(); // Or update state if you want instant UI update
    } catch (error) {
      toast({
        title: 'Update Failed',
        description: error instanceof Error ? error.message : 'Could not update account.',
        variant: 'destructive',
      });
    } finally {
      setIsSavingEdit(false);
    }
  };
  const handleEditCancel = () => {
    setIsEditing(false);
    setEditValues({
      name: account.name,
      contactPersonName: account.contactPersonName || '',
      contactEmail: account.contactEmail || '',
      contactPhone: account.contactPhone || '',
      status: account.status,
    });
  };

  return (
    <>
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <div
          className="flex flex-col h-full bg-white text-black rounded-[8px] border-none cursor-pointer"
          onClick={e => {
            if ((e.target as HTMLElement).closest("button, a")) return;
            setShowModal(true);
            fetchLogs();
          }}
        >
      <Card className="flex flex-col h-full bg-white text-black rounded-[8px] p-2 border-none text-left">
        <CardHeader className="pb-3 px-6 pt-6 text-left">
          <div className="flex flex-row items-center justify-between w-full mb-1 text-left">
            <div className="flex flex-col items-start text-left">
              <div className="flex items-center gap-2 text-left">
                <Briefcase className="h-5 w-5" style={{ color: '#97A88C' }} />
                <CardTitle className="text-xl font-headline mb-0 text-left" style={{ color: '#97A88C' }}>
                  {account.name}
                </CardTitle>
              </div>
              {(account.type || account.industry) && (
                <div className="flex items-center mt-2 text-muted-foreground text-sm text-left">
                  <Tag className="mr-1 h-4 w-4 shrink-0" />
                  <span>
                    {account.type}
                    {account.type && account.industry ? " | " : ""}
                    {account.industry}
                  </span>
                </div>
              )}
            </div>
                          <div className="flex items-center gap-2">
            <Badge
              variant={account.status === "Active" ? "default" : "secondary"}
              className={`capitalize whitespace-nowrap ml-2 ${
                account.status === "Active"
                  ? "bg-green-500/20 text-green-700 border-green-500/30"
                  : "bg-amber-500/20 text-amber-700 border-amber-500/30"
              } !hover:bg-inherit !hover:text-inherit !hover:border-inherit`}
            >
              {account.status}
            </Badge>
                  {(account.convertedFromLeadId && account.status !== 'Inactive') && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleRevertToLead}
                      disabled={isReverting}
                      className="ml-2 border border-yellow-700 text-yellow-900 bg-yellow-100 hover:bg-yellow-200"
                    >
                      {isReverting ? 'Reverting...' : 'Revert to Lead'}
                    </Button>
                  )}
                </div>
          </div>
        </CardHeader>
        <CardContent className="flex-grow space-y-3 text-sm px-6 text-left">
          <p className="text-muted-foreground line-clamp-2 text-left">
            {account.description}
          </p>

          {account.contactPersonName && (
            <div className="flex items-center text-muted-foreground">
              <Users className="mr-2 h-4 w-4 shrink-0 text-gray-700" />
              {account.contactPersonName}
            </div>
          )}
          {account.contactEmail && (
            <div className="flex items-center text-muted-foreground">
              <Mail className="mr-2 h-4 w-4 shrink-0 text-gray-700" />
              {account.contactEmail}
            </div>
          )}
          {account.contactPhone && (
            <div className="flex items-center text-muted-foreground">
              <Phone className="mr-2 h-4 w-4 shrink-0 text-gray-700" />
              {account.contactPhone}
            </div>
          )}

          <div className="text-sm flex items-center text-foreground font-medium text-left">
            <ListChecks className="mr-2 h-4 w-4" />
            <span>
              {opportunities.length} Active Opportunit{opportunities.length !== 1 ? "ies" : "y"}
            </span>
          </div>

          {account.status === "Active" && (
            <div className="pt-3 border-t mt-3">
              <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1.5 flex items-center text-left">
                <Lightbulb className="mr-1.5 h-3.5 w-3.5 text-yellow-500" /> AI
                Daily Brief
              </h4>
              {isLoadingSummary ? (
                <div className="flex items-center space-x-2 h-10">
                  <LoadingSpinner size={16} />
                  <span className="text-xs text-muted-foreground">
                    Generating brief...
                  </span>
                </div>
              ) : dailySummary ? (
                <div className="space-y-1">
                  <p className="text-xs text-foreground line-clamp-2 text-left">
                    {dailySummary.summary}
                  </p>
                  <div className="flex items-center text-xs text-left">
                    <MessageSquareHeart className="mr-1.5 h-3.5 w-3.5 text-pink-500" />
                    <span className="font-medium text-foreground">Health:</span>
                    &nbsp;
                    <span className="text-muted-foreground">
                      {dailySummary.relationshipHealth}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground h-10 flex items-center text-left">
                  No AI brief available for this account.
                </p>
              )}
            </div>
          )}
        </CardContent>
        <CardFooter className="pt-4 border-t mt-auto px-6 pb-6 flex justify-between items-center gap-2">
          <Button
                onClick={() => setIsAddOpportunityDialogOpen(true)}
                title="New Opportunity"
                className="flex flex-row items-center justify-center"
                style={{
                  width: 'auto',
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
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 5v14" /><path d="M5 12h14" /></svg>
                <span>New Opportunity</span>
          </Button>
              <div className="flex-grow" />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="p-0 bg-transparent border-none shadow-none focus:outline-none hover:bg-transparent ml-auto group"
                  onClick={() => setShowDeleteDialog(true)}
                  title="Delete Account"
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
            </CardFooter>
          </Card>
        </div>

        <DialogContent className="max-w-xl w-full bg-white text-black">
          <DialogHeader>
            <DialogTitle className="text-black flex items-center justify-between">
              <div className="flex items-center">
                {isEditing ? (
                  <Input
                    className="text-xl font-semibold border-b border-[#97A88C] bg-transparent focus:outline-none px-1"
                    value={editValues.name}
                    onChange={e => handleEditChange('name', e.target.value)}
                  />
                ) : (
                  account.name
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
                  <span className="text-black font-semibold">Contact: </span>
                  {isEditing ? (
                    <Input
                      className="border rounded px-2 py-1 w-full mt-1"
                      value={editValues.contactPersonName}
                      onChange={e => handleEditChange('contactPersonName', e.target.value)}
                    />
                  ) : (
                    account.contactPersonName || 'N/A'
                  )}
                </div>
                <div className="p-2 bg-gray-50 rounded">
                  <span className="text-black font-semibold">Email: </span>
                  {isEditing ? (
                    <Input
                      className="border rounded px-2 py-1 w-full mt-1"
                      value={editValues.contactEmail}
                      onChange={e => handleEditChange('contactEmail', e.target.value)}
                    />
                  ) : (
                    account.contactEmail || 'N/A'
                  )}
                </div>
                <div className="p-2 bg-gray-50 rounded">
                  <span className="text-black font-semibold">Phone: </span>
                  {isEditing ? (
                    <Input
                      className="border rounded px-2 py-1 w-full mt-1"
                      value={editValues.contactPhone}
                      onChange={e => handleEditChange('contactPhone', e.target.value)}
                    />
                  ) : (
                    account.contactPhone || 'N/A'
                  )}
                </div>
                <div className="p-2 bg-gray-50 rounded">
                  <span className="text-black font-semibold">Status: </span>
                  {isEditing ? (
                    <Select value={editValues.status} onValueChange={val => handleEditChange('status', val)}>
                      <SelectTrigger className="w-full mt-1">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    account.status
                  )}
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <h3 className="font-semibold mb-2 text-black">Records</h3>
            {logsLoading ? (
              <div className="text-black">Loading...</div>
            ) : logs.length === 0 ? (
              <div className="text-gray-600">No log found</div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {logs.map((log) => (
                  <div key={log.id} className="bg-gray-100 rounded p-2">
                    <div className="text-sm text-black">{log.content}</div>
                    <div className="text-xs text-gray-600 mt-1">Logged on: {log.date ? new Date(log.date).toLocaleDateString() : "-"}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <form className="mt-6" onSubmit={handleLogActivity}>
            <h4 className="font-semibold mb-2 text-black">Log New Activity</h4>
            <textarea
              className="w-full border border-black rounded p-2 mb-2 text-black bg-white"
              rows={3}
              placeholder="e.g., Follow-up call, sent proposal..."
              value={logContent}
              onChange={e => setLogContent(e.target.value)}
              required
            />
            <input
              type="date"
              className="w-full border border-black rounded p-2 mb-2 text-black bg-white"
              value={logDate}
              onChange={e => setLogDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
            <DialogFooter>
              <Button type="submit" className="bg-green-600 text-white" disabled={logSubmitting}>
                {logSubmitting ? "Logging..." : "Log Activity"}
          </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

          <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Account</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this account? This action cannot be undone.
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
      <AddOpportunityDialog
        open={isAddOpportunityDialogOpen}
        onOpenChange={setIsAddOpportunityDialogOpen}
        onOpportunityAdded={handleOpportunityAdded}
        initialAccountId={account.id}
        accounts={[{ id: account.id, name: account.name, type: account.type }]}
      />
      <AddUpdateDialog
        open={showAddUpdateDialog}
        onOpenChange={setShowAddUpdateDialog}
        onUpdateAdded={() => setShowAddUpdateDialog(false)}
        forceEntityType="account"
        forceEntityId={account.id}
      />
    </>
  );
}
