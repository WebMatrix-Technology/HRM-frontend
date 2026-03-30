import api from './api';

export interface Performance {
  id: string;
  _id?: string;
  employeeId: any;
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
    userId?: {
      role: string;
    };
  };
}

export interface PerformanceAnalytics {
  trend: { period: string; averageRating: number }[];
  departmentAverages: { department: string; averageRating: number }[];
  topPerformers: {
    employee: { id: string; firstName: string; lastName: string; employeeId: string; department?: string };
    averageRating: number;
    reviewCount: number;
  }[];
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
    const p = response.data.data;
    const transformed = { 
      ...p, 
      id: p.id || p._id,
      employee: typeof p.employeeId === 'object' ? p.employeeId : p.employee
    };
    return transformed;
  },

  getPerformances: async (employeeId?: string): Promise<Performance[]> => {
    const params = employeeId ? `?employeeId=${employeeId}` : '';
    const response = await api.get(`/performance${params}`);
    return response.data.data.map((p: any) => ({
      ...p,
      id: p.id || p._id,
      employee: typeof p.employeeId === 'object' ? p.employeeId : p.employee
    }));
  },

  getPerformanceById: async (id: string): Promise<Performance> => {
    const response = await api.get(`/performance/${id}`);
    const p = response.data.data;
    return { 
      ...p, 
      id: p.id || p._id,
      employee: typeof p.employeeId === 'object' ? p.employeeId : p.employee
    };
  },

  updatePerformance: async (id: string, data: Partial<Performance>): Promise<Performance> => {
    const response = await api.put(`/performance/${id}`, data);
    const p = response.data.data;
    return { 
      ...p, 
      id: p.id || p._id,
      employee: typeof p.employeeId === 'object' ? p.employeeId : p.employee
    };
  },

  getAnalytics: async (): Promise<PerformanceAnalytics> => {
    const response = await api.get('/performance/analytics');
    return response.data.data;
  },
};


