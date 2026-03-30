'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Employee, employeeService } from '@/services/employee.service';
import { payrollService } from '@/services/payroll.service';
import { leaveService, LeaveBalance } from '@/services/leave.service';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuthStore } from '@/store/authStore';
import { Role } from '@/types';
import {
  DollarSign,
  Users,
  Search,
  Building2,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Calendar,
  History,
  Download,
  FileText
} from 'lucide-react';
import { payslipService } from '@/services/payslip.service';
import { Payroll } from '@/services/payroll.service';

export default function AllotmentsPage() {
  const router = useRouter();
  const { user: currentUser, isAuthenticated } = useAuthStore();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [departments, setDepartments] = useState<string[]>([]);

  // Tabs state
  const [activeTab, setActiveTab] = useState<'process' | 'history'>('process');

  // History state
  const [payrollHistory, setPayrollHistory] = useState<Payroll[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  const [historyMonth, setHistoryMonth] = useState<number | ''>('');
  const [historyYear, setHistoryYear] = useState<number | ''>('');

  // Payroll processing state
  const [selectedEmployeeForPayroll, setSelectedEmployeeForPayroll] = useState<Employee | null>(null);
  const [employeeLeaveBalance, setEmployeeLeaveBalance] = useState<LeaveBalance | null>(null);
  const [payrollFormData, setPayrollFormData] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    basicSalary: 0,
    allowances: 0,
    deductions: 0,
    pf: 0,
    esic: 0,
    tds: 0,
  });
  const [payrollMetrics, setPayrollMetrics] = useState<{
    absentDays: number;
    idleHours: number;
    absentDeduction: number;
    idleDeduction: number;
  } | null>(null);
  const [isProcessingPayroll, setIsProcessingPayroll] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [payrollError, setPayrollError] = useState('');
  const [payrollSuccess, setPayrollSuccess] = useState('');

  const isAdmin = currentUser?.role === Role.ADMIN;
  const isHRManager = currentUser?.role === Role.HR_MANAGER;
  const canAccess = isAdmin || isHRManager;

  useEffect(() => {
    if (!isAuthenticated) return;

    if (!canAccess) {
      router.replace('/dashboard');
      return;
    }

    loadEmployees();
    loadDepartments();
  }, [isAuthenticated, canAccess, router]);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const result = await employeeService.getEmployees(1, 1000, {
        isActive: true,
      });
      setEmployees(result.employees || []);
    } catch (error) {
      console.error('Failed to load employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDepartments = async () => {
    try {
      const data = await employeeService.getDepartments();
      setDepartments(data);
    } catch (error) {
      console.error('Failed to load departments:', error);
    }
  };

  const loadHistory = async () => {
    try {
      setLoadingHistory(true);
      const data = await payrollService.getHistory();
      setPayrollHistory(data);
    } catch (error) {
      console.error('Failed to load payroll history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'history') {
      loadHistory();
    }
  }, [activeTab]);

  // Filter employees based on role restrictions
  const getFilteredEmployees = () => {
    let filtered = employees.filter((emp) => {
      const fullName = `${emp.firstName} ${emp.lastName}`.toLowerCase();
      const email = emp.user?.email?.toLowerCase() || '';
      const query = searchQuery.toLowerCase();
      const matchesSearch = fullName.includes(query) || email.includes(query) || emp.employeeId.toLowerCase().includes(query);
      const matchesDept = !departmentFilter || emp.department === departmentFilter;
      return matchesSearch && matchesDept;
    });

    // HR Manager can only process payroll for EMPLOYEE and CLERK roles
    // Admin can process payroll for all roles
    if (isHRManager && !isAdmin) {
      filtered = filtered.filter((emp) =>
        emp.user?.role === Role.EMPLOYEE || emp.user?.role === Role.CLERK
      );
    }

    return filtered;
  };

  const handleProcessPayroll = async (employee: Employee) => {
    setSelectedEmployeeForPayroll(employee);
    setEmployeeLeaveBalance(null); // Reset balance

    // Fetch leave balance for the selected employee
    try {
      const balance = await leaveService.getLeaveBalance(employee.id);
      setEmployeeLeaveBalance(balance);
    } catch (error) {
      console.error('Failed to load leave balance for employee:', error);
    }

    setPayrollFormData({
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      basicSalary: employee.salary || 0,
      allowances: 0,
      deductions: 0,
      pf: 0,
      esic: 0,
      tds: 0,
    });
    setPayrollMetrics(null);
    setPayrollError('');
    setPayrollSuccess('');

    // Auto-calculate
    calculatePayrollForEmployee(employee.id, new Date().getMonth() + 1, new Date().getFullYear());
  };

  const calculatePayrollForEmployee = async (employeeId: string, month: number, year: number) => {
    try {
      setIsCalculating(true);
      const data = await payrollService.calculatePayroll(employeeId, month, year);

      setPayrollFormData(prev => ({
        ...prev,
        month,
        year,
        basicSalary: data.basicSalary,
        deductions: data.deductions,
        pf: data.pf,
      }));

      if (data.metrics) {
        setPayrollMetrics(data.metrics);
      }
    } catch (error) {
      console.error('Failed to calculate payroll:', error);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleSubmitPayroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployeeForPayroll) return;

    setPayrollError('');
    setPayrollSuccess('');
    setIsProcessingPayroll(true);

    try {
      await payrollService.processPayroll({
        employeeId: selectedEmployeeForPayroll.id,
        ...payrollFormData,
      });

      setPayrollSuccess(`Payroll processed successfully for ${selectedEmployeeForPayroll.firstName} ${selectedEmployeeForPayroll.lastName}`);
      setSelectedEmployeeForPayroll(null);
      setEmployeeLeaveBalance(null);
    } catch (error: any) {
      setPayrollError(error.response?.data?.error || error.message || 'Failed to process payroll. Please try again.');
    } finally {
      setIsProcessingPayroll(false);
    }
  };

  const filteredEmployees = getFilteredEmployees();

  if (!canAccess) {
    return null;
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: [0, 0, 1, 1] as const }}
            className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full"
          />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            Payroll Processing
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Process payroll for employees
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab('process')}
            className={`flex flex-1 items-center justify-center gap-2 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'process'
              ? 'border-green-500 text-green-600 dark:text-green-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:hover:text-slate-300'
              }`}
          >
            <DollarSign className="w-4 h-4" />
            Process Payroll
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex flex-1 items-center justify-center gap-2 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'history'
              ? 'border-green-500 text-green-600 dark:text-green-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:hover:text-slate-300'
              }`}
          >
            <History className="w-4 h-4" />
            Payroll History
          </button>
        </div>

        {activeTab === 'process' && (
          <>
            {/* Filters */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-lg border border-slate-200 dark:border-slate-700">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search employees..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Departments</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Payroll Processing Form Modal */}
            {selectedEmployeeForPayroll && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
                >
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                    Process Payroll for {selectedEmployeeForPayroll.firstName} {selectedEmployeeForPayroll.lastName}
                  </h2>

                  {/* Leave Balance Display in Modal */}
                  {employeeLeaveBalance && (
                    <div className="flex items-center gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl mb-6">
                      <div className="p-2 bg-blue-100 dark:bg-blue-800/50 rounded-lg">
                        <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">Leave Balance (Current Year)</p>
                        <div className="flex gap-4 mt-1 text-sm text-slate-600 dark:text-slate-300">
                          <span>Total: <span className="font-semibold">{employeeLeaveBalance.total}</span></span>
                          <span>Used: <span className="font-semibold text-red-500">{employeeLeaveBalance.used}</span></span>
                          <span>Remaining: <span className="font-semibold text-green-500">{employeeLeaveBalance.remaining}</span></span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Dynamic Metrics Display */}
                  {payrollMetrics && (
                    <div className="flex items-start gap-4 p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl mb-6">
                      <div className="p-2 bg-indigo-100 dark:bg-indigo-800/50 rounded-lg mt-1">
                        <AlertCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-indigo-800 dark:text-indigo-200 font-bold mb-2">Automated Deductions Preview</p>
                        <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs text-indigo-700 dark:text-indigo-300">
                          <div className="flex justify-between">
                            <span>Absent Days:</span>
                            <span className="font-semibold">{payrollMetrics.absentDays}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Absent Ded.:</span>
                            <span className="font-semibold text-red-600 dark:text-red-400">₹{payrollMetrics.absentDeduction}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Idle Hours:</span>
                            <span className="font-semibold">{payrollMetrics.idleHours}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Idle Ded.:</span>
                            <span className="font-semibold text-red-600 dark:text-red-400">₹{payrollMetrics.idleDeduction}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {payrollError && (
                    <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl mb-4">
                      <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                      <p className="text-sm text-red-800 dark:text-red-200">{payrollError}</p>
                    </div>
                  )}

                  {payrollSuccess && (
                    <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl mb-4">
                      <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                      <p className="text-sm text-green-800 dark:text-green-200">{payrollSuccess}</p>
                    </div>
                  )}

                  <form onSubmit={handleSubmitPayroll} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Month <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={payrollFormData.month}
                          onChange={(e) => {
                            const newMonth = parseInt(e.target.value);
                            setPayrollFormData({ ...payrollFormData, month: newMonth });
                            calculatePayrollForEmployee(selectedEmployeeForPayroll.id, newMonth, payrollFormData.year);
                          }}
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        >
                          {Array.from({ length: 12 }, (_, i) => (
                            <option key={i + 1} value={i + 1}>
                              {new Date(2000, i).toLocaleString('default', { month: 'long' })}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Year <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          value={payrollFormData.year}
                          onChange={(e) => {
                            const newYear = parseInt(e.target.value);
                            setPayrollFormData({ ...payrollFormData, year: newYear });
                            if (newYear > 2000) calculatePayrollForEmployee(selectedEmployeeForPayroll.id, payrollFormData.month, newYear);
                          }}
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                          min="2020"
                          max="2100"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Basic Salary <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={payrollFormData.basicSalary}
                        onChange={(e) => setPayrollFormData({ ...payrollFormData, basicSalary: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                        min="0"
                        step="0.01"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Allowances
                      </label>
                      <input
                        type="number"
                        value={payrollFormData.allowances}
                        onChange={(e) => setPayrollFormData({ ...payrollFormData, allowances: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        min="0"
                        step="0.01"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Deductions
                      </label>
                      <input
                        type="number"
                        value={payrollFormData.deductions}
                        onChange={(e) => setPayrollFormData({ ...payrollFormData, deductions: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        min="0"
                        step="0.01"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          PF
                        </label>
                        <input
                          type="number"
                          value={payrollFormData.pf}
                          onChange={(e) => setPayrollFormData({ ...payrollFormData, pf: parseFloat(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          min="0"
                          step="0.01"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          ESIC
                        </label>
                        <input
                          type="number"
                          value={payrollFormData.esic}
                          onChange={(e) => setPayrollFormData({ ...payrollFormData, esic: parseFloat(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          min="0"
                          step="0.01"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          TDS
                        </label>
                        <input
                          type="number"
                          value={payrollFormData.tds}
                          onChange={(e) => setPayrollFormData({ ...payrollFormData, tds: parseFloat(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          min="0"
                          step="0.01"
                        />
                      </div>
                    </div>

                    <div className="bg-slate-100 dark:bg-slate-700 rounded-lg p-4 mt-4">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-slate-700 dark:text-slate-300">Net Salary:</span>
                        <span className="text-xl font-bold text-slate-900 dark:text-white">
                          ₹{(
                            payrollFormData.basicSalary +
                            payrollFormData.allowances -
                            payrollFormData.deductions -
                            payrollFormData.pf -
                            payrollFormData.esic -
                            payrollFormData.tds
                          ).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedEmployeeForPayroll(null);
                          setEmployeeLeaveBalance(null);
                        }}
                        className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isProcessingPayroll}
                        className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {isProcessingPayroll ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          'Process Payroll'
                        )}
                      </button>
                    </div>
                  </form>
                </motion.div>
              </div>
            )}

            {/* Employees List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEmployees.map((employee) => (
                <motion.div
                  key={employee.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {employee.firstName[0]}{employee.lastName[0]}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900 dark:text-white">
                        {employee.firstName} {employee.lastName}
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {employee.employeeId}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        {employee.user?.role}
                      </p>
                    </div>
                  </div>

                  {employee.department && (
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-2">
                      <Building2 className="w-4 h-4" />
                      <span>{employee.department}</span>
                    </div>
                  )}

                  {employee.salary && (
                    <div className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                      <DollarSign className="w-4 h-4 inline mr-1" />
                      Current Salary: ₹{employee.salary.toLocaleString()}
                    </div>
                  )}

                  <button
                    onClick={() => handleProcessPayroll(employee)}
                    className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium"
                  >
                    Process Payroll
                  </button>
                </motion.div>
              ))}
            </div>

            {filteredEmployees.length === 0 && (
              <div className="bg-white dark:bg-slate-800 rounded-xl p-12 shadow-lg border border-slate-200 dark:border-slate-700 text-center">
                <Users className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <p className="text-lg font-semibold text-slate-900 dark:text-white">
                  No employees found
                </p>
                <p className="text-slate-600 dark:text-slate-400 mt-2">
                  {searchQuery ? 'Try adjusting your search criteria' : 'No employees available for payroll processing'}
                </p>
              </div>
            )}
          </>
        )}

        {/* History Tab Content */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            {/* Filters for History */}
            <div className="glass rounded-xl p-4 shadow-lg border border-dark-border">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-cyan-500/50" />
                  <input
                    type="text"
                    placeholder="Search by employee name or ID..."
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-dark-bg/50 border border-dark-border rounded-lg text-white placeholder-slate-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors"
                  />
                </div>
                <select
                  value={historyMonth}
                  onChange={(e) => setHistoryMonth(e.target.value ? parseInt(e.target.value) : '')}
                  className="px-4 py-2 bg-dark-bg/50 border border-dark-border rounded-lg text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors"
                >
                  <option value="">All Months</option>
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {new Date(2000, i).toLocaleString('default', { month: 'long' })}
                    </option>
                  ))}
                </select>
                <select
                  value={historyYear}
                  onChange={(e) => setHistoryYear(e.target.value ? parseInt(e.target.value) : '')}
                  className="px-4 py-2 bg-dark-bg/50 border border-dark-border rounded-lg text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors"
                >
                  <option value="">All Years</option>
                  {[...new Set(payrollHistory.map(p => p.year))].sort((a, b) => b - a).map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="glass rounded-xl shadow-lg border border-dark-border overflow-hidden">
              <div className="p-6 border-b border-dark-border flex justify-between items-center bg-dark-surface/50">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <History className="w-5 h-5 text-primary-400" />
                  Processed Payrolls
                </h2>
              </div>

              {loadingHistory ? (
                <div className="p-12 flex justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-dark-surface/30 border-b border-dark-border">
                        <th className="px-6 py-4 text-xs font-semibold text-cyan-400/70 uppercase tracking-wider">Employee</th>
                        <th className="px-6 py-4 text-xs font-semibold text-cyan-400/70 uppercase tracking-wider">Period</th>
                        <th className="px-6 py-4 text-xs font-semibold text-cyan-400/70 uppercase tracking-wider">Net Salary</th>
                        <th className="px-6 py-4 text-xs font-semibold text-cyan-400/70 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-xs font-semibold text-cyan-400/70 text-right uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dark-border">
                      {(() => {
                        const filteredHistory = payrollHistory.filter(payroll => {
                          const query = historySearch.toLowerCase();
                          const matchesSearch =
                            payroll.employeeId?.firstName?.toLowerCase().includes(query) ||
                            payroll.employeeId?.lastName?.toLowerCase().includes(query) ||
                            payroll.employeeId?.employeeId?.toLowerCase().includes(query);
                          const matchesMonth = historyMonth === '' || payroll.month === historyMonth;
                          const matchesYear = historyYear === '' || payroll.year === historyYear;
                          return matchesSearch && matchesMonth && matchesYear;
                        });

                        if (filteredHistory.length === 0) {
                          return (
                            <tr>
                              <td colSpan={5} className="p-12 text-center text-slate-500">
                                No payroll history found matching the filters.
                              </td>
                            </tr>
                          );
                        }

                        return filteredHistory.map(payroll => (
                          <tr key={payroll._id} className="hover:bg-dark-surface/50 transition-colors group">
                            <td className="px-6 py-4">
                              <div className="font-medium text-white group-hover:text-primary-400 transition-colors">
                                {payroll.employeeId?.firstName} {payroll.employeeId?.lastName}
                              </div>
                              <div className="text-sm text-cyan-500/50">{payroll.employeeId?.employeeId}</div>
                            </td>
                            <td className="px-6 py-4 text-slate-300">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-slate-500" />
                                {new Date(payroll.year, payroll.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500">
                                ₹{payroll.netSalary.toLocaleString()}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border ${payroll.status === 'PAID'
                                ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                                }`}>
                                {payroll.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button
                                onClick={() => payslipService.generatePayslip(payroll)}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500/10 hover:bg-primary-500/20 text-primary-400 border border-primary-500/20 rounded-xl text-sm font-medium transition-all hover:scale-105 active:scale-95"
                                title="Download Payslip"
                              >
                                <Download className="w-4 h-4" />
                                Payslip
                              </button>
                            </td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </DashboardLayout>
  );
}
