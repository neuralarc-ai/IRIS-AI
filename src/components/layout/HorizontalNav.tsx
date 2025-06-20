"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Logo from '@/components/common/Logo';
import { Button } from '@/components/ui/button';
import { Briefcase, ListChecks, MessageSquare, LayoutDashboard, Users2, PlusCircle, Search, Users, BarChartBig } from 'lucide-react';
import UserProfile from './UserProfile';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import AddAccountDialog from '@/components/accounts/AddAccountDialog';
import Papa, { ParseResult } from 'papaparse';
import { useAuth } from '@/hooks/use-auth';

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
  const { isAdmin } = useAuth();

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
          "w-full mb-6"
        )}
        style={{ height: '80px' }} 
      >
        <div className="container mx-auto max-w-7xl flex h-full items-center justify-between px-6 py-2 whitespace-nowrap overflow-x-auto mt-4">
          <span className="font-extrabold text-[28px] flex items-center mr-12 select-none tracking-wide" style={{ letterSpacing: '0.04em' }}>IRIS AI</span>

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
          </nav>

          <div className="flex items-center gap-6 ml-6 flex-shrink-0">
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
            <UserProfile />
          </div>
        </div>
      </header>
      
      {/* Mobile Nav - Normal positioning */}
      <div 
        className={cn(
          "md:hidden w-full flex items-center justify-around py-2 overflow-x-auto px-2"
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
    </>
  );
}
