import api from './api';
import { Project, ProjectStatus, ProjectPriority } from '@/types';

// We need to define Task types here or in a types file.
// For now defining here to be self-contained, but ideally should be in types/index.ts
export enum TaskStatus {
    BACKLOG = 'Backlog',
    READY = 'Ready',
    IN_PROGRESS = 'In Progress',
    IN_REVIEW = 'In Review',
    DONE = 'Done',
}

export enum TaskPriority {
    LOW = 'Low',
    MEDIUM = 'Medium',
    HIGH = 'High',
    CRITICAL = 'Critical',
}

export interface Task {
    _id: string; // Mongoose ID
    title: string;
    description?: string;
    status: TaskStatus;
    priority: TaskPriority;
    storyPoints?: number;
    projectId: Project | string; // Populated or ID
    assigneeId?: {
        _id: string;
        firstName: string;
        lastName: string;
        avatar?: string;
    } | string;
    tags?: string[];
    createdAt: string;
    updatedAt: string;
}

export interface TaskFilters {
    projectId?: string;
    status?: TaskStatus;
    assigneeId?: string;
    search?: string;
}

export interface CreateTaskData {
    title: string;
    description?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    storyPoints?: number;
    projectId: string;
    assigneeId?: string;
    tags?: string[];
}

export interface UpdateTaskData {
    title?: string;
    description?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    storyPoints?: number;
    assigneeId?: string;
    tags?: string[];
}

export const taskService = {
    // Get all tasks
    getTasks: async (filters?: TaskFilters): Promise<Task[]> => {
        const params = new URLSearchParams();
        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                if (value) params.append(key, value);
            });
        }
        const response = await api.get(`/tasks?${params.toString()}`);
        return response.data.data;
    },

    // Get single task
    getTask: async (id: string): Promise<Task> => {
        const response = await api.get(`/tasks/${id}`);
        return response.data.data;
    },

    // Create task
    createTask: async (data: CreateTaskData): Promise<Task> => {
        const response = await api.post('/tasks', data);
        return response.data.data;
    },

    // Update task
    updateTask: async (id: string, data: UpdateTaskData): Promise<Task> => {
        const response = await api.put(`/tasks/${id}`, data);
        return response.data.data;
    },

    // Delete task
    deleteTask: async (id: string): Promise<void> => {
        await api.delete(`/tasks/${id}`);
    },
};
