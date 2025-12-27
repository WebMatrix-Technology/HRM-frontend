import api from './api';

export interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  inactiveEmployees: number;
  activeToday: number;
  onLeave: number;
  pendingRequests: number;
}

export interface EmployeeStats {
  total: number;
  active: number;
  inactive: number;
  byDepartment: Array<{ department: string; _count: { _all: number } }>;
  byRole: Array<{ role: string; _count: { _all: number } }>;
}

export interface AttendanceSummary {
  status: string;
  _count: { _all: number };
}

export const dashboardService = {
  getEmployeeStats: async (): Promise<EmployeeStats> => {
    try {
      const response = await api.get('/reports/employees');
      return response.data.data;
    } catch (error: any) {
      // If 403 (forbidden), user doesn't have access - return defaults
      if (error.response?.status === 403) {
        console.log('User does not have access to employee stats');
      } else {
        console.error('Failed to fetch employee stats:', error);
      }
      // Return default values if endpoint requires higher privileges
      return {
        total: 0,
        active: 0,
        inactive: 0,
        byDepartment: [],
        byRole: [],
      };
    }
  },

  getTodayAttendance: async (employeeStats?: EmployeeStats): Promise<number> => {
    try {
      // For now, use active employees as approximation for "active today"
      // This is a limitation - ideally we'd have a daily attendance endpoint for all employees
      // The attendance endpoint requires an employeeId, so we can't get all employees' attendance
      if (employeeStats) {
        return employeeStats.active;
      }
      const stats = await dashboardService.getEmployeeStats();
      return stats.active;
    } catch (error) {
      console.error('Failed to fetch today attendance:', error);
      return 0;
    }
  },

  getPendingLeaveRequests: async (): Promise<number> => {
    try {
      const response = await api.get('/leave?status=PENDING');
      return response.data.data?.length || 0;
    } catch (error) {
      console.error('Failed to fetch pending leave requests:', error);
      return 0;
    }
  },

  getOnLeaveToday: async (): Promise<number> => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await api.get('/leave');
      const leaves = response.data.data || [];
      // Count leaves that are approved and cover today
      const todayLeaves = leaves.filter((leave: any) => {
        if (leave.status !== 'APPROVED') return false;
        const startDate = new Date(leave.startDate).toISOString().split('T')[0];
        const endDate = new Date(leave.endDate).toISOString().split('T')[0];
        return today >= startDate && today <= endDate;
      });
      return todayLeaves.length;
    } catch (error) {
      console.error('Failed to fetch on leave today:', error);
      return 0;
    }
  },

  getDashboardStats: async (): Promise<DashboardStats> => {
    try {
      const employeeStats = await dashboardService.getEmployeeStats();
      const [activeToday, onLeave, pendingRequests] = await Promise.all([
        dashboardService.getTodayAttendance(employeeStats),
        dashboardService.getOnLeaveToday(),
        dashboardService.getPendingLeaveRequests(),
      ]);

      return {
        totalEmployees: employeeStats.total || 0,
        activeEmployees: employeeStats.active || 0,
        inactiveEmployees: employeeStats.inactive || 0,
        activeToday,
        onLeave,
        pendingRequests,
      };
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
      return {
        totalEmployees: 0,
        activeEmployees: 0,
        inactiveEmployees: 0,
        activeToday: 0,
        onLeave: 0,
        pendingRequests: 0,
      };
    }
  },
};

