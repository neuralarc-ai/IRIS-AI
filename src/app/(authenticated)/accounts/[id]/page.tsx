"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Briefcase, Users, Mail, Phone, Building2, CalendarDays, Clock, BarChartBig, MessageSquareHeart, Lightbulb, PlusCircle } from 'lucide-react';
import { format, parseISO, formatDistanceToNow } from 'date-fns';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { getAccountById, getOpportunitiesByAccount } from '@/lib/data';
import type { Account, Opportunity, DailyAccountSummary } from '@/types';
import { generateDailyAccountSummary } from '@/ai/flows/daily-account-summary';
import OpportunityCard from '@/components/opportunities/OpportunityCard';
import AddOpportunityDialog from '@/components/opportunities/AddOpportunityDialog';

const getStatusBadgeColorClasses = (status: Account['status']): string => {
  switch (status) {
    case 'Active': return 'bg-green-500/20 text-green-700 border-green-500/30';
    case 'Inactive': return 'bg-slate-500/20 text-slate-700 border-slate-500/30';
    case 'Prospect': return 'bg-blue-500/20 text-blue-700 border-blue-500/30';
    default: return 'bg-gray-500/20 text-gray-700 border-gray-500/30';
  }
};

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
        const accountData = getAccountById(accountId);
        
        if (!accountData) {
          router.push('/accounts');
          return;
        }

        setAccount(accountData);
        setOpportunities(getOpportunitiesByAccount(accountId));

        if (accountData.status === 'Active') {
          setIsLoadingSummary(true);
          try {
            const summary = await generateDailyAccountSummary({
              accountName: accountData.name,
              accountStatus: accountData.status,
              recentUpdates: "Recent updates indicate steady progress.",
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
                    <p className="text-sm text-foreground">{dailySummary.summary}</p>
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