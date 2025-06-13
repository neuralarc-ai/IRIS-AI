"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, User, Users, Mail, Phone, Building2, CalendarDays, Clock, Linkedin, MapPin, CheckSquare, FileWarning } from 'lucide-react';
import { format, parseISO, formatDistanceToNow } from 'date-fns';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { getLeadById, convertLeadToAccount } from '@/lib/data';
import type { Lead } from '@/types';
import { useToast } from "@/hooks/use-toast";

const getStatusBadgeColorClasses = (status: Lead['status']): string => {
  switch (status) {
    case 'New': return 'bg-blue-500/20 text-blue-700 border-blue-500/30';
    case 'Contacted': return 'bg-amber-500/20 text-amber-700 border-amber-500/30';
    case 'Qualified': return 'bg-green-500/20 text-green-700 border-green-500/30';
    case 'Lost': return 'bg-red-500/20 text-red-700 border-red-500/30';
    case 'Converted': return 'bg-purple-500/20 text-purple-700 border-purple-500/30';
    default: return 'bg-gray-500/20 text-gray-700 border-gray-500/30';
  }
};

export default function LeadDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [lead, setLead] = useState<Lead | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConverting, setIsConverting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const leadId = params.id as string;
        const leadData = getLeadById(leadId);
        
        if (!leadData) {
          router.push('/leads');
          return;
        }

        setLead(leadData);
      } catch (error) {
        console.error('Error fetching lead details:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [params.id, router]);

  const handleConvertLead = async () => {
    if (!lead) return;

    setIsConverting(true);
    try {
      const newAccountId = await convertLeadToAccount(lead.id);
      toast({
        title: "Lead Converted",
        description: "The lead has been successfully converted to an account.",
      });
      router.push(`/accounts/${newAccountId}`);
    } catch (error) {
      console.error('Error converting lead:', error);
      toast({
        title: "Conversion Failed",
        description: "There was an error converting the lead to an account.",
        variant: "destructive",
      });
    } finally {
      setIsConverting(false);
    }
  };

  const canConvert = lead && lead.status !== 'Lost' && lead.status !== 'Converted';

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-[60vh]">
          <LoadingSpinner size={32} />
        </div>
      </div>
    );
  }

  if (!lead) {
    return null;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-2xl font-semibold">{lead.companyName}</h1>
        <Badge variant="secondary" className={`capitalize ${getStatusBadgeColorClasses(lead.status)}`}>
          {lead.status}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Lead Details */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building2 className="mr-2 h-5 w-5 text-primary" />
              Lead Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Contact Person</h3>
                <div className="flex items-center">
                  <User className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>{lead.personName}</span>
                </div>
              </div>
              {lead.email && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Email</h3>
                  <div className="flex items-center">
                    <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
                    <a href={`mailto:${lead.email}`} className="hover:text-primary hover:underline">
                      {lead.email}
                    </a>
                  </div>
                </div>
              )}
              {lead.phone && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Phone</h3>
                  <div className="flex items-center">
                    <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
                    <a href={`tel:${lead.phone}`} className="hover:text-primary hover:underline">
                      {lead.phone}
                    </a>
                  </div>
                </div>
              )}
              {lead.linkedinProfileUrl && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">LinkedIn</h3>
                  <div className="flex items-center">
                    <Linkedin className="mr-2 h-4 w-4 text-muted-foreground" />
                    <a 
                      href={lead.linkedinProfileUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="hover:text-primary hover:underline truncate"
                    >
                      {lead.linkedinProfileUrl.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, '').replace(/\/$/, '')}
                    </a>
                  </div>
                </div>
              )}
              {lead.country && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Country</h3>
                  <div className="flex items-center">
                    <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>{lead.country}</span>
                  </div>
                </div>
              )}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Created</h3>
                <div className="flex items-center">
                  <CalendarDays className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>{formatDistanceToNow(parseISO(lead.createdAt), { addSuffix: true })}</span>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Last Updated</h3>
                <div className="flex items-center">
                  <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>{formatDistanceToNow(parseISO(lead.updatedAt), { addSuffix: true })}</span>
                </div>
              </div>
            </div>

            {lead.notes && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Notes</h3>
                <p className="text-sm text-muted-foreground">{lead.notes}</p>
              </div>
            )}
          </CardContent>
          <CardFooter className="pt-4 border-t">
            {canConvert ? (
              <Button 
                size="sm" 
                onClick={handleConvertLead}
                disabled={isConverting}
                className="w-full"
              >
                {isConverting ? (
                  <>
                    <LoadingSpinner size={16} className="mr-2" />
                    Converting...
                  </>
                ) : (
                  <>
                    <CheckSquare className="mr-2 h-4 w-4" />
                    Convert to Account
                  </>
                )}
              </Button>
            ) : (
              <Button 
                size="sm" 
                variant="outline" 
                disabled 
                className="w-full"
              >
                {lead.status === "Lost" ? (
                  <>
                    <FileWarning className="mr-2 h-4 w-4" />
                    Lost Lead
                  </>
                ) : (
                  <>
                    <CheckSquare className="mr-2 h-4 w-4" />
                    Already Converted
                  </>
                )}
              </Button>
            )}
          </CardFooter>
        </Card>

        {/* Additional Information */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="mr-2 h-5 w-5 text-primary" />
              Additional Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Lead Source</h3>
                <p className="text-sm">{lead.source || 'Not specified'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Industry</h3>
                <p className="text-sm">{lead.industry || 'Not specified'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Company Size</h3>
                <p className="text-sm">{lead.companySize || 'Not specified'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 