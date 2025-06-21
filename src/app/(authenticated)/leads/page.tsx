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
import LeadsListWithFilter from '@/components/leads/LeadsListWithFilter';
import { useAuth } from "@/hooks/use-auth";

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddLeadDialogOpen, setIsAddLeadDialogOpen] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const { toast } = useToast();
  const { user, isAdmin, isLoading: authLoading } = useAuth();

  // Fetch leads from Supabase
  const fetchLeads = async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      const response = await fetch('/api/leads', {
        headers: {
          'x-user-id': user.id,
          'x-user-admin': isAdmin() ? 'true' : 'false',
        },
      });
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
    if (!authLoading && user) {
      fetchLeads();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user]);

  const handleLeadAdded = (newLead: Lead) => {
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
      if (!user) {
        console.error('❌ No user found for import');
        toast({
          title: "Import Failed",
          description: "User not authenticated. Please log in again.",
          variant: "destructive",
        });
        return;
      }
      
      console.log('🔄 Starting CSV import process...');
      console.log('📊 Imported data:', importedData);
      console.log('👤 Current user:', user);
      
      if (!importedData || importedData.length === 0) {
        console.error('❌ No data to import');
        toast({
          title: "Import Failed",
          description: "No valid data found in the CSV file.",
          variant: "destructive",
        });
        return;
      }
      
      // Process imported data and add to leads
      const processedLeads = importedData.map((item, index) => {
        const processed = {
          companyName: item.company_name || item.companyName || item['Company Name'] || '',
          personName: item.person_name || item.personName || item['Person Name'] || item['Contact Name'] || '',
          email: item.email || item.Email || item['Email Address'] || '',
          phone: item.phone || item.Phone || item['Phone Number'] || '',
          linkedinProfileUrl: item.linkedin_profile_url || item.linkedinProfileUrl || item['LinkedIn Profile'] || item['LinkedIn URL'] || '',
          country: item.country || item.Country || '',
          status: 'New' as const,
        };
        
        console.log(`🔄 Processed lead ${index}:`, processed);
        return processed;
      });

      console.log('🔄 All processed leads:', processedLeads);

      // Validate that we have required fields
      const invalidLeads = processedLeads.filter(lead => !lead.companyName || !lead.personName || !lead.email);
      if (invalidLeads.length > 0) {
        console.error('❌ Invalid leads found:', invalidLeads);
        toast({
          title: "Import Failed",
          description: `${invalidLeads.length} leads are missing required fields (company name, person name, or email).`,
          variant: "destructive",
        });
        return;
      }

      // Add each imported lead via API
      const newLeads: Lead[] = [];
      
      for (let i = 0; i < processedLeads.length; i++) {
        const leadData = processedLeads[i];
        console.log(`🔄 Creating lead ${i + 1}/${processedLeads.length}:`, leadData);
        
        const requestBody = {
          company_name: leadData.companyName,
          person_name: leadData.personName,
          email: leadData.email,
          phone: leadData.phone,
          linkedin_profile_url: leadData.linkedinProfileUrl,
          country: leadData.country,
          status: leadData.status,
          created_by_user_id: user.id,
        };
        
        console.log('📤 API request body:', requestBody);
        
        try {
          const response = await fetch('/api/leads', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
          });

          console.log('📥 API response status:', response.status);

          if (response.ok) {
            const result = await response.json();
            console.log('✅ Lead created successfully:', result);
            
            // Transform the API response to match the Lead interface
            const newLead: Lead = {
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
            };
            
            console.log('🔄 Transformed lead:', newLead);
            newLeads.push(newLead);
          } else {
            const errorData = await response.json();
            console.error('❌ Failed to create lead:', errorData);
            throw new Error(`Failed to create lead: ${errorData.error || 'Unknown error'}`);
          }
        } catch (error) {
          console.error(`❌ Error creating lead ${i + 1}:`, error);
          throw error;
        }
      }

      console.log('🔄 All leads created, updating state...');
      console.log('📊 New leads to add:', newLeads);
      console.log('📊 Current leads count:', leads.length);

      // Update local state with all new leads
      setLeads(prevLeads => {
        const updatedLeads = [...newLeads, ...prevLeads];
        console.log('🔄 Updated leads state:', updatedLeads);
        return updatedLeads;
      });

      console.log('✅ State updated successfully');

      toast({
        title: "Import Successful",
        description: `${newLeads.length} leads have been imported successfully.`,
      });
      
      setShowImport(false);
    } catch (error) {
      console.error('❌ Error importing leads:', error);
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Failed to import leads. Please check your file format.",
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
            <Button onClick={() => setIsAddLeadDialogOpen(true)} variant="beige">
              <PlusCircle className="mr-2 h-4 w-4" /> Add First Lead
            </Button>
            <Button variant="outline" onClick={() => setShowImport(true)}>
              <Upload className="mr-2 h-4 w-4" /> Import CSV
            </Button>
          </div>
        </div>
      ) : (
        <LeadsListWithFilter
          leads={leads.filter(lead => lead.status !== 'Converted to Account')}
          onLeadConverted={handleLeadConverted}
          onLeadAdded={handleLeadAdded}
        />
      )}

      {user && (
        <AddLeadDialog
          open={isAddLeadDialogOpen}
          onOpenChange={setIsAddLeadDialogOpen}
          onLeadAdded={handleLeadAdded}
          user={user}
        />
      )}
    </div>
  );
}
