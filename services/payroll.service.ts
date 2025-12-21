import api from './api';

export interface Payroll {
  id: string;
  employeeId: string;
  month: number;
  year: number;
  basicSalary: number;
  allowances?: number;
  deductions?: number;
  pf?: number;
  esic?: number;
  tds?: number;
  netSalary: number;
  status: 'PENDING' | 'PROCESSED' | 'PAID';
  paidAt?: string;
  employee?: {
    id: string;
    firstName: string;
    lastName: string;
    employeeId: string;
  };
}

export const payrollService = {
  processPayroll: async (data: {
    employeeId: string;
    month: number;
    year: number;
    basicSalary: number;
    allowances?: number;
    deductions?: number;
    pf?: number;
    esic?: number;
    tds?: number;
  }): Promise<Payroll> => {
    const response = await api.post('/payroll', data);
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


