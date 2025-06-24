"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Logo from '@/components/common/Logo';
import { Button } from '@/components/ui/button';
import { Briefcase, ListChecks, MessageSquare, LayoutDashboard, Users2, PlusCircle, Search, Users, BarChartBig, Bell } from 'lucide-react';
import UserProfile from './UserProfile';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import AddAccountDialog from '@/components/accounts/AddAccountDialog';
import Papa, { ParseResult } from 'papaparse';
import { useAuth } from '@/hooks/use-auth';
import type { Lead } from '@/types';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/leads', label: 'Leads', icon: Users },
  { href: '/accounts', label: 'Accounts', icon: Briefcase },
  { href: '/opportunities', label: 'Opportunities', icon: BarChartBig },
  { href: '/updates', label: 'Updates', icon: MessageSquare },
  { href: '/settings/users', label: 'User Management', icon: Users2, adminOnly: true },
];

export default function HorizontalNav() {
  const pathname = usePathname();
  const [isAddAccountDialogOpen, setIsAddAccountDialogOpen] = useState(false);
  const { isAdmin, user } = useAuth();
  const [assignedLeadsCount, setAssignedLeadsCount] = useState(0);

  // Fetch assigned leads count for notification badge
  useEffect(() => {
    if (!user || isAdmin()) return;
    
    fetch('/api/leads', {
      headers: {
        'x-user-id': user.id,
        'x-user-admin': 'false',
      },
    })
      .then(res => res.json())
      .then(data => {
        const leads: Lead[] = (data.data || []).map((apiLead: any) => ({
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
        
        const assignedCount = leads.filter(lead => lead.assigned_user_id === user.id).length;
        setAssignedLeadsCount(assignedCount);
      })
      .catch(error => {
        console.error('Error fetching leads for notification badge:', error);
      });
  }, [user, isAdmin]);

  // Debug logging
  console.log('Nav Debug:', { 
    user: user?.id, 
    userName: user?.name,
    userRole: user?.role,
    userPin: user?.pin,
    isAdmin: isAdmin(), 
    showNotification: user && !isAdmin() 
  });

  // Filter navigation items based on admin status
  const filteredNavItems = navItems.filter(item => {
    if (item.adminOnly) {
      return isAdmin();
    }
    return true;
  });

  return (
    <>
      <header 
        className={cn(
          "w-full mb-6 border-b border-b-gray-200 pb-6 overflow-hidden"
        )}
        style={{ height: '80px' }} 
      >
        <div
          className="mx-auto flex h-full items-center justify-between py-2 whitespace-nowrap overflow-hidden mt-4 px-0"
          style={{ width: '1376px', paddingLeft: 0, paddingRight: 0 }}
        >
          <span className="font-extrabold text-[28px] flex items-center mr-12 select-none tracking-wide" style={{ letterSpacing: '0.04em' }}>IRIS AI</span>

          <nav className="hidden md:flex items-center gap-6 px-2 flex-shrink-0">
            {filteredNavItems.map((item) => (
              <Button
                key={item.href}
                variant="ghost"
                size="sm"
                asChild
                className={cn(
                  "flex flex-col items-center gap-1 px-4 py-2 shadow-none border-none bg-transparent text-black transition-all duration-150 text-[15px] min-w-[70px]",
                  (pathname === item.href || 
                    (pathname.startsWith(item.href) && 
                      (item.href === '/dashboard' ? pathname === '/dashboard' : true))) &&
                  "font-bold active-nav-item"
                )}
                style={{ boxShadow: 'none', background: 'none' }}
                onMouseEnter={e => {
                  e.currentTarget.classList.add('hovered-nav');
                }}
                onMouseLeave={e => {
                  e.currentTarget.classList.remove('hovered-nav');
                }}
              >
                <Link href={item.href} className="flex flex-col items-center gap-1">
                  <item.icon className="h-7 w-7" />
                  <span className="text-[16px] leading-tight text-center">{item.label}</span>
                </Link>
              </Button>
            ))}
            {/* Notification Tab for regular users only, after Updates */}
            {user && !isAdmin() && (
              <Button
                variant="ghost"
                size="sm"
                className="flex flex-col items-center gap-1 px-4 py-2 shadow-none border-none bg-transparent text-black hover:underline hover:bg-transparent transition-all duration-150 text-[15px] min-w-[70px]"
                style={{ boxShadow: 'none', background: 'none' }}
                asChild
              >
                <a href="/notifications" className="flex flex-col items-center gap-1 relative">
                  <Bell className="h-7 w-7" />
                  {assignedLeadsCount > 0 && (
                    <span className="absolute top-2 transform translate-x-1/2 -translate-y-1/2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold shadow-md border-2 border-white">
                      {assignedLeadsCount}
                    </span>
                  )}
                  <span className="text-[15px] leading-tight text-center">Notifications</span>
                </a>
              </Button>
            )}
            <Button
              variant="ghost" 
              size="sm"
              className="flex flex-col items-center gap-1 px-4 py-2 shadow-none border-none bg-transparent text-black hover:underline hover:bg-transparent transition-all duration-150 text-[15px] min-w-[70px]"
              onClick={() => setIsAddAccountDialogOpen(true)}
              style={{ boxShadow: 'none', background: 'none' }}
            >
              <PlusCircle className="h-7 w-7" />
              <span className="text-[15px] leading-tight text-center">Quick Create</span>
            </Button>
          </nav>

          <div className="flex items-center">
            <UserProfile />
          </div>
        </div>
      </header>
      
      {/* Mobile Nav - Normal positioning */}
      <div 
        className={cn(
          "md:hidden w-full flex items-center justify-around py-2 overflow-hidden px-2"
        )}
        style={{ height: '60px' }} 
      >
        {filteredNavItems.map((item) => (
          <Button
            key={item.href}
            variant="ghost"
            size="sm"
            asChild
            className={cn(
              "flex flex-col items-center gap-1 flex-1 justify-center text-[15px] px-2 py-2 min-w-[60px] shadow-none border-none bg-transparent text-black hover:underline hover:bg-transparent transition-all duration-150", 
              (pathname === item.href || 
                (pathname.startsWith(item.href) && 
                  (item.href === '/dashboard' ? pathname === '/dashboard' : true))) &&
              "font-semibold underline" 
            )}
            style={{ boxShadow: 'none', background: 'none' }}
          >
            <Link href={item.href} className="flex flex-col items-center gap-1">
              <item.icon className="h-7 w-7" />
              <span className="truncate text-[15px] leading-tight text-center">{item.label}</span>
            </Link>
          </Button>
        ))}
      </div>
      
      <AddAccountDialog open={isAddAccountDialogOpen} onOpenChange={setIsAddAccountDialogOpen} />
      <style jsx global>{`
        .hovered-nav:not(.active-nav-item) {
          background: #F3EEE9 !important;
          border-radius: 0.5rem;
          transition: background 0.18s;
          text-decoration: none;
        }
        .active-nav-item .text-center {
          font-weight: 700;
          color: #B89B6A !important;
        }
        .active-nav-item .h-7, .active-nav-item .w-7 {
          color: #B89B6A !important;
        }
      `}</style>
    </>
  );
}
