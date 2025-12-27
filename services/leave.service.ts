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
  }): Promise<Leave> => {
    const response = await api.post('/leave', data);
    return response.data.data;
  },

  allotLeave: async (employeeId: string, data: {
    type: Leave['type'];
    startDate: string;
    endDate: string;
    reason: string;
  }): Promise<Leave> => {
    // NOTE: Backend currently doesn't support creating leaves for other employees
    // The applyLeave endpoint always uses the authenticated user's employee ID
    // Backend needs to be updated to:
    // 1. Accept employeeId parameter in request body
    // 2. Check if user is HR/Admin before allowing this
    // 3. Use the provided employeeId instead of the authenticated user's employee ID
    
    // For now, this will fail or create leave for the current user
    // Backend enum: SICK, CASUAL, EARNED, UNPAID, MATERNITY, PATERNITY
    const leaveTypeMap: Record<Leave['type'], string> = {
      'VACATION': 'CASUAL',
      'SICK': 'SICK',
      'PERSONAL': 'CASUAL',
      'MATERNITY': 'MATERNITY',
      'PATERNITY': 'PATERNITY',
      'OTHER': 'UNPAID',
    };
    
    // TODO: Backend needs to support this endpoint or modify existing one
    const response = await api.post('/leave', {
      leaveType: leaveTypeMap[data.type] || 'CASUAL',
      startDate: data.startDate,
      endDate: data.endDate,
      reason: data.reason,
      employeeId, // Backend needs to handle this parameter
    });
    return response.data.data;
  },

  getLeaves: async (employeeId?: string, status?: Leave['status']): Promise<Leave[]> => {
    const params = new URLSearchParams();
    if (employeeId) params.append('employeeId', employeeId);
    if (status) params.append('status', status);

    const response = await api.get(`/leave?${params}`);
    return response.data.data;
  },

  approveLeave: async (leaveId: string): Promise<Leave> => {
    const response = await api.put(`/leave/${leaveId}/approve`);
    return response.data.data;
  },

  rejectLeave: async (leaveId: string, rejectionReason: string): Promise<Leave> => {
    const response = await api.put(`/leave/${leaveId}/reject`, { rejectionReason });
    return response.data.data;
  },

  getLeaveBalance: async (employeeId?: string): Promise<LeaveBalance> => {
    const params = employeeId ? `?employeeId=${employeeId}` : '';
    const response = await api.get(`/leave/balance${params}`);
    return response.data.data;
  },
};


