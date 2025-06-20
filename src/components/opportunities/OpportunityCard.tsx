"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BarChartBig,
  DollarSign,
  CalendarDays,
  Eye,
  AlertTriangle,
  CheckCircle2,
  Briefcase,
  Lightbulb,
  TrendingUp,
  Users,
  Clock,
} from "lucide-react";
import type {
  Opportunity,
  OpportunityForecast as AIOpportunityForecast,
  Account,
} from "@/types";
import { Progress } from "@/components/ui/progress";
import {
  format,
  differenceInDays,
  parseISO,
  formatDistanceToNowStrict,
} from "date-fns";
import { aiPoweredOpportunityForecasting } from "@/ai/flows/ai-powered-opportunity-forecasting";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

interface OpportunityCardProps {
  opportunity: Opportunity;
  onStatusChange?: (opportunityId: string, newStatus: Opportunity["status"]) => void;
}

const getStatusBadgeColorClasses = (status: Opportunity["status"]): string => {
  switch (status) {
    case "Need Analysis":
      return "bg-sky-500/20 text-sky-700 border-sky-500/30";
    case "Negotiation":
      return "bg-amber-500/20 text-amber-700 border-amber-500/30";
    case "In Progress":
      return "bg-blue-500/20 text-blue-700 border-blue-500/30";
    case "On Hold":
      return "bg-slate-500/20 text-slate-700 border-slate-500/30";
    case "Completed":
      return "bg-green-500/20 text-green-700 border-green-500/30";
    case "Cancelled":
      return "bg-red-500/20 text-red-700 border-red-500/30";
    default:
      return "bg-gray-500/20 text-gray-700 border-gray-500/30";
  }
};

const VALID_OPPORTUNITY_STATUSES: Opportunity["status"][] = [
  "Need Analysis",
  "Negotiation",
  "In Progress",
  "On Hold",
  "Completed",
  "Cancelled",
];

const calculateProgress = (
  startDate: string | undefined,
  endDate: string | undefined,
  status: Opportunity["status"]
): number => {
  if (!startDate || !endDate) return 0; // Defensive: if missing, show 0 progress
  if (status === "Completed") return 100;
  if (status === "Cancelled") return 0;

  if (status === "Need Analysis") {
    if (new Date() < parseISO(startDate)) {
      return 0;
    }
  }

  const start = parseISO(startDate);
  const end = parseISO(endDate);
  const today = new Date();

  if (today < start) return 5; // Slight progress if it hasn't started but not cancelled
  if (today >= end && status !== "Completed") return 95; // Near completion if past end date but not marked complete

  const totalDuration = differenceInDays(end, start);
  const elapsedDuration = differenceInDays(today, start);

  if (totalDuration <= 0) {
    if (
      status === "In Progress" ||
      status === "Negotiation" ||
      status === "On Hold"
    ) {
      return 50;
    } else {
      return 0;
    }
  }

  return Math.min(98, Math.max(5, (elapsedDuration / totalDuration) * 100)); // Ensure progress is between 5 and 98 unless completed/cancelled
};

export default function OpportunityCard({ opportunity: initialOpportunity, onStatusChange }: OpportunityCardProps) {
  const { toast } = useToast();
  const [opportunity, setOpportunity] = useState(initialOpportunity);
  const [forecast, setForecast] = useState<AIOpportunityForecast | null>(null);
  const [isLoadingForecast, setIsLoadingForecast] = useState(false);
  const [associatedAccount, setAssociatedAccount] = useState<any>(null);
  const [isStatusUpdating, setIsStatusUpdating] = useState(false);

  const handleStatusChange = async (newStatus: Opportunity["status"]) => {
    if (opportunity.status === newStatus) return;
    setIsStatusUpdating(true);
    try {
      const response = await fetch('/api/opportunities', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: opportunity.id, status: newStatus })
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update status');
      }
      setOpportunity((prev) => ({ ...prev, status: newStatus, updated_at: new Date().toISOString() }));
      if (onStatusChange) {
        onStatusChange(opportunity.id, newStatus);
      }
      toast({
        title: 'Status Updated!',
        description: `Opportunity status changed to ${newStatus}.`,
        className: 'bg-green-100 dark:bg-green-900 border-green-500'
      });
    } catch (error) {
      toast({
        title: "Status Update Failed",
        description: error instanceof Error ? error.message : "Could not update status.",
        variant: "destructive",
      });
    } finally {
      setIsStatusUpdating(false);
    }
  };

  useEffect(() => {
    async function fetchAccount() {
      if (opportunity.associated_account_id) {
        const res = await fetch(`/api/accounts?id=${opportunity.associated_account_id}`);
        const result = await res.json();
        if (result.data && result.data.length > 0) {
          setAssociatedAccount(result.data[0]);
        }
      }
    }
    fetchAccount();
  }, [opportunity.associated_account_id]);

  const fetchForecast = async () => {
    setIsLoadingForecast(true);
    try {
      const startDate = opportunity.created_at
        ? format(parseISO(opportunity.created_at), "MMM dd, yyyy")
        : "N/A";
      const endDate = opportunity.expected_close_date
        ? format(parseISO(opportunity.expected_close_date), "MMM dd, yyyy")
        : "N/A";
      const forecastData = await aiPoweredOpportunityForecasting({
        opportunityName: opportunity.name,
        opportunityDescription: opportunity.description,
        opportunityTimeline: `Start: ${startDate}, End: ${endDate}`,
        opportunityValue: opportunity.amount,
        opportunityStatus: opportunity.status,
        recentUpdates: "Placeholder: Updates show steady progress.",
      });
      setForecast(forecastData);
    } catch (error) {
      console.error(`Failed to fetch forecast for ${opportunity.name}:`, error);
      setForecast({
        timelinePrediction: "N/A",
        completionDateEstimate: "N/A",
        revenueForecast: opportunity.amount,
        bottleneckIdentification: "Error fetching forecast.",
      });
    } finally {
      setIsLoadingForecast(false);
    }
  };

  useEffect(() => {
    if (
      opportunity.status !== "Completed" &&
      opportunity.status !== "Cancelled" &&
      opportunity.name &&
      opportunity.created_at &&
      opportunity.expected_close_date &&
      opportunity.amount &&
      opportunity.status &&
      opportunity.description
    ) {
      fetchForecast();
    } else {
      setForecast(null); // No forecast for completed/cancelled
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    opportunity.id,
    opportunity.name,
    opportunity.created_at,
    opportunity.expected_close_date,
    opportunity.amount,
    opportunity.status,
    opportunity.description,
  ]);

  const accountName = associatedAccount?.name;
  const progress = calculateProgress(
    opportunity.created_at,
    opportunity.expected_close_date,
    opportunity.status
  );
  const isAtRisk =
    forecast?.bottleneckIdentification &&
    forecast.bottleneckIdentification.toLowerCase() !== "none identified" &&
    forecast.bottleneckIdentification.toLowerCase() !== "none" &&
    forecast.bottleneckIdentification !== "Error fetching forecast." &&
    forecast.bottleneckIdentification.length > 0;

  let opportunityHealthIcon = (
    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
  );
  let opportunityHealthText = "On Track";
  if (forecast?.bottleneckIdentification === "Error fetching forecast.") {
    opportunityHealthIcon = (
      <AlertTriangle className="h-4 w-4 text-orange-500 shrink-0" />
    );
    opportunityHealthText = "Forecast Error";
  } else if (isAtRisk) {
    opportunityHealthIcon = (
      <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
    );
    opportunityHealthText = "Potential Risk";
  }

  const timeRemaining = (status: Opportunity["status"]): string => {
    if (status === "Completed" || status === "Cancelled") return status;
    if (!opportunity.expected_close_date) return "N/A";
    const end = opportunity.expected_close_date
      ? parseISO(opportunity.expected_close_date)
      : new Date();
    const now = new Date();
    if (now > end)
      return `Overdue by ${formatDistanceToNowStrict(end, {
        addSuffix: false,
      })}`;
    return `${formatDistanceToNowStrict(end, { addSuffix: false })} left`;
  };

  // Debug: log the date fields
  console.log(
    "Opportunity dates:",
    opportunity.created_at,
    opportunity.expected_close_date
  );

  return (
    <Card className="flex flex-col h-full bg-white text-black rounded-[8px]  p-2 border-none">
      <CardHeader className="pb-3 px-6 pt-6">
        <div className="flex flex-row items-center justify-between w-full">
          <div className="flex flex-col items-start">
            <div className="flex flex-row items-center">
              <BarChartBig className="mr-2 h-5 w-5 shrink-0" style={{ color: '#97A88C' }} />
              <CardTitle className="text-xl font-headline mb-0 ml-2" style={{ color: '#97A88C' }}>
                {initialOpportunity.name}
              </CardTitle>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={`capitalize whitespace-nowrap ml-2 focus:outline-none ${getStatusBadgeColorClasses(opportunity.status)} inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors`}
                disabled={isStatusUpdating || opportunity.status === "Completed" || opportunity.status === "Cancelled"}
                aria-label="Change status"
              >
                {isStatusUpdating ? (
                  <span className="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : null}
                {opportunity.status}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {VALID_OPPORTUNITY_STATUSES.map((status) => (
                <DropdownMenuItem
                  key={status}
                  onSelect={() => handleStatusChange(status)}
                  disabled={status === opportunity.status || opportunity.status === "Completed" || opportunity.status === "Cancelled"}
                  className={`capitalize ${status === opportunity.status ? "opacity-60 font-bold" : "cursor-pointer"}`}
                >
                  {status}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="flex-grow space-y-3 text-sm px-6 text-left">
        {associatedAccount?.name && (
          <div className="flex items-center mb-1">
            <Briefcase className="mr-2 h-4 w-4 shrink-0" />
            <span className="font-semibold mr-1">For:</span> {associatedAccount.name}
          </div>
        )}
        {typeof opportunity.amount !== "undefined" &&
          opportunity.amount !== null && (
            <div className="flex items-center text-muted-foreground mb-1">
              <DollarSign className="mr-2 h-4 w-4 shrink-0" />
              <span className="font-semibold text-foreground mr-1">
                Quoted Value:
              </span>{" "}
              ${Number(opportunity.amount).toLocaleString()}
            </div>
          )}
        {opportunity.description && (
          <div className="mb-1">
            <p className="text-muted-foreground">{opportunity.description}</p>
          </div>
        )}
        {opportunity.created_at && opportunity.expected_close_date && (
          <div className="flex items-center text-muted-foreground mb-1">
            <CalendarDays className="mr-2 h-4 w-4 shrink-0" />
            <span>
              {opportunity.created_at
                ? format(parseISO(opportunity.created_at), "MMM dd, yyyy")
                : "N/A"}{" "}
              -{" "}
              {opportunity.expected_close_date
                ? format(
                    parseISO(opportunity.expected_close_date),
                    "MMM dd, yyyy"
                  )
                : "N/A"}
            </span>
          </div>
        )}
        <div className="mb-2">
          <Progress value={progress} className="h-2 bg-[#E5E7E0] [&>div]:bg-[#97A88C]" />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span className="flex items-center">
            <Clock className="mr-1 h-3 w-3 shrink-0" />
            {timeRemaining(opportunity.status)}
          </span>
          <div className="flex items-center gap-1">
            {opportunityHealthIcon} {opportunityHealthText}
          </div>
        </div>
        {(forecast || isLoadingForecast) &&
          opportunity.status !== "Completed" &&
          opportunity.status !== "Cancelled" && (
            <div className="pt-3 border-t mt-3">
              <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1.5 flex items-center">
                <Lightbulb className="mr-1.5 h-3.5 w-3.5 text-yellow-500" /> AI
                Forecast
              </h4>
              {isLoadingForecast ? (
                <div className="flex items-center space-x-2 h-12">
                  <LoadingSpinner size={16} />
                  <span className="text-xs text-muted-foreground">
                    Generating forecast...
                  </span>
                </div>
              ) : forecast ? (
                <div className="space-y-1 text-xs">
                  <p className="text-foreground line-clamp-1">
                    <span className="font-medium">Est. Completion:</span>{" "}
                    {forecast.completionDateEstimate}
                  </p>
                  <p className="text-foreground line-clamp-2 leading-snug">
                    <span className="font-medium">Bottlenecks:</span>{" "}
                    {forecast.bottleneckIdentification || "None identified"}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground h-12 flex items-center">
                  No AI forecast data for this opportunity.
                </p>
              )}
            </div>
          )}
      </CardContent>
      <CardFooter className="pt-4 border-t mt-auto px-6 pb-6">
        {/* Commented out View Details button */}
        {/* <Button variant="outline" size="sm" asChild className="mr-auto">
            <Link href={`/opportunities/${opportunity.id}`}>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </Link>
          </Button> */}
      </CardFooter>
    </Card>
  );
}
