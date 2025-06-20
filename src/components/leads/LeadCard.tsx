"use client";
import React, { useState } from "react";
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
  Users,
  User,
  Mail,
  Phone,
  Eye,
  CheckSquare,
  FileWarning,
  CalendarPlus,
  History,
  Linkedin,
  MapPin,
  Briefcase,
} from "lucide-react";
import type { Lead } from "@/types";
import { formatDistanceToNow, parseISO } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

interface LeadCardProps {
  lead: Lead;
  onLeadConverted: (leadId: string, newAccountId: string) => void;
  onStatusChange?: (leadId: string, newStatus: Lead["status"]) => void;
}

const getStatusBadgeVariant = (
  status: Lead["status"]
): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case "New":
      return "secondary";
    case "Contacted":
      return "outline";
    case "Qualified":
      return "default";
    case "Proposal Sent":
      return "default";
    case "Converted to Account":
      return "default";
    case "Lost":
      return "destructive";
    default:
      return "secondary";
  }
};

const getStatusBadgeColorClasses = (status: Lead["status"]): string => {
  switch (status) {
    case "New":
      return "bg-blue-500/20 text-blue-700 border-blue-500/30";
    case "Contacted":
      return "bg-sky-500/20 text-sky-700 border-sky-500/30";
    case "Qualified":
      return "bg-teal-500/20 text-teal-700 border-teal-500/30";
    case "Proposal Sent":
      return "bg-indigo-500/20 text-indigo-700 border-indigo-500/30";
    case "Converted to Account":
      return "bg-green-500/20 text-green-700 border-green-500/30";
    case "Lost":
      return "bg-red-500/20 text-red-700 border-red-500/30";
    default:
      return "bg-slate-500/20 text-slate-700 border-slate-500/30";
  }
};

const VALID_STATUSES: Lead["status"][] = [
  "New",
  "Contacted",
  "Qualified",
  "Proposal Sent",
  "Converted to Account",
  "Lost",
];

export default function LeadCard({
  lead: initialLead,
  onLeadConverted,
  onStatusChange,
}: LeadCardProps) {
  const { toast } = useToast();
  const [lead, setLead] = useState(initialLead);
  const [isConverting, setIsConverting] = useState(false);
  const [isStatusUpdating, setIsStatusUpdating] = useState(false);

  const handleStatusChange = async (newStatus: Lead["status"]) => {
    if (lead.status === newStatus) return;
    setIsStatusUpdating(true);
    try {
      const response = await fetch(`/api/leads/${lead.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to update status");
      }
      setLead((prev) => ({
        ...prev,
        status: newStatus,
        updatedAt: new Date().toISOString(),
      }));
      if (onStatusChange) {
        onStatusChange(lead.id, newStatus);
      }
      toast({
        title: "Status Updated!",
        description: `Lead status changed to ${newStatus}.`,
        className: "bg-green-100 dark:bg-green-900 border-green-500",
      });
      if (newStatus === "Converted to Account" && result.data?.id) {
        onLeadConverted(lead.id, result.data.id);
      }
    } catch (error) {
      toast({
        title: "Status Update Failed",
        description:
          error instanceof Error ? error.message : "Could not update status.",
        variant: "destructive",
      });
    } finally {
      setIsStatusUpdating(false);
    }
  };

  const handleConvert = async () => {
    setIsConverting(true);
    try {
      const response = await fetch(`/api/leads/${lead.id}/convert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to convert lead");
      }
      setLead((prev) => ({
        ...prev,
        status: "Converted to Account",
        updatedAt: new Date().toISOString(),
      }));
      toast({
        title: "Lead Converted!",
        description: "Lead has been successfully converted to an account.",
        className: "bg-green-100 dark:bg-green-900 border-green-500",
      });
      if (result.data?.account?.id) {
        onLeadConverted(lead.id, result.data.account.id);
      }
    } catch (error) {
      toast({
        title: "Conversion Failed",
        description:
          error instanceof Error ? error.message : "Could not convert lead.",
        variant: "destructive",
      });
    } finally {
      setIsConverting(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(parseISO(dateString), { addSuffix: true });
    } catch (error) {
      console.error("Error formatting date:", dateString, error);
      return "Unknown";
    }
  };

  return (
    <Card className="flex flex-col h-full bg-white text-black rounded-[8px] shadow-xl p-2 border-none">
      <CardHeader className="pb-3 px-6 pt-6">
        <div className="flex justify-between items-start mb-1">
          <CardTitle className="text-xl font-headline flex items-center">
            <Briefcase className="mr-2 h-5 w-5 text-primary shrink-0" />
            {lead.companyName}
          </CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={`capitalize whitespace-nowrap ml-2 focus:outline-none ${getStatusBadgeColorClasses(
                  lead.status
                )} inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors`}
                disabled={
                  isStatusUpdating ||
                  lead.status === "Converted to Account" ||
                  lead.status === "Lost"
                }
                aria-label="Change status"
              >
                {isStatusUpdating ? (
                  <span className="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : null}
                {lead.status}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {VALID_STATUSES.map((status) => (
                <DropdownMenuItem
                  key={status}
                  onSelect={() => handleStatusChange(status)}
                  disabled={
                    status === lead.status ||
                    lead.status === "Converted to Account" ||
                    lead.status === "Lost"
                  }
                  className={`capitalize ${getStatusBadgeColorClasses(
                    status
                  )} ${
                    status === lead.status
                      ? "opacity-60 font-bold"
                      : "cursor-pointer"
                  }`}
                >
                  {status}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <CardDescription className="text-sm text-muted-foreground flex items-center">
          <Users className="mr-2 h-4 w-4 shrink-0 text-gray-700" />{" "}
          {lead.personName}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow space-y-2.5 text-sm px-6">
        {lead.email && (
          <div className="flex items-center text-muted-foreground">
            <Mail className="mr-2 h-4 w-4 shrink-0 text-gray-700" />
            <a
              href={`mailto:${lead.email}`}
              className="hover:text-primary hover:underline"
            >
              {lead.email}
            </a>
          </div>
        )}
        {lead.phone && (
          <div className="flex items-center text-muted-foreground">
            <Phone className="mr-2 h-4 w-4 shrink-0 text-gray-700" />
            <span>{lead.phone}</span>
          </div>
        )}
        {lead.linkedinProfileUrl && (
          <div className="flex items-center text-muted-foreground">
            <Linkedin className="mr-2 h-4 w-4 shrink-0 text-gray-700" />
            <a
              href={lead.linkedinProfileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary hover:underline truncate"
            >
              {lead.linkedinProfileUrl
                .replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, "")
                .replace(/\/$/, "")}
            </a>
          </div>
        )}
        {lead.country && (
          <div className="flex items-center text-muted-foreground">
            <MapPin className="mr-2 h-4 w-4 shrink-0 text-gray-700" />
            <span>{lead.country}</span>
          </div>
        )}
        <div className="pt-2 space-y-1">
          <div className="text-xs text-muted-foreground flex items-center">
            <CalendarPlus className="mr-1.5 h-3.5 w-3.5 shrink-0 text-gray-700" />
            Created: {formatDate(lead.createdAt)}
          </div>
          <div className="text-xs text-muted-foreground flex items-center">
            <History className="mr-1.5 h-3.5 w-3.5 shrink-0 text-gray-700" />
            Last Updated: {formatDate(lead.updatedAt)}
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-4 border-t mt-auto px-6 pb-6">
        <Button variant="outline" size="sm" asChild className="mr-auto">
          <Link href={`/leads/${lead.id}`}>
            <Eye className="mr-2 h-4 w-4" />
            View Details
          </Link>
        </Button>
        {lead.status === "Converted to Account" ? (
          <Button
            size="sm"
            disabled
            className="ml-2 cursor-not-allowed opacity-70"
          >
            <CheckSquare className="mr-2 h-4 w-4" />
            Converted
          </Button>
        ) : (
          lead.status !== "Lost" && (
            <Button
              size="sm"
              onClick={handleConvert}
              disabled={isConverting}
              className="ml-2"
            >
              {isConverting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Converting...
                </>
              ) : (
                <>
                  <CheckSquare className="mr-2 h-4 w-4" />
                  Convert
                </>
              )}
            </Button>
          )
        )}
      </CardFooter>
    </Card>
  );
}
