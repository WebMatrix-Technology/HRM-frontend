import api from './api';

export interface Performance {
  id: string;
  employeeId: string;
  reviewPeriod: string;
  rating: number;
  goals: string[];
  achievements: string[];
  feedback?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
  employee?: {
    id: string;
    firstName: string;
    lastName: string;
    employeeId: string;
  };
}

export const performanceService = {
  createPerformance: async (data: {
    employeeId: string;
    reviewPeriod: string;
    rating: number;
    goals: string[];
    achievements: string[];
    feedback?: string;
  }): Promise<Performance> => {
    const response = await api.post('/performance', data);
    return response.data.data;
  },

  getPerformances: async (employeeId?: string): Promise<Performance[]> => {
    const params = employeeId ? `?employeeId=${employeeId}` : '';
    const response = await api.get(`/performance${params}`);
    return response.data.data;
  },

  getPerformanceById: async (id: string): Promise<Performance> => {
    const response = await api.get(`/performance/${id}`);
    return response.data.data;
  },

  updatePerformance: async (id: string, data: Partial<Performance>): Promise<Performance> => {
    const response = await api.put(`/performance/${id}`, data);
    return response.data.data;
  },
};


