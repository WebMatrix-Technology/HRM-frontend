'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Edit,
  Users,
  Calendar,
  DollarSign,
  Target,
  Clock,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  User,
  Trash2,
  UserPlus,
  UserMinus,
  Tag,
  Building2,
  Briefcase,
  FileText,
  X,
  Loader2,
  Paperclip,
  Upload,
  DownloadCloud,
  FileCheck
} from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuthStore } from '@/store/authStore';
import { Role, Project, ProjectStatus, ProjectPriority } from '@/types';
import { projectService } from '@/services/project.service';
import { employeeService } from '@/services/employee.service';

export default function ProjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user: currentUser, employee: currentEmployee, isLoading, fetchUser } = useAuthStore();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [availableEmployees, setAvailableEmployees] = useState<any[]>([]);
  const [selectedNewMembers, setSelectedNewMembers] = useState<string[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [addingMembers, setAddingMembers] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportText, setReportText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  const projectId = params.id as string;
  const isAdmin = currentUser?.role === Role.ADMIN;
  const isManager = currentUser?.role === Role.MANAGER;
  const canAccess = isAdmin || isManager;

  const isProjectManager = isManager && project && currentEmployee && (project.manager?.id === currentEmployee.id || project.manager?.id === (currentEmployee as any)._id);
  const canEdit = isAdmin || isProjectManager;

  useEffect(() => {
    if (isLoading) return;

    // If authenticated but no user data yet, fetch it
    if (!currentUser) {
      fetchUser();
      return;
    }

    if (!canAccess) {
      router.replace('/dashboard');
      return;
    }

    loadProject();
  }, [projectId, canAccess, isLoading, currentUser]);

  const loadProject = async () => {
    try {
      setLoading(true);
      setError(null);
      const projectData = await projectService.getProject(projectId);
      setProject(projectData);
    } catch (err: any) {
      console.error('Failed to load project:', err);
      setError(err.response?.data?.error || 'Failed to load project details');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!project || !isAdmin) return;

    if (!confirm(`Are you sure you want to delete "${project.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await projectService.deleteProject(projectId);
      router.push('/projects');
    } catch (error) {
      console.error('Failed to delete project:', error);
      alert('Failed to delete project. Please try again.');
    }
  };

  const openAddMembers = async () => {
    setShowAddMembers(true);
    setSelectedNewMembers([]);
    try {
      setLoadingEmployees(true);
      const response = await employeeService.getEmployees(1, 1000, { isActive: true });
      setAvailableEmployees(response.employees);
    } catch (err) {
      console.error('Failed to load employees:', err);
    } finally {
      setLoadingEmployees(false);
    }
  };

  const handleAddMembers = async () => {
    if (selectedNewMembers.length === 0) return;
    try {
      setAddingMembers(true);
      await projectService.addProjectMembers(projectId, {
        employeeIds: selectedNewMembers,
        role: 'MEMBER',
      });
      setShowAddMembers(false);
      setSelectedNewMembers([]);
      await loadProject();
    } catch (err: any) {
      console.error('Failed to add members:', err);
      alert(err.response?.data?.error || 'Failed to add members');
    } finally {
      setAddingMembers(false);
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!confirm(`Remove ${memberName} from this project?`)) return;
    try {
      await projectService.removeProjectMember(projectId, memberId);
      await loadProject();
    } catch (err: any) {
      console.error('Failed to remove member:', err);
      alert(err.response?.data?.error || 'Failed to remove member');
    }
  };

  const handleOpenReportModal = () => {
    if (!project) return;
    setReportText('');
    setSelectedFile(null);
    setShowReportModal(true);
  };

  const handleSubmitReport = async () => {
    if (!project || !reportText.trim() || !selectedFile) {
      alert('Please provide both report text and a file.');
      return;
    }

    try {
      setIsSubmittingReport(true);
      const updatedProject = await projectService.uploadReport(
        projectId, 
        selectedFile, 
        reportText
      );
      
      setProject(updatedProject);
      setShowReportModal(false);
    } catch (error) {
      console.error('Failed to submit report:', error);
      alert('Failed to submit report. Please try again.');
    } finally {
      setIsSubmittingReport(false);
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

  const getStatusColor = (status: ProjectStatus) => {
    switch (status) {
      case ProjectStatus.PLANNING:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case ProjectStatus.IN_PROGRESS:
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case ProjectStatus.ON_HOLD:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case ProjectStatus.COMPLETED:
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400';
      case ProjectStatus.CANCELLED:
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getPriorityColor = (priority: ProjectPriority) => {
    switch (priority) {
      case ProjectPriority.LOW:
        return 'text-green-600 dark:text-green-400';
      case ProjectPriority.MEDIUM:
        return 'text-yellow-600 dark:text-yellow-400';
      case ProjectPriority.HIGH:
        return 'text-orange-600 dark:text-orange-400';
      case ProjectPriority.CRITICAL:
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return 'bg-green-500';
    if (progress >= 75) return 'bg-blue-500';
    if (progress >= 50) return 'bg-yellow-500';
    if (progress >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const isOverdue = (deadline?: string) => {
    if (!deadline) return false;
    return new Date(deadline) < new Date() && new Date(deadline).toDateString() !== new Date().toDateString();
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
            className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full"
          />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !project) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Target className="w-12 h-12 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            Project Not Found
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            {error || 'The project you are looking for could not be found.'}
          </p>
          <motion.button
            onClick={() => router.push('/projects')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Projects
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
              onClick={() => router.push('/projects')}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </motion.button>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                {project.name}
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                Project Details and Management
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {canEdit && (
              <motion.button
                onClick={() => router.push(`/projects/${projectId}/edit`)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <Edit className="w-4 h-4" />
                Edit Project
              </motion.button>
            )}
            {isAdmin && (
              <motion.button
                onClick={handleDeleteProject}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </motion.button>
            )}
            {project.completionReportFile && (
              <motion.button
                onClick={() => {
                  const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/${project.completionReportFile}`;
                  window.open(url, '_blank');
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg hover:bg-emerald-200 transition-colors font-medium border border-emerald-200 dark:border-emerald-800/50"
              >
                <DownloadCloud className="w-4 h-4" />
                Download Report
              </motion.button>
            )}
            {project.progress === 100 && (project.status !== ProjectStatus.COMPLETED || !project.completionReport) && (
              <motion.button
                onClick={handleOpenReportModal}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg transition-all shadow-md hover:shadow-lg font-medium"
              >
                <FileText className="w-4 h-4" />
                Submit Project Report
              </motion.button>
            )}
          </div>
        </motion.div>

        {/* Project Overview */}
        <motion.div
          variants={itemVariants}
          className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-lg border border-slate-200 dark:border-slate-700"
        >
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Main Project Info */}
            <div className="flex-1 space-y-6">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(project.status)}`}>
                    {project.status.replace('_', ' ')}
                  </span>
                  <span className={`text-sm font-medium ${getPriorityColor(project.priority)}`}>
                    {project.priority} Priority
                  </span>
                  {isOverdue(project.deadline) && (
                    <span className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 text-xs font-medium rounded-full">
                      <AlertCircle className="w-3 h-3" />
                      Overdue
                    </span>
                  )}
                </div>

                {project.completionReport && (
                  <div className="mb-8 p-6 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/30 rounded-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                      <FileCheck className="w-24 h-24 text-emerald-500" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-emerald-500" />
                      Project Completion Report
                    </h3>
                    <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed relative z-10">
                      {project.completionReport}
                    </p>
                  </div>
                )}

                {project.description && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Description</h3>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                      {project.description}
                    </p>
                  </div>
                )}

                {/* Progress */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Progress</h3>
                    <span className="text-2xl font-bold text-slate-900 dark:text-white">{project.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all ${getProgressColor(project.progress)}`}
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Project Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Start Date</p>
                    <p className="text-slate-900 dark:text-white font-medium">
                      {formatDate(project.startDate)}
                    </p>
                  </div>
                </div>

                {project.deadline && (
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-slate-400" />
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Deadline</p>
                      <p className={`font-medium ${isOverdue(project.deadline) ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'}`}>
                        {formatDate(project.deadline)}
                      </p>
                    </div>
                  </div>
                )}

                {project.endDate && (
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-slate-400" />
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">End Date</p>
                      <p className="text-slate-900 dark:text-white font-medium">
                        {formatDate(project.endDate)}
                      </p>
                    </div>
                  </div>
                )}

                {project.budget && (
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-5 h-5 text-slate-400" />
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Budget</p>
                      <p className="text-slate-900 dark:text-white font-medium">
                        ${project.budget.toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Manager Info */}
            <div className="lg:w-80">
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Project Manager
                </h3>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                    {project.manager.firstName[0]}{project.manager.lastName[0]}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">
                      {project.manager.firstName} {project.manager.lastName}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Project Manager</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Team Members */}
        <motion.div
          variants={itemVariants}
          className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5" />
              Team Members ({project.members.length})
            </h3>
            {canEdit && (
              <motion.button
                onClick={openAddMembers}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors text-sm font-medium"
              >
                <UserPlus className="w-4 h-4" />
                Add Members
              </motion.button>
            )}
          </div>

          {project.members.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <p className="text-slate-500 dark:text-slate-400">No team members assigned yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {project.members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {member.employee.firstName[0]}{member.employee.lastName[0]}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-900 dark:text-white text-sm">
                      {member.employee.firstName} {member.employee.lastName}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {member.role} • {member.employee.position || 'Employee'}
                    </p>
                  </div>
                  {canEdit && (
                    <button
                      onClick={() => handleRemoveMember(member.id, `${member.employee.firstName} ${member.employee.lastName}`)}
                      className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <UserMinus className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Tags */}
        {project.tags && project.tags.length > 0 && (
          <motion.div
            variants={itemVariants}
            className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700"
          >
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Tag className="w-5 h-5" />
              Tags
            </h3>
            <div className="flex flex-wrap gap-2">
              {project.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 text-sm font-medium rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Add Members Modal */}
      {showAddMembers && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-700"
          >
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Add Team Members</h3>
                  <p className="text-sm text-slate-500">Select employees to add to {project.name}</p>
                </div>
              </div>
              <button onClick={() => setShowAddMembers(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                <UserMinus className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="p-5">
              {loadingEmployees ? (
                <div className="text-center py-8">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-3"
                  />
                  <p className="text-slate-500">Loading employees...</p>
                </div>
              ) : (
                <>
                  <div className="border border-slate-200 dark:border-slate-700 rounded-lg max-h-64 overflow-y-auto">
                    {availableEmployees
                      .filter(emp => !project.members.some(m => (m.employee as any)._id === emp.id || m.employee.id === emp.id))
                      .map((employee) => (
                        <label
                          key={employee.id}
                          className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer transition-colors border-b border-slate-200 dark:border-slate-700 last:border-b-0"
                        >
                          <input
                            type="checkbox"
                            checked={selectedNewMembers.includes(employee.id)}
                            onChange={() =>
                              setSelectedNewMembers(prev =>
                                prev.includes(employee.id)
                                  ? prev.filter(id => id !== employee.id)
                                  : [...prev, employee.id]
                              )
                            }
                            className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                          />
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {employee.firstName[0]}{employee.lastName[0]}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-slate-900 dark:text-white">
                              {employee.firstName} {employee.lastName}
                            </p>
                            <p className="text-xs text-slate-500">
                              {employee.position || employee.department || 'Employee'}
                            </p>
                          </div>
                        </label>
                      ))}
                    {availableEmployees.filter(emp => !project.members.some(m => (m.employee as any)._id === emp.id || m.employee.id === emp.id)).length === 0 && (
                      <div className="p-6 text-center text-slate-500">
                        All employees are already members of this project.
                      </div>
                    )}
                  </div>
                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={handleAddMembers}
                      disabled={selectedNewMembers.length === 0 || addingMembers}
                      className="flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-blue-600 text-white rounded-lg font-medium disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                    >
                      {addingMembers ? 'Adding...' : `Add ${selectedNewMembers.length} Member${selectedNewMembers.length !== 1 ? 's' : ''}`}
                    </button>
                    <button
                      onClick={() => setShowAddMembers(false)}
                      className="px-4 py-2.5 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
      {/* Project Report Modal */}
      <AnimatePresence>
        {showReportModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-700 overflow-hidden"
            >
              <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                    <FileText className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Submit Project Report</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Completion report for {project?.name}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowReportModal(false)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <div className="p-6">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Project Outcome / Summary
                  </label>
                  <textarea
                    value={reportText}
                    onChange={(e) => setReportText(e.target.value)}
                    placeholder="Describe the overall outcome of the project, key achievements, and any final notes..."
                    className="w-full h-32 px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Upload Report Document (PDF, DOCX, Excel)
                  </label>
                  <div className="relative group">
                    <input
                      type="file"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      accept=".pdf,.doc,.docx,.xls,.xlsx"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className={`
                      w-full p-6 border-2 border-dashed rounded-xl transition-all duration-200 flex flex-col items-center justify-center gap-2
                      ${selectedFile 
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10' 
                        : 'border-slate-300 dark:border-slate-600 group-hover:border-emerald-400 dark:group-hover:border-emerald-500/50 bg-slate-50 dark:bg-slate-800/50'
                      }
                    `}>
                      {selectedFile ? (
                        <>
                          <Paperclip className="w-8 h-8 text-emerald-500 animate-bounce-subtle" />
                          <div className="text-center">
                            <p className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[250px]">
                              {selectedFile.name}
                            </p>
                            <p className="text-xs text-emerald-600 dark:text-emerald-400">
                              {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready to upload
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="p-3 bg-white dark:bg-slate-800 rounded-full shadow-sm group-hover:scale-110 transition-transform">
                            <Upload className="w-6 h-6 text-slate-400 group-hover:text-emerald-500" />
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                              Click to upload or drag and drop
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              PDF, DOCX, or Excel (max 10MB)
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
                  Submitting this report will mark the project as <strong>COMPLETED</strong>.
                </p>
              </div>

              <div className="p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex gap-3">
                <button
                  onClick={() => setShowReportModal(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-xl font-medium hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitReport}
                  disabled={!reportText.trim() || !selectedFile || isSubmittingReport}
                  className="flex-[2] px-8 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/25 enabled:hover:shadow-emerald-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmittingReport ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Uploading Report...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Complete Project
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}





