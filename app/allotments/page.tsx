'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Employee, employeeService } from '@/services/employee.service';
import { payrollService } from '@/services/payroll.service';
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
} from 'lucide-react';

export default function AllotmentsPage() {
  const router = useRouter();
  const { user: currentUser, isAuthenticated } = useAuthStore();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [departments, setDepartments] = useState<string[]>([]);

  // Payroll processing state
  const [selectedEmployeeForPayroll, setSelectedEmployeeForPayroll] = useState<Employee | null>(null);
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
  const [isProcessingPayroll, setIsProcessingPayroll] = useState(false);
  const [payrollError, setPayrollError] = useState('');
  const [payrollSuccess, setPayrollSuccess] = useState('');

  const isAdmin = currentUser?.role === Role.ADMIN;
  const isHR = currentUser?.role === Role.HR;
  const canAccess = isAdmin || isHR;

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

    // HR can only process payroll for EMPLOYEE and MANAGER roles
    // Admin can process payroll for EMPLOYEE, MANAGER, and HR roles
    if (isHR && !isAdmin) {
      filtered = filtered.filter((emp) => 
        emp.user?.role === Role.EMPLOYEE || emp.user?.role === Role.MANAGER
      );
    }

    return filtered;
  };

  const handleProcessPayroll = async (employee: Employee) => {
    setSelectedEmployeeForPayroll(employee);
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
    setPayrollError('');
    setPayrollSuccess('');
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
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            Payroll Processing
          </h1>
          <p className="text-slate-400 mt-1">
            Process payroll for employees
          </p>
        </div>

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
                      onChange={(e) => setPayrollFormData({ ...payrollFormData, month: parseInt(e.target.value) })}
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
                      onChange={(e) => setPayrollFormData({ ...payrollFormData, year: parseInt(e.target.value) })}
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
                    onClick={() => setSelectedEmployeeForPayroll(null)}
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
      </motion.div>
    </DashboardLayout>
  );
}
