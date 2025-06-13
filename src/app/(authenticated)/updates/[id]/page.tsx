"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Eye, CheckSquare, Repeat, MessageSquare, Users, Mail, BarChartBig, Brain, Activity, ThumbsUp, ThumbsDown, MessageCircleMore, Briefcase, Sparkles, UserCircle, User as UserIcon, Phone, Calendar, FileText, AlertCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { getUpdateById, getOpportunityById, getAccountById, getUserById, getLeadById } from '@/lib/data';
import type { Update, UpdateInsights, Opportunity, Account, User, Lead } from '@/types';
import { generateInsights } from '@/ai/flows/intelligent-insights';
import Link from 'next/link';

const getUpdateIcon = (type: Update['type']) => {
  switch (type) {
    case 'Email': return <Mail className="h-5 w-5 text-blue-500" />;
    case 'Call': return <Phone className="h-5 w-5 text-green-500" />;
    case 'Meeting': return <Users className="h-5 w-5 text-purple-500" />;
    case 'Note': return <FileText className="h-5 w-5 text-amber-500" />;
    case 'Status Change': return <Activity className="h-5 w-5 text-red-500" />;
    default: return <MessageSquare className="h-5 w-5 text-gray-500" />;
  }
};

const getSentimentIcon = (sentiment: string) => {
  switch (sentiment?.toLowerCase()) {
    case 'positive': return <ThumbsUp className="h-4 w-4 text-green-500" />;
    case 'negative': return <ThumbsDown className="h-4 w-4 text-red-500" />;
    case 'neutral': return <MessageCircleMore className="h-4 w-4 text-blue-500" />;
    default: return <AlertCircle className="h-4 w-4 text-gray-500" />;
  }
};

export default function UpdateDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [update, setUpdate] = useState<Update | null>(null);
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [account, setAccount] = useState<Account | null>(null);
  const [lead, setLead] = useState<Lead | null>(null);
  const [updatedByUser, setUpdatedByUser] = useState<User | null>(null);
  const [insights, setInsights] = useState<UpdateInsights | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const [showAiInsights, setShowAiInsights] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const updateId = params.id as string;
        const updateData = getUpdateById(updateId);
        
        if (!updateData) {
          router.push('/updates');
          return;
        }

        setUpdate(updateData);
        if (updateData.opportunityId) {
          setOpportunity(getOpportunityById(updateData.opportunityId));
        }
        if (updateData.accountId) {
          setAccount(getAccountById(updateData.accountId));
        }
        if (updateData.leadId) {
          setLead(getLeadById(updateData.leadId));
        }
        if (updateData.updatedById) {
          setUpdatedByUser(getUserById(updateData.updatedById));
        }

        // Fetch AI insights if content is substantial
        if (updateData.content && updateData.content.length >= 20) {
          setIsLoadingInsights(true);
          try {
            const aiData = await generateInsights({ communicationHistory: updateData.content });
            setInsights({
              summary: aiData.updateSummary?.summary,
              actionItems: aiData.updateSummary?.actionItems?.split('\n').filter(s => s.trim().length > 0 && !s.trim().startsWith('-')).map(s => s.replace(/^- /, '')),
              followUpSuggestions: aiData.updateSummary?.followUpSuggestions?.split('\n').filter(s => s.trim().length > 0 && !s.trim().startsWith('-')).map(s => s.replace(/^- /, '')),
              sentiment: aiData.communicationAnalysis?.sentimentAnalysis,
              relationshipHealth: updateData.opportunityId ? aiData.relationshipHealth : null,
            });
            setShowAiInsights(true);
          } catch (error) {
            console.error('Error generating insights:', error);
          } finally {
            setIsLoadingInsights(false);
          }
        }
      } catch (error) {
        console.error('Error fetching update details:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [params.id, router]);

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-[60vh]">
          <LoadingSpinner size={32} />
        </div>
      </div>
    );
  }

  if (!update) {
    return null;
  }

  const formattedDate = format(parseISO(update.date), 'MMM d, yyyy h:mm a');

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-2xl font-semibold">Update Details</h1>
        <Badge variant="secondary" className="capitalize">
          {update.type}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Update Content */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex justify-between items-start mb-1">
              <CardTitle className="text-xl font-headline flex items-center text-foreground">
                {getUpdateIcon(update.type)}
                <span className="ml-2.5">{formattedDate}</span>
              </CardTitle>
            </div>

            {lead && (
              <CardDescription className="text-sm text-muted-foreground flex items-center">
                <UserIcon className="mr-2 h-4 w-4 shrink-0" />
                Lead: {lead.companyName} ({lead.personName})
              </CardDescription>
            )}
            {opportunity && (
              <CardDescription className="text-sm text-muted-foreground flex items-center">
                <BarChartBig className="mr-2 h-4 w-4 shrink-0" />
                Opportunity: {opportunity.name}
              </CardDescription>
            )}
            {account && (
              <CardDescription className="text-xs text-muted-foreground flex items-center mt-0.5">
                <Briefcase className="mr-1.5 h-3.5 w-3.5 shrink-0" />
                Account: {account.name}
              </CardDescription>
            )}
            {updatedByUser && (
              <CardDescription className="text-xs text-muted-foreground flex items-center mt-0.5">
                <UserCircle className="mr-1.5 h-3.5 w-3.5 shrink-0" />
                Updated by: {updatedByUser.name}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="prose prose-sm max-w-none">
              <p className="text-foreground leading-relaxed whitespace-pre-wrap">{update.content}</p>
            </div>

            {showAiInsights && (
              <div className="pt-4 border-t space-y-4">
                <h3 className="font-semibold text-foreground text-sm flex items-center">
                  <Sparkles className="mr-2 h-4 w-4 text-yellow-500" />
                  AI-Powered Insights
                </h3>
                {isLoadingInsights ? (
                  <div className="flex items-center space-x-2 h-16">
                    <LoadingSpinner size={16} />
                    <span className="text-xs text-muted-foreground">Analyzing update...</span>
                  </div>
                ) : insights ? (
                  <div className="space-y-4 text-sm">
                    {insights.summary && (
                      <div>
                        <h4 className="font-medium text-foreground mb-1">Summary</h4>
                        <p className="text-muted-foreground">{insights.summary}</p>
                      </div>
                    )}
                    {insights.actionItems && insights.actionItems.length > 0 && (
                      <div>
                        <h4 className="font-medium text-foreground mb-1 flex items-center">
                          <CheckSquare className="mr-1.5 h-4 w-4" />
                          Action Items
                        </h4>
                        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                          {insights.actionItems.map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {insights.followUpSuggestions && insights.followUpSuggestions.length > 0 && (
                      <div>
                        <h4 className="font-medium text-foreground mb-1 flex items-center">
                          <Repeat className="mr-1.5 h-4 w-4" />
                          Follow-up Suggestions
                        </h4>
                        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                          {insights.followUpSuggestions.map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {insights.sentiment && (
                      <div className="flex items-center">
                        {getSentimentIcon(insights.sentiment)}
                        <span className="font-medium text-foreground ml-1.5">Sentiment:</span>
                        <span className="text-muted-foreground ml-1">{insights.sentiment}</span>
                      </div>
                    )}
                    {insights.relationshipHealth && update.opportunityId && (
                      <div>
                        <h4 className="font-medium text-foreground mb-1">Relationship Health</h4>
                        <p className="text-muted-foreground">
                          {insights.relationshipHealth.summary} (Score: {insights.relationshipHealth.healthScore.toFixed(2)})
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No AI insights available for this update.</p>
                )}
              </div>
            )}
          </CardContent>
          <CardFooter className="pt-4 border-t">
            {opportunity && (
              <Button variant="outline" size="sm" asChild className="mr-2">
                <Link href={`/opportunities/${opportunity.id}`}>
                  <BarChartBig className="mr-2 h-4 w-4" />
                  View Opportunity
                </Link>
              </Button>
            )}
            {account && (
              <Button variant="outline" size="sm" asChild className="mr-2">
                <Link href={`/accounts/${account.id}`}>
                  <Briefcase className="mr-2 h-4 w-4" />
                  View Account
                </Link>
              </Button>
            )}
            {lead && (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/leads/${lead.id}`}>
                  <UserIcon className="mr-2 h-4 w-4" />
                  View Lead
                </Link>
              </Button>
            )}
          </CardFooter>
        </Card>

        {/* Related Information */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Brain className="mr-2 h-5 w-5 text-primary" />
              Related Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Update Type</h3>
                <p className="text-sm">{update.type}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Date & Time</h3>
                <p className="text-sm">{formattedDate}</p>
              </div>
              {updatedByUser && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Updated By</h3>
                  <p className="text-sm">{updatedByUser.name}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 