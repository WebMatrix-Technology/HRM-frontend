'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Briefcase,
  Plus,
  Search,
  Filter,
  Calendar,
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  MoreVertical,
  Edit,
  Trash2,
  UserPlus,
  Download,
  Eye,
  Target,
  DollarSign,
  FileText,
  X,
  Loader2,
  Paperclip,
  Upload,
  DownloadCloud
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import CreateProjectModal from '@/components/CreateProjectModal';
import ProjectCardSkeleton from '@/components/projects/ProjectCardSkeleton';
import { useAuthStore } from '@/store/authStore';
import { Role, Project, ProjectStatus, ProjectPriority } from '@/types';
import { projectService } from '@/services/project.service';

export default function ProjectsPage() {
  const router = useRouter();
  const { user: currentUser, isAuthenticated, isLoading, fetchUser } = useAuthStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | ''>('');
  const [priorityFilter, setPriorityFilter] = useState<ProjectPriority | ''>('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedProjectForReport, setSelectedProjectForReport] = useState<{ id: string, name: string } | null>(null);
  const [reportText, setReportText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    overduedProjects: 0,
  });

  const isAdmin = currentUser?.role === Role.ADMIN;
  const isHRManager = currentUser?.role === Role.HR_MANAGER;
  const isManager = currentUser?.role === Role.MANAGER;
  const canAccess = isAdmin || isManager;
  const canCreateProject = isAdmin || isManager;

  // Handle search debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Main data loading effect
  useEffect(() => {
    if (!isAuthenticated) return;
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

    loadProjects(debouncedSearch);
    loadStats();
  }, [isAuthenticated, isLoading, currentUser, canAccess, router, page, statusFilter, priorityFilter, debouncedSearch]);

  const loadProjects = async (search?: string) => {
    try {
      setLoading(true);
      const result = await projectService.getProjects(page, 12, {
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
        search: search || undefined,
      });
      console.log('Projects API response:', result);
      console.log('Projects array:', result.projects);
      setProjects(result.projects);
      setTotalPages(result.pagination.totalPages);
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const projectStats = await projectService.getProjectStats();
      setStats(projectStats);
    } catch (error) {
      console.error('Failed to load project stats:', error);
    }
  };

  const handleDeleteProject = async (projectId: string, projectName: string) => {
    if (!confirm(`Are you sure you want to delete "${projectName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await projectService.deleteProject(projectId);
      setProjects(prev => prev.filter(p => p.id !== projectId));
      loadStats(); // Refresh stats
    } catch (error) {
      console.error('Failed to delete project:', error);
      alert('Failed to delete project. Please try again.');
    }
  };

  const handleOpenReportModal = (projectId: string, projectName: string) => {
    setSelectedProjectForReport({ id: projectId, name: projectName });
    setReportText('');
    setSelectedFile(null);
    setShowReportModal(true);
  };

  const handleSubmitReport = async () => {
    if (!selectedProjectForReport || !reportText.trim() || !selectedFile) {
      alert('Please provide both report text and a file.');
      return;
    }

    try {
      setIsSubmittingReport(true);
      const updatedProject = await projectService.uploadReport(
        selectedProjectForReport.id, 
        selectedFile, 
        reportText
      );
      
      setProjects(prev => prev.map(p => p.id === selectedProjectForReport.id ? updatedProject : p));
      loadStats(); // Refresh stats
      setShowReportModal(false);
      setSelectedProjectForReport(null);
    } catch (error) {
      console.error('Failed to submit report:', error);
      alert('Failed to submit report. Please try again.');
    } finally {
      setIsSubmittingReport(false);
    }
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
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

  return (
    <DashboardLayout>
      <motion.div
        className="space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl">
                <Briefcase className="w-8 h-8 text-white" />
              </div>
              Projects
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              Manage and track all your organization's projects
            </p>
          </div>
          {canCreateProject && (
            <motion.button
              onClick={() => setShowCreateModal(true)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-600 text-white rounded-xl font-medium shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all"
            >
              <Plus className="w-5 h-5" />
              New Project
            </motion.button>
          )}
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            variants={itemVariants}
            className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Total Projects</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                  {stats.totalProjects}
                </p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Briefcase className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Active</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                  {stats.activeProjects}
                </p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Completed</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                  {stats.completedProjects}
                </p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <CheckCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Overdue</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
                  {stats.overduedProjects}
                </p>
              </div>
              <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Filters and Search */}
        <motion.div
          variants={itemVariants}
          className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-lg border border-slate-200 dark:border-slate-700"
        >
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as ProjectStatus | '');
                setPage(1);
              }}
              className="px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              {Object.values(ProjectStatus).map((status) => (
                <option key={status} value={status}>
                  {status.charAt(0) + status.slice(1).toLowerCase().replace('_', ' ')}
                </option>
              ))}
            </select>
            <select
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value as ProjectPriority | '');
                setPage(1);
              }}
              className="px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">All Priority</option>
              {Object.values(ProjectPriority).map((priority) => (
                <option key={priority} value={priority}>
                  {priority.charAt(0) + priority.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
          </div>
        </motion.div>

        {/* Projects Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <ProjectCardSkeleton key={i} />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <motion.div
            variants={itemVariants}
            className="bg-white dark:bg-slate-800 rounded-xl p-12 shadow-lg border border-slate-200 dark:border-slate-700 text-center"
          >
            <Briefcase className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <p className="text-lg font-semibold text-slate-900 dark:text-white">
              No projects found
            </p>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              {searchQuery ? 'Try adjusting your search criteria' : 'Get started by creating your first project'}
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {projects.map((project, index) => (
              <motion.div
                key={project.id}
                variants={itemVariants}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700 hover:shadow-2xl transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 dark:text-white text-lg mb-1 line-clamp-1">
                      {project.name}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-3">
                      {project.description || 'No description provided'}
                    </p>
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(project.status)}`}>
                        {project.status.replace('_', ' ')}
                      </span>
                      <span className={`text-xs font-medium ${getPriorityColor(project.priority)}`}>
                        {project.priority}
                      </span>
                    </div>
                  </div>
                  <div className="relative">
                    <button className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                      <MoreVertical className="w-4 h-4 text-slate-500" />
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400 mb-1">
                    <span>Progress</span>
                    <span>{project.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${getProgressColor(project.progress)}`}
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>

                {/* Project Details */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <Users className="w-4 h-4" />
                    <span>{project.members.length} members</span>
                  </div>
                  {project.deadline && (
                    <div className={`flex items-center gap-2 text-sm ${isOverdue(project.deadline) ? 'text-red-600 dark:text-red-400' : 'text-slate-600 dark:text-slate-400'
                      }`}>
                      <Clock className="w-4 h-4" />
                      <span>
                        Due {formatDate(project.deadline)}
                        {isOverdue(project.deadline) && ' (Overdue)'}
                      </span>
                    </div>
                  )}
                  {project.budget && (
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <DollarSign className="w-4 h-4" />
                      <span>${project.budget.toLocaleString()}</span>
                    </div>
                  )}
                </div>

                {/* Manager and Team */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {project.manager?.firstName?.[0] || '?'}{project.manager?.lastName?.[0] || '?'}
                    </div>
                    <div className="text-sm">
                      <p className="text-slate-900 dark:text-white font-medium">
                        {project.manager?.firstName || 'Unknown'} {project.manager?.lastName || 'Manager'}
                      </p>
                      <p className="text-slate-500 dark:text-slate-400">Manager</p>
                    </div>
                  </div>
                  <div className="flex -space-x-2">
                    {(Array.isArray(project.members) ? project.members : []).slice(0, 3).map((member, idx) => (
                      <div
                        key={member.id || idx}
                        className="w-8 h-8 bg-slate-100 dark:bg-slate-700 border-2 border-white dark:border-slate-800 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-400 font-bold text-xs"
                        title={member.employee ? `${member.employee.firstName} ${member.employee.lastName}` : 'Member'}
                      >
                        {member.employee?.firstName?.[0] || '?'}{member.employee?.lastName?.[0] || '?'}
                      </div>
                    ))}
                    {(Array.isArray(project.members) ? project.members : []).length > 3 && (
                      <div className="w-8 h-8 bg-slate-200 dark:bg-slate-600 border-2 border-white dark:border-slate-800 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-400 font-bold text-xs">
                        +{(Array.isArray(project.members) ? project.members : []).length - 3}
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <button
                    onClick={() => router.push(`/projects/${project.id}`)}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors text-sm font-medium"
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </button>
                  {(isAdmin || isHRManager) && (
                    <button
                      onClick={() => router.push(`/projects/${project.id}/edit`)}
                      className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-sm font-medium"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                  )}
                  {isAdmin && (
                    <button
                      onClick={() => handleDeleteProject(project.id, project.name)}
                      className="flex items-center justify-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors text-sm font-medium"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  )}
                </div>

                {project.progress === 100 && (project.status !== ProjectStatus.COMPLETED || !project.completionReport) && (
                  <div className="mt-3">
                    <button
                      onClick={() => handleOpenReportModal(project.id, project.name)}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-lg transition-all shadow-md hover:shadow-lg text-sm font-medium"
                    >
                      <FileText className="w-4 h-4" />
                      Submit Project Report
                    </button>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <motion.div
            variants={itemVariants}
            className="flex justify-center items-center gap-2"
          >
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-slate-700 dark:text-slate-300">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              Next
            </button>
          </motion.div>
        )}
      </motion.div>

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onProjectCreated={() => {
          loadProjects();
          loadStats();
        }}
      />
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
                    <p className="text-sm text-slate-500 dark:text-slate-400">Completion report for {selectedProjectForReport?.name}</p>
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
