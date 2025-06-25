import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Lightbulb } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";
import type { OpportunityForecast } from '@/types';

interface KeyOpportunityInsightsProps {
  isLoading: boolean;
  opportunities: OpportunityForecast[];
}

export default function KeyOpportunityInsights({ isLoading, opportunities }: KeyOpportunityInsightsProps) {
  return (
    <>
      <CardHeader>
        <CardTitle className="text-2xl font-semibold flex items-center text-foreground">
          <Lightbulb className="mr-3 h-6 w-6 text-yellow-500" />
          Key Opportunity Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 ">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {isLoading ? (
            Array.from({ length: 2 }).map((_, i) => (
              <Card key={i} className="h-full bg-white">
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
          ) : opportunities.length > 0 ? (
            opportunities.map((opportunity) => (
              <Card key={opportunity.id} className="h-full bg-white">
                <CardHeader>
                  <CardTitle className="text-lg">{opportunity.name}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{opportunity.status}</Badge>
                    <span className="text-sm text-muted-foreground">
                      ${opportunity.amount.toLocaleString()}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  {opportunity.forecast ? (
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        {opportunity.forecast.insights}
                      </p>
                      <div className="flex items-center justify-between text-sm">
                        <span>Probability: {opportunity.forecast.probability}%</span>
                        <span>Expected: {format(parseISO(opportunity.expected_close_date), "MMM dd, yyyy")}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Forecast data not available
                    </p>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <p className="text-muted-foreground text-center py-4 md:col-span-2">
              No key opportunities found.
            </p>
          )}
        </div>
      </CardContent>
    </>
  );
} 