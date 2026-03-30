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
  Coffee,
  Activity,
  Download,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useIdleTimer } from '@/components/providers/IdleTimerProvider';

export default function AttendancePage() {
  const { employee } = useAuthStore();
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [todayAttendance, setTodayAttendance] = useState<Attendance | null>(null);
  const [canPunchIn, setCanPunchIn] = useState(true);
  const [canPunchOut, setCanPunchOut] = useState(false);
  const [workFromHome, setWorkFromHome] = useState(false);
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(String(currentDate.getMonth() + 1).padStart(2, '0'));
  const [selectedYear, setSelectedYear] = useState(String(currentDate.getFullYear()));

  const { idleSeconds, resetIdleTime } = useIdleTimer();

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
        const activeBreak = todayRecord.breaks?.find((b) => !b.endTime);
        setIsOnBreak(!!activeBreak);
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
      alert(error.response?.data?.error || error.message || 'Action failed');
    }
  };

  const handlePunchOut = async () => {
    try {
      await attendanceService.punchOut(idleSeconds);
      resetIdleTime(); // Reset timer after punch out
      await checkTodayAttendance();
      await loadAttendance();
    } catch (error: any) {
      alert(error.response?.data?.error || error.message || 'Action failed');
    }
  };

  const handleStartBreak = async () => {
    try {
      await attendanceService.startBreak();
      await checkTodayAttendance();
      await loadAttendance();
    } catch (error: any) {
      alert(error.response?.data?.error || error.message || 'Action failed');
    }
  };

  const handleEndBreak = async () => {
    try {
      await attendanceService.endBreak();
      await checkTodayAttendance();
      await loadAttendance();
    } catch (error: any) {
      alert(error.response?.data?.error || error.message || 'Action failed');
    }
  };

  const handleDownload = async () => {
    try {
      if (!selectedMonth || !selectedYear) {
        alert('Please select a valid month and year');
        return;
      }
      setDownloading(true);
      await attendanceService.exportAttendance(parseInt(selectedMonth, 10), parseInt(selectedYear, 10));
    } catch (error: any) {
      alert('Failed to download attendance sheet');
    } finally {
      setDownloading(false);
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

  const formatDuration = (seconds?: number) => {
    if (seconds === undefined || seconds <= 0) return '-';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m`;
  };

  const calculateTotalBreakTime = (breaks?: { startTime: string; endTime?: string }[]) => {
    if (!breaks || breaks.length === 0) return undefined;
    let totalSeconds = 0;
    for (const b of breaks) {
      const start = new Date(b.startTime).getTime();
      const end = b.endTime ? new Date(b.endTime).getTime() : new Date().getTime();
      totalSeconds += Math.floor((end - start) / 1000);
    }
    return totalSeconds > 0 ? totalSeconds : undefined;
  };

  const presentDays = attendance.filter((a) => a.status === 'PRESENT').length;
  const absentDays = attendance.filter((a) => a.status === 'ABSENT').length;

  const currentYear = new Date().getFullYear();
  const currentMonthNum = new Date().getMonth() + 1;
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const allMonths = [
    { value: '01', label: 'January' },
    { value: '02', label: 'February' },
    { value: '03', label: 'March' },
    { value: '04', label: 'April' },
    { value: '05', label: 'May' },
    { value: '06', label: 'June' },
    { value: '07', label: 'July' },
    { value: '08', label: 'August' },
    { value: '09', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ];
  const availableMonths = selectedYear === String(currentYear) 
    ? allMonths.filter(m => parseInt(m.value) <= currentMonthNum)
    : allMonths;

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newYear = e.target.value;
    setSelectedYear(newYear);
    if (newYear === String(currentYear) && parseInt(selectedMonth) > currentMonthNum) {
      setSelectedMonth(String(currentMonthNum).padStart(2, '0'));
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
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
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
              <select 
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-4 py-3 bg-transparent text-slate-700 dark:text-slate-300 focus:outline-none border-r border-slate-200 dark:border-slate-700 appearance-none min-w-[120px]"
                title="Select Month"
              >
                {availableMonths.map(m => (
                  <option key={m.value} value={m.value} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">{m.label}</option>
                ))}
              </select>
              <select 
                value={selectedYear}
                onChange={handleYearChange}
                className="px-4 py-3 bg-transparent text-slate-700 dark:text-slate-300 focus:outline-none appearance-none"
                title="Select Year"
              >
                {years.map(y => (
                  <option key={y} value={y} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">{y}</option>
                ))}
              </select>
            </div>
            <button
              onClick={handleDownload}
              disabled={downloading || !selectedMonth || !selectedYear}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl font-medium shadow-lg hover:bg-green-700 disabled:opacity-50 transition-all"
            >
              <Download className="w-5 h-5" />
              {downloading ? 'Downloading...' : 'Export Sheet'}
            </button>
          </div>
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
                  <div
                    onClick={() => setWorkFromHome(!workFromHome)}
                    className="flex items-center gap-3 cursor-pointer group select-none bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full transition-all border border-white/20 backdrop-blur-sm shadow-sm hover:shadow-md"
                  >
                    <div className={`w-11 h-6 rounded-full relative transition-colors duration-300 ease-in-out ${workFromHome ? 'bg-white' : 'bg-black/20'}`}>
                      <div className={`absolute top-1 left-1 w-4 h-4 rounded-full shadow-sm transition-transform duration-300 ease-out ${workFromHome ? 'bg-green-600 translate-x-5' : 'bg-white'}`} />
                    </div>
                    <span className="font-semibold text-white tracking-wide">Work from home</span>
                  </div>
                  <button
                    onClick={handlePunchIn}
                    className="px-6 py-3 bg-white text-green-600 rounded-lg font-semibold hover:bg-green-50 transition-colors shadow-lg"
                  >
                    <LogIn className="w-5 h-5 inline mr-2" />
                    Punch In
                  </button>
                </div>
              )}
              {canPunchOut && !isOnBreak && (
                <button
                  onClick={handleStartBreak}
                  className="px-6 py-3 bg-amber-500 text-white rounded-lg font-semibold hover:bg-amber-600 transition-colors shadow-lg flex items-center justify-center"
                >
                  <Coffee className="w-5 h-5 mr-2" />
                  Start Break
                </button>
              )}
              {canPunchOut && isOnBreak && (
                <button
                  onClick={handleEndBreak}
                  className="px-6 py-3 bg-amber-700 text-white rounded-lg font-semibold hover:bg-amber-800 transition-colors shadow-lg flex items-center justify-center"
                >
                  <Coffee className="w-5 h-5 mr-2" />
                  End Break
                </button>
              )}
              {canPunchOut && (
                <button
                  onClick={handlePunchOut}
                  disabled={isOnBreak}
                  className={`px-6 py-3 ${isOnBreak ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-red-500 text-white hover:bg-red-600'} rounded-lg font-semibold transition-colors shadow-lg flex items-center justify-center`}
                >
                  <LogOut className="w-5 h-5 mr-2" />
                  Punch Out
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Prod. Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Break Time</th>
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
                  attendance.map((record, index) => (
                    <tr key={record.id || (record as any)._id || index} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white">
                        {new Date(record.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                        {formatTime(record.punchIn)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                        {formatTime(record.punchOut)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-indigo-600 dark:text-indigo-400 font-medium">
                        {record.productiveTime !== undefined ? (
                          <span className="flex items-center gap-1">
                            <Activity className="w-4 h-4" />
                            {formatDuration(record.productiveTime)}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-amber-600 dark:text-amber-400 font-medium">
                        {calculateTotalBreakTime(record.breaks) !== undefined ? (
                          <span className="flex items-center gap-1">
                            <Coffee className="w-4 h-4" />
                            {formatDuration(calculateTotalBreakTime(record.breaks))}
                          </span>
                        ) : '-'}
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

