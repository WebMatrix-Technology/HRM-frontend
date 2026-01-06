'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  User,
  Mail, 
  Phone, 
  Calendar,
  MapPin,
  Briefcase,
  Building2,
  ArrowLeft,
  Edit,
  Shield,
  Clock,
  DollarSign,
  UserCheck,
  UserX
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuthStore } from '@/store/authStore';
import { Role } from '@/types';
import { employeeService, Employee } from '@/services/employee.service';

export default function UserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user: currentUser } = useAuthStore();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const userId = params.id as string;
  const isAdmin = currentUser?.role === Role.ADMIN;
  const isHR = currentUser?.role === Role.HR;
  const isManager = currentUser?.role === Role.MANAGER;
  const canAccess = isAdmin || isHR || isManager;

  useEffect(() => {
    if (!canAccess) {
      router.replace('/dashboard');
      return;
    }

    loadEmployee();
  }, [userId, canAccess]);

  const loadEmployee = async () => {
    try {
      setLoading(true);
      setError(null);
      const employeeData = await employeeService.getEmployeeById(userId);
      setEmployee(employeeData);
    } catch (err: any) {
      console.error('Failed to load employee:', err);
      setError(err.response?.data?.message || 'Failed to load employee details');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getRoleBadgeColor = (role?: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      case 'HR':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'MANAGER':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'EMPLOYEE':
        return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

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
    },
  };

  if (!canAccess) {
    return null;
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: [0, 0, 1, 1] as const }}
            className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"
          />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !employee) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserX className="w-12 h-12 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            Employee Not Found
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            {error || 'The employee you are looking for could not be found.'}
          </p>
          <motion.button
            onClick={() => router.back()}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </motion.button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <motion.div
        className="space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.button
              onClick={() => router.back()}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </motion.button>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                Employee Details
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                View employee information and details
              </p>
            </div>
          </div>
          {(isAdmin || isHR) && (
            <motion.button
              onClick={() => router.push(`/users/${userId}/edit`)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Edit className="w-4 h-4" />
              Edit Employee
            </motion.button>
          )}
        </motion.div>

        {/* Employee Profile Card */}
        <motion.div
          variants={itemVariants}
          className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-lg border border-slate-200 dark:border-slate-700"
        >
          <div className="flex flex-col md:flex-row gap-8">
            {/* Avatar and Basic Info */}
            <div className="flex flex-col items-center text-center md:items-start md:text-left">
              <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-4xl mb-4">
                {employee.avatar ? (
                  <img
                    src={employee.avatar}
                    alt={`${employee.firstName} ${employee.lastName}`}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  `${employee.firstName[0]}${employee.lastName[0]}`
                )}
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                {employee.firstName} {employee.lastName}
              </h2>
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                ID: {employee.employeeId}
              </p>
              <div className="flex items-center gap-2 mb-4">
                <span
                  className={`px-3 py-1 text-sm font-semibold rounded-full ${
                    employee.isActive
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                  }`}
                >
                  {employee.isActive ? 'Active' : 'Inactive'}
                </span>
                {employee.user?.role && (
                  <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getRoleBadgeColor(employee.user.role)}`}>
                    {employee.user.role}
                  </span>
                )}
              </div>
            </div>

            {/* Details Grid */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2">
                  Contact Information
                </h3>
                
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Email</p>
                    <p className="text-slate-900 dark:text-white">{employee.user?.email || 'Not provided'}</p>
                  </div>
                </div>

                {employee.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-slate-400" />
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Phone</p>
                      <p className="text-slate-900 dark:text-white">{employee.phone}</p>
                    </div>
                  </div>
                )}

                {(employee.address || employee.city) && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-slate-400 mt-1" />
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Address</p>
                      <p className="text-slate-900 dark:text-white">
                        {employee.address && `${employee.address}`}
                        {employee.city && `${employee.address ? ', ' : ''}${employee.city}`}
                        {employee.state && `, ${employee.state}`}
                        {employee.zipCode && ` ${employee.zipCode}`}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Employment Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2">
                  Employment Details
                </h3>

                {employee.position && (
                  <div className="flex items-center gap-3">
                    <Briefcase className="w-5 h-5 text-slate-400" />
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Position</p>
                      <p className="text-slate-900 dark:text-white">{employee.position}</p>
                    </div>
                  </div>
                )}

                {employee.department && (
                  <div className="flex items-center gap-3">
                    <Building2 className="w-5 h-5 text-slate-400" />
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Department</p>
                      <p className="text-slate-900 dark:text-white">{employee.department}</p>
                    </div>
                  </div>
                )}

                {employee.employmentType && (
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-slate-400" />
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Employment Type</p>
                      <p className="text-slate-900 dark:text-white">
                        {employee.employmentType.replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                )}


                {employee.salary && isAdmin && (
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-5 h-5 text-slate-400" />
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Salary</p>
                      <p className="text-slate-900 dark:text-white">
                        ${employee.salary.toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Personal Information */}
        {(employee.dateOfBirth || employee.country) && (
          <motion.div
            variants={itemVariants}
            className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700"
          >
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-3 mb-4">
              Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {employee.dateOfBirth && (
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Date of Birth</p>
                    <p className="text-slate-900 dark:text-white">
                      {formatDate(employee.dateOfBirth)}
                    </p>
                  </div>
                </div>
              )}

              {employee.country && (
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Country</p>
                    <p className="text-slate-900 dark:text-white">{employee.country}</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Account Information */}
        <motion.div
          variants={itemVariants}
          className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700"
        >
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-3 mb-4">
            Account Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center gap-3">
              <UserCheck className="w-5 h-5 text-slate-400" />
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Account Status</p>
                <p className="text-slate-900 dark:text-white">
                  {employee.user?.isActive ? 'Active' : 'Inactive'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-slate-400" />
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Role</p>
                <p className="text-slate-900 dark:text-white">
                  {employee.user?.role || 'Not assigned'}
                </p>
              </div>
            </div>

          </div>
        </motion.div>
      </motion.div>
    </DashboardLayout>
  );
}
