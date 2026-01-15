'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ListTodo,
    Plus,
    Search,
    Filter,
    ChevronDown,
    ChevronRight,
    MoreHorizontal,
    Circle,
    Clock,
    CheckCircle2,
    AlertCircle
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { projectService } from '@/services/project.service';
import {
    DndContext,
    DragOverlay,
    useSensor,
    useSensors,
    PointerSensor,
    DragStartEvent,
    DragEndEvent,
    closestCorners
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import SortableTaskCard from '@/components/pbi/SortableTaskCard';
import { taskService, Task, TaskStatus, TaskPriority } from '@/services/task.service';
import { Project } from '@/types';
import { useAuthStore } from '@/store/authStore';
import CreateTaskModal from '@/components/pbi/CreateTaskModal';

export default function PBIPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedProjects, setExpandedProjects] = useState<string[]>([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(undefined);
    const [activeId, setActiveId] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over) {
            setActiveId(null);
            return;
        }

        const taskId = active.id as string;
        const overId = over.id as string;

        // Parse destination from over.id (format: `${projectId}-${status}`)
        // We expect the droppable container to have id `${projectId}-${status}`
        // OR if dropping on another task, we need to find that task's container.
        // simpler: make the COLUMN the droppable zone.

        // Check if we dropped on a column container
        if (overId.includes('container-')) {
            // Format: container-${projectId}-${status}
            const [, projectId, ...statusParts] = overId.split('-');
            const newStatus = statusParts.join('-') as TaskStatus;

            const task = tasks.find(t => t.id === taskId);
            if (!task) return;

            // Optimistic update
            // Only update if status or project changed
            if (task.status !== newStatus || (typeof task.projectId === 'string' ? task.projectId : task.projectId.id) !== projectId) {
                const originalTasks = [...tasks];

                setTasks(tasks.map(t =>
                    t.id === taskId
                        ? { ...t, status: newStatus, projectId: projectId } as any // casting for optimistic update
                        : t
                ));

                try {
                    await taskService.updateTask(taskId, {
                        status: newStatus,
                        projectId: projectId
                    });
                } catch (error) {
                    console.error('Failed to update task:', error);
                    // Revert
                    setTasks(originalTasks);
                }
            }
        } else {
            // Dropped on another task? 
            // For simple Kanban, let's focus on dropping into the column container.
            // If sorting implementation is full, we handle task-to-task drop.
            // For now, let's rely on the column being the main drop target for status change.
        }

        setActiveId(null);
    };

    // Initialize columns configuration
    const columns = [
        { id: TaskStatus.BACKLOG, label: 'Backlog', color: 'border-red-500' },
        { id: TaskStatus.READY, label: 'Ready', color: 'border-blue-500' },
        { id: TaskStatus.IN_PROGRESS, label: 'In progress', color: 'border-yellow-500' },
        { id: TaskStatus.IN_REVIEW, label: 'In review', color: 'border-purple-500' },
    ];

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [projectsData, tasksData] = await Promise.all([
                projectService.getProjects(1, 100), // Fetch all projects (pagination limit 100)
                taskService.getTasks()
            ]);

            setProjects(projectsData.projects);
            setTasks(tasksData);
            // Expand all projects by default
            setExpandedProjects(projectsData.projects.map(p => p.id));
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleProject = (projectId: string) => {
        setExpandedProjects(prev =>
            prev.includes(projectId)
                ? prev.filter(id => id !== projectId)
                : [...prev, projectId]
        );
    };

    const getTasksByProjectAndStatus = (projectId: string, status: TaskStatus) => {
        return tasks.filter(t =>
            (typeof t.projectId === 'string' ? t.projectId : t.projectId.id) === projectId &&
            t.status === status
        );
    };

    const getPriorityColor = (priority: TaskPriority) => {
        switch (priority) {
            case TaskPriority.CRITICAL: return 'text-red-500';
            case TaskPriority.HIGH: return 'text-orange-500';
            case TaskPriority.MEDIUM: return 'text-yellow-500';
            case TaskPriority.LOW: return 'text-blue-500';
            default: return 'text-slate-500';
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl">
                                <ListTodo className="w-8 h-8 text-white" />
                            </div>
                            Product Backlog
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400 mt-2">
                            Manage product backlog items and track progress across projects
                        </p>
                    </div>
                    <button
                        onClick={() => {
                            setSelectedProjectId(undefined);
                            setShowCreateModal(true);
                        }}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-xl font-medium shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 transition-all"
                    >
                        <Plus className="w-5 h-5" />
                        Add Item
                    </button>
                </div>

                {/* Board Search/Filter Bar */}
                <div className="bg-slate-900 text-slate-300 p-2 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2 px-3 py-1 bg-slate-800 rounded text-sm w-full max-w-md">
                        <Search className="w-4 h-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder="-status:Done"
                            className="bg-transparent border-none outline-none w-full placeholder-slate-500"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="bg-slate-700 px-2 py-1 rounded text-xs">72</span>
                        <button className="p-1 hover:bg-slate-800 rounded"><Filter className="w-4 h-4" /></button>
                    </div>
                </div>

                {/* Kanban Board Headers */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {columns.map(col => (
                        <div key={col.id} className={`border-t-4 ${col.color} bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg`}>
                            <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                    <span className={`w-3 h-3 rounded-full border-2 ${col.color.replace('border', 'border')}`}></span>
                                    <h3 className="font-semibold text-slate-900 dark:text-white">{col.label}</h3>
                                </div>
                                <MoreHorizontal className="w-4 h-4 text-slate-400" />
                            </div>
                            <p className="text-xs text-slate-500">
                                {col.id === TaskStatus.BACKLOG ? 'Estimate: 0' :
                                    col.id === TaskStatus.READY ? 'This is ready to be picked up' :
                                        col.id === TaskStatus.IN_PROGRESS ? 'This is actively being worked on' : 'This item is in review'}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Project Swimlanes */}
                {loading ? (
                    <div className="text-center py-10 text-slate-500">Loading backlog...</div>
                ) : (
                    projects.map(project => (
                        <div key={project.id} className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                            {/* Project Header */}
                            <div
                                className="bg-slate-100 dark:bg-slate-800/80 p-3 flex items-center gap-2 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                                onClick={() => toggleProject(project.id)}
                            >
                                {expandedProjects.includes(project.id) ? (
                                    <ChevronDown className="w-4 h-4 text-slate-500" />
                                ) : (
                                    <ChevronRight className="w-4 h-4 text-slate-500" />
                                )}
                                <h3 className="font-bold text-slate-900 dark:text-white">{project.name}</h3>
                                <span className="bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full text-xs text-slate-600 dark:text-slate-300">
                                    {tasks.filter(t => (typeof t.projectId === 'string' ? t.projectId : t.projectId.id) === project.id).length}
                                </span>
                                <span className="text-xs text-slate-500">Estimate: 0</span>
                                <MoreHorizontal className="w-4 h-4 text-slate-500 ml-auto" />
                            </div>

                            {/* Tasks Grid */}
                            <AnimatePresence>
                                {expandedProjects.includes(project.id) && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-slate-50/50 dark:bg-slate-900/30"
                                    >
                                        {columns.map(col => (
                                            <div key={col.id} className="space-y-3 min-h-[100px]">
                                                {getTasksByProjectAndStatus(project.id, col.id).map(task => (
                                                    <motion.div
                                                        key={task._id}
                                                        initial={{ scale: 0.95, opacity: 0 }}
                                                        animate={{ scale: 1, opacity: 1 }}
                                                        className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing border-l-4 border-l-purple-500"
                                                    >
                                                        <div className="flex flex-col gap-2">
                                                            <div className="flex items-center gap-2">
                                                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                                                                <span className="text-xs text-slate-400">PBI-{task._id.slice(-4)}</span>
                                                                <MoreHorizontal className="w-4 h-4 text-slate-400 ml-auto" />
                                                            </div>

                                                            <p className="text-sm font-medium text-slate-900 dark:text-white line-clamp-2">
                                                                {task.title}
                                                            </p>

                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-[10px] text-slate-600 dark:text-slate-400">
                                                                    {project.name}
                                                                </span>
                                                            </div>

                                                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                                                                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                                                    <Clock className="w-3 h-3" />
                                                                    <span>0/2</span>
                                                                </div>
                                                                <span className="text-xs text-purple-400 font-medium">0%</span>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                ))}

                                                {/* + Add Item placeholder */}
                                                <button
                                                    onClick={() => {
                                                        setSelectedProjectId(project.id);
                                                        setShowCreateModal(true);
                                                    }}
                                                    className="flex items-center gap-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 text-sm px-2 py-1 rounded hover:bg-slate-200/50 dark:hover:bg-slate-800/50 w-full"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                    Add item
                                                </button>
                                            </div>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))
                )}
            </div>

            <CreateTaskModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onTaskCreated={() => {
                    fetchData();
                }}
                defaultProjectId={selectedProjectId}
            />
        </DashboardLayout>
    );
}
