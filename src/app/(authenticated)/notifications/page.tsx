'use client';
import { Bell, UserCheck, UserPlus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import type { Lead } from '@/types';

export default function NotificationsPage() {
  const { user, isAdmin } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  // Calculate assigned leads count
  const assignedLeadsCount = leads.filter(lead => lead.assigned_user_id === user?.id).length;
  const createdLeadsCount = leads.filter(lead => lead.created_by_user_id === user?.id).length;

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    
    // Fetch notifications
    fetch(`/api/notifications?user_id=${user.id}`)
      .then(res => res.json())
      .then(data => setNotifications(data.data || []));
    
    // Fetch leads for summary
    fetch('/api/leads', {
      headers: {
        'x-user-id': user.id,
        'x-user-admin': isAdmin() ? 'true' : 'false',
      },
    })
      .then(res => res.json())
      .then(data => {
        // Transform API response from snake_case to camelCase
        const transformedLeads: Lead[] = (data.data || []).map((apiLead: any) => ({
          id: apiLead.id,
          companyName: apiLead.company_name,
          personName: apiLead.person_name,
          email: apiLead.email,
          phone: apiLead.phone,
          linkedinProfileUrl: apiLead.linkedin_profile_url,
          country: apiLead.country,
          status: apiLead.status,
          opportunityIds: [],
          updateIds: [],
          createdAt: apiLead.created_at,
          updatedAt: apiLead.updated_at,
          assigned_user_id: apiLead.assigned_user_id,
          created_by_user_id: apiLead.created_by_user_id,
        }));
        setLeads(transformedLeads);
      })
      .finally(() => setLoading(false));
  }, [user, isAdmin]);

  return (
    <div className="container mx-auto space-y-6 mt-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold mb-2">Notifications</h1>
          <p className="text-muted-foreground">Stay updated with your latest activities and assignments.</p>
        </div>
        <div className="relative">
          <Bell className="h-8 w-8 text-muted-foreground" />
          {!isAdmin() && assignedLeadsCount > 0 && (
            <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-medium">
              {assignedLeadsCount}
            </div>
          )}
        </div>
      </div>

      {/* Show assigned leads info for regular users */}
      {!isAdmin() && user && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-blue-900 mb-1">
                Your Lead Summary
              </h3>
              <p className="text-sm text-blue-700">
                You have {assignedLeadsCount} assigned leads and {createdLeadsCount} created leads
              </p>
            </div>
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center">
                <div className="relative">
                  <UserCheck className="w-4 h-4 text-blue-500 mr-2" />
                  {assignedLeadsCount > 0 && (
                    <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-bold">
                      {assignedLeadsCount}
                    </div>
                  )}
                </div>
                <span className="text-blue-700">Assigned to you</span>
              </div>
              <div className="flex items-center">
                <UserPlus className="w-4 h-4 text-green-500 mr-2" />
                <span className="text-blue-700">Created by you</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] py-12">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] py-12">
          <Bell className="h-16 w-16 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No notifications yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="text-lg font-medium">Recent Notifications</h2>
          <ul className="space-y-4">
            {notifications.map((n) => (
              <li key={n.id} className="bg-white rounded-lg shadow p-4 border border-gray-100">
                <span className="block text-base text-gray-900">{n.message}</span>
                <span className="block text-xs text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
} 