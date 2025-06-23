import React from 'react';
import { Badge } from '@/components/ui/badge';
import type { Update } from '@/types';

interface RecentActivityItemProps {
  update: Update & { lead?: { company_name?: string; person_name?: string } };
}

export default function RecentActivityItem({ update }: RecentActivityItemProps) {
  const leadName = update.lead?.company_name || update.lead?.person_name || '';
  const date = update.date ? update.date.slice(0, 10) : '';
  return (
    <div className="rounded-lg bg-white p-4 shadow-sm border mb-2">
      <div className="flex items-center mb-2">
        <span className="mr-2 text-lg">💬</span>
        <span className="text-muted-foreground mr-1">Lead:</span>
        <span className="font-bold text-lg">{leadName}</span>
      </div>
      <div className="relative bg-blue-50 rounded-md px-4 py-3 mb-1 flex items-center min-h-[48px]">
        <span className="font-semibold text-base text-black">{update.content}</span>
        <Badge className="absolute right-3 top-3 bg-blue-100 text-blue-700 border-blue-200 px-2 py-0.5 text-xs font-semibold cursor-default select-none">
          {update.type}
        </Badge>
      </div>
      <div className="text-xs text-muted-foreground ml-1 mt-1">Logged on: {date}</div>
    </div>
  );
} 