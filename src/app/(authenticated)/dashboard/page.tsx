"use client";

import React, { useState, useEffect, useMemo } from 'react';
import PageTitle from '@/components/common/PageTitle';
import { Button } from '@/components/ui/button';
import { RefreshCw, TrendingUp, Users, AlertTriangle, Lightbulb, BarChartHorizontalBig, CalendarClock, DollarSign, AlertCircle, CheckCircle, History } from 'lucide-react';
import { aiPoweredOpportunityForecasting } from '@/ai/flows/ai-powered-opportunity-forecasting';
import { mockOpportunities, mockLeads, getRecentUpdates } from '@/lib/data';
import type { Opportunity, OpportunityForecast, Lead, OpportunityStatus, Update } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, parseISO } from 'date-fns';
import UpdateItem from '@/components/updates/UpdateItem';

interface OpportunityWithForecast extends Opportunity {
  forecast?: OpportunityForecast;
}

const getStatusBadgeVariant = (status: OpportunityStatus | undefined): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case 'Need Analysis': return 'outline';
    case 'Negotiation': return 'secondary';
    case 'In Progress': return 'default';
    case 'Completed': return 'default';
    case 'On Hold': return 'secondary';
    case 'Cancelled': return 'destructive';
    default: return 'secondary';
  }
};


export default function DashboardPage() {
  const [forecastedOpportunities, setForecastedOpportunities] = useState<OpportunityWithForecast[]>([]);
  const [overallSalesForecast, setOverallSalesForecast] = useState<string | null>(null);
  const [recentUpdates, setRecentUpdates] = useState<Update[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const activeOpportunities = mockOpportunities.filter(
        opp => opp.status !== 'Completed' && opp.status !== 'Cancelled'
      ).slice(0, 2); 

      const forecastPromises = activeOpportunities.map(async (opp) => {
        try {
          const forecast = await aiPoweredOpportunityForecasting({
            opportunityName: opp.name,
            opportunityDescription: opp.description,
            opportunityTimeline: `Start: ${format(parseISO(opp.startDate), 'MMM dd, yyyy')}, End: ${format(parseISO(opp.endDate), 'MMM dd, yyyy')}`,
            opportunityValue: opp.value,
            opportunityStatus: opp.status,
            recentUpdates: "Recent updates indicate steady progress and positive client feedback.",
          });
          return { ...opp, forecast };
        } catch (e) {
          console.error(`Failed to get forecast for ${opp.name}`, e);
          return { ...opp, forecast: undefined };
        }
      });

      const results = await Promise.all(forecastPromises);
      setForecastedOpportunities(results);

      if (results.length > 0) {
        setOverallSalesForecast(`Optimistic outlook for next quarter with strong potential from key deals like ${results[0]?.name}. Predicted revenue growth is positive, with several opportunities nearing completion.`);
      } else {
        setOverallSalesForecast("No active opportunities to forecast. Add new opportunities to see AI-powered sales predictions.");
      }
      
      setRecentUpdates(getRecentUpdates(2)); 
      setLastRefreshed(new Date());
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      setOverallSalesForecast("Error fetching sales forecast data.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const opportunityStatusData = useMemo(() => {
    const counts: Record<OpportunityStatus, number> = {
      "Need Analysis": 0, "Negotiation": 0, "In Progress": 0,
      "On Hold": 0, "Completed": 0, "Cancelled": 0,
    };
    mockOpportunities.forEach(opp => { counts[opp.status]++; });
    return Object.entries(counts).map(([name, value]) => ({ name, count: value })).filter(item => item.count > 0);
  }, []);

  return (
    <div className="container mx-auto p-6 mt-6">
      <div className="mb-6">
        <PageTitle 
          title="Dashboard" 
          subtitle={lastRefreshed ? `Last updated: ${format(lastRefreshed, 'MMM dd, yyyy HH:mm')}` : 'Loading...'} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Forecast Card */}
        <Card className="lg:col-span-3" gradient="green" bgImage="/D9613D0C-A55A-4CBD-8C94-00112661A0CB.svg">
          <CardHeader>
            <CardTitle className="text-xl flex items-center">
              <TrendingUp className="mr-3 h-6 w-6 text-primary" />
              AI Sales Forecast Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading && !overallSalesForecast ? (
              <div className="h-10 bg-muted/50 rounded animate-pulse w-3/4"></div>
            ) : (
              <p className="text-foreground text-base leading-relaxed">{overallSalesForecast || "No forecast available."}</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity Stream */}
        <Card className="lg:col-span-2" gradient="gray" bgImage="/D9363D0C-A55A-4CBD-8C94-00112661A0CB.svg">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold flex items-center text-foreground">
              <History className="mr-3 h-6 w-6 text-blue-500" />
              Recent Activity Stream
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {isLoading && recentUpdates.length === 0 ? (
                Array.from({ length: 2 }).map((_, i) => (
                  <Card key={`update-skeleton-${i}`} className="h-full" isInner={true}>
                    <CardHeader><div className="h-5 bg-muted/50 rounded w-1/2"></div></CardHeader>
                    <CardContent className="space-y-2">
                      <div className="h-4 bg-muted/50 rounded w-full"></div>
                      <div className="h-4 bg-muted/50 rounded w-3/4"></div>
                    </CardContent>
                  </Card>
                ))
              ) : recentUpdates.length > 0 ? (
                recentUpdates.map((update, index) => (
                  <Card key={update.id} className="h-full" isInner={true}>
                    <UpdateItem update={update} />
                  </Card>
                ))
              ) : (
                !isLoading && <p className="text-muted-foreground text-center py-4 md:col-span-2">No recent updates found.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Key Opportunity Insights */}
        <Card className="lg:col-span-1" gradient="neutral" bgImage="/2.svg">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold flex items-center text-foreground">
              <Lightbulb className="mr-3 h-6 w-6 text-yellow-500" />
              Key Opportunity Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-6">
              {isLoading && forecastedOpportunities.length === 0 ? (
                Array.from({ length: 2 }).map((_, i) => (
                  <Card key={i} className="h-full" isInner={true}>
                    <CardHeader>
                      <div className="h-6 bg-muted/50 rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-muted/50 rounded w-1/2"></div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="h-4 bg-muted/50 rounded w-full"></div>
                      <div className="h-4 bg-muted/50 rounded w-5/6"></div>
                    </CardContent>
                  </Card>
                ))
              ) : forecastedOpportunities.length > 0 ? (
                forecastedOpportunities.map((opp) => (
                  <Card key={opp.id} className="h-full" isInner={true}>
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{opp.name}</CardTitle>
                        <Badge variant={getStatusBadgeVariant(opp.status)}>
                          {opp.status}
                        </Badge>
                      </div>
                      <CardDescription className="flex items-center text-sm pt-1">
                        <DollarSign className="mr-1 h-4 w-4 text-muted-foreground" />
                        Value: ${opp.value.toLocaleString()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      {opp.forecast ? (
                        <>
                          <div className="flex items-center">
                            <CalendarClock className="mr-2 h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">Est. Completion:</span>
                            <span className="ml-1 text-muted-foreground">{opp.forecast.completionDateEstimate}</span>
                          </div>
                          <div className="flex items-center">
                            <TrendingUp className="mr-2 h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">Revenue Forecast:</span>
                            <span className="ml-1 text-muted-foreground">${opp.forecast.revenueForecast.toLocaleString()}</span>
                          </div>
                        </>
                      ) : (
                        <p className="text-muted-foreground">AI forecast not available.</p>
                      )}
                    </CardContent>
                    <CardFooter className="pt-4 border-t">
                      <Button variant="outline" size="sm" asChild className="ml-auto">
                        <Link href={`/opportunities/${opp.id}`}>View Details</Link>
                      </Button>
                    </CardFooter>
                  </Card>
                ))
              ) : (
                !isLoading && <p className="text-muted-foreground text-center py-4">No active opportunities with forecasts.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Opportunities Pipeline */}
        <Card className="lg:col-span-2" gradient="green" bgImage="/4.svg">
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <BarChartHorizontalBig className="mr-3 h-5 w-5 text-primary" />
              Opportunities Pipeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {isLoading ? (
                <div className="h-full bg-muted/50 rounded animate-pulse"></div>
              ) : opportunityStatusData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={opportunityStatusData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} width={100} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        borderColor: "hsl(var(--border))",
                        borderRadius: "var(--radius)",
                      }}
                    />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-muted-foreground text-center py-4">No opportunity data available.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Lead Engagement */}
        <Card className="lg:col-span-1" gradient="neutral" bgImage="/3.svg">
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Users className="mr-3 h-5 w-5 text-primary" />
              Lead Engagement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Card key={`lead-skeleton-${i}`} className="w-full" isInner={true}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="h-4 bg-muted/50 rounded w-24"></div>
                          <div className="h-3 bg-muted/50 rounded w-32"></div>
                        </div>
                        <div className="h-5 bg-muted/50 rounded w-16"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : mockLeads.length > 0 ? (
                mockLeads.slice(0, 3).map(lead => (
                  <Card key={lead.id} className="w-full" isInner={true}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{lead.personName}</p>
                          <p className="text-sm text-muted-foreground">{lead.companyName}</p>
                        </div>
                        <Badge variant="outline">{lead.status}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-4">No leads available.</p>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              variant="outline" 
              size="sm" 
              asChild 
              className="ml-auto"
              disabled={isLoading}
            >
              <Link href="/leads">View All Leads</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

