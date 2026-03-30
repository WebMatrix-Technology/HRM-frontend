'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { leaveService, Leave, LeaveBalance } from '@/services/leave.service';
import { employeeService, Employee } from '@/services/employee.service';
import Datepicker from 'react-tailwindcss-datepicker';
import {
  Calendar,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { Role } from '@/types';

export default function LeavePage() {
  const { employee, user } = useAuthStore();
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [balance, setBalance] = useState<LeaveBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [activeTab, setActiveTab] = useState<'MY_LEAVES' | 'TEAM_LEAVES'>('MY_LEAVES');
  const [formData, setFormData] = useState({
    type: 'VACATION' as Leave['type'],
    startDate: '',
    endDate: '',
    reason: '',
    employeeId: '',
  });

  const isPrivileged = user?.role === Role.HR_MANAGER || user?.role === Role.ADMIN;

  useEffect(() => {
    loadLeaves();
    loadBalance();
    if (isPrivileged) {
      loadEmployees();
    }
  }, [isPrivileged]);

  const loadLeaves = async () => {
    try {
      setLoading(true);
      const data = await leaveService.getLeaves();
      setLeaves(data);
    } catch (error) {
      console.error('Failed to load leaves:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBalance = async () => {
    try {
      const data = await leaveService.getLeaveBalance();
      setBalance(data);
    } catch (error) {
      console.error('Failed to load leave balance:', error);
    }
  };

  const loadEmployees = async () => {
    try {
      const data = await employeeService.getEmployees(1, 1000, { isActive: true });
      setEmployees(data.employees);
    } catch (error) {
      console.error('Failed to load employees:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await leaveService.applyLeave(formData);
      setShowForm(false);
      setFormData({ type: 'VACATION', startDate: '', endDate: '', reason: '', employeeId: '' });
      await loadLeaves();
      await loadBalance();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to apply leave');
    }
  };

  const handleApprove = async (id: string) => {
    try {
      setProcessingId(id);
      await leaveService.approveLeave(id);
      await loadLeaves();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to approve leave');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string) => {
    const reason = window.prompt('Enter rejection reason:');
    if (reason === null) return; // cancelled

    try {
      setProcessingId(id);
      await leaveService.rejectLeave(id, reason);
      await loadLeaves();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to reject leave');
    } finally {
      setProcessingId(null);
    }
  };

  const canReview = (leave: Leave) => {
    if (!user) return false;
    if (leave.status !== 'PENDING') return false;

    // Admin can review anyone
    if (user.role === Role.ADMIN) return true;

    // HR can only review employees
    if (user.role === Role.HR_MANAGER) {
      const targetRole = leave.employee?.userId?.role;
      return targetRole === Role.EMPLOYEE;
    }

    return false;
  };

  const getStatusBadge = (status: Leave['status']) => {
    const styles = {
      PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      APPROVED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    };
    const icons = {
      PENDING: AlertCircle,
      APPROVED: CheckCircle2,
      REJECTED: XCircle,
    };
    const Icon = icons[status];
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${styles[status]}`}>
        <Icon className="w-3 h-3" />
        {status}
      </span>
    );
  };

  const getTypeColor = (type: Leave['type']) => {
    const colors: Record<Leave['type'], string> = {
      SICK: 'text-red-600',
      VACATION: 'text-blue-600',
      PERSONAL: 'text-purple-600',
      MATERNITY: 'text-pink-600',
      PATERNITY: 'text-indigo-600',
      OTHER: 'text-slate-600',
    };
    return colors[type] || 'text-slate-600';
  };

  const myLeaves = leaves.filter((l) => l.employeeId === employee?.id);
  const teamLeaves = leaves.filter((l) => l.employeeId !== employee?.id);
  const displayedLeaves = activeTab === 'MY_LEAVES' ? myLeaves : teamLeaves;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Calendar className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              Leave Management
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Apply for leave and track your leave balance
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors shadow-lg"
          >
            <Plus className="w-5 h-5" />
            {isPrivileged ? 'Assign / Apply Leave' : 'Apply Leave'}
          </button>
        </div>

        {/* Apply Leave Form */}
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700"
          >
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
              {isPrivileged ? 'Assign or Apply for Leave' : 'Apply for Leave'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {isPrivileged && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Select Employee (Optional - Leave empty for yourself)
                  </label>
                  <select
                    value={formData.employeeId}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="">Myself</option>
                    {employees.map((emp) => (
                      <option key={emp.employeeId} value={emp.employeeId}>
                        {emp.firstName} {emp.lastName} ({emp.employeeId})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Leave Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as Leave['type'] })}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  required
                >
                  <option value="VACATION">Vacation</option>
                  <option value="SICK">Sick Leave</option>
                  <option value="PERSONAL">Personal</option>
                  <option value="MATERNITY">Maternity</option>
                  <option value="PATERNITY">Paternity</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Leave Duration
                </label>
                <div className="relative z-50">
                  <Datepicker
                    primaryColor="purple"
                    value={{ startDate: formData.startDate as any || null, endDate: formData.endDate as any || null }}
                    onChange={(newValue: any) => setFormData({ ...formData, startDate: newValue?.startDate || '', endDate: newValue?.endDate || '' })}
                    displayFormat="DD MMM YYYY"
                    inputClassName="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    popoverDirection="down"
                    useRange={true}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Reason
                </label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  rows={4}
                  required
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                >
                  Submit
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Leave History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden"
        >
          <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Leave History</h2>
            {isPrivileged && (
              <div className="flex bg-slate-100 dark:bg-slate-700/50 p-1 rounded-lg">
                <button
                  onClick={() => setActiveTab('MY_LEAVES')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'MY_LEAVES'
                    ? 'bg-white dark:bg-slate-600 shadow text-purple-600 dark:text-purple-400'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                >
                  My Leaves
                </button>
                <button
                  onClick={() => setActiveTab('TEAM_LEAVES')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'TEAM_LEAVES'
                    ? 'bg-white dark:bg-slate-600 shadow text-purple-600 dark:text-purple-400'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                >
                  Team Leaves
                </button>
              </div>
            )}
          </div>
          <div className="p-6 space-y-4">
            {displayedLeaves.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Calendar className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                <p>No leave applications found</p>
              </div>
            ) : (
              displayedLeaves.map((leave) => (
                <div
                  key={leave.id}
                  className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`font-semibold ${getTypeColor(leave.type)}`}>
                          {leave.type}
                        </span>
                        {getStatusBadge(leave.status)}
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                        <p>
                          {new Date(leave.startDate).toLocaleDateString()} -{' '}
                          {new Date(leave.endDate).toLocaleDateString()}
                        </p>
                        <p>{leave.days} day(s)</p>
                        <p className="mt-2">{leave.reason}</p>
                        <p className="border-t border-slate-100 dark:border-slate-700/50 pt-2 mt-2 font-bold text-slate-700 dark:text-slate-300 flex items-center">
                          {leave.employeeId === employee?.id ? (
                            <span className="text-sm">Self</span>
                          ) : leave.employee ? (
                            <>
                              <Users className="w-4 h-4 mr-2 text-slate-400" />
                              {leave.employee.firstName} {leave.employee.lastName} <span className="text-slate-400 text-sm font-normal ml-1">({leave.employee.employeeId})</span>
                            </>
                          ) : (
                            <span className="text-sm">Unknown Employee</span>
                          )}
                        </p>
                      </div>
                    </div>
                    {canReview(leave) && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(leave.id)}
                          disabled={processingId === leave.id}
                          className="px-3 py-1 bg-green-100 hover:bg-green-200 text-green-700 dark:bg-green-900/30 dark:hover:bg-green-900/50 dark:text-green-400 rounded transition-colors text-sm font-medium disabled:opacity-50 flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(leave.id)}
                          disabled={processingId === leave.id}
                          className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-400 rounded transition-colors text-sm font-medium disabled:opacity-50 flex items-center gap-1"
                        >
                          <XCircle className="w-4 h-4" />
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}


