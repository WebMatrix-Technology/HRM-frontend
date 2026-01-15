'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Users, Target, DollarSign, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { projectService } from '@/services/project.service';
import { employeeService } from '@/services/employee.service';
import { ProjectStatus, ProjectPriority, CreateProjectData } from '@/types';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated: () => void;
}

export default function CreateProjectModal({
  isOpen,
  onClose,
  onProjectCreated,
}: CreateProjectModalProps) {
  const [formData, setFormData] = useState<CreateProjectData>({
    name: '',
    description: '',
    status: ProjectStatus.PLANNING,
    priority: ProjectPriority.MEDIUM,
    startDate: new Date().toISOString().split('T')[0],
    managerId: '',
  });
  const [availableManagers, setAvailableManagers] = useState<any[]>([]);
  const [availableEmployees, setAvailableEmployees] = useState<any[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadInitialData();
    }
  }, [isOpen]);

  const loadInitialData = async () => {
    try {
      setLoadingData(true);
      const [managersResponse, employeesResponse] = await Promise.all([
        projectService.getAvailableManagers(),
        employeeService.getEmployees(1, 1000, { isActive: true })
      ]);
      
      setAvailableManagers(managersResponse);
      setAvailableEmployees(employeesResponse.employees);
    } catch (error) {
      console.error('Failed to load data:', error);
      setError('Failed to load managers and employees');
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!formData.name.trim()) {
      setError('Project name is required');
      return;
    }

    if (!formData.managerId) {
      setError('Project manager is required');
      return;
    }

    if (formData.deadline && new Date(formData.deadline) <= new Date(formData.startDate)) {
      setError('Deadline must be after start date');
      return;
    }

    try {
      setLoading(true);
      
      const projectData: CreateProjectData = {
        ...formData,
        memberIds: selectedMembers,
        tags: tags.length > 0 ? tags : undefined,
      };

      await projectService.createProject(projectData);
      
      setSuccess('Project created successfully!');
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        status: ProjectStatus.PLANNING,
        priority: ProjectPriority.MEDIUM,
        startDate: new Date().toISOString().split('T')[0],
        managerId: '',
      });
      setSelectedMembers([]);
      setTags([]);
      setTagInput('');
      
      // Notify parent and close modal
      setTimeout(() => {
        onProjectCreated();
        onClose();
        setSuccess('');
      }, 1500);
      
    } catch (err: any) {
      setError(
        err.response?.data?.error || 
        err.message || 
        'Failed to create project. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        name: '',
        description: '',
        status: ProjectStatus.PLANNING,
        priority: ProjectPriority.MEDIUM,
        startDate: new Date().toISOString().split('T')[0],
        managerId: '',
      });
      setSelectedMembers([]);
      setTags([]);
      setTagInput('');
      setError('');
      setSuccess('');
      onClose();
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

  const toggleMember = (employeeId: string) => {
    setSelectedMembers(prev =>
      prev.includes(employeeId)
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-4xl border border-slate-200 dark:border-slate-700 my-8"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                    Create New Project
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Set up a new project for your team
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                disabled={loading}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {loadingData ? (
              <div className="p-12 text-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"
                />
                <p className="text-slate-600 dark:text-slate-400">Loading project data...</p>
              </div>
            ) : (
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
                        disabled={loading}
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
                        disabled={loading}
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
                          disabled={loading}
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
                          disabled={loading}
                        >
                          {Object.values(ProjectPriority).map((priority) => (
                            <option key={priority} value={priority}>
                              {priority.charAt(0) + priority.slice(1).toLowerCase()}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="startDate" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Start Date *
                        </label>
                        <input
                          id="startDate"
                          type="date"
                          value={formData.startDate}
                          onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                          className="block w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                          disabled={loading}
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="deadline" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Deadline
                        </label>
                        <input
                          id="deadline"
                          type="date"
                          value={formData.deadline || ''}
                          onChange={(e) => setFormData({ ...formData, deadline: e.target.value || undefined })}
                          min={formData.startDate}
                          className="block w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                          disabled={loading}
                        />
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
                        disabled={loading}
                      />
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
                        disabled={loading}
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
                          disabled={loading}
                        />
                        <button
                          type="button"
                          onClick={addTag}
                          disabled={!tagInput.trim() || loading}
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
                                className="text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Team Members */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Team Members ({selectedMembers.length} selected)
                      </label>
                      <div className="border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 max-h-48 overflow-y-auto">
                        {availableEmployees.map((employee) => (
                          <label
                            key={employee.id}
                            className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer transition-colors border-b border-slate-200 dark:border-slate-700 last:border-b-0"
                          >
                            <input
                              type="checkbox"
                              checked={selectedMembers.includes(employee.id)}
                              onChange={() => toggleMember(employee.id)}
                              className="w-4 h-4 text-purple-600 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded focus:ring-purple-500 focus:ring-2"
                              disabled={loading}
                            />
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                              {employee.firstName[0]}{employee.lastName[0]}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-slate-900 dark:text-white">
                                {employee.firstName} {employee.lastName}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                {employee.position || employee.department || 'Employee'}
                              </p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-6 border-t border-slate-200 dark:border-slate-700">
                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={loading ? {} : { scale: 1.02 }}
                    whileTap={loading ? {} : { scale: 0.98 }}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Creating Project...
                      </>
                    ) : (
                      <>
                        <Target className="w-4 h-4" />
                        Create Project
                      </>
                    )}
                  </motion.button>
                  <motion.button
                    type="button"
                    onClick={handleClose}
                    disabled={loading}
                    whileHover={loading ? {} : { scale: 1.02 }}
                    whileTap={loading ? {} : { scale: 0.98 }}
                    className="px-6 py-3 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
                  >
                    Cancel
                  </motion.button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}






