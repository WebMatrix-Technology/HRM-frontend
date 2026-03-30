import api from './api';

export interface Leave {
  id: string;
  employeeId: string;
  type: 'SICK' | 'VACATION' | 'PERSONAL' | 'MATERNITY' | 'PATERNITY' | 'OTHER';
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
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

export interface LeaveBalance {
  total: number;
  used: number;
  remaining: number;
}

export const leaveService = {
  applyLeave: async (data: {
    type: Leave['type'];
    startDate: string;
    endDate: string;
    reason: string;
    employeeId?: string;
  }): Promise<Leave> => {
    const response = await api.post('/leave', data);
    return response.data.data;
  },

  getLeaves: async (employeeId?: string, status?: Leave['status']): Promise<Leave[]> => {
    const params = new URLSearchParams();
    if (employeeId) params.append('employeeId', employeeId);
    if (status) params.append('status', status);

    const response = await api.get(`/leave?${params}`);
    return response.data.data.map((item: any) => {
      const employeeObj = typeof item.employeeId === 'object' ? item.employeeId : item.employee;
      const actualEmployeeId = typeof item.employeeId === 'object' ? (item.employeeId._id || item.employeeId.id) : item.employeeId;
      return {
        ...item,
        employee: employeeObj,
        employeeId: actualEmployeeId,
      };
    });
  },

  approveLeave: async (leaveId: string): Promise<Leave> => {
    const response = await api.post(`/leave/${leaveId}/approve`);
    return response.data.data;
  },

  rejectLeave: async (leaveId: string, rejectionReason: string): Promise<Leave> => {
    const response = await api.post(`/leave/${leaveId}/reject`, { rejectionReason });
    return response.data.data;
  },

  getLeaveBalance: async (employeeId?: string): Promise<LeaveBalance> => {
    const params = employeeId ? `?employeeId=${employeeId}` : '';
    const response = await api.get(`/leave/balance${params}`);
    return response.data.data;
  },
};


