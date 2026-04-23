'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/auth.service';
import {
  User,
  Mail,
  Shield,
  Phone,
  MapPin,
  Building2,
  Briefcase,
  Calendar,
  Hash,
  Edit,
  ArrowLeft,
  Loader2,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  FileText,
  Download,
  X,
  Camera,
  Briefcase as PositionIcon,
} from 'lucide-react';
import Link from 'next/link';
import { Role } from '@/types';
import { payrollService, Payroll } from '@/services/payroll.service';
import { payslipService } from '@/services/payslip.service';
import { employeeService, UpdateEmployeeData, Employee } from '@/services/employee.service';
import { documentService } from '@/services/document.service';
import DatePicker from '@/components/ui/DatePicker';
import { Trash2 } from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const { user, employee, fetchUser } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [payslips, setPayslips] = useState<Payroll[]>([]);
  const [loadingPayslips, setLoadingPayslips] = useState(false);
  
  // Document State
  const [documents, setDocuments] = useState<any[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocFile, setNewDocFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Profile Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [updateProfileError, setUpdateProfileError] = useState('');
  const [skillInput, setSkillInput] = useState('');
  const [formData, setFormData] = useState<UpdateEmployeeData & { email?: string; role?: string; employeeIdCode?: string; }>({
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
    basicSalary: undefined,
    hra: undefined,
    specialAllowance: undefined,
    travelAllowance: undefined,
    pf: undefined,
    tds: undefined,
    monthlyLeaveAllotment: undefined,
    personalEmail: '',
    bankName: '',
    bankAccountNumber: '',
    bankIfscCode: '',
    nameTitle: 'Mr.',
    qualifications: '',
    skills: '',
    joiningDate: '',
    bloodGroup: '',
    aadhaarNumber: '',
    isActive: true,
    email: '',
    role: 'EMPLOYEE',
    employeeIdCode: '',
  });

  useEffect(() => {
    if (employee) {
      // Format dates for input field (YYYY-MM-DD)
      const dateOfBirth = employee.dateOfBirth
        ? new Date(employee.dateOfBirth).toISOString().split('T')[0]
        : '';
      const joiningDate = employee.joiningDate
        ? new Date(employee.joiningDate).toISOString().split('T')[0]
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
        basicSalary: employee.basicSalary,
        hra: employee.hra,
        specialAllowance: employee.specialAllowance,
        travelAllowance: employee.travelAllowance,
        pf: employee.pf,
        tds: employee.tds,
        monthlyLeaveAllotment: employee.monthlyLeaveAllotment,
        personalEmail: employee.personalEmail || '',
        bankName: employee.bankName || '',
        bankAccountNumber: employee.bankAccountNumber || '',
        bankIfscCode: employee.bankIfscCode || '',
        nameTitle: employee.nameTitle || 'Mr.',
        qualifications: employee.qualifications || '',
        skills: employee.skills || '',
        joiningDate: joiningDate,
        bloodGroup: employee.bloodGroup || '',
        aadhaarNumber: employee.aadhaarNumber || '',
        isActive: employee.isActive ?? true,
        email: user?.email || '',
        role: user?.role || 'EMPLOYEE',
        employeeIdCode: employee.employeeId || '',
      });
    }
  }, [employee, user]);

  useEffect(() => {
    const loadPayslips = async () => {
      if (employee?.id) {
        try {
          setLoadingPayslips(true);
          const data = await payrollService.getPayrolls(employee.id);
          setPayslips(data);
        } catch (error) {
          console.error("Failed to load payslips:", error);
        } finally {
          setLoadingPayslips(false);
        }
      }
    };
    loadPayslips();
  }, [employee]);

  useEffect(() => {
    if (employee?.id) {
      loadDocuments(employee.id);
    }
  }, [employee]);

  const loadDocuments = async (empId: string) => {
    try {
      setLoadingDocs(true);
      const docs = await documentService.getDocuments(empId);
      setDocuments(docs || []);
    } catch (error) {
      console.error('Failed to load documents', error);
    } finally {
      setLoadingDocs(false);
    }
  };

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        await fetchUser();
      } catch (error) {
        console.error('Failed to load profile:', error);
        router.push('/auth/login');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [fetchUser, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: ['salary', 'basicSalary', 'hra', 'specialAllowance', 'travelAllowance', 'pf', 'tds', 'monthlyLeaveAllotment'].includes(name) ? (value ? parseFloat(value) : undefined) : 
              name === 'isActive' ? (e.target as HTMLInputElement).checked : value,
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

  const handleSubmitProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employee?.id) return;
    
    setUpdateProfileError('');
    setIsUpdatingProfile(true);

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
        // For regular users, we might not want them editing salary/pf/leave balance
        // But for consistency we include them in the same data structure
        // The backend should enforce permissions
        salary: formData.salary,
        basicSalary: formData.basicSalary,
        hra: formData.hra,
        specialAllowance: formData.specialAllowance,
        travelAllowance: formData.travelAllowance,
        pf: formData.pf,
        tds: formData.tds,
        monthlyLeaveAllotment: formData.monthlyLeaveAllotment,
        personalEmail: formData.personalEmail || undefined,
        bankName: formData.bankName || undefined,
        bankAccountNumber: formData.bankAccountNumber || undefined,
        bankIfscCode: formData.bankIfscCode || undefined,
        nameTitle: formData.nameTitle || undefined,
        qualifications: formData.qualifications || undefined,
        skills: formData.skills || undefined,
        joiningDate: formData.joiningDate || undefined,
        bloodGroup: formData.bloodGroup || undefined,
        aadhaarNumber: formData.aadhaarNumber || undefined,
        isActive: formData.isActive,
      };

      await employeeService.updateEmployee(employee.id, submitData);
      
      // Refresh user data globally
      await fetchUser();
      
      setIsEditing(false);
      // Optional: scroll to top or show success toast
    } catch (err: any) {
      console.error('Update profile error:', err);
      setUpdateProfileError(err.response?.data?.error || err.message || 'Failed to update profile. Please try again.');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length || !employee?.id) return;
    const file = e.target.files[0];
    
    setIsUploadingAvatar(true);
    try {
      await employeeService.uploadAvatar(employee.id, file);
      await fetchUser(); // Reload user data
    } catch (error) {
      console.error('Failed to upload avatar', error);
      alert('Failed to upload profile image.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const API_URL = process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:5000' : '');

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    // Validation
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setPasswordError('All fields are required');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      setPasswordError('New password must be different from current password');
      return;
    }

    try {
      setIsChangingPassword(true);
      await authService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      setPasswordSuccess('Password changed successfully!');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setShowPasswordReset(false);

      // Clear success message after 3 seconds
      setTimeout(() => {
        setPasswordSuccess('');
      }, 3000);
    } catch (err: any) {
      setPasswordError(err.response?.data?.error || err.message || 'Failed to change password. Please try again.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employee?.id || !newDocFile) return;

    try {
      setUploading(true);
      await documentService.uploadDocument(employee.id, newDocTitle, newDocFile);
      setShowUploadModal(false);
      setNewDocTitle('');
      setNewDocFile(null);
      loadDocuments(employee.id);
    } catch (error) {
      console.error('Failed to upload', error);
      alert('Failed to upload document.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (id: string) => {
    if (!confirm('Delete this document?')) return;
    try {
      await documentService.deleteDocument(id);
      if (employee?.id) loadDocuments(employee.id);
    } catch (error) {
      console.error('Failed to delete', error);
      alert('Failed to delete document.');
    }
  };

  const getRoleBadgeColor = (role: Role) => {
    switch (role) {
      case Role.ADMIN:
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      case Role.HR_MANAGER:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case Role.EMPLOYEE:
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

  if (!user) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg text-slate-600 dark:text-slate-400">User not found</p>
            <Link
              href="/auth/login"
              className="mt-4 text-blue-600 dark:text-blue-400 hover:underline"
            >
              Go to Login
            </Link>
          </div>
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
            href="/dashboard"
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              My Profile
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              View and manage your profile information
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div />
          {!isEditing ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-md transition-all sm:text-base text-sm"
            >
              <Edit className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Edit Profile</span>
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsEditing(false)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg font-medium transition-all sm:text-base text-sm"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Cancel Editing</span>
            </motion.button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <motion.div
            variants={itemVariants}
            className="lg:col-span-1"
          >
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-4 group inline-block">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg overflow-hidden">
                    {employee?.avatar ? (
                      <img src={`${API_URL}${employee.avatar}`} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      employee
                        ? `${employee.firstName[0]}${employee.lastName[0]}`
                        : user.email[0].toUpperCase()
                    )}
                  </div>
                  {/* Upload Overlay */}
                  <label className="absolute inset-0 bg-black/50 text-white rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    {isUploadingAvatar ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <>
                        <Camera className="w-6 h-6 mb-1" />
                        <span className="text-[10px]">Upload</span>
                        <input type="file" hidden accept="image/*" onChange={handleAvatarUpload} disabled={isUploadingAvatar} />
                      </>
                    )}
                  </label>
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                  {employee
                    ? `${employee.firstName} ${employee.lastName}`
                    : user.email}
                </h2>
                <span
                  className={`px-3 py-1 text-sm font-semibold rounded-full mb-4 ${getRoleBadgeColor(
                    user.role
                  )}`}
                >
                  {user.role}
                </span>
                {employee && (
                  <div className="w-full space-y-2 mt-4">
                    {employee.employeeId && (
                      <div className="flex items-center justify-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <Hash className="w-4 h-4" />
                        <span>{employee.employeeId}</span>
                      </div>
                    )}
                    {employee.department && (
                      <div className="flex items-center justify-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <Building2 className="w-4 h-4" />
                        <span>{employee.department}</span>
                      </div>
                    )}
                    {employee.position && (
                      <div className="flex items-center justify-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <PositionIcon className="w-4 h-4" />
                        <span>{employee.position}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Details Card */}
          {/* Details & Form Column */}
          <motion.div
            variants={itemVariants}
            className="lg:col-span-2 space-y-6"
          >
            {isEditing ? (
              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                  <Edit className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  Edit Profile Information
                </h3>

                {updateProfileError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl mb-6"
                  >
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                    <p className="text-sm text-red-800 dark:text-red-200">{updateProfileError}</p>
                  </motion.div>
                )}

                <form onSubmit={handleSubmitProfile} className="space-y-6">
                  {/* Account Info (Readonly) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Email Address</label>
                      <input
                        type="text"
                        disabled
                        className="block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 cursor-not-allowed text-sm"
                        value={formData.email}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Employee ID</label>
                      <input
                        type="text"
                        disabled
                        className="block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 cursor-not-allowed text-sm"
                        value={formData.employeeIdCode}
                      />
                    </div>
                  </div>

                  {/* Personal Info */}
                  <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4">Personal Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex gap-4">
                        <div className="w-24">
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Title</label>
                          <select
                            name="nameTitle"
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-sm focus:ring-2 focus:ring-blue-500 transition-all text-slate-900 dark:text-white"
                            value={formData.nameTitle}
                            onChange={handleChange}
                          >
                            <option value="Mr.">Mr.</option>
                            <option value="Ms.">Ms.</option>
                            <option value="Mrs.">Mrs.</option>
                            <option value="Dr.">Dr.</option>
                          </select>
                        </div>
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">First Name</label>
                          <input
                            type="text"
                            name="firstName"
                            required
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-sm focus:ring-2 focus:ring-blue-500 transition-all text-slate-900 dark:text-white"
                            value={formData.firstName}
                            onChange={handleChange}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Last Name</label>
                        <input
                          type="text"
                          name="lastName"
                          required
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-sm focus:ring-2 focus:ring-blue-500 transition-all text-slate-900 dark:text-white"
                          value={formData.lastName}
                          onChange={handleChange}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Phone</label>
                        <input
                          type="text"
                          name="phone"
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-sm focus:ring-2 focus:ring-blue-500 transition-all text-slate-900 dark:text-white"
                          value={formData.phone}
                          onChange={handleChange}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Date of Birth</label>
                        <DatePicker
                          value={formData.dateOfBirth || ''}
                          onChange={(val) => setFormData(prev => ({ ...prev, dateOfBirth: val }))}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Personal Email</label>
                        <input
                          type="email"
                          name="personalEmail"
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-sm focus:ring-2 focus:ring-blue-500 transition-all text-slate-900 dark:text-white"
                          placeholder="personal@email.com"
                          value={formData.personalEmail}
                          onChange={handleChange}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Blood Group</label>
                        <select
                          name="bloodGroup"
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-sm focus:ring-2 focus:ring-blue-500 transition-all text-slate-900 dark:text-white"
                          value={formData.bloodGroup || ''}
                          onChange={handleChange}
                        >
                          <option value="">Select</option>
                          <option value="A+">A+</option>
                          <option value="A-">A-</option>
                          <option value="B+">B+</option>
                          <option value="B-">B-</option>
                          <option value="AB+">AB+</option>
                          <option value="AB-">AB-</option>
                          <option value="O+">O+</option>
                          <option value="O-">O-</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Aadhaar Number</label>
                        <input
                          type="text"
                          name="aadhaarNumber"
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-sm focus:ring-2 focus:ring-blue-500 transition-all text-slate-900 dark:text-white"
                          placeholder="1234 5678 9012"
                          value={formData.aadhaarNumber || ''}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Address Info */}
                  <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4">Address Information</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Street Address</label>
                        <input
                          type="text"
                          name="address"
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-sm focus:ring-2 focus:ring-blue-500 transition-all text-slate-900 dark:text-white"
                          value={formData.address}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">City</label>
                          <input
                            type="text"
                            name="city"
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-sm focus:ring-2 focus:ring-blue-500 transition-all text-slate-900 dark:text-white"
                            value={formData.city}
                            onChange={handleChange}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">State</label>
                          <input
                            type="text"
                            name="state"
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-sm focus:ring-2 focus:ring-blue-500 transition-all text-slate-900 dark:text-white"
                            value={formData.state}
                            onChange={handleChange}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Zip Code</label>
                          <input
                            type="text"
                            name="zipCode"
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-sm focus:ring-2 focus:ring-blue-500 transition-all text-slate-900 dark:text-white"
                            value={formData.zipCode}
                            onChange={handleChange}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Country</label>
                          <input
                            type="text"
                            name="country"
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-sm focus:ring-2 focus:ring-blue-500 transition-all text-slate-900 dark:text-white"
                            value={formData.country}
                            onChange={handleChange}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Employment Info (Readonly for non-admins) */}
                  <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4">Employment Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Department</label>
                        <input
                          type="text"
                          disabled
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700/50 text-sm text-slate-500 dark:text-slate-400 cursor-not-allowed"
                          value={formData.department}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Position</label>
                        <input
                          type="text"
                          disabled
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700/50 text-sm text-slate-500 dark:text-slate-400 cursor-not-allowed"
                          value={formData.position}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Employment Type</label>
                        <input
                          type="text"
                          disabled
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700/50 text-sm text-slate-500 dark:text-slate-400 cursor-not-allowed"
                          value={formData.employmentType}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Joining Date</label>
                        <input
                          type="text"
                          disabled
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700/50 text-sm text-slate-500 dark:text-slate-400 cursor-not-allowed"
                          value={formData.joiningDate}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Salary Information (Only visible/editable for Admins/HR) */}
                  {(user?.role === Role.ADMIN || user?.role === Role.HR_MANAGER) && (
                    <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4">Salary & Benefits</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Annual CTC (₹)</label>
                          <input
                            type="number"
                            name="salary"
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-sm focus:ring-2 focus:ring-blue-500 transition-all text-slate-900 dark:text-white"
                            value={formData.salary || ''}
                            onChange={handleChange}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Monthly Leave Allotment</label>
                          <input
                            type="number"
                            name="monthlyLeaveAllotment"
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-sm focus:ring-2 focus:ring-blue-500 transition-all text-slate-900 dark:text-white"
                            value={formData.monthlyLeaveAllotment || ''}
                            onChange={handleChange}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Bank Details */}
                  <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4">Bank Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Bank Name</label>
                        <input
                          type="text"
                          name="bankName"
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-sm focus:ring-2 focus:ring-blue-500 transition-all text-slate-900 dark:text-white"
                          value={formData.bankName}
                          onChange={handleChange}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Account Number</label>
                        <input
                          type="text"
                          name="bankAccountNumber"
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-sm focus:ring-2 focus:ring-blue-500 transition-all text-slate-900 dark:text-white"
                          value={formData.bankAccountNumber}
                          onChange={handleChange}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">IFSC Code</label>
                        <input
                          type="text"
                          name="bankIfscCode"
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-sm focus:ring-2 focus:ring-blue-500 transition-all text-slate-900 dark:text-white"
                          value={formData.bankIfscCode}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                  </div>

                   {/* Skills & Qualifications */}
                   <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4">Professional Skills</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Qualifications</label>
                        <input
                          type="text"
                          name="qualifications"
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-sm focus:ring-2 focus:ring-blue-500 transition-all text-slate-900 dark:text-white"
                          placeholder="e.g. B.Tech, MBA"
                          value={formData.qualifications}
                          onChange={handleChange}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Skills (Press Enter or use comma to add)</label>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {formData.skills && formData.skills.split(',').map(s => s.trim()).filter(Boolean).map((skill, index) => (
                            <div key={index} className="flex items-center gap-1.5 px-3 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-lg text-sm font-medium">
                              {skill}
                              <button type="button" onClick={() => handleRemoveSkill(skill)} className="hover:text-blue-900">
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                        <input
                          type="text"
                          value={skillInput}
                          onChange={(e) => setSkillInput(e.target.value)}
                          onKeyDown={handleAddSkill}
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-sm focus:ring-2 focus:ring-blue-500 transition-all text-slate-900 dark:text-white"
                          placeholder="Add a skill..."
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-6 border-t border-slate-200 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-6 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 transition-all"
                    >
                      Cancel
                    </button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={isUpdatingProfile}
                      className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                      {isUpdatingProfile ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Saving Changes...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-5 h-5" />
                          <span>Save Changes</span>
                        </>
                      )}
                    </motion.button>
                  </div>
                </form>
              </div>
            ) : (
              <>
                {/* Account Information */}
                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    Account Information
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                      <Mail className="w-5 h-5 text-slate-400" />
                      <div className="flex-1">
                        <p className="text-xs text-slate-500 dark:text-slate-400">Email</p>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                      <Shield className="w-5 h-5 text-slate-400" />
                      <div className="flex-1">
                        <p className="text-xs text-slate-500 dark:text-slate-400">Role</p>
                        <p className="text-sm font-medium text-slate-900 dark:text-white capitalize">
                          {user.role.toLowerCase()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                      <div className="w-5 h-5 flex items-center justify-center">
                        <div
                          className={`w-3 h-3 rounded-full ${user.isActive
                            ? 'bg-green-500'
                            : 'bg-red-500'
                            }`}
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-slate-500 dark:text-slate-400">Status</p>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                          {user.isActive ? 'Active' : 'Inactive'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Password Reset Section */}
                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                      <Lock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      Password & Security
                    </h3>
                    {!showPasswordReset && (
                      <button
                        onClick={() => setShowPasswordReset(true)}
                        className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                      >
                        Change Password
                      </button>
                    )}
                  </div>

                  {passwordSuccess && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl mb-4"
                    >
                      <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                      <p className="text-sm text-green-800 dark:text-green-200">{passwordSuccess}</p>
                    </motion.div>
                  )}

                  {showPasswordReset ? (
                    <form onSubmit={handlePasswordChange} className="space-y-4">
                      {passwordError && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl"
                        >
                          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                          <p className="text-sm text-red-800 dark:text-red-200">{passwordError}</p>
                        </motion.div>
                      )}

                      <div>
                        <label htmlFor="currentPassword" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Current Password
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Lock className="h-5 w-5 text-slate-400" />
                          </div>
                          <input
                            id="currentPassword"
                            type={showPasswords.current ? 'text' : 'password'}
                            value={passwordData.currentPassword}
                            onChange={(e) =>
                              setPasswordData({ ...passwordData, currentPassword: e.target.value })
                            }
                            className="block w-full pl-10 pr-12 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="Enter current password"
                            required
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowPasswords({ ...showPasswords, current: !showPasswords.current })
                            }
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                          >
                            {showPasswords.current ? (
                              <EyeOff className="h-5 w-5" />
                            ) : (
                              <Eye className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label htmlFor="newPassword" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          New Password
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Lock className="h-5 w-5 text-slate-400" />
                          </div>
                          <input
                            id="newPassword"
                            type={showPasswords.new ? 'text' : 'password'}
                            value={passwordData.newPassword}
                            onChange={(e) =>
                              setPasswordData({ ...passwordData, newPassword: e.target.value })
                            }
                            className="block w-full pl-10 pr-12 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="Enter new password (min. 8 characters)"
                            required
                            minLength={8}
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowPasswords({ ...showPasswords, new: !showPasswords.new })
                            }
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                          >
                            {showPasswords.new ? (
                              <EyeOff className="h-5 w-5" />
                            ) : (
                              <Eye className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          Must be at least 8 characters long
                        </p>
                      </div>

                      <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Confirm New Password
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Lock className="h-5 w-5 text-slate-400" />
                          </div>
                          <input
                            id="confirmPassword"
                            type={showPasswords.confirm ? 'text' : 'password'}
                            value={passwordData.confirmPassword}
                            onChange={(e) =>
                              setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                            }
                            className="block w-full pl-10 pr-12 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="Confirm new password"
                            required
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })
                            }
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                          >
                            {showPasswords.confirm ? (
                              <EyeOff className="h-5 w-5" />
                            ) : (
                              <Eye className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="flex gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setShowPasswordReset(false);
                            setPasswordData({
                              currentPassword: '',
                              newPassword: '',
                              confirmPassword: '',
                            });
                            setPasswordError('');
                            setPasswordSuccess('');
                          }}
                          className="flex-1 px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors text-center font-medium"
                        >
                          Cancel
                        </button>
                        <motion.button
                          type="submit"
                          disabled={isChangingPassword}
                          className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          whileHover={{ scale: isChangingPassword ? 1 : 1.02 }}
                          whileTap={{ scale: isChangingPassword ? 1 : 0.98 }}
                        >
                          {isChangingPassword ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin" />
                              <span>Changing...</span>
                            </>
                          ) : (
                            <>
                              <Lock className="w-5 h-5" />
                              <span>Change Password</span>
                            </>
                          )}
                        </motion.button>
                      </div>
                    </form>
                  ) : (
                    <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Click "Change Password" to update your account password.
                      </p>
                    </div>
                  )}
                </div>

                {/* Employee Information */}
                {employee && (
                  <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                      <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      Employee Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {employee.employeeId && (
                        <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-2">
                            <Hash className="w-4 h-4" />
                            Employee ID
                          </p>
                          <p className="text-sm font-medium text-slate-900 dark:text-white">
                            {employee.employeeId}
                          </p>
                        </div>
                      )}
                      {employee.phone && (
                        <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            Phone
                          </p>
                          <p className="text-sm font-medium text-slate-900 dark:text-white">
                            {employee.phone}
                          </p>
                        </div>
                      )}
                      {employee.department && (
                        <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-2">
                            <Building2 className="w-4 h-4" />
                            Department
                          </p>
                          <p className="text-sm font-medium text-slate-900 dark:text-white">
                            {employee.department}
                          </p>
                        </div>
                      )}
                      {employee.position && (
                        <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-2">
                            <PositionIcon className="w-4 h-4" />
                            Position
                          </p>
                          <p className="text-sm font-medium text-slate-900 dark:text-white">
                            {employee.position}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Payslips Information */}
            {employee && (
              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  My Payslips
                </h3>

                {loadingPayslips ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                  </div>
                ) : payslips.length === 0 ? (
                  <div className="text-center py-6 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                    <p className="text-sm text-slate-500 dark:text-slate-400">No payslips available.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {payslips.map(payslip => (
                      <div key={payslip._id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900 dark:text-white">
                              {new Date(payslip.year, payslip.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
                            </p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                              Net Pay: ₹{payslip.netSalary?.toLocaleString()} • Status: {payslip.status}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => payslipService.generatePayslip(payslip)}
                          className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 dark:hover:text-blue-400 rounded-lg transition-colors"
                          title="Download Payslip PDF"
                        >
                          <Download className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Documents Information */}
            {employee && (
              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
                <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-3 mb-4">
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    My Documents
                  </h3>
                  <button
                    onClick={() => setShowUploadModal(true)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg text-sm hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                  >
                    <FileText className="w-4 h-4" />
                    Upload
                  </button>
                </div>

                {loadingDocs ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                  </div>
                ) : documents.length === 0 ? (
                  <div className="text-center py-6 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                    <p className="text-sm text-slate-500 dark:text-slate-400">No documents uploaded.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {documents.map((doc) => (
                      <div key={doc._id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900 dark:text-white">{doc.title}</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                              {new Date(doc.createdAt).toLocaleDateString()} • {Math.round(doc.size / 1024)} KB
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <a
                            href={documentService.getDownloadUrl(doc._id)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 dark:hover:text-blue-400 rounded-lg transition-colors"
                            title="Download"
                          >
                            <Download className="w-5 h-5" />
                          </a>
                          <button
                            onClick={() => handleDeleteDocument(doc._id)}
                            className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 dark:hover:text-red-400 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* No Employee Record */}
            {!employee && (
              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
                <div className="text-center py-8">
                  <User className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                  <p className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                    No Employee Record
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                    You don't have an associated employee profile yet.
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </motion.div>

      <DocumentUploadModal 
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        title={newDocTitle}
        setTitle={setNewDocTitle}
        setFile={setNewDocFile}
        onSubmit={handleUploadDocument}
        uploading={uploading}
      />
    </DashboardLayout>
  );
}
