'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, X, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuthStore } from '@/store/authStore';
import { Role, Project, ProjectStatus, ProjectPriority, UpdateProjectData } from '@/types';
import { projectService } from '@/services/project.service';
import DatePicker from '@/components/ui/DatePicker';
import { employeeService } from '@/services/employee.service';

export default function EditProjectPage() {
  const router = useRouter();
  const params = useParams();
  const { user: currentUser, employee: currentEmployee, isLoading, fetchUser } = useAuthStore();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState<UpdateProjectData>({
    name: '',
    description: '',
    status: ProjectStatus.PLANNING,
    priority: ProjectPriority.MEDIUM,
    startDate: '',
    endDate: '',
    deadline: '',
    budget: 0,
    progress: 0,
    tags: [],
    memberIds: [],
  });

  const [availableManagers, setAvailableManagers] = useState<any[]>([]);
  const [availableEmployees, setAvailableEmployees] = useState<any[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  const projectId = params.id as string;
  const isAdmin = currentUser?.role === Role.ADMIN;
  const isManager = currentUser?.role === Role.MANAGER;
  const canAccess = isAdmin || isManager;

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
    loadManagers();
    loadEmployees();
  }, [projectId, canAccess, isLoading, currentUser]);

  const loadProject = async () => {
    try {
      setLoading(true);
      const projectData = await projectService.getProject(projectId);
      setProject(projectData);

      const mId = projectData.manager?.id || (projectData.manager as any)?._id || (typeof projectData.manager === 'string' ? projectData.manager : '');
      if (isManager && currentEmployee && mId !== currentEmployee.id && mId !== (currentEmployee as any)._id) {
        router.replace(`/projects/${projectId}`);
        return;
      }

      // Populate form with existing data
      setFormData({
        name: projectData.name,
        description: projectData.description || '',
        status: projectData.status,
        priority: projectData.priority,
        startDate: projectData.startDate ? projectData.startDate.split('T')[0] : '',
        endDate: projectData.endDate ? projectData.endDate.split('T')[0] : '',
        deadline: projectData.deadline ? projectData.deadline.split('T')[0] : '',
        budget: projectData.budget || 0,
        managerId: projectData.manager?.id || (projectData.manager as any)?._id || (typeof projectData.manager === 'string' ? projectData.manager : ''),
        progress: projectData.progress,
      });

      setTags(projectData.tags || []);
      setSelectedMembers(projectData.members?.map((m: any) => m.employee?.id || (m.employee as any)?._id) || []);
    } catch (err: any) {
      console.error('Failed to load project:', err);
      setError(err.response?.data?.error || 'Failed to load project details');
    } finally {
      setLoading(false);
    }
  };

  const loadManagers = async () => {
    try {
      const managers = await projectService.getAvailableManagers();
      setAvailableManagers(managers);
    } catch (error) {
      console.error('Failed to load managers:', error);
    }
  };

  const loadEmployees = async () => {
    try {
      setLoadingEmployees(true);
      const response = await employeeService.getEmployees(1, 1000, { isActive: true });
      setAvailableEmployees(response.employees || []);
    } catch (error) {
      console.error('Failed to load employees:', error);
    } finally {
      setLoadingEmployees(false);
    }
  };

  const toggleMember = (employeeId: string) => {
    setSelectedMembers(prev =>
      prev.includes(employeeId)
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validation
    if (!formData.name?.trim()) {
      setError('Project name is required');
      return;
    }

    if (!formData.managerId) {
      setError('Project manager is required');
      return;
    }

    if (formData.deadline && formData.startDate && new Date(formData.deadline) <= new Date(formData.startDate)) {
      setError('Deadline must be after start date');
      return;
    }

    try {
      setSaving(true);

      const updateData: UpdateProjectData = {
        ...formData,
        tags: tags.length > 0 ? tags : undefined,
        memberIds: selectedMembers,
      };

      await projectService.updateProject(projectId, updateData);
      setSuccess('Project updated successfully!');

      // Redirect back to project details after a short delay
      setTimeout(() => {
        router.push(`/projects/${projectId}`);
      }, 1500);

    } catch (err: any) {
      setError(
        err.response?.data?.error ||
        err.message ||
        'Failed to update project. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      addTag();
    }
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

  if (error && !project) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-12 h-12 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            Project Not Found
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            The project you are trying to edit could not be found.
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
              onClick={() => router.push(`/projects/${projectId}`)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </motion.button>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                Edit Project
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                Update project details and settings
              </p>
            </div>
          </div>
        </motion.div>

        {/* Edit Form */}
        <motion.div
          variants={itemVariants}
          className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden"
        >
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Messages */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
              >
                <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </motion.div>
            )}

            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
              >
                <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                <p className="text-sm text-green-800 dark:text-green-200">{success}</p>
              </motion.div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                {/* Project Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Project Name *
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter project name"
                    className="block w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    disabled={saving}
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Description
                  </label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe the project goals and objectives"
                    rows={3}
                    className="block w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
                    disabled={saving}
                  />
                </div>

                {/* Status and Priority */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="status" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Status
                    </label>
                    <select
                      id="status"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as ProjectStatus })}
                      className="block w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      disabled={saving}
                    >
                      {Object.values(ProjectStatus).map((status) => (
                        <option key={status} value={status}>
                          {status.charAt(0) + status.slice(1).toLowerCase().replace('_', ' ')}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="priority" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Priority
                    </label>
                    <select
                      id="priority"
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value as ProjectPriority })}
                      className="block w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      disabled={saving}
                    >
                      {Object.values(ProjectPriority).map((priority) => (
                        <option key={priority} value={priority}>
                          {priority.charAt(0) + priority.slice(1).toLowerCase()}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Progress */}
                <div>
                  <label htmlFor="progress" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Progress: {formData.progress}%
                  </label>
                  <input
                    id="progress"
                    type="range"
                    min="0"
                    max="100"
                    value={formData.progress}
                    onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) })}
                    className="block w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-not-allowed opacity-80"
                    disabled={true}
                  />
                  <p className="text-xs text-slate-500 mt-2">
                    Progress is automatically calculated based on completed PBI tasks.
                  </p>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Start Date *
                    </label>
                    <DatePicker
                      value={formData.startDate || ''}
                      onChange={(val) => setFormData({ ...formData, startDate: val })}
                      disabled={saving}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      End Date
                    </label>
                    <DatePicker
                      value={formData.endDate || ''}
                      onChange={(val) => setFormData({ ...formData, endDate: val })}
                      disabled={saving}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Deadline
                    </label>
                    <DatePicker
                      value={formData.deadline || ''}
                      onChange={(val) => setFormData({ ...formData, deadline: val })}
                      min={formData.startDate}
                      disabled={saving}
                    />
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                {/* Project Manager */}
                <div>
                  <label htmlFor="managerId" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Project Manager *
                  </label>
                  <select
                    id="managerId"
                    value={formData.managerId}
                    onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
                    className="block w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    disabled={saving}
                    required
                  >
                    <option value="">Select a manager</option>
                    {availableManagers.map((manager) => (
                      <option key={manager.id} value={manager.id}>
                        {manager.firstName} {manager.lastName} {manager.position && `- ${manager.position}`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Team Members */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Team Members ({selectedMembers.length} selected)
                  </label>
                  <div className="border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 max-h-48 overflow-y-auto mb-4">
                    {loadingEmployees ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="w-5 h-5 animate-spin text-purple-500" />
                      </div>
                    ) : availableEmployees.length === 0 ? (
                      <p className="p-4 text-sm text-slate-500 text-center text-slate-500">No employees found.</p>
                    ) : (
                      availableEmployees.map((employee) => (
                        <label
                          key={employee.id}
                          className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer transition-colors border-b border-slate-200 dark:border-slate-700 last:border-b-0"
                        >
                          <input
                            type="checkbox"
                            checked={selectedMembers.includes(employee.id)}
                            onChange={() => toggleMember(employee.id)}
                            className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                            disabled={saving}
                          />
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
                            {employee.firstName[0]}{employee.lastName[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                              {employee.firstName} {employee.lastName}
                            </p>
                            <p className="text-xs text-slate-500 truncate">
                              {employee.position || 'Employee'}
                            </p>
                          </div>
                        </label>
                      ))
                    )}
                  </div>
                </div>

                {/* Budget */}
                <div>
                  <label htmlFor="budget" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Budget (Optional)
                  </label>
                  <input
                    id="budget"
                    type="number"
                    min="0"
                    value={formData.budget || ''}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value ? Number(e.target.value) : undefined })}
                    placeholder="Enter project budget"
                    className="block w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    disabled={saving}
                  />
                </div>

                {/* Tags */}
                <div>
                  <label htmlFor="tags" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Tags
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      id="tags"
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Add tags (press Enter)"
                      className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      disabled={saving}
                    />
                    <button
                      type="button"
                      onClick={addTag}
                      disabled={!tagInput.trim() || saving}
                      className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Add
                    </button>
                  </div>
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 text-sm rounded-lg"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            disabled={saving}
                            className="text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 disabled:opacity-50"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-6 border-t border-slate-200 dark:border-slate-700">
              <motion.button
                type="submit"
                disabled={saving}
                whileHover={saving ? {} : { scale: 1.02 }}
                whileTap={saving ? {} : { scale: 0.98 }}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Updating Project...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Update Project
                  </>
                )}
              </motion.button>
              <motion.button
                type="button"
                onClick={() => router.push(`/projects/${projectId}`)}
                disabled={saving}
                whileHover={saving ? {} : { scale: 1.02 }}
                whileTap={saving ? {} : { scale: 0.98 }}
                className="px-6 py-3 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
              >
                Cancel
              </motion.button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </DashboardLayout>
  );
}





