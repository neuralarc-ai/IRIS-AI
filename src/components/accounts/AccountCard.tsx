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
  Briefcase,
  ListChecks,
  PlusCircle,
  Eye,
  MessageSquareHeart,
  Lightbulb,
  Users,
  Mail,
  Phone,
  Tag,
} from "lucide-react";
import type {
  Account,
  DailyAccountSummary as AIDailySummary,
  Opportunity,
} from "@/types";
import { getOpportunitiesByAccount } from "@/lib/data";
import { generateDailyAccountSummary } from "@/ai/flows/daily-account-summary";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import AddOpportunityDialog from "@/components/opportunities/AddOpportunityDialog";

interface AccountCardProps {
  account: Account;
  isConverted?: boolean;
}

export default function AccountCard({
  account,
  isConverted,
}: AccountCardProps) {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [dailySummary, setDailySummary] = useState<AIDailySummary | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [isAddOpportunityDialogOpen, setIsAddOpportunityDialogOpen] =
    useState(false);

  useEffect(() => {
    setOpportunities(getOpportunitiesByAccount(account.id));
  }, [account.id]);

  const fetchDailySummary = async () => {
    setIsLoadingSummary(true);
    try {
      const summary = await generateDailyAccountSummary({
        accountId: account.id,
        accountName: account.name,
        recentUpdates:
          "Placeholder: Recent updates indicate active engagement.",
        keyMetrics: "Placeholder: Key metrics are trending positively.",
      });
      setDailySummary(summary);
    } catch (error) {
      console.error(`Failed to fetch summary for ${account.name}:`, error);
      // Set a default error state for summary to inform user
      setDailySummary({
        summary: "Could not load AI summary.",
        relationshipHealth: "Unknown",
      });
    } finally {
      setIsLoadingSummary(false);
    }
  };

  useEffect(() => {
    if (account.status === "Active") {
      fetchDailySummary();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account.id, account.name, account.status]);

  const handleOpportunityAdded = (newOpportunity: Opportunity) => {
    // Refresh the account data or update the UI as needed
    // This could be handled by a parent component if needed
  };

  return (
    <>
      <Card className="flex flex-col h-full bg-white text-black rounded-[8px] shadow-lg p-2 border-none">
        <CardHeader className="pb-3 px-6 pt-6">
          <div className="flex flex-row items-center justify-between w-full mb-1">
            <div className="flex flex-row items-center">
              <Briefcase className="mr-2 h-5 w-5 text-primary shrink-0" />
              <CardTitle className="text-xl font-headline mb-0 ml-2">
                {account.name}
              </CardTitle>
            </div>
            <Badge
              variant={account.status === "Active" ? "default" : "secondary"}
              className={`capitalize whitespace-nowrap ml-2 ${
                account.status === "Active"
                  ? "bg-green-500/20 text-green-700 border-green-500/30"
                  : "bg-amber-500/20 text-amber-700 border-amber-500/30"
              }`}
            >
              {account.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="flex-grow space-y-3 text-sm px-6">
          <p className="text-muted-foreground line-clamp-2">
            {account.description}
          </p>

          {account.contactPersonName && (
            <div className="flex items-center text-muted-foreground">
              <Users className="mr-2 h-4 w-4 shrink-0" />
              {account.contactPersonName}
            </div>
          )}
          {account.contactEmail && (
            <div className="flex items-center text-muted-foreground">
              <Mail className="mr-2 h-4 w-4 shrink-0" />
              {account.contactEmail}
            </div>
          )}
          {account.contactPhone && (
            <div className="flex items-center text-muted-foreground">
              <Phone className="mr-2 h-4 w-4 shrink-0" />
              {account.contactPhone}
            </div>
          )}

          <div className="text-sm flex items-center text-foreground font-medium">
            <ListChecks className="mr-2 h-4 w-4 text-primary" />
            <span>
              {opportunities.length} Active Opportunit
              {opportunities.length !== 1 ? "ies" : "y"}
            </span>
          </div>

          {account.status === "Active" && (
            <div className="pt-3 border-t mt-3">
              <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1.5 flex items-center">
                <Lightbulb className="mr-1.5 h-3.5 w-3.5 text-yellow-500" /> AI
                Daily Brief
              </h4>
              {isLoadingSummary ? (
                <div className="flex items-center space-x-2 h-10">
                  <LoadingSpinner size={16} />
                  <span className="text-xs text-muted-foreground">
                    Generating brief...
                  </span>
                </div>
              ) : dailySummary ? (
                <div className="space-y-1">
                  <p className="text-xs text-foreground line-clamp-2">
                    {dailySummary.summary}
                  </p>
                  <div className="flex items-center text-xs">
                    <MessageSquareHeart className="mr-1.5 h-3.5 w-3.5 text-pink-500" />
                    <span className="font-medium text-foreground">Health:</span>
                    &nbsp;
                    <span className="text-muted-foreground">
                      {dailySummary.relationshipHealth}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground h-10 flex items-center">
                  No AI brief available for this account.
                </p>
              )}
            </div>
          )}
        </CardContent>
        <CardFooter className="pt-4 border-t mt-auto px-6 pb-6">
          {" "}
          {/* mt-auto pushes footer to bottom */}
          {/*
          <Button variant="outline" size="sm" asChild className="mr-auto">
            <Link href={`/accounts/${account.id}`}> 
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </Link>
          </Button>
          */}
          <Button size="sm" onClick={() => setIsAddOpportunityDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Opportunity
          </Button>
        </CardFooter>
      </Card>
      <AddOpportunityDialog
        open={isAddOpportunityDialogOpen}
        onOpenChange={setIsAddOpportunityDialogOpen}
        onOpportunityAdded={handleOpportunityAdded}
        initialAccountId={account.id}
        accounts={[{ id: account.id, name: account.name, type: account.type }]}
      />
    </>
  );
}
