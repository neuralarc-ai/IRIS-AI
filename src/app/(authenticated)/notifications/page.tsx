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
  const [unreadCount, setUnreadCount] = useState(0);

  // Calculate assigned leads count
  const assignedLeadsCount = leads.filter(lead => lead.assigned_user_id === user?.id).length;
  const createdLeadsCount = leads.filter(lead => lead.created_by_user_id === user?.id).length;

  useEffect(() => {
    if (!user) return;
    setLoading(true);

    // Mark all notifications as read when visiting the page
    fetch(`/api/notifications?user_id=${user.id}`, { method: 'PATCH' });

    // Fetch notifications
    fetch(`/api/notifications?user_id=${user.id}`)
      .then(res => res.json())
      .then(data => {
        setNotifications(data.data || []);
        // Count unread notifications
        setUnreadCount((data.data || []).filter((n: any) => n.is_read === false).length);
      });

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
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] py-12">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] py-12">
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