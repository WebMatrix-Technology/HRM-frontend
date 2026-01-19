'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Clock,
  Calendar,
  DollarSign,
  TrendingUp,
  Briefcase,
  MessageSquare,
  UsersRound,
  LogOut,
  User,
  FileCheck,
  Target,
  ListTodo,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { Role } from '@/types';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: [Role.ADMIN, Role.HR, Role.MANAGER, Role.EMPLOYEE] },
  { name: 'Users', href: '/users', icon: User, roles: [Role.ADMIN, Role.HR, Role.MANAGER] },
  { name: 'Employees', href: '/employees', icon: Users, roles: [Role.ADMIN, Role.HR, Role.MANAGER, Role.EMPLOYEE] },
  { name: 'Projects', href: '/projects', icon: Target, roles: [Role.ADMIN, Role.HR, Role.MANAGER] },
  { name: 'Product Backlog', href: '/pbi', icon: ListTodo, roles: [Role.ADMIN, Role.HR, Role.MANAGER, Role.EMPLOYEE] },
  { name: 'Attendance', href: '/attendance', icon: Clock, roles: [Role.ADMIN, Role.HR, Role.MANAGER, Role.EMPLOYEE] },
  { name: 'Leave', href: '/leave', icon: Calendar, roles: [Role.ADMIN, Role.HR, Role.MANAGER, Role.EMPLOYEE] },
  { name: 'Payroll Processing', href: '/allotments', icon: FileCheck, roles: [Role.ADMIN, Role.HR] },
  { name: 'Performance', href: '/performance', icon: TrendingUp, roles: [Role.ADMIN, Role.HR, Role.MANAGER] },
  { name: 'Recruitment', href: '/recruitment', icon: Briefcase, roles: [Role.ADMIN, Role.HR, Role.MANAGER] },
  { name: 'Chat', href: '/chat', icon: MessageSquare, roles: [Role.ADMIN, Role.HR, Role.MANAGER, Role.EMPLOYEE] },
  { name: 'Group Chat', href: '/group-chat', icon: UsersRound, roles: [Role.ADMIN, Role.HR, Role.MANAGER, Role.EMPLOYEE] },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, employee, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    window.location.href = '/auth/login';
  };

  return (
    <motion.div
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="hidden md:flex md:flex-shrink-0"
    >
      <div className="flex flex-col w-64">
        <div className="flex flex-col flex-grow glass border-r border-dark-border pt-5 pb-4 overflow-y-auto custom-scrollbar">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0 px-4 mb-8">
            <motion.div
              className="flex items-center gap-3"
              whileHover={{ scale: 1.05 }}
            >
              <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/50">
                <LayoutDashboard className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold gradient-text uppercase tracking-tight">
                  WebMatrix
                </h1>
                <p className="text-xs text-cyan-400/70">
                  HRM System
                </p>
              </div>
            </motion.div>
          </div>

          {/* Navigation */}
          <div className="mt-5 flex-1 flex flex-col px-3 space-y-1">
            {navigation
              .filter((item) => {
                // Filter navigation items based on user role
                if (!item.roles || !user?.role) return true;
                return item.roles.includes(user.role);
              })
              .map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <motion.div
                    key={item.name}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Link
                      href={item.href}
                      className={`
                        group flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200
                        ${isActive
                          ? 'bg-gradient-primary text-white shadow-lg shadow-primary-500/50'
                          : 'text-cyan-300/80 hover:bg-dark-surface hover:text-cyan-400'
                        }
                      `}
                    >
                      <Icon
                        className={`
                          mr-3 h-5 w-5 flex-shrink-0
                          ${isActive ? 'text-white' : 'text-cyan-400/60'}
                        `}
                      />
                      {item.name}
                    </Link>
                  </motion.div>
                );
              })}
          </div>

          {/* User Section */}
          <div className="mt-auto px-3 pb-4">
            <Link href="/profile">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="bg-dark-surface/50 rounded-xl p-4 mb-3 cursor-pointer hover:bg-dark-surface transition-colors border border-dark-border"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">
                      {employee
                        ? `${employee.firstName} ${employee.lastName}`
                        : user?.email}
                    </p>
                    <p className="text-xs text-cyan-400/70 capitalize">
                      {user?.role?.toLowerCase() || 'User'}
                    </p>
                  </div>
                </div>
              </motion.div>
            </Link>

            <motion.button
              onClick={handleLogout}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center px-3 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Sign Out
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

