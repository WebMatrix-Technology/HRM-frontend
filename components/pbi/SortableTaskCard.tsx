'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task, TaskPriority } from '@/services/task.service';
import { motion } from 'framer-motion';
import { MoreHorizontal, Clock, CheckCircle2, Circle, AlertCircle } from 'lucide-react';

interface SortableTaskCardProps {
    task: Task;
    index: number; // Important for sorting if we implement reordering within column
}

export default function SortableTaskCard({ task, index }: SortableTaskCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: task.id,
        data: {
            type: 'Task',
            task,
        },
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    if (isDragging) {
        return (
            <div
                ref={setNodeRef}
                style={style}
                className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 opacity-50 h-[150px]"
            />
        );
    }

    const getPriorityColor = (priority: TaskPriority) => {
        switch (priority) {
            case TaskPriority.CRITICAL: return 'text-red-500 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
            case TaskPriority.HIGH: return 'text-orange-500 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800';
            case TaskPriority.MEDIUM: return 'text-blue-500 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
            case TaskPriority.LOW: return 'text-slate-500 bg-slate-50 dark:bg-slate-900/20 border-slate-200 dark:border-slate-800';
            default: return 'text-slate-500';
        }
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className="group relative bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 p-4 rounded-xl hover:shadow-lg hover:border-pink-500/30 transition-all cursor-grab active:cursor-grabbing"
        >
            <div className="flex justify-between items-start mb-3">
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${getPriorityColor(task.priority)} uppercase tracking-wider`}>
                    {task.priority}
                </span>
                <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreHorizontal className="w-4 h-4" />
                </button>
            </div>

            <h4 className="font-medium text-slate-800 dark:text-slate-200 mb-2 line-clamp-2">
                {task.title}
            </h4>

            {task.tags && task.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                    {task.tags.map((tag, i) => (
                        <span key={i} className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-[10px] rounded">
                            {tag}
                        </span>
                    ))}
                </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-700/50">
                <div className="flex -space-x-2">
                    {task.assigneeId ? (
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-[10px] text-white font-bold border-2 border-white dark:border-slate-800" title={`${task.assigneeId.firstName} ${task.assigneeId.lastName}`}>
                            {task.assigneeId.firstName?.[0]}{task.assigneeId.lastName?.[0]}
                        </div>
                    ) : (
                        <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] text-slate-500 border-2 border-white dark:border-slate-800">
                            ?
                        </div>
                    )}
                </div>

                {task.storyPoints !== undefined && task.storyPoints > 0 && (
                    <div className="flex items-center gap-1 text-xs text-slate-500 font-medium bg-slate-100 dark:bg-slate-700/50 px-2 py-1 rounded-full">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                        {task.storyPoints} pts
                    </div>
                )}
            </div>
        </div>
    );
}
