'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import Sidebar from './Sidebar';
import Header from './Header';
import DemoRoleSwitcher from './DemoRoleSwitcher';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, isAuthenticated, fetchUser } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Initialize user data on mount if we have a token but no user data
    const initializeAuth = async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

      // If there's a token but no user data, fetch it
      if (token && !user) {
        try {
          await fetchUser();
        } catch (error) {
          console.error('Failed to initialize auth:', error);
        }
      }
    };

    initializeAuth();
    setMounted(true);
  }, []); // Only run once on mount

  if (!mounted) {
    return null;
  }

  return (
    <div className="flex h-screen bg-dark-bg relative">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">{children}</div>
        </main>
      </div>
      <DemoRoleSwitcher />
    </div>
  );
}


