"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Briefcase, Users, Mail, Phone, Building2, CalendarDays, Clock, BarChartBig, MessageSquareHeart, Lightbulb, PlusCircle } from 'lucide-react';
import { format, parseISO, formatDistanceToNow } from 'date-fns';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { getOpportunitiesByAccount } from '@/lib/data';
import type { Account, Opportunity, DailyAccountSummary, Update } from '@/types';
import { generateDailyAccountSummary } from '@/ai/flows/daily-account-summary';
import OpportunityCard from '@/components/opportunities/OpportunityCard';
import AddOpportunityDialog from '@/components/opportunities/AddOpportunityDialog';
import { mockUpdates } from '@/lib/data'; // Import all updates

const getStatusBadgeColorClasses = (status: Account['status']): string => {
  switch (status) {
    case 'Active': return 'bg-green-500/20 text-green-700 border-green-500/30';
    case 'Inactive': return 'bg-slate-500/20 text-slate-700 border-slate-500/30';
    case 'Prospect': return 'bg-blue-500/20 text-blue-700 border-blue-500/30';
    default: return 'bg-gray-500/20 text-gray-700 border-gray-500/30';
  }
};

// Utility to summarize engagement/activity for an account
function summarizeAccountEngagement(updates: Update[]) {
  if (!updates || updates.length === 0) return 'No recent updates or engagement.';
  const now = new Date();
  const last14Days = updates.filter(u => (now - new Date(u.date)) / (1000 * 60 * 60 * 24) <= 14);
  const lastUpdate = updates[0];
  const lastUpdateDate = lastUpdate ? new Date(lastUpdate.date) : null;
  const daysSinceLast = lastUpdateDate ? Math.floor((now - lastUpdateDate) / (1000 * 60 * 60 * 24)) : null;
  let engagementTrend = '';
  if (daysSinceLast !== null && daysSinceLast > 7) {
    engagementTrend = `No client contact in ${daysSinceLast} days.`;
  } else if (last14Days.length >= 3) {
    engagementTrend = 'High engagement in the last 2 weeks.';
  } else if (last14Days.length === 0) {
    engagementTrend = 'No engagement in the last 2 weeks.';
  } else {
    engagementTrend = 'Moderate engagement.';
  }
  return `${last14Days.length} updates in the last 14 days. Last update: '${lastUpdate?.type || 'N/A'}' on ${lastUpdate ? lastUpdate.date.split('T')[0] : 'N/A'}. ${engagementTrend}`;
}

// Utility to aggregate key metrics for an account
function getAccountKeyMetrics(opportunities: Opportunity[]) {
  const openOpportunities = opportunities.filter(o => o.status !== 'Completed' && o.status !== 'Cancelled');
  const totalValue = openOpportunities.reduce((sum, o) => sum + (o.value || 0), 0);
  return `Open opportunities: ${openOpportunities.length}, Total open value: $${totalValue.toLocaleString()}`;
}

export default function AccountDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [account, setAccount] = useState<Account | null>(null);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [dailySummary, setDailySummary] = useState<DailyAccountSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [isAddOpportunityDialogOpen, setIsAddOpportunityDialogOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const accountId = params.id as string;
        const response = await fetch(`/api/accounts/${accountId}`);
        if (!response.ok) {
          if (response.status === 404) {
          router.push('/accounts');
          return;
        }
          throw new Error('Failed to fetch account details');
        }
        const result = await response.json();
        // Transform the API response to match the Account interface
        const accountData: Account = {
          id: result.data.id,
          name: result.data.name,
          type: result.data.type,
          status: result.data.status,
          description: result.data.description,
          contactEmail: result.data.contact_email,
          industry: result.data.industry,
          contactPersonName: result.data.contact_person_name,
          contactPhone: result.data.contact_phone,
          convertedFromLeadId: result.data.converted_from_lead_id,
          opportunityIds: [],
          createdAt: result.data.created_at,
          updatedAt: result.data.updated_at,
        };
        setAccount(accountData);
        const accountOpportunities = getOpportunitiesByAccount(accountId);
        setOpportunities(accountOpportunities);
        // Get all updates for this account
        const accountUpdates = mockUpdates.filter(u => u.accountId === accountId);
        const engagementSummary = summarizeAccountEngagement(accountUpdates);
        const keyMetrics = getAccountKeyMetrics(accountOpportunities);
        if (accountData.status === 'Active') {
          setIsLoadingSummary(true);
          try {
            const summary = await generateDailyAccountSummary({
              accountId: accountData.id,
              accountName: accountData.name,
              recentUpdates: engagementSummary,
              keyMetrics,
            });
            setDailySummary(summary);
          } catch (error) {
            console.error('Error generating account summary:', error);
          } finally {
            setIsLoadingSummary(false);
          }
        }
      } catch (error) {
        console.error('Error fetching account details:', error);
        router.push('/accounts');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [params.id, router]);

  const handleOpportunityAdded = (newOpportunity: Opportunity) => {
    setOpportunities(prev => [...prev, newOpportunity]);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-[60vh]">
          <LoadingSpinner size={32} />
        </div>
      </div>
    );
  }

  if (!account) {
    return null;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-2xl font-semibold">{account.name}</h1>
        <Badge variant="secondary" className={`capitalize ${getStatusBadgeColorClasses(account.status)}`}>
          {account.status}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Account Details */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building2 className="mr-2 h-5 w-5 text-primary" />
              Account Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {account.contactPersonName && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Contact Person</h3>
                  <div className="flex items-center">
                    <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>{account.contactPersonName}</span>
                  </div>
                </div>
              )}
              {account.contactEmail && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Contact Email</h3>
                  <div className="flex items-center">
                    <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
                    <a href={`mailto:${account.contactEmail}`} className="hover:text-primary hover:underline">
                      {account.contactEmail}
                    </a>
                  </div>
                </div>
              )}
              {account.contactPhone && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Contact Phone</h3>
                  <div className="flex items-center">
                    <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
                    <a href={`tel:${account.contactPhone}`} className="hover:text-primary hover:underline">
                      {account.contactPhone}
                    </a>
                  </div>
                </div>
              )}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Created</h3>
                <div className="flex items-center">
                  <CalendarDays className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>{formatDistanceToNow(parseISO(account.createdAt), { addSuffix: true })}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Description</h3>
              <p className="text-sm text-muted-foreground">{account.description}</p>
            </div>

            {account.status === 'Active' && (
              <div className="pt-4 border-t">
                <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center">
                  <Lightbulb className="mr-2 h-4 w-4 text-yellow-500" />
                  AI Daily Brief
                </h3>
                {isLoadingSummary ? (
                  <div className="flex items-center space-x-2 h-10">
                    <LoadingSpinner size={16} />
                    <span className="text-xs text-muted-foreground">Generating brief...</span>
                  </div>
                ) : dailySummary ? (
                  <div className="space-y-1">
                    <p className="text-sm text-foreground decoration-none">{dailySummary.summary}</p>
                    <div className="flex items-center text-sm">
                      <MessageSquareHeart className="mr-1.5 h-4 w-4 text-pink-500" />
                      <span className="font-medium text-foreground">Health:</span>&nbsp;
                      <span className="text-muted-foreground">{dailySummary.relationshipHealth}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No AI brief available for this account.</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Opportunities Section */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <BarChartBig className="mr-2 h-5 w-5 text-primary" />
                Opportunities
              </CardTitle>
              <Button size="sm" onClick={() => setIsAddOpportunityDialogOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                New
              </Button>
            </div>
            <CardDescription>Active opportunities for this account</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {opportunities.length > 0 ? (
                opportunities.map((opportunity) => (
                  <OpportunityCard key={opportunity.id} opportunity={opportunity} />
                ))
              ) : (
                <p className="text-muted-foreground text-center py-4">No opportunities available.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <AddOpportunityDialog
        open={isAddOpportunityDialogOpen}
        onOpenChange={setIsAddOpportunityDialogOpen}
        onOpportunityAdded={handleOpportunityAdded}
        initialAccountId={account.id}
        accounts={[{ id: account.id, name: account.name, type: account.type }]}
      />
    </div>
  );
} 