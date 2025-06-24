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
        .filter((opp) => opp.status !== "Completed" && opp.status !== "Cancelled")
        .slice(0, 2);

        const forecastPromises = activeOpportunities.map(async (opp) => {
          try {
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
            recentUpdates:
              "Recent updates indicate steady progress and positive client feedback.",
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
          const totalRevenue = results.reduce((sum, opp) => {
            return sum + (opp.forecast?.revenueForecast || 0);
          }, 0);
          const soonestCompletion = results
            .map((opp) => opp.forecast?.completionDateEstimate)
            .filter(Boolean)
            .sort()[0];
          const keyDeals = results.map((opp) => opp.name).join(", ");
          setOverallSalesForecast(
            `<strong>AI Sales Forecast:</strong> The system predicts a <strong>total potential revenue</strong> of <strong>$${totalRevenue.toLocaleString()}</strong> from <strong>${results.length}</strong> key deal${results.length > 1 ? "s" : ""} (${keyDeals}). <br />` +
            (soonestCompletion
              ? `The <strong>earliest estimated completion</strong> is <strong>${soonestCompletion}</strong>. <br />`
              : "") +
            `Opportunities are showing <strong>positive momentum</strong> with strong client engagement. Stay focused on high-value deals to maximize your sales outcomes.`
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
            ) : (
            <p 
              className="text-foreground text-base leading-relaxed" 
              dangerouslySetInnerHTML={{ __html: overallSalesForecast || "No forecast available." }} 
            />
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