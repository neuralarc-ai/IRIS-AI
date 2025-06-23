"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, User, Users, Mail, Phone, Building2, CalendarDays, Clock, Linkedin, MapPin, CheckSquare, FileWarning } from 'lucide-react';
import { format, parseISO, formatDistanceToNow } from 'date-fns';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import type { Lead, Update } from '@/types';
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User as UserIcon } from 'lucide-react';
import UpdateItem from '@/components/updates/UpdateItem';
import AddUpdateDialog from '@/components/updates/AddUpdateDialog';

const getStatusBadgeColorClasses = (status: Lead['status']): string => {
  switch (status) {
    case 'New': return 'bg-blue-500/20 text-blue-700 border-blue-500/30';
    case 'Contacted': return 'bg-amber-500/20 text-amber-700 border-amber-500/30';
    case 'Qualified': return 'bg-green-500/20 text-green-700 border-green-500/30';
    case 'Proposal Sent': return 'bg-purple-500/20 text-purple-700 border-purple-500/30';
    case 'Converted to Account': return 'bg-emerald-500/20 text-emerald-700 border-emerald-500/30';
    case 'Lost': return 'bg-red-500/20 text-red-700 border-red-500/30';
    default: return 'bg-gray-500/20 text-gray-700 border-gray-500/30';
  }
};

export default function LeadDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [lead, setLead] = useState<Lead | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConverting, setIsConverting] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [assignLoading, setAssignLoading] = useState(false);

  // Fetch updates for this lead
  const [leadUpdates, setLeadUpdates] = useState<Update[]>([]);
  const [isLoadingUpdates, setIsLoadingUpdates] = useState(true);
  const [isAddUpdateDialogOpen, setIsAddUpdateDialogOpen] = useState(false);

  useEffect(() => {
    const fetchLeadUpdates = async () => {
      setIsLoadingUpdates(true);
      try {
        const response = await fetch(`/api/updates?lead_id=${params.id}`);
        const result = await response.json();
        setLeadUpdates(
          (result.data || []).map((u: any) => ({
            id: u.id,
            opportunityId: u.opportunity_id,
            leadId: u.lead_id,
            accountId: u.account_id,
            date: u.date,
            content: u.content,
            type: u.type,
            createdAt: u.created_at,
            updatedByUserId: u.updated_by_user_id,
            opportunity: u.opportunity,
            account: u.account,
            updatedByUser: u.user,
          }))
        );
      } catch (error) {
        console.error('Error fetching lead updates:', error);
      } finally {
        setIsLoadingUpdates(false);
      }
    };
    if (params.id) {
      fetchLeadUpdates();
    }
  }, [params.id]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const leadId = params.id as string;
        const response = await fetch(`/api/leads/${leadId}`);
        
        if (!response.ok) {
          if (response.status === 404) {
          router.push('/leads');
          return;
        }
          throw new Error('Failed to fetch lead details');
        }
        
        const result = await response.json();
        
        // Transform the API response to match the Lead interface
        const leadData: Lead = {
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

        setLead(leadData);
        // Fetch users for assignment
        const usersRes = await fetch('/api/users');
        const usersJson = await usersRes.json();
        setUsers(usersJson.data || []);
      } catch (error) {
        console.error('Error fetching lead details:', error);
        router.push('/leads');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [params.id, router]);

  const handleConvertLead = async () => {
    if (!lead) return;

    setIsConverting(true);
    try {
      const response = await fetch(`/api/leads/${lead.id}/convert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notes: 'Converted via lead details page'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to convert lead');
      }

      const result = await response.json();
      
      toast({
        title: "Lead Converted",
        description: "The lead has been successfully converted to an account.",
      });
      
      router.push(`/accounts/${result.data.account.id}`);
    } catch (error) {
      console.error('Error converting lead:', error);
      toast({
        title: "Conversion Failed",
        description: error instanceof Error ? error.message : "There was an error converting the lead to an account.",
        variant: "destructive",
      });
    } finally {
      setIsConverting(false);
    }
  };

  const handleAssignUser = async (userId: string) => {
    if (!lead) return;
    setAssignLoading(true);
    try {
      const response = await fetch(`/api/leads/${lead.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assigned_user_id: userId })
      });
      if (!response.ok) throw new Error('Failed to assign user');
      const result = await response.json();
      setLead((prev) => prev ? { ...prev, assigned_user_id: userId } : prev);
      toast({ title: 'Lead Assigned', description: 'Lead has been assigned successfully.' });
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to assign user.', variant: 'destructive' });
    } finally {
      setAssignLoading(false);
    }
  };

  const canConvert = lead && lead.status !== 'Lost' && lead.status !== 'Converted to Account';

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-[60vh]">
          <LoadingSpinner size={32} />
        </div>
      </div>
    );
  }

  if (!lead) {
    return null;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-2xl font-semibold">{lead.companyName}</h1>
        <Badge variant="secondary" className={`capitalize ${getStatusBadgeColorClasses(lead.status)}`}>
          {lead.status}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Lead Details */}
        <Card className="lg:col-span-2" style={{ backgroundColor: "#FFFFFF" }}>
          <CardHeader>
            <CardTitle className="flex items-center" style={{ color: "rgb(151, 168, 140)" }}>
              <Building2 className="mr-2 h-5 w-5" style={{ color: "rgb(151, 168, 140)" }} />
              Lead Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Contact Person</h3>
                <div className="flex items-center">
                  <User className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>{lead.personName}</span>
                </div>
              </div>
              {lead.email && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Email</h3>
                  <div className="flex items-center">
                    <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
                    <a href={`mailto:${lead.email}`} className="hover:text-primary hover:underline">
                      {lead.email}
                    </a>
                  </div>
                </div>
              )}
              {lead.phone && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Phone</h3>
                  <div className="flex items-center">
                    <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
                    <a href={`tel:${lead.phone}`} className="hover:text-primary hover:underline">
                      {lead.phone}
                    </a>
                  </div>
                </div>
              )}
              {lead.linkedinProfileUrl && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">LinkedIn</h3>
                  <div className="flex items-center">
                    <Linkedin className="mr-2 h-4 w-4 text-muted-foreground" />
                    <a 
                      href={lead.linkedinProfileUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="hover:text-primary hover:underline truncate"
                    >
                      {lead.linkedinProfileUrl.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, '').replace(/\/$/, '')}
                    </a>
                  </div>
                </div>
              )}
              {lead.country && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Country</h3>
                  <div className="flex items-center">
                    <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>{lead.country}</span>
                  </div>
                </div>
              )}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Created</h3>
                <div className="flex items-center">
                  <CalendarDays className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>{formatDistanceToNow(parseISO(lead.createdAt), { addSuffix: true })}</span>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Last Updated</h3>
                <div className="flex items-center">
                  <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>{formatDistanceToNow(parseISO(lead.updatedAt), { addSuffix: true })}</span>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="pt-4 border-t">
            {canConvert ? (
              <Button 
                size="sm" 
                onClick={handleConvertLead}
                disabled={isConverting}
                className="w-full"
              >
                {isConverting ? (
                  <>
                    <LoadingSpinner size={16} className="mr-2" />
                    Converting...
                  </>
                ) : (
                  <>
                    <CheckSquare className="mr-2 h-4 w-4" />
                    Convert to Account
                  </>
                )}
              </Button>
            ) : (
              <Button 
                size="sm" 
                variant="outline" 
                disabled 
                className="w-full"
              >
                {lead.status === "Lost" ? (
                  <>
                    <FileWarning className="mr-2 h-4 w-4" />
                    Lost Lead
                  </>
                ) : (
                  <>
                    <CheckSquare className="mr-2 h-4 w-4" />
                    Already Converted
                  </>
                )}
              </Button>
            )}
          </CardFooter>
        </Card>

        {/* Additional Information */}
        <Card className="lg:col-span-1" style={{ backgroundColor: "#FFFFFF" }}>
          <CardHeader>
            <CardTitle className="flex items-center" style={{ color: "rgb(151, 168, 140)" }}>
              <Users className="mr-2 h-5 w-5" style={{ color: "rgb(151, 168, 140)" }} />
              Additional Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Assigned To</h3>
                <div className="flex items-center gap-2">
                  <UserIcon className="h-4 w-4 text-muted-foreground" />
                  <Select
                    value={lead.assigned_user_id || ''}
                    onValueChange={handleAssignUser}
                    disabled={assignLoading || users.length === 0}
                  >
                    <SelectTrigger className="w-full bg-[#E2D4C3]/60">
                      <SelectValue placeholder={users.length === 0 ? 'No users' : 'Assign user'} />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>{user.name} ({user.email})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">LinkedIn Profile</h3>
                <p className="text-sm">{lead.linkedinProfileUrl ? 'Available' : 'Not provided'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Country</h3>
                <p className="text-sm">{lead.country || 'Not specified'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Opportunities</h3>
                <p className="text-sm">{lead.opportunityIds?.length || 0} associated</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lead Updates Section */}
      <Button onClick={() => setIsAddUpdateDialogOpen(true)} variant="beige" className="mb-4">
        Log Update
      </Button>
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Lead Updates</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingUpdates ? (
            <LoadingSpinner size={24} />
          ) : leadUpdates.length === 0 ? (
            <p className="text-muted-foreground">No updates for this lead yet.</p>
          ) : (
            <div className="space-y-4">
              {leadUpdates.map(update => (
                <UpdateItem key={update.id} update={update} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      <AddUpdateDialog
        open={isAddUpdateDialogOpen}
        onOpenChange={setIsAddUpdateDialogOpen}
        onUpdateAdded={fetchLeadUpdates}
      />
    </div>
  );
} 