import api from './api';
import { Project, CreateProjectData, UpdateProjectData, ProjectStatus, ProjectPriority } from '@/types';

export interface ProjectsResponse {
  projects: Project[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    limit: number;
  };
}

export interface ProjectFilters {
  status?: ProjectStatus;
  priority?: ProjectPriority;
  managerId?: string;
  search?: string;
  tags?: string[];
  startDate?: string;
  endDate?: string;
}

export const projectService = {
  // Get all projects with pagination and filters
  getProjects: async (
    page: number = 1,
    limit: number = 20,
    filters?: ProjectFilters
  ): Promise<ProjectsResponse> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          if (Array.isArray(value)) {
            value.forEach(v => params.append(key, v));
          } else {
            params.append(key, value.toString());
          }
        }
      });
    }

    const response = await api.get(`/projects?${params.toString()}`);
    return response.data.data;
  },

  // Get project by ID
  getProject: async (id: string): Promise<Project> => {
    const response = await api.get(`/projects/${id}`);
    return response.data.data;
  },

  // Create new project
  createProject: async (data: CreateProjectData): Promise<Project> => {
    const response = await api.post('/projects', data);
    return response.data.data;
  },

  // Update project
  updateProject: async (id: string, data: UpdateProjectData): Promise<Project> => {
    const response = await api.put(`/projects/${id}`, data);
    return response.data.data;
  },

  // Delete project
  deleteProject: async (id: string): Promise<void> => {
    await api.delete(`/projects/${id}`);
  },

  // Add members to project
  addProjectMembers: async (id: string, memberData: { employeeIds: string[], role: string }): Promise<void> => {
    await api.post(`/projects/${id}/members`, memberData);
  },

  // Remove member from project
  removeProjectMember: async (id: string, memberId: string): Promise<void> => {
    await api.delete(`/projects/${id}/members/${memberId}`);
  },

  // Update project progress
  updateProgress: async (id: string, progress: number): Promise<Project> => {
    const response = await api.patch(`/projects/${id}/progress`, { progress });
    return response.data.data;
  },

  // Get project statistics
  getProjectStats: async (): Promise<{
    totalProjects: number;
    activeProjects: number;
    completedProjects: number;
    overduedProjects: number;
    projectsByStatus: Record<ProjectStatus, number>;
    projectsByPriority: Record<ProjectPriority, number>;
  }> => {
    const response = await api.get('/projects/stats');
    return response.data.data;
  },

  // Get available managers for projects
  getAvailableManagers: async (): Promise<Array<{
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    position?: string;
  }>> => {
    const response = await api.get('/projects/managers');
    return response.data.data;
  },

  // Get project templates
  getProjectTemplates: async (): Promise<Array<{
    id: string;
    name: string;
    description: string;
    defaultTags: string[];
    estimatedDuration: number; // in days
  }>> => {
    const response = await api.get('/projects/templates');
    return response.data.data;
  },

  // Export projects data
  exportProjects: async (format: 'csv' | 'excel', filters?: ProjectFilters): Promise<Blob> => {
    const params = new URLSearchParams({ format });
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          if (Array.isArray(value)) {
            value.forEach(v => params.append(key, v));
          } else {
            params.append(key, value.toString());
          }
        }
      });
    }

    const response = await api.get(`/projects/export?${params.toString()}`, {
      responseType: 'blob',
    });
    return response.data;
  },
};


