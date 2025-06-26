"use client";

import React, { useState, useEffect, useMemo, useRef, Suspense } from "react";
import PageTitle from "@/components/common/PageTitle";
import { Button } from "@/components/ui/button";
import {
  RefreshCw,
  TrendingUp,
  Users,
  AlertTriangle,
  Lightbulb,
  BarChartHorizontalBig,
  CalendarClock,
  DollarSign,
  AlertCircle,
  CheckCircle,
  History,
  BarChartBig,
  Eye,
} from "lucide-react";
import { aiPoweredOpportunityForecasting } from "@/ai/flows/ai-powered-opportunity-forecasting";
import type {
  Opportunity,
  OpportunityForecast,
  Lead,
  OpportunityStatus,
  Update,
} from "@/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { format, parseISO } from "date-fns";
import UpdateItem from "@/components/updates/UpdateItem";
import { useAuth } from '@/hooks/use-auth';
import RecentActivityItem from '@/components/updates/RecentActivityItem';
import dynamic from 'next/dynamic';
import { getUpdatesForOpportunity } from '@/lib/data';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

// Dynamically import heavy components
const OpportunitiesPipeline = dynamic(() => import('@/components/dashboard/OpportunitiesPipeline'), {
  loading: () => <Card className="h-full"><LoadingSpinner /></Card>,
  ssr: false
});

const KeyOpportunityInsights = dynamic(() => import('@/components/dashboard/KeyOpportunityInsights'), {
  loading: () => <Card className="h-full"><LoadingSpinner /></Card>,
  ssr: false
});

const LeadEngagement = dynamic(() => import('@/components/dashboard/LeadEngagement'), {
  loading: () => <Card className="h-full"><LoadingSpinner /></Card>,
  ssr: false
});

interface OpportunityWithForecast extends Opportunity {
  forecast?: OpportunityForecast;
}

const getStatusBadgeVariant = (
  status: OpportunityStatus | undefined
): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case "Need Analysis":
      return "outline";
    case "Negotiation":
      return "secondary";
    case "In Progress":
      return "default";
    case "Completed":
      return "default";
    case "On Hold":
      return "secondary";
    case "Cancelled":
      return "destructive";
    default:
      return "secondary";
  }
};

// Utility to summarize engagement/activity for an opportunity
function summarizeEngagement(updates) {
  if (!updates || updates.length === 0) return 'No recent updates or engagement.';
  const now = new Date();
  const last14Days = updates.filter(u => (now - new Date(u.date)) / (1000 * 60 * 60 * 24) <= 14);
  const lastUpdate = updates[0];
  const lastUpdateDate = lastUpdate ? new Date(lastUpdate.date) : null;
  const daysSinceLast = lastUpdateDate ? Math.floor((now - lastUpdateDate) / (1000 * 60 * 60 * 24)) : null;
  const updateTypes = last14Days.map(u => u.type);
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

// Utility to truncate text to 2 lines with ellipsis
function truncateSummary(text) {
  if (!text) return '';
  // Simple truncation to ~140 chars, adjust as needed
  return text.length > 140 ? text.slice(0, 137) + '...' : text;
}

export default function DashboardPage() {
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const [forecastedOpportunities, setForecastedOpportunities] = useState<OpportunityWithForecast[]>([]);
  const [overallSalesForecast, setOverallSalesForecast] = useState<string | null>(null);
  const [recentUpdates, setRecentUpdates] = useState<Update[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const refreshTimeout = useRef<NodeJS.Timeout | null>(null);
  const [dataLoadingState, setDataLoadingState] = useState({
    opportunities: true,
    updates: true,
    leads: true,
    forecasts: true
  });
  const [selectedForecast, setSelectedForecast] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchOpportunities = async () => {
    try {
      const oppRes = await fetch("/api/opportunities?limit=10");
        const oppJson = await oppRes.json();
      return oppJson.data || [];
    } catch (error) {
      console.error("Failed to fetch opportunities:", error);
      return [];
    } finally {
      setDataLoadingState(prev => ({ ...prev, opportunities: false }));
    }
  };

  const fetchUpdates = async () => {
    try {
      const updRes = await fetch("/api/updates?limit=5", {
        headers: {
          "x-user-id": user?.id || "",
          "x-user-admin": isAdmin() ? "true" : "false",
        },
      });
        const updJson = await updRes.json();
      setRecentUpdates(updJson.data || []);
    } catch (error) {
      console.error("Failed to fetch updates:", error);
    } finally {
      setDataLoadingState(prev => ({ ...prev, updates: false }));
    }
  };

  const fetchLeads = async () => {
    try {
      const leadsRes = await fetch("/api/leads?limit=4");
        const leadsJson = await leadsRes.json();
      const leadsData: Lead[] = (leadsJson.data || []).map((apiLead: any) => ({
        id: apiLead.id ?? "",
        company_name: apiLead.company_name ?? "",
        person_name: apiLead.person_name ?? "",
        email: apiLead.email ?? "",
        phone: apiLead.phone ?? "",
        linkedin_profile_url: apiLead.linkedin_profile_url ?? "",
        country: apiLead.country ?? "",
        status: apiLead.status ?? "",
        opportunityIds: [],
        updateIds: [],
        created_at: apiLead.created_at ?? "",
        updated_at: apiLead.updated_at ?? "",
      }));
        setLeads(leadsData);
    } catch (error) {
      console.error("Failed to fetch leads:", error);
    } finally {
      setDataLoadingState(prev => ({ ...prev, leads: false }));
    }
  };

  const fetchForecasts = async (opportunities: Opportunity[]) => {
    try {
      const activeOpportunities = opportunities
        .filter((opp) => opp.status !== "Completed" && opp.status !== "Cancelled");

      const forecastPromises = activeOpportunities.map(async (opp) => {
        try {
          // Fetch updates for this opportunity
          const updates = getUpdatesForOpportunity ? getUpdatesForOpportunity(opp.id) : [];
          const engagementSummary = summarizeEngagement(updates);
          const forecast = await aiPoweredOpportunityForecasting({
            opportunityName: opp.name,
            opportunityDescription: opp.description,
            opportunityTimeline: `Start: ${
              opp.created_at
                ? format(parseISO(opp.created_at), "MMM dd, yyyy")
                : "N/A"
            }, End: ${
              opp.expected_close_date
                ? format(parseISO(opp.expected_close_date), "MMM dd, yyyy")
                : "N/A"
            }`,
            opportunityValue: opp.amount,
            opportunityStatus: opp.status,
            recentUpdates: engagementSummary,
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
        // Build a structured, visually clear overview from AI output
        const aiSummaries = results.map((opp) => {
          const name = opp.name;
          const forecast = opp.forecast;
          if (!forecast) return '';
          return `
            <div style="margin-bottom: 1.5em;">
              <h3 style="font-size:1.1em; margin-bottom:0.2em;"><strong>${name}</strong></h3>
              <ul style="margin:0 0 0.5em 1.2em; padding:0; list-style: disc;">
                <li><strong>Summary:</strong> ${forecast.timelinePrediction}</li>
                <li><strong>Bottleneck:</strong> ${forecast.bottleneckIdentification}</li>
                <li><strong>Estimated Completion:</strong> ${forecast.completionDateEstimate}</li>
                <li><strong>Forecasted Revenue:</strong> $${forecast.revenueForecast.toLocaleString()}</li>
              </ul>
            </div>
          `;
        }).filter(Boolean).join('');

        setOverallSalesForecast(
          `<div style="font-size:1.05em;"><strong>AI Sales Forecast Overview</strong></div>${aiSummaries}`
        );
      } else {
        setOverallSalesForecast(
          "No active opportunities to forecast. Add new opportunities to see <strong>AI-powered sales predictions</strong>."
        );
      }
    } catch (error) {
      console.error("Failed to fetch forecasts:", error);
      setOverallSalesForecast("Error fetching sales forecast data.");
    } finally {
      setDataLoadingState(prev => ({ ...prev, forecasts: false }));
    }
  };

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setDataLoadingState({
      opportunities: true,
      updates: true,
      leads: true,
      forecasts: true
    });

    try {
      // Fetch data in parallel
      const opportunities = await fetchOpportunities();
      await Promise.all([
        fetchUpdates(),
        fetchLeads(),
        fetchForecasts(opportunities)
      ]);

        setLastRefreshed(new Date());
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

  useEffect(() => {
    if (!authLoading && user) {
    fetchDashboardData();
    // Set up auto-refresh every 1 hour
    if (refreshTimeout.current) clearInterval(refreshTimeout.current);
    refreshTimeout.current = setInterval(() => {
      fetchDashboardData();
    }, 3600000);
    return () => {
      if (refreshTimeout.current) clearInterval(refreshTimeout.current);
    };
    }
  }, [authLoading, user]);

  const opportunityStatusData = useMemo(() => {
    const counts: Record<OpportunityStatus, number> = {
      "Need Analysis": 0,
      Negotiation: 0,
      "In Progress": 0,
      "On Hold": 0,
      Completed: 0,
      Cancelled: 0,
    };
    forecastedOpportunities.forEach((opp) => {
      counts[opp.status as OpportunityStatus]++;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, count: value }))
      .filter((item) => item.count > 0);
  }, [forecastedOpportunities]);

  return (
    <div
      className="mx-auto mt-6 px-0"
      style={{ maxWidth: '1376px', paddingLeft: 0, paddingRight: 0 }}
    >
      <div className="mb-6 flex items-center justify-between">
        <PageTitle 
          title="Dashboard" 
          subtitle={
            lastRefreshed
              ? `Last updated: ${format(lastRefreshed, "MMM dd, yyyy HH:mm")}`
              : "Loading..."
          }
        />
        <Button
          onClick={fetchDashboardData}
          variant="outline"
          size="sm"
          className="ml-4 flex items-center"
          disabled={isLoading}
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
        />
          {isLoading ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

        {/* Main Forecast Card */}
      <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-xl flex items-center">
              <TrendingUp className="mr-3 h-6 w-6 text-primary" />
              AI Sales Forecast Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
          {dataLoadingState.forecasts ? (
              <div className="h-10 bg-muted/50 rounded animate-pulse w-3/4"></div>
            ) : forecastedOpportunities.length === 0 ? (
              <p className="text-foreground text-base leading-relaxed">No forecast available.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {forecastedOpportunities.map((opp) => {
                  const forecast = opp.forecast;
                  if (!forecast) return null;
                  return (
                    <Card
                      key={opp.id}
                      className="border border-gray-200 shadow-sm p-3 flex flex-col justify-between h-full min-h-[170px] transition-colors duration-150 group"
                      style={{ cursor: 'pointer' }}
                    >
                      <div>
                        <div
                          className="font-semibold text-base mb-1 truncate"
                          title={opp.name}
                          style={{ color: 'black' }}
                        >
                          {opp.name}
                        </div>
                        {/* Subtext: person/country, if available */}
                        {opp.person_name || opp.country ? (
                          <div
                            className="text-sm mb-2"
                            style={{ color: 'black', opacity: 0.5 }}
                          >
                            {opp.person_name}
                            {opp.person_name && opp.country ? ' • ' : ''}
                            {opp.country}
                          </div>
                        ) : null}
                        <div className="text-xs mb-2 text-foreground" style={{display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'}}>
                          <strong>Summary:</strong> {truncateSummary(forecast.timelinePrediction)}
                        </div>
                        <div className="text-xs text-muted-foreground mb-1"><strong>Revenue:</strong> ${forecast.revenueForecast.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground mb-2"><strong>Est. Completion:</strong> {forecast.completionDateEstimate}</div>
                      </div>
                      <Dialog open={modalOpen && selectedForecast?.id === opp.id} onOpenChange={(open) => { setModalOpen(open); if (!open) setSelectedForecast(null); }}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="mt-2 w-full group-hover:bg-[#2B2521] group-hover:text-white transition-colors duration-150" onClick={() => { setSelectedForecast({ ...opp, forecast }); setModalOpen(true); }}>
                            View Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>{opp.name} - Full AI Analysis</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-3">
                            <div><strong>Summary:</strong> {forecast.timelinePrediction}</div>
                            <div><strong>Bottleneck:</strong> {forecast.bottleneckIdentification}</div>
                            <div><strong>Estimated Completion:</strong> {forecast.completionDateEstimate}</div>
                            <div><strong>Forecasted Revenue:</strong> ${forecast.revenueForecast.toLocaleString()}</div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

      {/* Top Row: Recent Activity Stream & Opportunities Pipeline */}
      <div className="flex flex-col lg:flex-row gap-6 mb-6 mt-4">
        <div className="flex-1 min-w-0 flex flex-col gap-6">
        {/* Recent Activity Stream */}
          <Suspense fallback={<LoadingSpinner />}>
            <div className="flex-1">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold flex items-center text-foreground">
              <History className="mr-3 h-6 w-6 text-blue-500" />
              Recent Activity Stream
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {dataLoadingState.updates ? (
                    Array.from({ length: 2 }).map((_, i) => (
                      <Card
                        key={`update-skeleton-${i}`}
                        className="h-full bg-white text-black rounded-[8px] p-2 border-none"
                      >
                        <CardHeader>
                          <div className="h-5 bg-muted/50 rounded w-1/2"></div>
                        </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="h-4 bg-muted/50 rounded w-full"></div>
                      <div className="h-4 bg-muted/50 rounded w-3/4"></div>
                    </CardContent>
                  </Card>
                ))
                  ) : recentUpdates.length > 0 ? (
                    recentUpdates.map((update) => (
                      <RecentActivityItem key={update.id} update={update} />
                    ))
                  ) : (
                      <p className="text-muted-foreground text-center py-4 md:col-span-2">
                        No recent updates found.
                      </p>
                    )}
              </div>
            </CardContent>
          </div>
          </Suspense>
        </div>

        {/* Opportunities Pipeline */}
        <div className="w-full lg:w-[400px] flex-shrink-0 mt-2">
          <Suspense fallback={<LoadingSpinner />}>
            <OpportunitiesPipeline 
              isLoading={dataLoadingState.opportunities}
              opportunityStatusData={opportunityStatusData}
            />
          </Suspense>
        </div>
      </div>

      {/* Bottom Row: Key Opportunity Insights & Lead Engagement */}
      <div className="flex flex-col lg:flex-row gap-6 mt-4">
        {/* Key Opportunity Insights */}
        <div className="flex-1 min-w-0">
          <Suspense fallback={<LoadingSpinner />}>
            <KeyOpportunityInsights
              isLoading={dataLoadingState.forecasts}
              opportunities={forecastedOpportunities}
            />
          </Suspense>
            </div>

        {/* Lead Engagement */}
        <div className="w-full lg:w-[400px] flex-shrink-0">
          <Suspense fallback={<LoadingSpinner />}>
            <LeadEngagement
              isLoading={dataLoadingState.leads}
              leads={leads}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}