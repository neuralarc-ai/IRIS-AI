import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Users } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import type { Lead } from '@/types';

interface LeadEngagementProps {
  isLoading: boolean;
  leads: Lead[];
}

export default function LeadEngagement({ isLoading, leads }: LeadEngagementProps) {
  return (
    <Card className="h-full bg-white text-black rounded-[8px] p-2 border-none">
      <CardHeader>
        <CardTitle className="text-lg flex items-center text-black">
          <Users className="mr-3 h-5 w-5 text-black" />
          Lead Engagement
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-4 rounded-lg border border-border">
                <div className="h-5 bg-muted/50 rounded w-2/3 mb-2"></div>
                <div className="h-4 bg-muted/50 rounded w-1/2"></div>
              </div>
            ))
          ) : leads.length > 0 ? (
            leads.map((lead) => (
              <Link
                key={lead.id}
                href={`/leads/${lead.id}`}
                className="block p-4 rounded-lg border border-border hover:bg-accent transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">{lead.company_name}</h3>
                  <Badge variant="outline">{lead.status}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {lead.person_name} • {lead.country}
                </p>
              </Link>
            ))
          ) : (
            <p className="text-muted-foreground text-center py-4">
              No active leads found.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 