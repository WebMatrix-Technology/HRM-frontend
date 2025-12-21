import api from './api';

export interface Employee {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  department?: string;
  position?: string;
  employmentType?: string;
  salary?: number;
  isActive: boolean;
  avatar?: string;
  user?: {
    id: string;
    email: string;
    role: string;
    isActive: boolean;
  } | null;
}

export interface CreateEmployeeData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  employeeId: string;
  phone?: string;
  dateOfBirth?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  department?: string;
  position?: string;
  employmentType?: string;
  salary?: number;
  role?: string;
}

export interface UpdateEmployeeData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  dateOfBirth?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  department?: string;
  position?: string;
  employmentType?: string;
  salary?: number;
  isActive?: boolean;
}

export const employeeService = {
  getEmployees: async (page = 1, limit = 20, filters?: { department?: string; isActive?: boolean }) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (filters?.department) params.append('department', filters.department);
    if (filters?.isActive !== undefined) params.append('isActive', filters.isActive.toString());

    const response = await api.get(`/employees?${params}`);
    return response.data;
  },

  getEmployeeById: async (id: string): Promise<Employee> => {
    const response = await api.get(`/employees/${id}`);
    return response.data.data;
  },

  createEmployee: async (data: CreateEmployeeData): Promise<Employee> => {
    const response = await api.post('/employees', data);
    return response.data.data;
  },

  updateEmployee: async (id: string, data: UpdateEmployeeData): Promise<Employee> => {
    const response = await api.put(`/employees/${id}`, data);
    return response.data.data;
  },

  deleteEmployee: async (id: string): Promise<void> => {
    await api.delete(`/employees/${id}`);
  },

  getDepartments: async (): Promise<string[]> => {
    const response = await api.get('/employees/departments');
    return response.data.data;
  },
};

