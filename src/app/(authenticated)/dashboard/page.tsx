"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
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
  const [forecastedOpportunities, setForecastedOpportunities] = useState<
    OpportunityWithForecast[]
  >([]);
  const [overallSalesForecast, setOverallSalesForecast] = useState<
    string | null
  >(null);
  const [recentUpdates, setRecentUpdates] = useState<Update[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const refreshTimeout = useRef<NodeJS.Timeout | null>(null);

    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
      const oppRes = await fetch("/api/opportunities");
        const oppJson = await oppRes.json();
        const opportunities: Opportunity[] = oppJson.data || [];

      const updRes = await fetch("/api/updates", {
        headers: {
          "x-user-id": user?.id || "",
          "x-user-admin": isAdmin() ? "true" : "false",
        },
      });
        const updJson = await updRes.json();
        const updates: Update[] = updJson.data || [];

      const leadsRes = await fetch("/api/leads");
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

      const activeOpportunities = opportunities
        .filter(
          (opp) => opp.status !== "Completed" && opp.status !== "Cancelled"
        )
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
          // Calculate total forecasted revenue and soonest completion date
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
        setRecentUpdates(updates.slice(0, 2));
        setLastRefreshed(new Date());
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
        setOverallSalesForecast("Error fetching sales forecast data.");
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
            {isLoading && !overallSalesForecast ? (
              <div className="h-10 bg-muted/50 rounded animate-pulse w-3/4"></div>
            ) : (
            <p className="text-foreground text-base leading-relaxed" dangerouslySetInnerHTML={{ __html: overallSalesForecast || "No forecast available." }} />
            )}
          </CardContent>
        </Card>

      {/* Top Row: Recent Activity Stream & Opportunities Pipeline */}
      <div className="flex flex-col lg:flex-row gap-6 mb-6 mt-4">
        <div className="flex-1 min-w-0 flex flex-col gap-6">
        {/* Recent Activity Stream */}
          <div className="flex-1  ">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold flex items-center text-foreground">
              <History className="mr-3 h-6 w-6 text-blue-500" />
              Recent Activity Stream
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {isLoading && recentUpdates.length === 0
                  ? Array.from({ length: 2 }).map((_, i) => (
                      <Card
                        key={`update-skeleton-${i}`}
                        className="h-full bg-white text-black rounded-[8px]  p-2 border-none"
                        isInner={true}
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
                  : recentUpdates.length > 0
                  ? recentUpdates.map((update, index) => (
                      <RecentActivityItem key={update.id} update={update} />
                    ))
                  : !isLoading && (
                      <p className="text-muted-foreground text-center py-4 md:col-span-2">
                        No recent updates found.
                      </p>
                    )}
              </div>
            </CardContent>
          </div>
        </div>
        {/* Opportunities Pipeline on the right */}
        <div className="w-full lg:w-[400px] flex-shrink-0 mt-2">
          <Card className="h-full bg-white text-black rounded-[8px] p-2 border-none">
            <CardHeader>
              <CardTitle className="text-lg flex items-center text-black">
                <BarChartHorizontalBig className="mr-3 h-5 w-5 text-black" />
                Opportunities Pipeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {isLoading ? (
                  <div className="h-full bg-muted/50 rounded animate-pulse"></div>
                ) : opportunityStatusData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={opportunityStatusData}
                      layout="vertical"
                      margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="hsl(var(--border))"
                      />
                      <XAxis
                        type="number"
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                      />
                      <YAxis
                        dataKey="name"
                        type="category"
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        width={100}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          borderColor: "hsl(var(--border))",
                          borderRadius: "var(--radius)",
                        }}
                      />
                      <Bar
                        dataKey="count"
                        fill="#222"
                        radius={[0, 4, 4, 0]}
                        barSize={20}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    No opportunity data available.
                  </p>
              )}
            </div>
          </CardContent>
        </Card>
        </div>
      </div>

      {/* Bottom Row: Key Opportunity Insights & Lead Engagement */}
      <div className="flex flex-col lg:flex-row gap-6 mt-4">
        {/* Key Opportunity Insights */}
        <div className="flex-1 min-w-0 flex flex-col gap-6">
          <div>
          <CardHeader>
            <CardTitle className="text-2xl font-semibold flex items-center text-foreground">
              <Lightbulb className="mr-3 h-6 w-6 text-yellow-500" />
              Key Opportunity Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {isLoading && forecastedOpportunities.length === 0
                  ? Array.from({ length: 2 }).map((_, i) => (
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
                  : forecastedOpportunities.length > 0
                  ? forecastedOpportunities.map((opp) => (
                      <Card
                        key={opp.id}
                        className="flex flex-col h-full bg-white text-black rounded-[8px]  p-2 border-none"
                      >
                        <CardHeader className="pb-3 px-6 pt-6">
                          <div className="flex flex-row items-center justify-between w-full">
                            <div className="flex flex-row items-center">
                              <BarChartBig className="mr-2 h-5 w-5 text-primary shrink-0" />
                              <CardTitle className="text-xl font-headline mb-0 ml-2">
                                {opp.name}
                              </CardTitle>
                            </div>
                            <Badge
                              variant="secondary"
                              className={`capitalize whitespace-nowrap ml-2 ${getStatusBadgeVariant(
                                opp.status as OpportunityStatus
                              )}`}
                            >
                              {opp.status}
                        </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="flex-grow space-y-3 text-sm px-6 text-left">
                          <div className="flex items-center text-muted-foreground mb-1">
                            <DollarSign className="mr-2 h-4 w-4 shrink-0" />
                            <span className="font-semibold text-foreground mr-1">
                              Quoted Value:
                            </span>{" "}
                            ${opp.amount.toLocaleString()}
                          </div>
                          {opp.description && (
                            <div className="mb-1">
                              <p className="text-muted-foreground">
                                {opp.description}
                              </p>
                            </div>
                          )}
                          {opp.created_at && opp.expected_close_date && (
                            <div className="flex items-center text-muted-foreground mb-1">
                              <CalendarClock className="mr-2 h-4 w-4 shrink-0" />
                              <span>
                                {format(
                                  parseISO(opp.created_at),
                                  "MMM dd, yyyy"
                                )}{" "}
                                -{" "}
                                {format(
                                  parseISO(opp.expected_close_date),
                                  "MMM dd, yyyy"
                                )}
                              </span>
                            </div>
                          )}
                          {opp.forecast && (
                            <div className="pt-3 border-t mt-3">
                              <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1.5 flex items-center">
                                <Lightbulb className="mr-1.5 h-3.5 w-3.5 text-yellow-500" />{" "}
                                AI Forecast
                              </h4>
                              <div className="space-y-1 text-xs">
                                <p className="text-foreground line-clamp-1">
                                  <span className="font-medium">
                                    Est. Completion:
                                  </span>{" "}
                                  {opp.forecast.completionDateEstimate}
                                </p>
                                <p className="text-foreground line-clamp-2 leading-snug">
                                  <span className="font-medium">
                                    Revenue Forecast:
                                  </span>{" "}
                                  $
                                  {opp.forecast.revenueForecast.toLocaleString()}
                                </p>
                              </div>
                            </div>
                      )}
                    </CardContent>
                        <CardFooter className="pt-4 border-t mt-auto px-6 pb-6">
                          <Button
                            size="sm"
                            asChild
                            className="ml-auto bg-[#6FCF97] text-white border-none shadow-none hover:bg-[#8FE6B5] dark:hover:bg-[#4B8B6F] hover:text-white focus:bg-[#6FCF97] focus:text-white"
                          >
                            <Link href={`/opportunities/${opp.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                ))
                  : !isLoading && (
                      <p className="text-muted-foreground text-center py-4">
                        No active opportunities with forecasts.
                      </p>
              )}
            </div>
          </CardContent>
          </div>
            </div>

        {/* Lead Engagement */}
        <div className="w-full lg:w-[400px] flex-shrink-0 mt-2">
          <Card className="h-full bg-white text-black rounded-[8px]  p-2 border-none">
          <CardHeader>
            <CardTitle className="text-lg flex items-center text-black">
              <Users className="mr-3 h-5 w-5 text-black" />
              Lead Engagement
            </CardTitle>
          </CardHeader>
          <CardContent>
              <div className="space-y-3">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={`lead-skeleton-${i}`}
                      className="w-full bg-gray-50/50 rounded-sm p-3 border-l-4 border-gray-200"
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="h-4 bg-muted/50 rounded w-24"></div>
                          <div className="h-3 bg-muted/50 rounded w-32"></div>
                        </div>
                      </div>
                    </div>
                ))
              ) : leads.length > 0 ? (
                  (leads as any[])
                    .filter((lead) => lead.status !== "Converted to Account")
                    .map((lead) => (
                      <div
                        key={lead.id}
                        className="w-full bg-gray-50/50 rounded-sm p-3 border-l-4 border-blue-400 hover:bg-gray-100/50 transition-colors"
                      >
                        <div className="flex flex-col gap-1">
                          <p className="font-medium text-gray-900">{lead.person_name}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">({lead.company_name})</span>
                            <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                              {lead.status}
                            </span>
                          </div>
                        </div>
                      </div>
                ))
              ) : (
                  <p className="text-muted-foreground text-center py-4">
                    No leads available.
                  </p>
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
    </div>
  );
}