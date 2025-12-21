export enum Role {
  ADMIN = 'ADMIN',
  HR = 'HR',
  MANAGER = 'MANAGER',
  EMPLOYEE = 'EMPLOYEE',
}

export interface User {
  id: string;
  email: string;
  role: Role;
  isActive: boolean;
  employee?: Employee;
}

export interface Employee {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  phone?: string;
  department?: string;
  position?: string;
  avatar?: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    role: Role;
  };
  employee: Employee | null;
  accessToken: string;
  refreshToken: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  employeeId: string;
  phone?: string;
  department?: string;
  position?: string;
}

