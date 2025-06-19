"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, BarChartBig, DollarSign, CalendarDays, Clock, Briefcase, AlertTriangle, CheckCircle2, Lightbulb, TrendingUp, Edit } from 'lucide-react';
import { format, parseISO, formatDistanceToNowStrict } from 'date-fns';
import { Progress } from '@/components/ui/progress';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { getOpportunityById, getAccountById, getUpdatesForOpportunity } from '@/lib/data';
import type { Opportunity, OpportunityForecast, Account, Update } from '@/types';
import { aiPoweredOpportunityForecasting } from '@/ai/flows/ai-powered-opportunity-forecasting';
import UpdateItem from '@/components/updates/UpdateItem';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const getStatusBadgeColorClasses = (status: Opportunity['status']): string => {
  switch (status) {
    case 'Need Analysis': return 'bg-sky-500/20 text-sky-700 border-sky-500/30';
    case 'Negotiation': return 'bg-amber-500/20 text-amber-700 border-amber-500/30';
    case 'In Progress': return 'bg-blue-500/20 text-blue-700 border-blue-500/30';
    case 'On Hold': return 'bg-slate-500/20 text-slate-700 border-slate-500/30';
    case 'Completed': return 'bg-green-500/20 text-green-700 border-green-500/30';
    case 'Cancelled': return 'bg-red-500/20 text-red-700 border-red-500/30';
    default: return 'bg-gray-500/20 text-gray-700 border-gray-500/30';
  }
};

const calculateProgress = (startDate: string, endDate: string, status: Opportunity['status']): number => {
  if (status === 'Completed') return 100;
  if (status === 'Cancelled') return 0;
  if (status === 'Need Analysis' && new Date() < parseISO(startDate)) return 0;

  const start = parseISO(startDate);
  const end = parseISO(endDate);
  const today = new Date();

  if (today < start) return 5;
  if (today >= end && status !== 'Completed') return 95;

  const totalDuration = end.getTime() - start.getTime();
  const elapsedDuration = today.getTime() - start.getTime();

  if (totalDuration <= 0) return status === 'In Progress' || status === 'Negotiation' || status === 'On Hold' ? 50 : 0;

  return Math.min(98, Math.max(5, (elapsedDuration / totalDuration) * 100));
};

export default function OpportunityDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [account, setAccount] = useState<Account | null>(null);
  const [forecast, setForecast] = useState<OpportunityForecast | null>(null);
  const [updates, setUpdates] = useState<Update[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState<Opportunity['status'] | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const statusOptions = [
    'Need Analysis',
    'Negotiation',
    'In Progress',
    'On Hold',
    'Completed',
    'Cancelled',
  ];

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const opportunityId = params.id as string;
        const opportunityData = getOpportunityById(opportunityId);
        
        if (!opportunityData) {
          router.push('/opportunities');
          return;
        }

        setOpportunity(opportunityData);
        setAccount(getAccountById(opportunityData.associated_account_id) || null);
        setUpdates(getUpdatesForOpportunity(opportunityId));

        if (opportunityData.status !== 'Completed' && opportunityData.status !== 'Cancelled') {
          const forecastData = await aiPoweredOpportunityForecasting({
            opportunityName: opportunityData.name,
            opportunityDescription: opportunityData.description,
            opportunityTimeline: `Start: ${format(parseISO(opportunityData.created_at), 'MMM dd, yyyy')}, End: ${format(parseISO(opportunityData.expected_close_date || opportunityData.created_at), 'MMM dd, yyyy')}`,
            opportunityValue: opportunityData.amount,
            opportunityStatus: opportunityData.status,
            recentUpdates: "Recent updates indicate steady progress.",
          });
          setForecast(forecastData);
        }
      } catch (error) {
        console.error('Error fetching opportunity details:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [params.id, router]);

  useEffect(() => {
    if (opportunity) setStatus(opportunity.status);
  }, [opportunity]);

  const handleStatusChange = async (newStatus: Opportunity['status']) => {
    if (!opportunity) return;
    setIsUpdatingStatus(true);
    try {
      const res = await fetch(`/api/opportunities/${opportunity.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setStatus(newStatus);
        setOpportunity({ ...opportunity, status: newStatus });
        setIsEditingStatus(false);
      } else {
        // Optionally handle error
      }
    } finally {
      setIsUpdatingStatus(false);
    }
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

  if (!opportunity) {
    return null;
  }

  const progress = calculateProgress(opportunity.created_at, opportunity.expected_close_date || opportunity.created_at, opportunity.status);
  const isAtRisk = forecast?.bottleneckIdentification && 
    forecast.bottleneckIdentification.toLowerCase() !== "none identified" && 
    forecast.bottleneckIdentification.toLowerCase() !== "none" && 
    forecast.bottleneckIdentification !== "Error fetching forecast.";

  const timeRemaining = (status: Opportunity['status']): string => {
    if (status === 'Completed' || status === 'Cancelled') return status;
    const end = parseISO(opportunity.expected_close_date || opportunity.created_at);
    const now = new Date();
    if (now > end) return `Overdue by ${formatDistanceToNowStrict(end, { addSuffix: false })}`;
    return `${formatDistanceToNowStrict(end, { addSuffix: false })} left`;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-2xl font-semibold">{opportunity.name}</h1>
        <div className="flex items-center gap-2">
          <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
          {isEditingStatus ? (
            <Select value={status || ''} onValueChange={handleStatusChange} disabled={isUpdatingStatus}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map(opt => (
                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <>
              <Badge variant="secondary" className={`capitalize ${getStatusBadgeColorClasses(status || (opportunity && opportunity.status))}`}>{status || (opportunity && opportunity.status)}</Badge>
              <Button variant="ghost" size="icon" onClick={() => setIsEditingStatus(true)} aria-label="Edit Status">
                <Edit className="h-4 w-4" />
              </Button>
            </>
          )}
          <span>{timeRemaining(status || (opportunity && opportunity.status))}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Opportunity Details */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChartBig className="mr-2 h-5 w-5 text-primary" />
              Opportunity Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Account</h3>
                <div className="flex items-center">
                  <Briefcase className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>{account?.name || 'Unknown Account'}</span>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Value</h3>
                <div className="flex items-center">
                  <DollarSign className="mr-2 h-4 w-4 text-green-600" />
                  <span>${opportunity.amount.toLocaleString()}</span>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Timeline</h3>
                <div className="flex items-center">
                  <CalendarDays className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>
                    {format(parseISO(opportunity.created_at), 'MMM dd, yyyy')} - {format(parseISO(opportunity.expected_close_date || opportunity.created_at), 'MMM dd, yyyy')}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Description</h3>
              <p className="text-sm text-muted-foreground">{opportunity.description}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Progress</h3>
              <Progress value={progress} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Progress: {Math.round(progress)}%</span>
                <div className="flex items-center gap-1">
                  {isAtRisk ? (
                    <>
                      <AlertTriangle className="h-3 w-3 text-destructive" />
                      <span>At Risk</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                      <span>On Track</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {forecast && opportunity.status !== 'Completed' && opportunity.status !== 'Cancelled' && (
              <div className="pt-4 border-t">
                <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center">
                  <Lightbulb className="mr-2 h-4 w-4 text-yellow-500" />
                  AI Forecast
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm">
                      <span className="font-medium">Est. Completion:</span>
                      <br />
                      <span className="text-muted-foreground">{forecast.completionDateEstimate}</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-sm">
                      <span className="font-medium">Revenue Forecast:</span>
                      <br />
                      <span className="text-muted-foreground">${forecast.revenueForecast.toLocaleString()}</span>
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm">
                      <span className="font-medium">Potential Bottlenecks:</span>
                      <br />
                      <span className="text-muted-foreground">{forecast.bottleneckIdentification || "None identified"}</span>
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Updates Section */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="mr-2 h-5 w-5 text-primary" />
              Updates
            </CardTitle>
            <CardDescription>Recent activity and updates for this opportunity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {updates.length > 0 ? (
                updates.map((update) => (
                  <Card key={update.id} className="w-full" isInner={true}>
                    <UpdateItem update={update} />
                  </Card>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-4">No updates available.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 