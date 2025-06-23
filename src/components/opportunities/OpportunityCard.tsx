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
  Trash2,
  MessageSquare,
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
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import AddUpdateDialog from "@/components/updates/AddUpdateDialog";

interface OpportunityCardProps {
  opportunity: Opportunity;
  onStatusChange?: (opportunityId: string, newStatus: Opportunity["status"]) => void;
  onDelete?: (opportunityId: string) => void;
}

const getStatusBadgeColorClasses = (status: Opportunity["status"]): string => {
  switch (status) {
    case "Scope Of Work":
      return "bg-sky-500/20 text-sky-700 border-sky-500/30";
    case "Proposal":
      return "bg-blue-500/20 text-blue-700 border-blue-500/30";
    case "Negotiation":
      return "bg-amber-500/20 text-amber-700 border-amber-500/30";
    case "Win":
      return "bg-green-500/20 text-green-700 border-green-500/30";
    case "Loss":
      return "bg-red-500/20 text-red-700 border-red-500/30";
    default:
      return "bg-gray-500/20 text-gray-700 border-gray-500/30";
  }
};

const VALID_OPPORTUNITY_STATUSES: Opportunity["status"][] = [
  "Scope Of Work",
  "Proposal",
  "Negotiation",
  "Win",
  "Loss",
];

const calculateProgress = (
  startDate: string | undefined,
  endDate: string | undefined,
  status: Opportunity["status"]
): number => {
  if (status === "Win") return 100;
  if (status === "Loss") return 0;
  if (!startDate || !endDate) return 0;

  const start = parseISO(startDate);
  const end = parseISO(endDate);
  const today = new Date();

  if (today >= end) return 95; // Past due but not won/lost
  if (today < start) return 5; // Not yet started

  const totalDuration = differenceInDays(end, start);
  const elapsedDuration = differenceInDays(today, start);

  if (totalDuration <= 0) {
    if (status === "Scope Of Work" || status === "Proposal" || status === "Negotiation") {
        return 50; // In progress, but no valid date range
    }
    return 10;
  }

  const progress = (elapsedDuration / totalDuration) * 100;
  return Math.min(98, Math.max(5, progress)); // Cap progress between 5% and 98%
};

export default function OpportunityCard({ opportunity: initialOpportunity, onStatusChange, onDelete }: OpportunityCardProps) {
  const { toast } = useToast();
  const [opportunity, setOpportunity] = useState(initialOpportunity);
  const [forecast, setForecast] = useState<AIOpportunityForecast | null>(null);
  const [isLoadingForecast, setIsLoadingForecast] = useState(false);
  const [associatedAccount, setAssociatedAccount] = useState<any>(null);
  const [isStatusUpdating, setIsStatusUpdating] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAddUpdateDialog, setShowAddUpdateDialog] = useState(false);

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
      opportunity.status !== "Win" &&
      opportunity.status !== "Loss" &&
      opportunity.name &&
      opportunity.created_at &&
      opportunity.expected_close_date
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
    opportunity.status,
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
  }

  const timeRemaining = (status: Opportunity["status"]): string => {
    if (status === "Win" || status === "Loss") return status;
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

  const handleDelete = async () => {
    setShowDeleteDialog(false);
    try {
      const response = await fetch(`/api/opportunities?id=${opportunity.id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Failed to delete opportunity");
      }
      toast({
        title: "Opportunity Deleted",
        description: `${opportunity.name} has been successfully deleted.`,
      });
      if (onDelete) onDelete(opportunity.id);
    } catch (error) {
      console.error('Error deleting opportunity:', error);
      toast({
        title: "Delete Failed",
        description: error instanceof Error ? error.message : "Failed to delete opportunity. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="flex flex-col h-full bg-white text-black rounded-[8px] border-none">
      <CardHeader className="pb-3 px-6 pt-6">
        <div className="flex flex-row items-center justify-between w-full">
          <div className="flex flex-col items-start">
            <div className="flex flex-row items-center">
              <BarChartBig className="mr-2 h-5 w-5 shrink-0" style={{ color: '#97A88C' }} />
              <CardTitle className="font-headline mb-0 ml-2" style={{ color: '#97A88C', fontSize: '1.5rem', fontWeight: 700 }}>
                {initialOpportunity.name}
              </CardTitle>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={`capitalize whitespace-nowrap ml-2 focus:outline-none ${getStatusBadgeColorClasses(opportunity.status)} inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors`}
                disabled={isStatusUpdating || opportunity.status === "Win" || opportunity.status === "Loss"}
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
                  disabled={status === opportunity.status || opportunity.status === "Win" || opportunity.status === "Loss"}
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
            <span className="font-semibold text-muted-foreground mr-1" style={{ fontSize: '1.05rem' }}>
              For:
            </span>{' '}
            <span className="font-bold text-foreground" style={{ fontSize: '1.15rem' }}>
              {associatedAccount.name}
            </span>
          </div>
        )}
        {typeof opportunity.amount !== "undefined" &&
          opportunity.amount !== null && (
            <div className="flex items-center mb-1">
        
              <span className="font-semibold text-muted-foreground mr-1" style={{ fontSize: '0.95rem' }}>
                Quoted Value:
              </span>{" "}
              <span className="text-black font-bold" style={{ fontSize: '1.35rem' }}>
                ${Number(opportunity.amount).toLocaleString()}
              </span>
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
        <div className="flex justify-between text-[14px] text-muted-foreground mb-1">
          <span className="flex items-center">
            <Clock className="mr-1 h-3 w-3 shrink-0" />
            {timeRemaining(opportunity.status)}
          </span>
          <div className="flex items-center gap-1">
            {opportunityHealthIcon} {opportunityHealthText}
          </div>
        </div>
        {(forecast || isLoadingForecast) &&
          opportunity.status !== "Win" &&
          opportunity.status !== "Loss" && (
            <div className="pt-3 border-t mt-3">
              <h4 className="text-sm font-semibold uppercase text-muted-foreground mb-1.5 flex items-center">
                <Lightbulb className="mr-1.5 h-3.5 w-3.5 text-yellow-500" /> AI
                Forecast
              </h4>
              {isLoadingForecast ? (
                <div className="flex items-center space-x-2 h-12">
                  <LoadingSpinner size={16} />
                  <span className="text-sm text-muted-foreground">
                    Generating forecast...
                  </span>
                </div>
              ) : forecast ? (
                <div className="space-y-1 text-[14px]">
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
      <CardFooter className="pt-4 border-t mt-auto px-6 pb-6 flex justify-end items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowAddUpdateDialog(true)}
          title="Log Communication Update"
          className="hover:bg-muted"
        >
          <MessageSquare className="h-4 w-4 text-primary" />
        </Button>
        <Link href={`/updates?opportunity_id=${opportunity.id}&entity_type=opportunity`} passHref>
          <Button
            variant="outline"
            size="sm"
            className="text-gray-600 hover:text-gray-800"
          >
            <Eye className="h-4 w-4 mr-1" />
            View Log
          </Button>
        </Link>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setShowDeleteDialog(true)}
          title="Delete Opportunity"
          className="ml-auto hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Opportunity</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this opportunity? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel asChild>
                <Button variant="outline">Cancel</Button>
              </AlertDialogCancel>
              <AlertDialogAction asChild>
                <Button variant="destructive" onClick={handleDelete}>Delete</Button>
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <AddUpdateDialog
          open={showAddUpdateDialog}
          onOpenChange={setShowAddUpdateDialog}
          onUpdateAdded={() => setShowAddUpdateDialog(false)}
          forceEntityType="opportunity"
          forceEntityId={opportunity.id}
        />
      </CardFooter>
    </Card>
  );
}
