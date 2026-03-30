'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  UserPlus,
  Mail,
  Lock,
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
  Eye,
  EyeOff,
  ArrowLeft,
  X,
} from 'lucide-react';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { employeeService, CreateEmployeeData } from '@/services/employee.service';
import { useAuthStore } from '@/store/authStore';
import { Role } from '@/types';
import DatePicker from '@/components/ui/DatePicker';

const DEFAULT_DEPARTMENTS = [
  'Administration',
  'Engineering',
  'Human Resources',
  'Sales',
  'Marketing',
  'Product',
  'Design',
  'Finance',
  'Operations',
  'Customer Support',
  'Legal',
];

export default function AddEmployeePage() {
  const router = useRouter();
  const { user: currentUser, isAuthenticated } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [departments, setDepartments] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');

  // Access control: Only HR Manager and Admin can add employees
  const isHRManager = currentUser?.role === Role.HR_MANAGER;
  const isAdmin = currentUser?.role === Role.ADMIN;
  const canAccess = isHRManager || isAdmin;

  // Form fields
  const [formData, setFormData] = useState<CreateEmployeeData>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    employeeId: '',
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
    salary: undefined as number | undefined,
    basicSalary: undefined as number | undefined,
    hra: undefined as number | undefined,
    specialAllowance: undefined as number | undefined,
    travelAllowance: undefined as number | undefined,
    pf: undefined as number | undefined,
    tds: undefined as number | undefined,
    role: 'EMPLOYEE',
    personalEmail: '',
    bankName: '',
    bankAccountNumber: '',
    bankIfscCode: '',
    nameTitle: 'Mr.',
    qualifications: '',
    skills: '',
    joiningDate: '',
  });

  useEffect(() => {
    if (!isAuthenticated) return;

    if (!canAccess) {
      router.replace('/dashboard');
      return;
    }

    loadDepartments();
  }, [isAuthenticated, canAccess, router]);

  if (!canAccess) {
    return null;
  }

  const loadDepartments = async () => {
    try {
      const data = await employeeService.getDepartments();
      // Merge unique departments from API and defaults
      const mergedDepartments = Array.from(new Set([...DEFAULT_DEPARTMENTS, ...data])).sort();
      setDepartments(mergedDepartments);
    } catch (error) {
      console.error('Failed to load departments:', error);
      // Fallback to default departments on error
      setDepartments(DEFAULT_DEPARTMENTS.sort());
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: ['salary', 'basicSalary', 'hra', 'specialAllowance', 'travelAllowance', 'pf', 'tds'].includes(name) ? (value ? parseFloat(value) : undefined) : value,
    }));
  };

  const handleAddSkill = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const newSkill = skillInput.trim().replace(/,$/, '');
      if (newSkill) {
        const skillsArray = formData.skills ? formData.skills.split(',').map(s => s.trim()).filter(Boolean) : [];
        if (!skillsArray.includes(newSkill)) {
          skillsArray.push(newSkill);
          setFormData(prev => ({ ...prev, skills: skillsArray.join(', ') }));
        }
        setSkillInput('');
      }
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    const skillsArray = formData.skills ? formData.skills.split(',').map(s => s.trim()).filter(Boolean) : [];
    const updatedSkills = skillsArray.filter(s => s !== skillToRemove);
    setFormData(prev => ({ ...prev, skills: updatedSkills.join(', ') }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Validate required fields
      if (!formData.email || !formData.password || !formData.firstName || !formData.lastName || !formData.employeeId || !formData.department || !formData.position) {
        throw new Error('Please fill in all required fields');
      }

      // Prepare data for submission
      const submitData: CreateEmployeeData = {
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        employeeId: formData.employeeId,
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
        basicSalary: formData.basicSalary,
        hra: formData.hra,
        specialAllowance: formData.specialAllowance,
        travelAllowance: formData.travelAllowance,
        pf: formData.pf,
        tds: formData.tds,
        role: formData.role as any,
        personalEmail: formData.personalEmail || undefined,
        bankName: formData.bankName || undefined,
        bankAccountNumber: formData.bankAccountNumber || undefined,
        bankIfscCode: formData.bankIfscCode || undefined,
        nameTitle: formData.nameTitle || undefined,
        qualifications: formData.qualifications || undefined,
        skills: formData.skills || undefined,
        joiningDate: formData.joiningDate || undefined,
      };

      await employeeService.createEmployee(submitData);
      router.push('/users');
    } catch (err: any) {
      console.error('Create employee error:', err);
      setError(err.response?.data?.error || err.message || 'Failed to create employee. Please try again.');
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
            href="/users"
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <UserPlus className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              Add New Employee
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Create a new employee account and profile
            </p>
          </div>
        </div>

        {/* Form */}
        <motion.div
          variants={itemVariants}
          className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700"
        >
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl mb-6"
            >
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Account Information Section */}
            <div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                Account Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="name@company.com"
                      value={formData.email}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      className="block w-full pl-10 pr-12 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Enter password"
                      value={formData.password}
                      autoComplete="new-password"
                      onChange={handleChange}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Role
                  </label>
                  <select
                    id="role"
                    name="role"
                    className="block w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    value={formData.role}
                    onChange={handleChange}
                  >
                    <option value="EMPLOYEE">Employee</option>
                    {isAdmin && <option value="MANAGER">Manager</option>}
                    {isAdmin && <option value="HR_MANAGER">HR Manager</option>}
                    {isAdmin && <option value="CLERK">Clerk</option>}
                    {isAdmin && <option value="ADMIN">Admin</option>}
                  </select>
                </div>
              </div>
            </div>

            {/* Personal Information Section */}
            <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                Personal Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex gap-4">
                  <div className="w-28 flex-shrink-0">
                    <label htmlFor="nameTitle" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Title
                    </label>
                    <select
                      id="nameTitle"
                      name="nameTitle"
                      className="block w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      value={formData.nameTitle || 'Mr.'}
                      onChange={handleChange}
                    >
                      <option value="Mr.">Mr.</option>
                      <option value="Ms.">Ms.</option>
                      <option value="Mrs.">Mrs.</option>
                      <option value="Dr.">Dr.</option>
                      <option value="Prof.">Prof.</option>
                    </select>
                  </div>

                  <div className="flex-1">
                    <label htmlFor="firstName" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-slate-400" />
                      </div>
                      <input
                        id="firstName"
                        name="firstName"
                        type="text"
                        required
                        className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Enter first name"
                        value={formData.firstName}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      required
                      className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Enter last name"
                      value={formData.lastName}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="employeeId" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Employee ID <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Hash className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      id="employeeId"
                      name="employeeId"
                      type="text"
                      required
                      className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="EMP001"
                      value={formData.employeeId}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
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
                      className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="+91 98765 43210"
                      value={formData.phone}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="dateOfBirth" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Date of Birth
                  </label>
                  <DatePicker
                    value={formData.dateOfBirth || ''}
                    onChange={(val) => setFormData((prev) => ({ ...prev, dateOfBirth: val }))}
                    placeholder="Select date of birth"
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label htmlFor="personalEmail" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Personal Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      id="personalEmail"
                      name="personalEmail"
                      type="email"
                      className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="personal@email.com"
                      value={formData.personalEmail || ''}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Address Information Section */}
            <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                Address Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label htmlFor="address" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Street Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MapPin className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      id="address"
                      name="address"
                      type="text"
                      className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Flat 101, XYZ Apartments, MG Road"
                      value={formData.address}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    City
                  </label>
                  <input
                    id="city"
                    name="city"
                    type="text"
                    className="block w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Mumbai"
                    value={formData.city}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label htmlFor="state" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    State/Province
                  </label>
                  <input
                    id="state"
                    name="state"
                    type="text"
                    className="block w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Maharashtra"
                    value={formData.state}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label htmlFor="zipCode" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Zip/Postal Code
                  </label>
                  <input
                    id="zipCode"
                    name="zipCode"
                    type="text"
                    className="block w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="400001"
                    value={formData.zipCode}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label htmlFor="country" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Country
                  </label>
                  <input
                    id="country"
                    name="country"
                    type="text"
                    className="block w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="India"
                    value={formData.country}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            {/* Employment Information Section */}
            <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                Employment Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="department" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Department <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Building2 className="h-5 w-5 text-slate-400" />
                    </div>
                    <select
                      id="department"
                      name="department"
                      required
                      className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
                  <label htmlFor="position" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Position <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Briefcase className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      id="position"
                      name="position"
                      type="text"
                      required
                      className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Software Engineer"
                      value={formData.position}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="employmentType" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
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
                  <label htmlFor="joiningDate" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Date of Joining
                  </label>
                  <DatePicker
                    value={formData.joiningDate || ''}
                    onChange={(val) => setFormData((prev) => ({ ...prev, joiningDate: val }))}
                    placeholder="Select Date of Joining"
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label htmlFor="qualifications" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Qualifications
                  </label>
                  <input
                    id="qualifications"
                    name="qualifications"
                    type="text"
                    className="block w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="e.g. B.Tech, MBA"
                    value={formData.qualifications || ''}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label htmlFor="skills" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Skills
                  </label>
                  <div className="flex flex-col p-2 min-h-[46px] border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 transition-all focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
                    <div className="flex flex-wrap gap-2">
                      {formData.skills && formData.skills.split(',').map(s => s.trim()).filter(Boolean).map((skill, index) => (
                        <div key={index} className="flex items-center gap-1.5 px-3 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-lg text-sm font-medium">
                          {skill}
                          <button
                            type="button"
                            onClick={() => handleRemoveSkill(skill)}
                            className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5 transition-colors focus:outline-none"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      <input
                        id="skills"
                        type="text"
                        className="flex-1 min-w-[120px] bg-transparent text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none py-1"
                        placeholder={(!formData.skills || formData.skills.trim().length === 0) ? "e.g. JavaScript, React, Node.js" : ""}
                        value={skillInput}
                        onChange={(e) => setSkillInput(e.target.value)}
                        onKeyDown={handleAddSkill}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-1.5">Press Enter or type a comma to add a skill</p>
                </div>
              </div>
            </div>

            {/* Salary Information Section */}
            <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                Salary Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="salary" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    CTC (Annual)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-slate-400 sm:text-sm">₹</span>
                    </div>
                    <input
                      id="salary"
                      name="salary"
                      type="number"
                      min="0"
                      step="0.01"
                      className="block w-full pl-8 pr-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="e.g. 500000"
                      value={formData.salary || ''}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="basicSalary" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Basic Salary
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-slate-400 sm:text-sm">₹</span>
                    </div>
                    <input
                      id="basicSalary"
                      name="basicSalary"
                      type="number"
                      min="0"
                      step="0.01"
                      className="block w-full pl-8 pr-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="e.g. 250000"
                      value={formData.basicSalary || ''}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="hra" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    HRA
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-slate-400 sm:text-sm">₹</span>
                    </div>
                    <input
                      id="hra"
                      name="hra"
                      type="number"
                      min="0"
                      step="0.01"
                      className="block w-full pl-8 pr-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="e.g. 125000"
                      value={formData.hra || ''}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="specialAllowance" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Special Allowance
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-slate-400 sm:text-sm">₹</span>
                    </div>
                    <input
                      id="specialAllowance"
                      name="specialAllowance"
                      type="number"
                      min="0"
                      step="0.01"
                      className="block w-full pl-8 pr-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="e.g. 75000"
                      value={formData.specialAllowance || ''}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="travelAllowance" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Travel Allowance
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-slate-400 sm:text-sm">₹</span>
                    </div>
                    <input
                      id="travelAllowance"
                      name="travelAllowance"
                      type="number"
                      min="0"
                      step="0.01"
                      className="block w-full pl-8 pr-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="e.g. 50000"
                      value={formData.travelAllowance || ''}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="pf" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    PF (Provident Fund)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-slate-400 sm:text-sm">₹</span>
                    </div>
                    <input
                      id="pf"
                      name="pf"
                      type="number"
                      min="0"
                      step="0.01"
                      className="block w-full pl-8 pr-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="e.g. 1800"
                      value={formData.pf || ''}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="tds" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    TDS
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-slate-400 sm:text-sm">₹</span>
                    </div>
                    <input
                      id="tds"
                      name="tds"
                      type="number"
                      min="0"
                      step="0.01"
                      className="block w-full pl-8 pr-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="e.g. 5000"
                      value={formData.tds || ''}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Bank Information Section */}
            <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                Bank Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="bankName" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Bank Name
                  </label>
                  <select
                    id="bankName"
                    name="bankName"
                    className="block w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    value={formData.bankName}
                    onChange={handleChange}
                  >
                    <option value="">Select Bank</option>
                    <option value="State Bank of India (SBI)">State Bank of India (SBI)</option>
                    <option value="HDFC Bank">HDFC Bank</option>
                    <option value="ICICI Bank">ICICI Bank</option>
                    <option value="Axis Bank">Axis Bank</option>
                    <option value="Punjab National Bank (PNB)">Punjab National Bank (PNB)</option>
                    <option value="Bank of Baroda (BoB)">Bank of Baroda (BoB)</option>
                    <option value="Kotak Mahindra Bank">Kotak Mahindra Bank</option>
                    <option value="Union Bank of India">Union Bank of India</option>
                    <option value="IndusInd Bank">IndusInd Bank</option>
                    <option value="Canara Bank">Canara Bank</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="bankAccountNumber" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Account Number
                  </label>
                  <input
                    id="bankAccountNumber"
                    name="bankAccountNumber"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    className="block w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Enter Account Number"
                    value={formData.bankAccountNumber}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      setFormData(prev => ({ ...prev, bankAccountNumber: value }));
                    }}
                  />
                </div>

                <div>
                  <label htmlFor="bankIfscCode" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    IFSC Code
                  </label>
                  <input
                    id="bankIfscCode"
                    name="bankIfscCode"
                    type="text"
                    className="block w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="e.g. SBIN0001234"
                    value={formData.bankIfscCode}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex gap-4 pt-6 border-t border-slate-200 dark:border-slate-700">
              <Link
                href="/users"
                className="flex-1 px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors text-center font-medium"
              >
                Cancel
              </Link>
              <motion.button
                type="submit"
                disabled={isLoading}
                className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                whileHover={{ scale: isLoading ? 1 : 1.02 }}
                whileTap={{ scale: isLoading ? 1 : 0.98 }}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-5 h-5" />
                    <span>Create Employee</span>
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
