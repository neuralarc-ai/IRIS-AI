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

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/leads', label: 'Leads', icon: Users },
  { href: '/accounts', label: 'Accounts', icon: Briefcase },
  { href: '/opportunities', label: 'Opportunities', icon: BarChartBig },
  { href: '/updates', label: 'Updates', icon: MessageSquare },
  { href: '/settings/users', label: 'User Management', icon: Users2 },
];

export default function HorizontalNav() {
  const pathname = usePathname();
  const [isAddAccountDialogOpen, setIsAddAccountDialogOpen] = useState(false);

  return (
    <>
      <header 
        className={cn(
          "w-full border-b",
          "bg-[#2B2521]", 
          "border-gray-700"
        )}
        style={{ height: '70px' }} 
      >
        <div className="container mx-auto flex h-full items-center justify-between px-4 py-2"> 
          <div className="flex items-center">
            <Link href="/dashboard" className="mr-8">
              <Logo iconSize={28} textSize="text-2xl" className="text-[#EFEDEB] bg-transparent" /> 
            </Link>
          </div>

          <div className="flex flex-1 items-center justify-end gap-2"> 
            <Button variant="ghost" size="icon" className="hidden sm:inline-flex text-[#EFEDEB] hover:text-[#EFEDEB]/90"> 
              <Search className="h-5 w-5" />
              <span className="sr-only">Search</span>
            </Button>

            <nav className="hidden md:flex items-center gap-2">
              {navItems.map((item) => (
                <Button
                  key={item.href}
                  variant="ghost"
                  size="sm"
                  asChild
                  className={cn(
                    "text-[#EFEDEB] hover:text-[#EFEDEB]/90 hover:bg-white/5 font-normal text-base leading-6 tracking-normal font-sans px-4 h-9 min-w-[140px]",
                    (pathname === item.href || 
                      (pathname.startsWith(item.href) && 
                        (item.href === '/dashboard' ? pathname === '/dashboard' : true))) &&
                    "text-[#EFEDEB] bg-white/10 font-semibold",
                    item.label === "User Management" && "bg-white text-black hover:bg-white hover:text-black"
                  )}
                >
                  <Link href={item.href}>
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.label}
                  </Link>
                </Button>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              <Button
                variant="outline" 
                size="sm"
                className="h-9 min-w-[140px] border-gray-500 font-normal text-base leading-6 tracking-normal font-sans text-black bg-white px-4"
                onClick={() => setIsAddAccountDialogOpen(true)}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Quick Create
              </Button>
              <UserProfile />
            </div>
          </div>
        </div>
      </header>
      
      {/* Mobile Nav - Normal positioning */}
      <div 
        className={cn(
          "md:hidden w-full flex items-center justify-around border-t py-2 overflow-x-auto",
          "bg-[#2B2521]", 
          "border-gray-700"
        )}
        style={{ height: '50px' }} 
      >
        {navItems.map((item) => (
          <Button
            key={item.href}
            variant="ghost"
            size="sm"
            asChild
            className={cn(
              "flex-1 justify-center text-xs text-[#EFEDEB] px-2 min-w-max hover:bg-white/5 font-normal text-base leading-6 tracking-normal font-sans", 
              (pathname === item.href || 
                (pathname.startsWith(item.href) && 
                  (item.href === '/dashboard' ? pathname === '/dashboard' : true))) &&
              "text-[#EFEDEB] font-semibold" 
            )}
          >
            <Link href={item.href} className="flex flex-col items-center">
              <item.icon className="h-5 w-5 mb-1" />
              <span className="truncate">{item.label}</span>
            </Link>
          </Button>
        ))}
      </div>
      
      <AddAccountDialog open={isAddAccountDialogOpen} onOpenChange={setIsAddAccountDialogOpen} />
    </>
  );
}
