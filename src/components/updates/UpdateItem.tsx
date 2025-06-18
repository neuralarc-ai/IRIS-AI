"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, type GradientType } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, CheckSquare, Repeat, MessageSquare, Users, Mail, BarChartBig, Brain, Activity, ThumbsUp, ThumbsDown, MessageCircleMore, Briefcase, Sparkles, UserCircle, User as UserIcon, Phone, Calendar, FileText, AlertCircle } from 'lucide-react';
import type { Update, UpdateInsights as AIUpdateInsights, Opportunity, Account, User, Lead, UpdateType } from '@/types';
import {format, parseISO} from 'date-fns';
import { generateInsights, RelationshipHealthOutput } from '@/ai/flows/intelligent-insights'; 
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { getOpportunityById, getAccountById, getUserById, getLeadById } from '@/lib/data';
import Link from 'next/link';

interface UpdateItemProps {
  update: Update;
  gradient?: GradientType;
}

const getUpdateIcon = (type: UpdateType) => {
  switch (type) {
    case 'Meeting':
      return <Calendar className="h-4 w-4" />;
    case 'Email':
      return <Mail className="h-4 w-4" />;
    case 'Call':
      return <Phone className="h-4 w-4" />;
    case 'General':
      return <MessageSquare className="h-4 w-4" />;
    default:
      return <MessageSquare className="h-4 w-4" />;
  }
};

const getSentimentIcon = (sentiment?: string) => {
    if (!sentiment) return <Activity className="h-4 w-4"/>;
    const lowerSentiment = sentiment.toLowerCase();
    if (lowerSentiment.includes("positive")) return <ThumbsUp className="h-4 w-4 text-green-500"/>;
    if (lowerSentiment.includes("negative")) return <ThumbsDown className="h-4 w-4 text-red-500"/>;
    if (lowerSentiment.includes("neutral")) return <Activity className="h-4 w-4 text-yellow-500"/>;
    return <Activity className="h-4 w-4"/>;
}

export default function UpdateItem({ update, gradient }: UpdateItemProps) {
  const [insights, setInsights] = useState<Partial<AIUpdateInsights> & { relationshipHealth?: RelationshipHealthOutput | null } | null>(null);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const [showAiInsights, setShowAiInsights] = useState(false);
  
  const [opportunity, setOpportunity] = useState<Opportunity | undefined>(undefined);
  const [account, setAccount] = useState<Account | undefined>(undefined);
  const [lead, setLead] = useState<Lead | undefined>(undefined);
  const [updatedByUser, setUpdatedByUser] = useState<User | undefined>(undefined);

  useEffect(() => {
    if (update.opportunityId) {
      const opp = getOpportunityById(update.opportunityId);
      setOpportunity(opp);
      if (opp?.associated_account_id) {
        setAccount(getAccountById(opp.associated_account_id));
      } else {
        setAccount(undefined); // Should not happen if data is consistent
      }
      setLead(undefined); // Clear lead if it's an opportunity update
    } else if (update.leadId) {
      setLead(getLeadById(update.leadId));
      setOpportunity(undefined); // Clear opportunity/account if it's a lead update
      setAccount(undefined);
    }

    if (update.updatedByUserId) {
      setUpdatedByUser(getUserById(update.updatedByUserId));
    } else {
      setUpdatedByUser(undefined);
    }
  }, [update.opportunityId, update.leadId, update.updatedByUserId]);

  const fetchInsights = async () => {
    if (!update.content || update.content.length < 20) { // Avoid AI call for very short content
        setInsights({ summary: "Content too short for detailed AI analysis."});
        setShowAiInsights(true);
        return;
    }
    setIsLoadingInsights(true);
    setShowAiInsights(true); 
    try {
      // For lead updates, communication history might be just the current update.
      // For opportunity updates, one might ideally gather more context, but for now, use current update content.
      const aiData = await generateInsights({ communicationHistory: update.content });
      setInsights({
        summary: aiData.updateSummary?.summary,
        actionItems: aiData.updateSummary?.actionItems?.split('\n').filter(s => s.trim().length > 0 && !s.trim().startsWith('-')).map(s => s.replace(/^- /, '')),
        followUpSuggestions: aiData.updateSummary?.followUpSuggestions?.split('\n').filter(s => s.trim().length > 0 && !s.trim().startsWith('-')).map(s => s.replace(/^- /, '')),
        sentiment: aiData.communicationAnalysis?.sentimentAnalysis,
        // Relationship health might be less relevant for a single lead update vs. ongoing opportunity communication
        relationshipHealth: update.opportunityId ? aiData.relationshipHealth : null, 
      });
    } catch (error) {
      console.error(`Failed to fetch insights for update ${update.id}:`, error);
      setInsights({ summary: "Could not load AI insights.", sentiment: "Unknown" });
    } finally {
      setIsLoadingInsights(false);
    }
  };

  const toggleAiInsights = () => {
    if (!insights && !isLoadingInsights) { // Fetch only if not already fetched or loading
      fetchInsights();
    } else {
      setShowAiInsights(prev => !prev); // Just toggle visibility if already fetched
    }
  };
  
  const formattedDate = format(parseISO(update.date), 'MMM d, yyyy h:mm a');

  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col h-full p-2" gradient={gradient}>
      <Card isInner={true} className="flex flex-col h-full bg-white text-black rounded-lg">
        <CardHeader className="pb-3 px-6 pt-6">
          <div className="flex justify-between items-start mb-1">
            <CardTitle className="text-xl font-headline flex items-center">
              {getUpdateIcon(update.type)}
              <span className="ml-2.5">Update: {formattedDate}</span>
            </CardTitle>
            <Badge variant="secondary" className="capitalize whitespace-nowrap ml-2 bg-accent text-accent-foreground">
              {update.type}
            </Badge>
          </div>

          {lead && (
              <CardDescription className="text-sm text-muted-foreground flex items-center">
                  <UserIcon className="mr-2 h-4 w-4 shrink-0" />
                  <span className="font-semibold mr-1">Lead:</span> {lead.companyName} ({lead.personName})
              </CardDescription>
          )}
          {opportunity && (
            <CardDescription className="text-sm text-muted-foreground flex items-center">
              <BarChartBig className="mr-2 h-4 w-4 shrink-0" />
              <span className="font-semibold mr-1">Opportunity:</span> {opportunity.name}
            </CardDescription>
          )}
          {account && ( // Display account only if an opportunity is linked
              <CardDescription className="text-xs text-muted-foreground flex items-center mt-0.5">
                  <Briefcase className="mr-1.5 h-3.5 w-3.5 shrink-0" />
                  <span className="font-semibold mr-1">Account:</span> {account.name}
              </CardDescription>
          )}
           {updatedByUser && (
              <CardDescription className="text-xs text-muted-foreground flex items-center mt-0.5">
                  <UserCircle className="mr-1.5 h-3.5 w-3.5 shrink-0" />
                  <span className="font-semibold mr-1">Updated by:</span> {updatedByUser.name}
              </CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-3.5 text-sm flex-grow px-6">
          <p className="text-foreground leading-relaxed">{update.content}</p>
          
          {showAiInsights && (
            <div className="pt-3.5 border-t mt-3.5 space-y-3">
              <h4 className="font-semibold text-foreground text-sm flex items-center">
                <Sparkles className="mr-2 h-4 w-4 text-yellow-500" />
                AI-Powered Insights
              </h4>
              {isLoadingInsights ? (
                <div className="flex items-center space-x-2 h-16">
                  <LoadingSpinner size={16} />
                  <span className="text-xs text-muted-foreground">Analyzing update...</span>
                </div>
              ) : insights ? (
                <div className="space-y-2 text-xs">
                  {insights.summary && (
                    <div>
                      <strong className="text-foreground block mb-0.5">Summary:</strong>
                      <p className="text-muted-foreground ml-1 leading-snug">{insights.summary}</p>
                    </div>
                  )}
                  {insights.actionItems && insights.actionItems.length > 0 && (
                    <div className="mt-1.5">
                      <strong className="text-foreground flex items-center mb-0.5"><CheckSquare className="mr-1.5 h-4 w-4 shrink-0" />Action Items:</strong>
                      <ul className="list-disc list-inside ml-3 space-y-0.5">
                        {insights.actionItems.slice(0,3).map((item, idx) => <li key={idx} className="text-muted-foreground">{item}</li>)}
                        {insights.actionItems.length > 3 && <li className="text-muted-foreground text-xs">...and more</li>}
                      </ul>
                    </div>
                  )}
                  {insights.followUpSuggestions && insights.followUpSuggestions.length > 0 && (
                     <div className="mt-1.5">
                      <strong className="text-foreground flex items-center mb-0.5"><Repeat className="mr-1.5 h-4 w-4 shrink-0" />Follow-up Suggestions:</strong>
                       <ul className="list-disc list-inside ml-3 space-y-0.5">
                        {insights.followUpSuggestions.slice(0,2).map((item, idx) => <li key={idx} className="text-muted-foreground">{item}</li>)}
                       </ul>
                     </div>
                  )}
                   {insights.sentiment && (
                      <div className="flex items-center mt-1.5">
                      {getSentimentIcon(insights.sentiment)}
                      <strong className="text-foreground ml-1.5">Sentiment:</strong>
                      <span className="text-muted-foreground ml-1">{insights.sentiment}</span>
                      </div>
                   )}
                   {insights.relationshipHealth && update.opportunityId && ( // Show relationship health only for opportunity updates
                      <div className="mt-1.5">
                        <strong className="text-foreground flex items-center mb-0.5"><MessageCircleMore className="mr-1.5 h-4 w-4 shrink-0" />Relationship Health:</strong>
                        <p className="text-muted-foreground ml-1 leading-snug">{insights.relationshipHealth.summary}</p>
                      </div>
                   )}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground h-full flex items-center">No AI insights available for this update.</p>
              )}
            </div>
          )}
        </CardContent>
        <CardFooter className="pt-4 border-t mt-auto px-6 pb-6">
          <Button variant="outline" size="sm" onClick={toggleAiInsights} className="mr-2">
            {showAiInsights ? 'Hide AI Insights' : 'Show AI Insights'}
          </Button>
          <Button variant="outline" size="sm" asChild className="ml-auto">
            <Link href={`/updates/${update.id}`} prefetch={false}>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </Card>
  );
}
