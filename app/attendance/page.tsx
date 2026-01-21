'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { attendanceService, Attendance } from '@/services/attendance.service';
import {
  Clock,
  LogIn,
  LogOut,
  Home,
  Calendar,
  TrendingUp,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Check,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

export default function AttendancePage() {
  const { employee } = useAuthStore();
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [todayAttendance, setTodayAttendance] = useState<Attendance | null>(null);
  const [canPunchIn, setCanPunchIn] = useState(true);
  const [canPunchOut, setCanPunchOut] = useState(false);
  const [workFromHome, setWorkFromHome] = useState(false);

  useEffect(() => {
    loadAttendance();
    checkTodayAttendance();
  }, []);

  const loadAttendance = async () => {
    try {
      setLoading(true);
      const today = new Date();
      const startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
      const endDate = today.toISOString().split('T')[0];
      const data = await attendanceService.getAttendance(startDate, endDate);
      setAttendance(data);
    } catch (error) {
      console.error('Failed to load attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkTodayAttendance = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const data = await attendanceService.getAttendance(today, today);
      if (data.length > 0) {
        const todayRecord = data[0];
        setTodayAttendance(todayRecord);
        setCanPunchIn(!todayRecord.punchIn);
        setCanPunchOut(!!todayRecord.punchIn && !todayRecord.punchOut);
      }
    } catch (error) {
      console.error('Failed to check today attendance:', error);
    }
  };

  const handlePunchIn = async () => {
    try {
      await attendanceService.punchIn(workFromHome);
      await checkTodayAttendance();
      await loadAttendance();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to punch in');
    }
  };

  const handlePunchOut = async () => {
    try {
      await attendanceService.punchOut();
      await checkTodayAttendance();
      await loadAttendance();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to punch out');
    }
  };

  const getStatusIcon = (record: Attendance) => {
    if (record.status === 'PRESENT') return <CheckCircle2 className="w-5 h-5 text-green-600" />;
    if (record.status === 'ABSENT') return <XCircle className="w-5 h-5 text-red-600" />;
    if (record.status === 'LATE') return <AlertCircle className="w-5 h-5 text-yellow-600" />;
    return <Clock className="w-5 h-5 text-slate-400" />;
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const presentDays = attendance.filter((a) => a.status === 'PRESENT').length;
  const absentDays = attendance.filter((a) => a.status === 'ABSENT').length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Clock className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            Attendance
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Track your daily attendance and work hours
          </p>
        </div>

        {/* Punch In/Out Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-8 shadow-2xl text-white"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">Today's Attendance</h2>
              {todayAttendance ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <LogIn className="w-5 h-5" />
                    <span>Punched In: {formatTime(todayAttendance.punchIn)}</span>
                  </div>
                  {todayAttendance.punchOut ? (
                    <div className="flex items-center gap-2">
                      <LogOut className="w-5 h-5" />
                      <span>Punched Out: {formatTime(todayAttendance.punchOut)}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      <span>Still working...</span>
                    </div>
                  )}
                  {todayAttendance.workFromHome && (
                    <div className="flex items-center gap-2 mt-2">
                      <Home className="w-5 h-5" />
                      <span>Working from home</span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-green-100">No attendance record for today</p>
              )}
            </div>
            <div className="flex flex-col gap-3">
              {canPunchIn && (
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-3 cursor-pointer group select-none">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={workFromHome}
                        onChange={(e) => setWorkFromHome(e.target.checked)}
                        className="peer sr-only"
                      />
                      <div className="w-6 h-6 border-2 border-white/60 rounded-lg peer-checked:bg-white peer-checked:border-white transition-all group-hover:border-white"></div>
                      <Check className="w-4 h-4 text-green-600 absolute left-1 top-1 opacity-0 peer-checked:opacity-100 transition-opacity" />
                    </div>
                    <span className="font-medium text-white/90 group-hover:text-white transition-colors">Work from home</span>
                  </label>
                  <button
                    onClick={handlePunchIn}
                    className="px-6 py-3 bg-white text-green-600 rounded-lg font-semibold hover:bg-green-50 transition-colors shadow-lg"
                  >
                    <LogIn className="w-5 h-5 inline mr-2" />
                    Punch In
                  </button>
                </div>
              )}
              {canPunchOut && (
                <button
                  onClick={handlePunchOut}
                  className="px-6 py-3 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-colors shadow-lg"
                >
                  <LogOut className="w-5 h-5 inline mr-2" />
                  Punch Out
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Present Days</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                  {presentDays}
                </p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Absent Days</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
                  {absentDays}
                </p>
              </div>
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Total Days</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                  {attendance.length}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-blue-600" />
            </div>
          </motion.div>
        </div>

        {/* Attendance History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden"
        >
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Attendance History</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Punch In</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Punch Out</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Location</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {attendance.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                      No attendance records found
                    </td>
                  </tr>
                ) : (
                  attendance.map((record) => (
                    <tr key={record.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white">
                        {new Date(record.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                        {formatTime(record.punchIn)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                        {formatTime(record.punchOut)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(record)}
                          <span className="text-sm font-medium">{record.status}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {record.workFromHome ? (
                          <span className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400">
                            <Home className="w-4 h-4" />
                            Home
                          </span>
                        ) : (
                          <span className="text-sm text-slate-600 dark:text-slate-400">Office</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}

