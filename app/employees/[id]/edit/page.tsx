'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Edit,
  Mail,
  User,
  Hash,
  Phone,
  Calendar,
  MapPin,
  Building2,
  Briefcase,
  DollarSign,
  AlertCircle,
  Loader2,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { employeeService, Employee, UpdateEmployeeData } from '@/services/employee.service';

export default function EditEmployeePage() {
  const router = useRouter();
  const params = useParams();
  const employeeId = params.id as string;
  
  const [isLoading, setIsLoading] = useState(false);
  const [loadingEmployee, setLoadingEmployee] = useState(true);
  const [error, setError] = useState('');
  const [departments, setDepartments] = useState<string[]>([]);

  // Form fields
  const [formData, setFormData] = useState<UpdateEmployeeData>({
    firstName: '',
    lastName: '',
    phone: '',
    dateOfBirth: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    department: '',
    position: '',
    employmentType: 'FULL_TIME',
    salary: undefined,
    isActive: true,
  });

  useEffect(() => {
    loadEmployee();
    loadDepartments();
  }, [employeeId]);

  const loadEmployee = async () => {
    try {
      setLoadingEmployee(true);
      const employee = await employeeService.getEmployeeById(employeeId);
      
      // Check if employee is an admin - admins cannot be edited
      if (employee.user?.role === 'ADMIN') {
        setError('Admin users cannot be edited');
        setTimeout(() => {
          router.push('/employees');
        }, 2000);
        return;
      }
      
      // Format dateOfBirth for input field (YYYY-MM-DD)
      const dateOfBirth = employee.dateOfBirth 
        ? new Date(employee.dateOfBirth).toISOString().split('T')[0]
        : '';

      setFormData({
        firstName: employee.firstName || '',
        lastName: employee.lastName || '',
        phone: employee.phone || '',
        dateOfBirth: dateOfBirth,
        address: employee.address || '',
        city: employee.city || '',
        state: employee.state || '',
        zipCode: employee.zipCode || '',
        country: employee.country || '',
        department: employee.department || '',
        position: employee.position || '',
        employmentType: employee.employmentType || 'FULL_TIME',
        salary: employee.salary,
        isActive: employee.isActive,
      });
    } catch (error) {
      console.error('Failed to load employee:', error);
      setError('Failed to load employee data');
    } finally {
      setLoadingEmployee(false);
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'salary' ? (value ? parseFloat(value) : undefined) : 
              name === 'isActive' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Validate required fields
      if (!formData.firstName || !formData.lastName) {
        throw new Error('Please fill in all required fields');
      }

      // Prepare data for submission
      const submitData: UpdateEmployeeData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone || undefined,
        dateOfBirth: formData.dateOfBirth || undefined,
        address: formData.address || undefined,
        city: formData.city || undefined,
        state: formData.state || undefined,
        zipCode: formData.zipCode || undefined,
        country: formData.country || undefined,
        department: formData.department || undefined,
        position: formData.position || undefined,
        employmentType: formData.employmentType as any,
        salary: formData.salary,
        isActive: formData.isActive,
      };

      await employeeService.updateEmployee(employeeId, submitData);
      router.push('/employees');
    } catch (err: any) {
      console.error('Update employee error:', err);
      setError(err.response?.data?.error || err.message || 'Failed to update employee. Please try again.');
      setIsLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1] as const,
      },
    },
  };

  if (loadingEmployee) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: [0, 0, 1, 1] as const }}
            className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full"
          />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link
            href="/employees"
            className="p-2 hover:bg-dark-surface rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-cyan-400" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <div className="p-2 bg-primary-500/20 rounded-lg">
                <Edit className="w-6 h-6 text-cyan-400" />
              </div>
              Edit Employee
            </h1>
            <p className="text-cyan-400/70 mt-1">
              Update employee information
            </p>
          </div>
        </div>

        {/* Form */}
        <motion.div
          variants={itemVariants}
          className="glass rounded-xl p-6 shadow-lg"
        >
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl mb-6"
            >
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-300">{error}</p>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information Section */}
            <div>
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-cyan-400" />
                Personal Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-cyan-300 mb-2">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-cyan-400/50" />
                    </div>
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      required
                      className="block w-full pl-10 pr-3 py-2.5 border border-dark-border rounded-lg bg-dark-surface text-white placeholder-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
                      placeholder="John"
                      value={formData.firstName}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-cyan-300 mb-2">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-cyan-400/50" />
                    </div>
                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      required
                      className="block w-full pl-10 pr-3 py-2.5 border border-dark-border rounded-lg bg-dark-surface text-white placeholder-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
                      placeholder="Doe"
                      value={formData.lastName}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-cyan-300 mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      className="block w-full pl-10 pr-3 py-2.5 border border-dark-border rounded-lg bg-dark-surface text-white placeholder-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
                      placeholder="+1 (555) 000-0000"
                      value={formData.phone}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="dateOfBirth" className="block text-sm font-medium text-cyan-300 mb-2">
                    Date of Birth
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Calendar className="h-5 w-5 text-cyan-400/50" />
                    </div>
                    <input
                      id="dateOfBirth"
                      name="dateOfBirth"
                      type="date"
                      className="block w-full pl-10 pr-3 py-2.5 border border-dark-border rounded-lg bg-dark-surface text-white placeholder-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
                      value={formData.dateOfBirth}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Address Information Section */}
            <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-cyan-400" />
                Address Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label htmlFor="address" className="block text-sm font-medium text-cyan-300 mb-2">
                    Street Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MapPin className="h-5 w-5 text-cyan-400/50" />
                    </div>
                    <input
                      id="address"
                      name="address"
                      type="text"
                      className="block w-full pl-10 pr-3 py-2.5 border border-dark-border rounded-lg bg-dark-surface text-white placeholder-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
                      placeholder="123 Main Street"
                      value={formData.address}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-cyan-300 mb-2">
                    City
                  </label>
                  <input
                    id="city"
                    name="city"
                    type="text"
                    className="block w-full px-3 py-2.5 border border-dark-border rounded-lg bg-dark-surface text-white placeholder-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
                    placeholder="New York"
                    value={formData.city}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label htmlFor="state" className="block text-sm font-medium text-cyan-300 mb-2">
                    State/Province
                  </label>
                  <input
                    id="state"
                    name="state"
                    type="text"
                    className="block w-full px-3 py-2.5 border border-dark-border rounded-lg bg-dark-surface text-white placeholder-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
                    placeholder="NY"
                    value={formData.state}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label htmlFor="zipCode" className="block text-sm font-medium text-cyan-300 mb-2">
                    Zip/Postal Code
                  </label>
                  <input
                    id="zipCode"
                    name="zipCode"
                    type="text"
                    className="block w-full px-3 py-2.5 border border-dark-border rounded-lg bg-dark-surface text-white placeholder-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
                    placeholder="10001"
                    value={formData.zipCode}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label htmlFor="country" className="block text-sm font-medium text-cyan-300 mb-2">
                    Country
                  </label>
                  <input
                    id="country"
                    name="country"
                    type="text"
                    className="block w-full px-3 py-2.5 border border-dark-border rounded-lg bg-dark-surface text-white placeholder-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
                    placeholder="United States"
                    value={formData.country}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            {/* Employment Information Section */}
            <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-cyan-400" />
                Employment Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="department" className="block text-sm font-medium text-cyan-300 mb-2">
                    Department
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Building2 className="h-5 w-5 text-cyan-400/50" />
                    </div>
                    <select
                      id="department"
                      name="department"
                      className="block w-full pl-10 pr-3 py-2.5 border border-dark-border rounded-lg bg-dark-surface text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
                      value={formData.department}
                      onChange={handleChange}
                    >
                      <option value="">Select Department</option>
                      {departments.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="position" className="block text-sm font-medium text-cyan-300 mb-2">
                    Position
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Briefcase className="h-5 w-5 text-cyan-400/50" />
                    </div>
                    <input
                      id="position"
                      name="position"
                      type="text"
                      className="block w-full pl-10 pr-3 py-2.5 border border-dark-border rounded-lg bg-dark-surface text-white placeholder-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
                      placeholder="Software Engineer"
                      value={formData.position}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="employmentType" className="block text-sm font-medium text-cyan-300 mb-2">
                    Employment Type
                  </label>
                  <select
                    id="employmentType"
                    name="employmentType"
                    className="block w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    value={formData.employmentType}
                    onChange={handleChange}
                  >
                    <option value="FULL_TIME">Full Time</option>
                    <option value="PART_TIME">Part Time</option>
                    <option value="CONTRACT">Contract</option>
                    <option value="INTERN">Intern</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="salary" className="block text-sm font-medium text-cyan-300 mb-2">
                    Salary
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <DollarSign className="h-5 w-5 text-cyan-400/50" />
                    </div>
                    <input
                      id="salary"
                      name="salary"
                      type="number"
                      min="0"
                      step="0.01"
                      className="block w-full pl-10 pr-3 py-2.5 border border-dark-border rounded-lg bg-dark-surface text-white placeholder-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
                      placeholder="50000"
                      value={formData.salary || ''}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleChange}
                      className="w-5 h-5 text-cyan-500 border-dark-border rounded focus:ring-cyan-500 bg-dark-surface"
                    />
                    <span className="text-sm font-medium text-cyan-300">
                      Active Employee
                    </span>
                  </label>
                  <p className="text-xs text-cyan-400/60 mt-1 ml-8">
                    Inactive employees cannot access the system
                  </p>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex gap-4 pt-6 border-t border-dark-border">
              <Link
                href="/employees"
                className="flex-1 px-4 py-2.5 border border-dark-border rounded-lg bg-dark-surface text-cyan-300 hover:bg-dark-surface/80 transition-colors text-center font-medium"
              >
                Cancel
              </Link>
              <motion.button
                type="submit"
                disabled={isLoading}
                className="flex-1 px-4 py-2.5 bg-gradient-primary hover:opacity-90 text-white rounded-lg font-medium shadow-lg shadow-primary-500/50 hover:shadow-xl hover:shadow-primary-500/70 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                whileHover={{ scale: isLoading ? 1 : 1.02 }}
                whileTap={{ scale: isLoading ? 1 : 0.98 }}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Updating...</span>
                  </>
                ) : (
                  <>
                    <Edit className="w-5 h-5" />
                    <span>Update Employee</span>
                  </>
                )}
              </motion.button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </DashboardLayout>
  );
}

