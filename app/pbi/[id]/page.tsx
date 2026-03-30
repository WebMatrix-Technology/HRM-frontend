'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    ArrowLeft,
    Circle,
    MoreHorizontal,
    Edit2,
    Trash2,
    User,
    Tag,
    FolderKanban,
    Clock,
    CalendarDays,
    Target,
    Loader2,
    CheckCircle2,
    AlertCircle,
    Hash,
    Layers,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { taskService, Task, TaskStatus, TaskPriority } from '@/services/task.service';
import CreateTaskModal from '@/components/pbi/CreateTaskModal';
import Link from 'next/link';

export default function PBIDetailPage() {
    const router = useRouter();
    const params = useParams();
    const taskId = params.id as string;

    const [task, setTask] = useState<Task | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showMenu, setShowMenu] = useState(false);

    useEffect(() => {
        if (taskId) loadTask();
    }, [taskId]);

    const loadTask = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await taskService.getTask(taskId);
            setTask(data);
        } catch (err: any) {
            console.error('Failed to load task:', err);
            setError(err.response?.data?.message || 'Failed to load task');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!task) return;
        if (!confirm(`Delete "${task.title}"? This cannot be undone.`)) return;
        try {
            await taskService.deleteTask(task._id);
            router.push('/pbi');
        } catch (err) {
            console.error('Failed to delete task:', err);
            alert('Failed to delete task');
        }
    };

    const getStatusBadge = (status: TaskStatus) => {
        const configs: Record<string, { color: string; bg: string; border: string; icon: any }> = {
            [TaskStatus.BACKLOG]: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', icon: Circle },
            [TaskStatus.READY]: { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30', icon: CheckCircle2 },
            [TaskStatus.IN_PROGRESS]: { color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', icon: Clock },
            [TaskStatus.IN_REVIEW]: { color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30', icon: AlertCircle },
            [TaskStatus.DONE]: { color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30', icon: CheckCircle2 },
        };
        const config = configs[status] || configs[TaskStatus.BACKLOG];
        const StatusIcon = config.icon;
        const displayLabel = status === TaskStatus.BACKLOG ? 'Planning' : status;
        return (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-sm font-semibold rounded-full border ${config.bg} ${config.color} ${config.border}`}>
                <StatusIcon className="w-3.5 h-3.5" />
                {displayLabel}
            </span>
        );
    };

    const getPriorityBadge = (priority: TaskPriority) => {
        const colors: Record<string, string> = {
            [TaskPriority.CRITICAL]: 'text-red-400 bg-red-500/10 border-red-500/30',
            [TaskPriority.HIGH]: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
            [TaskPriority.MEDIUM]: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
            [TaskPriority.LOW]: 'text-slate-400 bg-slate-500/10 border-slate-500/30',
        };
        return (
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full border ${colors[priority] || colors[TaskPriority.MEDIUM]}`}>
                {priority}
            </span>
        );
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const formatTimeSince = (dateStr: string) => {
        const now = new Date();
        const date = new Date(dateStr);
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        if (diffDays === 0) return 'today';
        if (diffDays === 1) return 'yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
        return formatDate(dateStr);
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="min-h-screen flex items-center justify-center">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: [0, 0, 1, 1] as const }}
                        className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full"
                    />
                </div>
            </DashboardLayout>
        );
    }

    if (error || !task) {
        return (
            <DashboardLayout>
                <div className="text-center py-20">
                    <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-white mb-2">Task Not Found</h2>
                    <p className="text-slate-400 mb-6">{error || 'The task you are looking for could not be found.'}</p>
                    <Link href="/pbi" className="inline-flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Board
                    </Link>
                </div>
            </DashboardLayout>
        );
    }

    const projectName = typeof task.projectId === 'object' && task.projectId
        ? (task.projectId as any).name
        : 'Unknown Project';

    const assignee = typeof task.assigneeId === 'object' && task.assigneeId
        ? task.assigneeId
        : null;

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto">
                {/* Top Header Bar */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6"
                >
                    {/* Back + Title row */}
                    <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                            <button
                                onClick={() => router.push('/pbi')}
                                className="mt-1 p-1.5 rounded-lg hover:bg-slate-800 transition-colors text-slate-400 hover:text-white flex-shrink-0"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <div className="min-w-0">
                                <h1 className="text-2xl font-bold text-white leading-tight">
                                    PBI : {task.title}
                                    <span className="text-slate-500 font-normal ml-2">#{task._id.slice(-4)}</span>
                                </h1>
                                <div className="flex items-center gap-3 mt-2 flex-wrap">
                                    {getStatusBadge(task.status)}
                                    <span className="text-sm text-slate-400">
                                        opened {formatTimeSince(task.createdAt)}
                                    </span>
                                    <span className="text-slate-600">•</span>
                                    <span className="text-sm text-slate-400">{projectName}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                                onClick={() => setShowEditModal(true)}
                                className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-300 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition-colors"
                            >
                                <Edit2 className="w-3.5 h-3.5" />
                                Edit
                            </button>
                            <div className="relative">
                                <button
                                    onClick={() => setShowMenu(!showMenu)}
                                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                                >
                                    <MoreHorizontal className="w-5 h-5" />
                                </button>
                                {showMenu && (
                                    <div className="absolute right-0 top-full mt-1 w-40 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden">
                                        <button
                                            onClick={() => {
                                                setShowMenu(false);
                                                handleDelete();
                                            }}
                                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                            Delete Task
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Main Content: Two Column Layout */}
                <div className="flex gap-6">
                    {/* Left Column - Main Content */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="flex-1 min-w-0 space-y-6"
                    >
                        {/* Description Card */}
                        <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
                            <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-800 bg-slate-800/30">
                                {assignee ? (
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-xs text-white font-bold flex-shrink-0">
                                        {assignee.firstName?.[0]}{assignee.lastName?.[0]}
                                    </div>
                                ) : (
                                    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs text-slate-400 flex-shrink-0">
                                        ?
                                    </div>
                                )}
                                <div className="flex items-center gap-2 text-sm">
                                    <span className="font-semibold text-white">
                                        {assignee ? `${assignee.firstName} ${assignee.lastName}` : 'Unassigned'}
                                    </span>
                                    <span className="text-slate-500">opened this on {formatDate(task.createdAt)}</span>
                                </div>
                            </div>
                            <div className="p-5">
                                {task.description ? (
                                    <div className="prose prose-invert prose-sm max-w-none">
                                        <h3 className="text-base font-semibold text-slate-200 mb-3">Description</h3>
                                        <div className="text-slate-300 whitespace-pre-wrap leading-relaxed">
                                            {task.description}
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-slate-500 italic">No description provided.</p>
                                )}
                            </div>
                        </div>

                        {/* Activity Timeline */}
                        <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
                            <div className="px-5 py-4 border-b border-slate-800">
                                <h3 className="text-sm font-semibold text-white">Activity</h3>
                            </div>
                            <div className="p-5 space-y-4">
                                {/* Created event */}
                                <div className="flex gap-3 items-start">
                                    <div className="w-8 h-8 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <Circle className="w-3.5 h-3.5 text-green-400" />
                                    </div>
                                    <div className="text-sm">
                                        <span className="font-semibold text-white">
                                            {assignee ? `${assignee.firstName} ${assignee.lastName}` : 'Someone'}
                                        </span>
                                        <span className="text-slate-400"> created this task </span>
                                        <span className="text-slate-500">on {formatDate(task.createdAt)}</span>
                                    </div>
                                </div>

                                {/* Status event */}
                                {task.status !== TaskStatus.BACKLOG && (
                                    <div className="flex gap-3 items-start">
                                        <div className="w-8 h-8 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <Target className="w-3.5 h-3.5 text-purple-400" />
                                        </div>
                                        <div className="text-sm">
                                            <span className="text-slate-400">moved to </span>
                                            {getStatusBadge(task.status)}
                                        </div>
                                    </div>
                                )}

                                {/* Last updated event */}
                                {task.updatedAt !== task.createdAt && (
                                    <div className="flex gap-3 items-start">
                                        <div className="w-8 h-8 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <Edit2 className="w-3.5 h-3.5 text-blue-400" />
                                        </div>
                                        <div className="text-sm">
                                            <span className="text-slate-400">last updated </span>
                                            <span className="text-slate-500">{formatTimeSince(task.updatedAt)}</span>
                                        </div>
                                    </div>
                                )}

                                {/* Tags added event */}
                                {task.tags && task.tags.length > 0 && (
                                    <div className="flex gap-3 items-start">
                                        <div className="w-8 h-8 rounded-full bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <Tag className="w-3.5 h-3.5 text-yellow-400" />
                                        </div>
                                        <div className="text-sm flex items-center gap-2 flex-wrap">
                                            <span className="text-slate-400">added labels</span>
                                            {task.tags.map((tag, i) => (
                                                <span key={i} className="px-2 py-0.5 text-xs font-medium rounded-full bg-pink-500/15 text-pink-400 border border-pink-500/30">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>

                    {/* Right Sidebar */}
                    <motion.div
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="w-72 flex-shrink-0 space-y-1"
                    >
                        {/* Assignees */}
                        <div className="px-4 py-3 border-b border-slate-800">
                            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Assignees</h4>
                            {assignee ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-[10px] text-white font-bold">
                                        {assignee.firstName?.[0]}{assignee.lastName?.[0]}
                                    </div>
                                    <span className="text-sm text-white">{assignee.firstName} {assignee.lastName}</span>
                                </div>
                            ) : (
                                <p className="text-sm text-slate-500">No one assigned</p>
                            )}
                        </div>

                        {/* Labels */}
                        <div className="px-4 py-3 border-b border-slate-800">
                            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Labels</h4>
                            {task.tags && task.tags.length > 0 ? (
                                <div className="flex flex-wrap gap-1.5">
                                    {task.tags.map((tag, i) => (
                                        <span key={i} className="px-2 py-0.5 text-xs font-medium rounded-full bg-pink-500/15 text-pink-400 border border-pink-500/30">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-slate-500">None yet</p>
                            )}
                        </div>

                        {/* Project Info Card */}
                        <div className="px-4 py-3 border-b border-slate-800">
                            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Projects</h4>
                            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3 space-y-3">
                                <div className="flex items-center gap-2">
                                    <FolderKanban className="w-4 h-4 text-slate-400" />
                                    <span className="text-sm font-medium text-white">{projectName}</span>
                                </div>
                                <div className="space-y-2.5">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-slate-500">Status</span>
                                        {getStatusBadge(task.status)}
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-slate-500">Priority</span>
                                        {getPriorityBadge(task.priority)}
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-slate-500">Estimate</span>
                                        <span className="text-sm text-slate-300">
                                            {task.storyPoints ? `${task.storyPoints} pts` : 'Not set'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Dates */}
                        <div className="px-4 py-3 border-b border-slate-800">
                            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Dates</h4>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-slate-500">Created</span>
                                    <span className="text-sm text-slate-300">{formatDate(task.createdAt)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-slate-500">Updated</span>
                                    <span className="text-sm text-slate-300">{formatDate(task.updatedAt)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Development */}
                        <div className="px-4 py-3">
                            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Development</h4>
                            <p className="text-sm text-slate-500">No branches or pull requests</p>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Edit Modal */}
            <CreateTaskModal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                onTaskCreated={() => {
                    loadTask();
                }}
                editTask={task}
            />
        </DashboardLayout>
    );
}
