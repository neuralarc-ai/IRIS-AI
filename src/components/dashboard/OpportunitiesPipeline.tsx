import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BarChartHorizontalBig } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface OpportunitiesPipelineProps {
  isLoading: boolean;
  opportunityStatusData: Array<{ name: string; count: number }>;
}

export default function OpportunitiesPipeline({ isLoading, opportunityStatusData }: OpportunitiesPipelineProps) {
  return (
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
  );
} 