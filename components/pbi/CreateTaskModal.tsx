'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Target, AlertCircle, CheckCircle, Loader2, ListTodo, Calendar, User } from 'lucide-react';
import { projectService } from '@/services/project.service';
import { taskService, TaskStatus, TaskPriority, CreateTaskData } from '@/services/task.service';
import { employeeService } from '@/services/employee.service';
import { Project } from '@/types';

interface CreateTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onTaskCreated: () => void;
    defaultProjectId?: string; // Optional default project to select
}

export default function CreateTaskModal({
    isOpen,
    onClose,
    onTaskCreated,
    defaultProjectId,
}: CreateTaskModalProps) {
    const [formData, setFormData] = useState<CreateTaskData>({
        title: '',
        description: '',
        status: TaskStatus.BACKLOG,
        priority: TaskPriority.MEDIUM,
        storyPoints: 0,
        projectId: defaultProjectId || '',
        assigneeId: '',
        tags: [],
    });

    const [availableProjects, setAvailableProjects] = useState<Project[]>([]);
    const [availableEmployees, setAvailableEmployees] = useState<any[]>([]);
    const [tagInput, setTagInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (isOpen) {
            loadInitialData();
            if (defaultProjectId) {
                setFormData(prev => ({ ...prev, projectId: defaultProjectId }));
            }
        }
    }, [isOpen, defaultProjectId]);

    const loadInitialData = async () => {
        try {
            setLoadingData(true);
            const [projectsResponse, employeesResponse] = await Promise.all([
                projectService.getProjects(1, 1000), // Get all projects
                employeeService.getEmployees(1, 1000, { isActive: true })
            ]);

            setAvailableProjects(projectsResponse.projects);
            setAvailableEmployees(employeesResponse.employees);
        } catch (error) {
            console.error('Failed to load data:', error);
            setError('Failed to load projects and employees');
        } finally {
            setLoadingData(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // Validation
        if (!formData.title.trim()) {
            setError('Task title is required');
            return;
        }

        if (!formData.projectId) {
            setError('Project is required');
            return;
        }

        try {
            setLoading(true);

            await taskService.createTask({
                ...formData,
                description: formData.description || undefined,
                assigneeId: formData.assigneeId || undefined,
                storyPoints: Number(formData.storyPoints),
                tags: formData.tags?.length ? formData.tags : undefined,
            });

            setSuccess('Task created successfully!');

            // Reset form
            setFormData({
                title: '',
                description: '',
                status: TaskStatus.BACKLOG,
                priority: TaskPriority.MEDIUM,
                storyPoints: 0,
                projectId: defaultProjectId || '', // Reset to default if exists
                assigneeId: '',
                tags: [],
            });
            setTagInput('');

            // Notify parent and close modal
            setTimeout(() => {
                onTaskCreated();
                onClose();
                setSuccess('');
            }, 1500);

        } catch (err: any) {
            setError(
                err.response?.data?.message ||
                err.message ||
                'Failed to create task. Please try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (!loading) {
            // Clear specific form fields but keep defaultProjectId if set
            setFormData(prev => ({
                ...prev,
                title: '',
                description: '',
                status: TaskStatus.BACKLOG,
                priority: TaskPriority.MEDIUM,
                storyPoints: 0,
                projectId: defaultProjectId || '',
                assigneeId: '',
                tags: [],
            }));
            setTagInput('');
            setError('');
            setSuccess('');
            onClose();
        }
    };

    const addTag = () => {
        if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
            setFormData({
                ...formData,
                tags: [...(formData.tags || []), tagInput.trim()]
            });
            setTagInput('');
        }
    };

    const removeTag = (tagToRemove: string) => {
        setFormData({
            ...formData,
            tags: formData.tags?.filter(tag => tag !== tagToRemove)
        });
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && tagInput.trim()) {
            e.preventDefault();
            addTag();
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl border border-slate-200 dark:border-slate-700 my-8"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center">
                                    <ListTodo className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                                        Create New Task
                                    </h3>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">
                                        Add a new item to the backlog
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
                                <Loader2 className="w-8 h-8 animate-spin text-pink-500 mx-auto mb-4" />
                                <p className="text-slate-600 dark:text-slate-400">Loading form data...</p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                                {/* Messages */}
                                {error && (
                                    <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                        <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                                        <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                                    </div>
                                )}

                                {success && (
                                    <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                                        <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                                        <p className="text-sm text-green-800 dark:text-green-200">{success}</p>
                                    </div>
                                )}

                                <div className="space-y-4">
                                    {/* Task Title */}
                                    <div>
                                        <label htmlFor="title" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                            Title *
                                        </label>
                                        <input
                                            id="title"
                                            type="text"
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            placeholder="Enter task title"
                                            className="block w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                                            disabled={loading}
                                            required
                                        />
                                    </div>

                                    {/* Project Selection */}
                                    <div>
                                        <label htmlFor="projectId" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                            Project *
                                        </label>
                                        <select
                                            id="projectId"
                                            value={formData.projectId}
                                            onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                                            className="block w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                                            disabled={loading || !!defaultProjectId}
                                        >
                                            <option value="">Select a project</option>
                                            {availableProjects.map((project) => (
                                                <option key={project.id} value={project.id}>
                                                    {project.name}
                                                </option>
                                            ))}
                                        </select>
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
                                            placeholder="Describe the task"
                                            rows={3}
                                            className="block w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all resize-none"
                                            disabled={loading}
                                        />
                                    </div>

                                    {/* Status, Priority, Story Points */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label htmlFor="status" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                                Status
                                            </label>
                                            <select
                                                id="status"
                                                value={formData.status}
                                                onChange={(e) => setFormData({ ...formData, status: e.target.value as TaskStatus })}
                                                className="block w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                                                disabled={loading}
                                            >
                                                {Object.values(TaskStatus).map((status) => (
                                                    <option key={status} value={status}>
                                                        {status}
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
                                                onChange={(e) => setFormData({ ...formData, priority: e.target.value as TaskPriority })}
                                                className="block w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                                                disabled={loading}
                                            >
                                                {Object.values(TaskPriority).map((priority) => (
                                                    <option key={priority} value={priority}>
                                                        {priority}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label htmlFor="storyPoints" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                                Story Points
                                            </label>
                                            <input
                                                id="storyPoints"
                                                type="number"
                                                min="0"
                                                value={formData.storyPoints}
                                                onChange={(e) => setFormData({ ...formData, storyPoints: Number(e.target.value) })}
                                                className="block w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                                                disabled={loading}
                                            />
                                        </div>
                                    </div>

                                    {/* Assignee */}
                                    <div>
                                        <label htmlFor="assigneeId" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                            Assignee
                                        </label>
                                        <select
                                            id="assigneeId"
                                            value={formData.assigneeId}
                                            onChange={(e) => setFormData({ ...formData, assigneeId: e.target.value })}
                                            className="block w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                                            disabled={loading}
                                        >
                                            <option value="">Select an assignee</option>
                                            {availableEmployees.map((employee) => (
                                                <option key={employee.id} value={employee.id}>
                                                    {employee.firstName} {employee.lastName}
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
                                                className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                                                disabled={loading}
                                            />
                                            <button
                                                type="button"
                                                onClick={addTag}
                                                disabled={!tagInput.trim() || loading}
                                                className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            >
                                                Add
                                            </button>
                                        </div>
                                        {formData.tags && formData.tags.length > 0 && (
                                            <div className="flex flex-wrap gap-2">
                                                {formData.tags.map((tag, index) => (
                                                    <span
                                                        key={index}
                                                        className="inline-flex items-center gap-1 px-2 py-1 bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-300 text-sm rounded-lg"
                                                    >
                                                        {tag}
                                                        <button
                                                            type="button"
                                                            onClick={() => removeTag(tag)}
                                                            className="text-pink-600 hover:text-pink-800 dark:text-pink-400 dark:hover:text-pink-300"
                                                        >
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-3 pt-6 border-t border-slate-200 dark:border-slate-700">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="flex-1 px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-pink-500/25"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Creating Task...
                                            </>
                                        ) : (
                                            <>
                                                <ListTodo className="w-4 h-4" />
                                                Create Task
                                            </>
                                        )}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleClose}
                                        disabled={loading}
                                        className="px-6 py-3 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
