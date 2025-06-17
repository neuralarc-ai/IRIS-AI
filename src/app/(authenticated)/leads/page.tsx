"use client";

import React, { useState, useEffect } from 'react';
import PageTitle from '@/components/common/PageTitle';
import LeadCard from '@/components/leads/LeadCard';
import { mockLeads as initialMockLeads, addLead } from '@/lib/data';
import type { Lead, LeadStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { PlusCircle, Search, ListFilter, FileUp, Plus, Upload, CheckCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AddLeadDialog from '@/components/leads/AddLeadDialog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import CSVImport from '@/components/common/CSVImport';

const leadStatusOptions: LeadStatus[] = ["New", "Contacted", "Qualified", "Proposal Sent", "Converted to Account", "Lost"];

export default function LeadsPage() {
  console.log('🔄 LeadsPage component rendered');
  
  const [leads, setLeads] = useState<Lead[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all');
  const [isAddLeadDialogOpen, setIsAddLeadDialogOpen] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const { toast } = useToast();

  console.log('🔄 LeadsPage state:', { 
    leadsCount: leads.length, 
    searchTerm, 
    statusFilter, 
    isAddLeadDialogOpen, 
    showImport
  });

  useEffect(() => {
    console.log('🔄 LeadsPage useEffect - setting initial leads');
    setLeads([...initialMockLeads].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));
  }, []);


  const filteredLeads = leads.filter(lead => {
    const searchTermLower = searchTerm.toLowerCase();
    const matchesSearch =
      lead.companyName.toLowerCase().includes(searchTermLower) ||
      lead.personName.toLowerCase().includes(searchTermLower) ||
      (lead.email && lead.email.toLowerCase().includes(searchTermLower)) ||
      (lead.country && lead.country.toLowerCase().includes(searchTermLower));
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  }); // Sorting is now done in useEffect and after add/convert

  const handleLeadAdded = (newLead: Lead) => {
    setLeads(prevLeads => [newLead, ...prevLeads].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));
  };

  const handleLeadConverted = (convertedLeadId: string) => {
    setLeads(prevLeads =>
      prevLeads.map(lead =>
        lead.id === convertedLeadId ? { ...lead, status: 'Converted to Account' as LeadStatus, updatedAt: new Date().toISOString() } : lead
      ).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    );
  };

  const handleImport = async (data: any[]) => {
    console.log('🔄 LeadsPage: handleImport triggered');
    console.log('📊 Received data from CSVImport:', data);
    console.log('📊 Data length:', data.length);
    console.log('📊 Sample data item:', data[0]);
    
    if (data.length > 0) {
        console.log('✅ Valid data received, processing leads...');
        
        const newLeadsToAdd: Lead[] = data.map((row, index) => {
            console.log(`🔍 Processing row ${index}:`, row);
            console.log(`🔍 Row ${index} all available fields:`, Object.keys(row));
            
            // Find email field with various possible names (case-insensitive)
            const possibleEmailFields = ['email', 'Email', 'EMAIL', 'e-mail', 'e_mail', 'email_address', 'emailAddress', 'contact_email', 'contactEmail'];
            let emailValue = null;
            
            // Find the email field (case-insensitive)
            for (const fieldName of possibleEmailFields) {
              if (row.hasOwnProperty(fieldName)) {
                emailValue = row[fieldName];
                console.log(`🔍 Row ${index} email found with field name: ${fieldName}`);
                break;
              }
            }
            
            // Also check all fields for any that contain 'email' (case-insensitive)
            if (!emailValue) {
              for (const [key, value] of Object.entries(row)) {
                if (key.toLowerCase().includes('email')) {
                  emailValue = value;
                  console.log(`🔍 Row ${index} email found with partial match: ${key}`);
                  break;
                }
              }
            }
            
            // Extract company name with flexible case matching
            let companyName = 'N/A';
            const companyFields = ['companyName', 'company_name', 'Company', 'company', 'CompanyName', 'COMPANY', 'COMPANY_NAME'];
            
            for (const field of companyFields) {
              if (row.hasOwnProperty(field) && row[field] && row[field].toString().trim() !== '') {
                companyName = row[field].toString().trim();
                console.log(`🔍 Row ${index} company name found with field: ${field}`);
                break;
              }
            }
            
            // Also check for partial matches
            if (companyName === 'N/A') {
              for (const [key, value] of Object.entries(row)) {
                if (key.toLowerCase().includes('company') && value && value.toString().trim() !== '') {
                  companyName = value.toString().trim();
                  console.log(`🔍 Row ${index} company name found with partial match: ${key}`);
                  break;
                }
              }
            }
            
            console.log(`🔍 Row ${index} company name mapping:`, {
              'available fields': Object.keys(row),
              'final result': companyName
            });
            
            // Extract person name with flexible case matching
            let personName = 'N/A';
            const personFields = ['personName', 'person_name', 'name', 'Name', 'fullName', 'full_name', 'PersonName', 'PERSON_NAME', 'NAME', 'FULL_NAME'];
            
            for (const field of personFields) {
              if (row.hasOwnProperty(field) && row[field] && row[field].toString().trim() !== '') {
                personName = row[field].toString().trim();
                console.log(`🔍 Row ${index} person name found with field: ${field}`);
                break;
              }
            }
            
            // Also check for partial matches
            if (personName === 'N/A') {
              for (const [key, value] of Object.entries(row)) {
                if ((key.toLowerCase().includes('name') || key.toLowerCase().includes('person')) && value && value.toString().trim() !== '') {
                  personName = value.toString().trim();
                  console.log(`🔍 Row ${index} person name found with partial match: ${key}`);
                  break;
                }
              }
            }
            
            console.log(`🔍 Row ${index} person name mapping:`, {
              'available fields': Object.keys(row),
              'final result': personName
            });
            
            const newLead = {
                id: `lead-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                companyName: companyName,
                personName: personName,
                email: emailValue,
                phone: row.phone || row.Phone || row.telephone || row.contact || null,
                linkedinProfileUrl: row.linkedinProfileUrl || row.linkedin || row.linkedin_url || row.linkedinUrl || null,
                country: row.country || row.Country || row.location || row.Location || null,
                status: 'New', // Default status for imported leads
                opportunityIds: [],
                updateIds: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            } as Lead;
            
            console.log(`✅ Created new lead ${index}:`, newLead);
            return newLead;
        });

        console.log('📊 New leads to add:', newLeadsToAdd);

        // Add new leads to the mock data and update state
        console.log('🔍 Adding leads to mock data...');
        newLeadsToAdd.forEach((lead, index) => {
            console.log(`Adding lead ${index} to mock data:`, lead.id);
            addLead(lead);
        });

        console.log('🔄 Updating leads state...');
        setLeads(prevLeads => {
            const updatedLeads = [...newLeadsToAdd, ...prevLeads].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
            console.log('📊 Updated leads count:', updatedLeads.length);
            return updatedLeads;
        });
        
        console.log('📢 Showing success toast');
        toast({
            title: "Leads Imported!",
            description: `${newLeadsToAdd.length} new leads have been added.`, 
            variant: "default"
        });
    } else {
        console.log('❌ No valid data received, showing error toast');
        toast({
            title: "No valid data",
            description: "No valid rows found in the CSV after validation.",
            variant: "destructive"
        });
    }
    
    setShowImport(false); // Hide the import component after processing
    console.log('✅ Import component hidden');
  };

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

      <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 ">
         <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center">
                <ListFilter className="mr-2 h-5 w-5 text-primary"/> Filter & Search Leads
            </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div>
              <Label htmlFor="search-leads">Search Leads</Label>
               <div className="relative mt-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    id="search-leads"
                    type="text"
                    placeholder="Search by company, name, email, country..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="status-filter">Status</Label>
              <Select value={statusFilter} onValueChange={(value: LeadStatus | 'all') => setStatusFilter(value)}>
                <SelectTrigger id="status-filter" className="w-full mt-1">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {leadStatusOptions.map(status => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {filteredLeads.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-8">
          {filteredLeads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} onLeadConverted={handleLeadConverted} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <Search className="mx-auto h-16 w-16 text-muted-foreground/50 mb-6" />
          <p className="text-xl font-semibold text-foreground mb-2">No Leads Found</p>
          <p className="text-muted-foreground">Try adjusting your search or filter criteria, or add a new lead.</p>
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
