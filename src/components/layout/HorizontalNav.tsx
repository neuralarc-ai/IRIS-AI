"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Logo from '@/components/common/Logo';
import { Button } from '@/components/ui/button';
import { Briefcase, ListChecks, MessageSquare, LayoutDashboard, Users2, PlusCircle, Search, Users, BarChartBig, Bell, Menu } from 'lucide-react';
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
          style={{ width: '100%', maxWidth: '1376px', paddingLeft: 0, paddingRight: 0 }}
        >
          <span className="font-extrabold text-[28px] flex items-center mr-12 select-none tracking-wide" style={{ letterSpacing: '0.04em' }}>IRIS AI</span>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6 px-2 flex-shrink-0">
            {filteredNavItems.map((item) => (
              <Button
                key={item.href}
                variant="ghost"
                size="sm"
                asChild
                className={cn(
                  "flex flex-col items-center gap-1 px-4 py-2 shadow-none border-none bg-transparent text-black hover:underline hover:bg-transparent transition-all duration-150 text-[15px] min-w-[70px]",
                  (pathname === item.href || 
                    (pathname.startsWith(item.href) && 
                      (item.href === '/dashboard' ? pathname === '/dashboard' : true))) &&
                  "font-semibold underline"
                )}
                style={{ boxShadow: 'none', background: 'none' }}
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

          {/* Mobile Menu Button */}
          <button
            className="md:hidden flex items-center justify-center p-2 rounded focus:outline-none border border-gray-300 bg-white"
            onClick={() => setMobileMenuOpen((open) => !open)}
            aria-label="Open menu"
          >
            <Menu className="h-7 w-7" />
          </button>

          <div className="hidden md:flex items-center">
            <UserProfile />
          </div>
        </div>
      </header>
      {/* Mobile Nav Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex md:hidden">
          <div className="bg-white w-64 h-full shadow-lg flex flex-col p-4">
            <div className="flex items-center justify-between mb-6">
              <span className="font-extrabold text-[24px] tracking-wide">IRIS AI</span>
              <button onClick={() => setMobileMenuOpen(false)} className="p-2 rounded focus:outline-none">
                <span className="text-xl">×</span>
              </button>
            </div>
            {filteredNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 py-3 px-2 rounded text-[16px] font-medium hover:bg-gray-100 transition-all",
                  pathname === item.href && "bg-gray-100 font-bold"
                )}
                onClick={() => setMobileMenuOpen(false)}
              >
                <item.icon className="h-6 w-6" />
                {item.label}
              </Link>
            ))}
            {user && !isAdmin() && (
              <Link
                href="/notifications"
                className="flex items-center gap-3 py-3 px-2 rounded text-[16px] font-medium hover:bg-gray-100 transition-all"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Bell className="h-6 w-6" />
                Notifications
                {assignedLeadsCount > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold shadow-md border-2 border-white">
                    {assignedLeadsCount}
                  </span>
                )}
              </Link>
            )}
            <Button
              variant="outline"
              className="mt-6 w-full flex items-center justify-center gap-2"
              onClick={() => {
                setIsAddAccountDialogOpen(true);
                setMobileMenuOpen(false);
              }}
            >
              <PlusCircle className="h-6 w-6" /> Quick Create
            </Button>
            <div className="mt-auto pt-8">
              <UserProfile />
            </div>
          </div>
          <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
        </div>
      )}
      {/* Mobile Nav - Normal positioning */}
      <div 
        className={cn(
          "md:hidden w-full flex items-center justify-around py-2 overflow-hidden px-2"
        )}
        style={{ height: '60px' }} 
      >
        {/* Hide mobile nav bar if menu is open */}
        {!mobileMenuOpen && (
          filteredNavItems.map((item) => (
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
          ))
        )}
      </div>
      <AddAccountDialog open={isAddAccountDialogOpen} onOpenChange={setIsAddAccountDialogOpen} />
    </>
  );
}
