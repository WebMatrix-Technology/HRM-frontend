import api from './api';
import { User, Role } from '@/types';

export interface UserWithEmployee extends User {
  employee?: {
    id: string;
    employeeId: string;
    firstName: string;
    lastName: string;
    phone?: string;
    department?: string;
    position?: string;
    avatar?: string;
  } | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateUserData {
  role?: Role;
  isActive?: boolean;
}

export const userService = {
  getUsers: async (
    page = 1,
    limit = 20,
    filters?: { role?: string; isActive?: boolean }
  ) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (filters?.role) params.append('role', filters.role);
    if (filters?.isActive !== undefined) params.append('isActive', filters.isActive.toString());

    const response = await api.get(`/users?${params}`);
    return response.data;
  },

  getUserById: async (id: string): Promise<UserWithEmployee> => {
    const response = await api.get(`/users/${id}`);
    return response.data.data;
  },

  updateUser: async (id: string, data: UpdateUserData): Promise<UserWithEmployee> => {
    const response = await api.put(`/users/${id}`, data);
    return response.data.data;
  },

  deleteUser: async (id: string): Promise<void> => {
    await api.delete(`/users/${id}`);
  },
};


