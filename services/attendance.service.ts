import api from './api';

export interface Attendance {
  id: string;
  employeeId: string;
  date: string;
  punchIn?: string;
  punchOut?: string;
  workFromHome: boolean;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY';
  breaks?: { startTime: string; endTime?: string }[];
  idleTime?: number;
  productiveTime?: number;
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

  punchOut: async (idleTime: number = 0): Promise<Attendance> => {
    const response = await api.post('/attendance/punch-out', { idleTime });
    return response.data.data;
  },

  startBreak: async (): Promise<Attendance> => {
    const response = await api.post('/attendance/start-break');
    return response.data.data;
  },

  endBreak: async (): Promise<Attendance> => {
    const response = await api.post('/attendance/end-break');
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

  exportAttendance: async (month: number, year: number): Promise<void> => {
    const params = new URLSearchParams({
      month: month.toString(),
      year: year.toString(),
    });

    const response = await api.get(`/attendance/export?${params}`, {
      responseType: 'blob',
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `attendance_export_${year}_${month}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};


