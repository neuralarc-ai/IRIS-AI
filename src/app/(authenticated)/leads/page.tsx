"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, Upload } from 'lucide-react';
import PageTitle from '@/components/common/PageTitle';
import AddLeadDialog from '@/components/leads/AddLeadDialog';
import LeadCard from '@/components/leads/LeadCard';
import CSVImport from '@/components/common/CSVImport';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useToast } from "@/hooks/use-toast";
import type { Lead } from '@/types';

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddLeadDialogOpen, setIsAddLeadDialogOpen] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const { toast } = useToast();

  // Fetch leads from Supabase
  const fetchLeads = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/leads');
      
      if (!response.ok) {
        throw new Error('Failed to fetch leads');
      }
      
      const result = await response.json();
      
      // Transform API response from snake_case to camelCase
      const transformedLeads: Lead[] = (result.data || []).map((apiLead: any) => ({
        id: apiLead.id,
        companyName: apiLead.company_name,
        personName: apiLead.person_name,
        email: apiLead.email,
        phone: apiLead.phone,
        linkedinProfileUrl: apiLead.linkedin_profile_url,
        country: apiLead.country,
        status: apiLead.status,
        opportunityIds: [],
        updateIds: [],
        createdAt: apiLead.created_at,
        updatedAt: apiLead.updated_at,
      }));
      
      setLeads(transformedLeads);
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast({
        title: "Error",
        description: "Failed to load leads. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleLeadAdded = async (newLead: Lead) => {
    setLeads(prevLeads => [newLead, ...prevLeads]);
    toast({
      title: "Lead Added",
      description: `${newLead.companyName} has been successfully added.`,
    });
  };

  const handleLeadConverted = async (leadId: string, newAccountId: string) => {
    // Update the lead status in the local state
    setLeads(prevLeads =>
      prevLeads.map(lead =>
        lead.id === leadId 
          ? { ...lead, status: 'Converted to Account' as const }
          : lead
      )
    );
    toast({
      title: "Lead Converted",
      description: "Lead has been successfully converted to an account.",
    });
  };

  const handleImport = async (importedData: any[]) => {
    try {
      // Process imported data and add to leads
      const processedLeads = importedData.map((item, index) => ({
        id: `imported_${Date.now()}_${index}`,
        companyName: item.company_name || item.companyName || '',
        personName: item.person_name || item.personName || '',
        email: item.email || '',
        phone: item.phone || '',
        linkedinProfileUrl: item.linkedin_profile_url || item.linkedinProfileUrl || '',
        country: item.country || '',
        status: 'New' as const,
                opportunityIds: [],
                updateIds: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
      }));

      // Add each imported lead via API
      for (const lead of processedLeads) {
        const response = await fetch('/api/leads', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            company_name: lead.companyName,
            person_name: lead.personName,
            email: lead.email,
            phone: lead.phone,
            linkedin_profile_url: lead.linkedinProfileUrl,
            country: lead.country,
            status: lead.status
          })
        });

        if (response.ok) {
          const result = await response.json();
          setLeads(prevLeads => [result.data, ...prevLeads]);
        }
      }

        toast({
        title: "Import Successful",
        description: `${processedLeads.length} leads have been imported successfully.`,
        });
      setShowImport(false);
    } catch (error) {
      console.error('Error importing leads:', error);
        toast({
        title: "Import Failed",
        description: "Failed to import leads. Please check your file format.",
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
            <Button onClick={() => setIsAddLeadDialogOpen(true)}>
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
        <div className="max-w-2xl mx-auto">
          <CSVImport
            type="leads"
            onImport={handleImport}
            templateUrl="/templates/leads-template.csv"
          />
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
            <Button onClick={() => setIsAddLeadDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add First Lead
            </Button>
            <Button variant="outline" onClick={() => setShowImport(true)}>
              <Upload className="mr-2 h-4 w-4" /> Import CSV
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {leads.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              onLeadConverted={handleLeadConverted}
            />
          ))}
        </div>
      )}

      <AddLeadDialog
        open={isAddLeadDialogOpen}
        onOpenChange={setIsAddLeadDialogOpen}
        onLeadAdded={handleLeadAdded}
      />
    </div>
  );
}
