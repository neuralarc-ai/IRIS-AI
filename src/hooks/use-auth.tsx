"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { DEMO_PIN, AUTH_TOKEN_KEY } from '@/lib/constants';
import type { User } from '@/types';

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    try {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      const userData = localStorage.getItem('iris-user-data');
      if (token && userData) {
        try {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
          setIsAuthenticated(true);
        } catch (error) {
          console.warn("Could not parse user data", error);
          setIsAuthenticated(false);
        }
      } else if (token === DEMO_PIN) {
        setIsAuthenticated(true);
        setUser({
          id: 'admin',
          name: 'Admin User',
          email: 'admin@iris.ai',
          pin: DEMO_PIN,
          createdAt: new Date().toISOString(),
          role: 'admin',
          isActive: true
        });
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      // localStorage might not be available (e.g. SSR or incognito)
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (pin: string) => {
    // First check if it's the admin PIN
    if (pin === DEMO_PIN) {
      try {
        localStorage.setItem(AUTH_TOKEN_KEY, pin);
        const adminUser = {
          id: 'admin',
          name: 'Admin User',
          email: 'admin@iris.ai',
          pin: DEMO_PIN,
          createdAt: new Date().toISOString(),
          role: 'admin',
          isActive: true
        };
        localStorage.setItem('iris-user-data', JSON.stringify(adminUser));
        setUser(adminUser);
        setIsAuthenticated(true);
        router.push('/dashboard');
        return true;
      } catch (error) {
        console.warn("Could not save auth token to localStorage", error);
      }
    }

    // If not admin PIN, try to find user in Supabase
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pin }),
      });

      if (response.ok) {
        const result = await response.json();
        const userData = result.data;
        
        try {
          localStorage.setItem(AUTH_TOKEN_KEY, pin);
          localStorage.setItem('iris-user-data', JSON.stringify(userData));
          setUser(userData);
      setIsAuthenticated(true);
      router.push('/dashboard');
      return true;
        } catch (error) {
          console.warn("Could not save auth token to localStorage", error);
        }
      }
    } catch (error) {
      console.error('Login error:', error);
    }

    setIsAuthenticated(false);
    return false;
  }, [router]);

  const logout = useCallback(() => {
    try {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem('iris-user-data');
    } catch (error) {
       console.warn("Could not remove auth token from localStorage", error);
    }
    setIsAuthenticated(false);
    setUser(null);
    router.push('/login');
  }, [router]);

  // Helper function to check if user is admin
  const isAdmin = useCallback(() => {
    if (!user) return false;
    // Check if it's the admin user (PIN 111111)
    if (user.pin === DEMO_PIN) return true;
    // Check if user has admin privileges from database
    return user.role === 'admin';
  }, [user]);

  return { isAuthenticated, isLoading, login, logout, user, isAdmin };
}
