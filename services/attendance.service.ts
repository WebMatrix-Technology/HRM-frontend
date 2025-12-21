import api from './api';

export interface Attendance {
  id: string;
  employeeId: string;
  date: string;
  punchIn?: string;
  punchOut?: string;
  workFromHome: boolean;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY';
}

export interface MonthlyReport {
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  workFromHomeDays: number;
  attendance: Attendance[];
}

export const attendanceService = {
  punchIn: async (workFromHome = false): Promise<Attendance> => {
    const response = await api.post('/attendance/punch-in', { workFromHome });
    return response.data.data;
  },

  punchOut: async (): Promise<Attendance> => {
    const response = await api.post('/attendance/punch-out');
    return response.data.data;
  },

  getAttendance: async (startDate?: string, endDate?: string, employeeId?: string): Promise<Attendance[]> => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (employeeId) params.append('employeeId', employeeId);

    const response = await api.get(`/attendance?${params}`);
    return response.data.data;
  },

  getMonthlyReport: async (month: number, year: number, employeeId?: string): Promise<MonthlyReport> => {
    const params = new URLSearchParams({
      month: month.toString(),
      year: year.toString(),
    });
    if (employeeId) params.append('employeeId', employeeId);

    const response = await api.get(`/attendance/monthly-report?${params}`);
    return response.data.data;
  },
};


