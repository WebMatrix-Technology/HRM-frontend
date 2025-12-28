'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Users,
  Clock,
  Calendar,
  TrendingUp,
  Briefcase,
  MessageSquare,
  UsersRound,
  ArrowRight,
  UserCheck,
  ClockCheck,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { dashboardService, DashboardStats } from '@/services/dashboard.service';

const dashboardCards = [
  {
    name: 'Employees',
    href: '/employees',
    icon: Users,
    description: 'Manage employee information',
    color: 'from-blue-500 to-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  {
    name: 'Attendance',
    href: '/attendance',
    icon: Clock,
    description: 'Track employee attendance',
    color: 'from-green-500 to-green-600',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    iconColor: 'text-green-600 dark:text-green-400',
  },
  {
    name: 'Leave',
    href: '/leave',
    icon: Calendar,
    description: 'Manage leave requests',
    color: 'from-purple-500 to-purple-600',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    iconColor: 'text-purple-600 dark:text-purple-400',
  },
  {
    name: 'Performance',
    href: '/performance',
    icon: TrendingUp,
    description: 'Performance reviews',
    color: 'from-indigo-500 to-indigo-600',
    bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
    iconColor: 'text-indigo-600 dark:text-indigo-400',
  },
  {
    name: 'Recruitment',
    href: '/recruitment',
    icon: Briefcase,
    description: 'Job postings & applications',
    color: 'from-pink-500 to-pink-600',
    bgColor: 'bg-pink-50 dark:bg-pink-900/20',
    iconColor: 'text-pink-600 dark:text-pink-400',
  },
  {
    name: 'Chat',
    href: '/chat',
    icon: MessageSquare,
    description: 'One-to-one messaging',
    color: 'from-cyan-500 to-cyan-600',
    bgColor: 'bg-cyan-50 dark:bg-cyan-900/20',
    iconColor: 'text-cyan-600 dark:text-cyan-400',
  },
  {
    name: 'Group Chat',
    href: '/group-chat',
    icon: UsersRound,
    description: 'Team discussions',
    color: 'from-orange-500 to-orange-600',
    bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    iconColor: 'text-orange-600 dark:text-orange-400',
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const { user, employee, isAuthenticated, fetchUser } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    activeEmployees: 0,
    inactiveEmployees: 0,
    activeToday: 0,
    onLeave: 0,
    pendingRequests: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    const checkAuth = async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (!isMounted) return;
      
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      
      if (token) {
        if (isAuthenticated && !user) {
          try {
            await fetchUser();
          } catch (error) {
            console.error('Failed to fetch user:', error);
          }
        } else if (!isAuthenticated) {
          try {
            await fetchUser();
          } catch (error) {
            console.error('Failed to fetch user:', error);
            if (isMounted && !localStorage.getItem('accessToken')) {
              router.replace('/auth/login');
            }
          }
        }
        return;
      }
      
      if (!token && !isAuthenticated) {
        if (isMounted) {
          router.replace('/auth/login');
        }
      }
    };

    checkAuth();
    
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, user?.id, router]);

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoadingStats(true);
        const dashboardStats = await dashboardService.getDashboardStats();
        setStats(dashboardStats);
      } catch (error) {
        console.error('Failed to load dashboard stats:', error);
      } finally {
        setLoadingStats(false);
      }
    };

    if (isAuthenticated && user) {
      loadStats();
    }
  }, [isAuthenticated, user]);

  if (!isAuthenticated || !user) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: [0, 0, 1, 1] as const }}
              className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full mx-auto"
            />
            <p className="mt-4 text-slate-600 dark:text-slate-400">Loading...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.4, 0, 0.2, 1] as const,
      },
    },
  };

  return (
    <DashboardLayout>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {/* Welcome Section */}
        <motion.div variants={itemVariants} className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Welcome back, <span className="gradient-text">{employee ? employee.firstName : user.email.split('@')[0]}</span>! 👋
          </h1>
          <p className="text-cyan-400/70">
            Here's what's happening with your HRM system today.
          </p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0 }}
            whileHover={{ scale: 1.02, y: -4 }}
            className="glass rounded-2xl p-6 shadow-lg shadow-primary-500/10"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/20">
                <UserCheck className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">
              {loadingStats ? '...' : stats.totalEmployees}
            </h3>
            <p className="text-sm text-cyan-400/70">Total Employees</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            whileHover={{ scale: 1.02, y: -4 }}
            className="glass rounded-2xl p-6 shadow-lg shadow-primary-500/10"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-green-100 dark:bg-green-900/20">
                <ClockCheck className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">
              {loadingStats ? '...' : stats.activeToday}
            </h3>
            <p className="text-sm text-cyan-400/70">Active Today</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            whileHover={{ scale: 1.02, y: -4 }}
            className="glass rounded-2xl p-6 shadow-lg shadow-primary-500/10"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-orange-100 dark:bg-orange-900/20">
                <Calendar className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">
              {loadingStats ? '...' : stats.onLeave}
            </h3>
            <p className="text-sm text-cyan-400/70">On Leave</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            whileHover={{ scale: 1.02, y: -4 }}
            className="glass rounded-2xl p-6 shadow-lg shadow-primary-500/10"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-900/20">
                <Briefcase className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">
              {loadingStats ? '...' : stats.pendingRequests}
            </h3>
            <p className="text-sm text-cyan-400/70">Pending Requests</p>
          </motion.div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div variants={itemVariants}>
          <h2 className="text-2xl font-bold text-white mb-6">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {dashboardCards.map((card, index) => {
              const Icon = card.icon;
              return (
                <motion.div
                  key={card.name}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.05, y: -8 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link href={card.href}>
                    <div className="glass rounded-2xl p-6 shadow-lg hover:shadow-2xl hover:shadow-primary-500/20 transition-all duration-300 group cursor-pointer h-full hover:border-cyan-500/50">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-xl font-semibold text-white mb-2">
                        {card.name}
                      </h3>
                      <p className="text-sm text-cyan-400/70 mb-4">
                        {card.description}
                      </p>
                      <div className="flex items-center gradient-text font-medium text-sm group-hover:gap-2 transition-all">
                        <span>Open</span>
                        <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </motion.div>
    </DashboardLayout>
  );
}
