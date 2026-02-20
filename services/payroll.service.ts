import api from './api';

export interface ProcessPayrollData {
  employeeId: string;
  month: number;
  year: number;
  basicSalary: number;
  allowances?: number;
  deductions?: number;
  pf?: number;
  esic?: number;
  tds?: number;
}

export interface Payroll {
  _id: string;
  employeeId: any; // Populated Employee object from backend
  month: number;
  year: number;
  basicSalary: number;
  allowances: number;
  deductions: number;
  pf: number;
  metrics?: {
    absentDays: number;
    idleHours: number;
    absentDeduction: number;
    idleDeduction: number;
  };
  esic?: number;
  tds?: number;
  netSalary: number;
  status: 'PENDING' | 'PROCESSED' | 'PAID';
  paidAt?: string;
}

export interface PayrollFormData {
  employeeId: string;
  month: number;
  year: number;
  basicSalary: number;
  allowances: number;
  deductions: number;
  pf: number;
  esic: number;
  tds: number;
  metrics?: {
    absentDays: number;
    idleHours: number;
    absentDeduction: number;
    idleDeduction: number;
  };
}

export const payrollService = {
  processPayroll: async (data: ProcessPayrollData): Promise<Payroll> => {
    const response = await api.post('/payroll/process', data);
    return response.data.data;
  },

  getHistory: async (): Promise<Payroll[]> => {
    const response = await api.get('/payroll');
    return response.data.data;
  },

  calculatePayroll: async (employeeId: string, month: number, year: number): Promise<PayrollFormData> => {
    const response = await api.get(`/payroll/${employeeId}/calculate`, {
      params: { month, year }
    });
    return response.data.data;
  },

  getPayrolls: async (employeeId?: string, month?: number, year?: number): Promise<Payroll[]> => {
    const params = new URLSearchParams();
    if (employeeId) params.append('employeeId', employeeId);
    if (month) params.append('month', month.toString());
    if (year) params.append('year', year.toString());

    const response = await api.get(`/payroll?${params}`);
    return response.data.data;
  },

  getPayrollById: async (id: string): Promise<Payroll> => {
    const response = await api.get(`/payroll/${id}`);
    return response.data.data;
  },

  markAsPaid: async (id: string): Promise<Payroll> => {
    const response = await api.put(`/payroll/${id}/mark-paid`);
    return response.data.data;
  },
};


