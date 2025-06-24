"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, Upload, ChevronUp } from 'lucide-react';
import PageTitle from '@/components/common/PageTitle';
import AddLeadDialog from '@/components/leads/AddLeadDialog';
import LeadCard from '@/components/leads/LeadCard';
import CSVImport from '@/components/common/CSVImport';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useToast } from "@/hooks/use-toast";
import type { Lead } from '@/types';
import LeadsListWithFilter from '@/components/leads/LeadsListWithFilter';
import { useAuth } from "@/hooks/use-auth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";

interface RejectedLead {
  company_name: string;
  person_name: string;
  email: string;
  phone?: string;
  linkedin_profile_url?: string;
  country?: string;
  _errors?: string[];
  _rowIndex: number;
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddLeadDialogOpen, setIsAddLeadDialogOpen] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const { toast } = useToast();
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const [rejectedLeads, setRejectedLeads] = useState<RejectedLead[]>([]);
  const [showRejectedDialog, setShowRejectedDialog] = useState(false);
  const [editingLeads, setEditingLeads] = useState<RejectedLead[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastLeadElementRef = useCallback((node: HTMLDivElement | null) => {
    if (isLoading || isFetchingMore) return;
    
    if (observerRef.current) observerRef.current.disconnect();
    
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    });
    
    if (node) observerRef.current.observe(node);
  }, [isLoading, isFetchingMore, hasMore]);

  const fetchLeads = async (pageNum: number, isInitial: boolean = false) => {
    try {
      if (!isInitial) setIsFetchingMore(true);
      const response = await fetch(`/api/leads?page=${pageNum}&limit=10`);
      const data = await response.json();
      
      if (data.data) {
        const newLeads = data.data.map((lead: any) => ({
          id: lead.id,
          companyName: lead.company_name,
          personName: lead.person_name,
          email: lead.email,
          phone: lead.phone,
          linkedinProfileUrl: lead.linkedin_profile_url,
          country: lead.country,
          status: lead.status,
          opportunityIds: lead.opportunity_ids || [],
          updateIds: lead.update_ids || [],
          createdAt: lead.created_at,
          updatedAt: lead.updated_at,
          assigned_user_id: lead.assigned_user_id,
          created_by_user_id: lead.created_by_user_id,
        }));

        setLeads(prevLeads => isInitial ? newLeads : [...prevLeads, ...newLeads]);
        setHasMore(newLeads.length === 10); // Assuming 10 is the page size
      }
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setIsLoading(false);
      setIsFetchingMore(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      fetchLeads(1, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user]);

  useEffect(() => {
    if (page > 1) {
      fetchLeads(page);
    }
  }, [page]);

  const handleLeadAdded = (newLead: Lead) => {
    setLeads(prevLeads => [newLead, ...prevLeads]);
    toast({
      title: "Lead Added",
      description: `${newLead.companyName} has been successfully added.`,
    });
  };

  const handleLeadConverted = async (leadId: string, newAccountId: string) => {
    // Remove the converted lead from the list
    setLeads(prevLeads => prevLeads.filter(lead => lead.id !== leadId));
    
    toast({
      title: "Lead Converted",
      description: "Lead has been successfully converted to an account.",
      className: "bg-green-100 dark:bg-green-900 border-green-500",
    });
  };

  const handleLeadDeleted = (leadId: string) => {
    setLeads(prevLeads => prevLeads.filter(lead => lead.id !== leadId));
    toast({
      title: "Lead Deleted",
      description: "Lead has been successfully deleted.",
    });
  };

  const handleImport = async (validData: any[], rejectedData: RejectedLead[]) => {
    setIsImporting(true);
    try {
      if (!user) {
        console.error('❌ No user found for import');
        toast({
          title: "Import Failed",
          description: "User not authenticated. Please log in again.",
          variant: "destructive",
        });
        return;
      }
      
      // Process valid data first
      const newLeads: Lead[] = [];
      let successCount = 0;
      let errorCount = 0;
      
      for (const leadData of validData) {
        try {
          const response = await fetch('/api/leads', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              company_name: leadData.company_name,
              person_name: leadData.person_name,
              email: leadData.email,
              phone: leadData.phone,
              linkedin_profile_url: leadData.linkedin_profile_url,
              country: leadData.country,
              created_by_user_id: user.id,
            })
          });

          if (response.ok) {
            const result = await response.json();
            newLeads.push({
              id: result.data.id,
              companyName: result.data.company_name,
              personName: result.data.person_name,
              email: result.data.email,
              phone: result.data.phone,
              linkedinProfileUrl: result.data.linkedin_profile_url,
              country: result.data.country,
              status: result.data.status,
              opportunityIds: [],
              updateIds: [],
              createdAt: result.data.created_at,
              updatedAt: result.data.updated_at,
              assigned_user_id: result.data.assigned_user_id,
              created_by_user_id: result.data.created_by_user_id,
            });
            successCount++;
          } else {
            errorCount++;
          }
        } catch (error) {
          console.error('Error creating lead:', error);
          errorCount++;
        }
      }

      // Update state with valid leads
      setLeads(prevLeads => [...newLeads, ...prevLeads]);

      // Handle rejected data
      if (rejectedData.length > 0) {
        setRejectedLeads(rejectedData);
        setEditingLeads(rejectedData);
        setShowRejectedDialog(true);
      }

      toast({
        title: "Import Summary",
        description: `Total: ${validData.length + rejectedData.length} records
          ✓ ${successCount} imported successfully
          ${rejectedData.length > 0 ? `\n⚠ ${rejectedData.length} need review` : ''}
          ${errorCount > 0 ? `\n⚠ ${errorCount} failed to import` : ''}`,
        variant: "default"
      });
    } catch (error) {
      console.error('Error importing leads:', error);
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Failed to import leads.",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
      setShowImport(false);
    }
  };

  const handleSaveRejectedLeads = async () => {
    if (!editingLeads.length || !user) return;

    const results = { success: 0, failed: 0 };
    const newLeads: Lead[] = [];

    for (const lead of editingLeads) {
      try {
        const response = await fetch('/api/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            company_name: lead.company_name,
            person_name: lead.person_name,
            email: lead.email,
            phone: lead.phone,
            linkedin_profile_url: lead.linkedin_profile_url,
            country: lead.country,
            created_by_user_id: user.id,
          })
        });

        if (response.ok) {
          const result = await response.json();
          newLeads.push({
            id: result.data.id,
            companyName: result.data.company_name,
            personName: result.data.person_name,
            email: result.data.email,
            phone: result.data.phone,
            linkedinProfileUrl: result.data.linkedin_profile_url,
            country: result.data.country,
            status: result.data.status,
            opportunityIds: [],
            updateIds: [],
            createdAt: result.data.created_at,
            updatedAt: result.data.updated_at,
            assigned_user_id: result.data.assigned_user_id,
            created_by_user_id: result.data.created_by_user_id,
          });
          results.success++;
        } else {
          results.failed++;
        }
      } catch (error) {
        console.error('Error saving lead:', error);
        results.failed++;
      }
    }

    if (results.success > 0) {
      setLeads(prevLeads => [...newLeads, ...prevLeads]);
      setShowRejectedDialog(false);
      setRejectedLeads([]);
      setEditingLeads([]);

      toast({
        title: "Leads Saved",
        description: `${results.success} leads saved successfully.${results.failed > 0 ? ` ${results.failed} failed.` : ''}`,
        variant: results.failed > 0 ? "destructive" : "default"
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to save leads. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto space-y-6 mt-6">
        <PageTitle title="Lead Management" subtitle="Track and manage potential clients." />
        <div className="flex items-center justify-center h-[60vh]">
          <LoadingSpinner size={32} />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6 mt-6">
      <PageTitle title="Lead Management" subtitle="Track and manage potential clients.">
        <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => {
                console.log('🔄 Import CSV button clicked');
                console.log('🔄 Current showImport state:', showImport);
                setShowImport(true);
                console.log('🔄 showImport set to true');
              }}
              className="flex items-center"
            >
                <Upload className="mr-2 h-4 w-4" /> Import CSV
            </Button>
            <Button onClick={() => setIsAddLeadDialogOpen(true)} variant="beige">
                <PlusCircle className="mr-2 h-4 w-4" /> Add New Lead
            </Button>
        </div>
      </PageTitle>

      {(() => {
        if (showImport) {
          console.log('🔄 Rendering CSVImport component');
        }
        return null;
      })()}

      {showImport && (
        <div className="max-w-2xl mx-auto relative mb-4">
          <CSVImport
            type="leads"
            onImport={handleImport}
            templateUrl="/templates/leads-template.csv"
            disabled={isImporting}
          />
          <Button
            variant="ghost"
            size="lg"
            className="absolute -top-2 -right-12 text-muted-foreground hover:bg-transparent"
            onClick={() => setShowImport(false)}
            disabled={isImporting}
          >
            <ChevronUp className="h-6 w-6" />
            <span className="sr-only">Close import</span>
          </Button>
          {isImporting && (
            <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10 rounded-lg">
              <LoadingSpinner size={32} />
              <span className="ml-3 text-muted-foreground">Importing leads...</span>
            </div>
          )}
        </div>
      )}

      {leads.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-muted-foreground mb-4">
            <PlusCircle className="mx-auto h-12 w-12 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No leads yet</h3>
            <p className="text-sm">Get started by adding your first lead or importing from CSV.</p>
              </div>
          <div className="flex justify-center gap-2">
            <Button onClick={() => setIsAddLeadDialogOpen(true)} variant="beige">
              <PlusCircle className="mr-2 h-4 w-4" /> Add First Lead
            </Button>
            <Button variant="outline" onClick={() => setShowImport(true)}>
              <Upload className="mr-2 h-4 w-4" /> Import CSV
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex-1 space-y-4">
          <LeadsListWithFilter 
            leads={leads} 
            onLeadConverted={handleLeadConverted} 
            onLeadAdded={handleLeadAdded}
            onLeadDeleted={handleLeadDeleted}
          />
        </div>
      )}

      {user && (
        <AddLeadDialog
          open={isAddLeadDialogOpen}
          onOpenChange={setIsAddLeadDialogOpen}
          onLeadAdded={handleLeadAdded}
          user={user}
        />
      )}

      <Dialog open={showRejectedDialog} onOpenChange={setShowRejectedDialog}>
        <DialogContent className="max-w-4xl bg-background border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Review Rejected Leads ({rejectedLeads.length})</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              These records were rejected due to missing or invalid data. Please review and fix the issues below.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[600px] overflow-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[100px]">Row</TableHead>
                  <TableHead>Company Name</TableHead>
                  <TableHead>Person Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Issues</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {editingLeads.map((lead, index) => (
                  <TableRow key={index} className={lead._errors?.length ? 'bg-destructive/5 hover:bg-destructive/10' : 'hover:bg-muted/50'}>
                    <TableCell className="font-medium">{lead._rowIndex + 1}</TableCell>
                    <TableCell>
                      <Input
                        value={lead.company_name}
                        onChange={e => {
                          const newLeads = [...editingLeads];
                          newLeads[index] = { ...lead, company_name: e.target.value };
                          setEditingLeads(newLeads);
                        }}
                        className={!lead.company_name ? 'border-destructive focus-visible:ring-destructive' : 'bg-background'}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={lead.person_name}
                        onChange={e => {
                          const newLeads = [...editingLeads];
                          newLeads[index] = { ...lead, person_name: e.target.value };
                          setEditingLeads(newLeads);
                        }}
                        className={!lead.person_name ? 'border-destructive focus-visible:ring-destructive' : 'bg-background'}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="email"
                        value={lead.email}
                        onChange={e => {
                          const newLeads = [...editingLeads];
                          newLeads[index] = { ...lead, email: e.target.value };
                          setEditingLeads(newLeads);
                        }}
                        className={!lead.email ? 'border-destructive focus-visible:ring-destructive' : 'bg-background'}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-destructive space-y-1">
                        {lead._errors?.map((error, i) => (
                          <div key={i}>• {error}</div>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>

          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setShowRejectedDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveRejectedLeads}>
              Save All Fixed Leads
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
