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
  employee?: Employee | null;
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

export enum ProjectStatus {
  PLANNING = 'PLANNING',
  IN_PROGRESS = 'IN_PROGRESS',
  ON_HOLD = 'ON_HOLD',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum ProjectPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export interface ProjectMember {
  id: string;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    position?: string;
  };
  role: string; // 'MANAGER' | 'DEVELOPER' | 'DESIGNER' | 'TESTER' | 'ANALYST'
  joinedAt: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  startDate: string;
  endDate?: string;
  deadline?: string;
  budget?: number;
  progress: number; // 0-100
  manager: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  members: ProjectMember[];
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectData {
  name: string;
  description?: string;
  status?: ProjectStatus;
  priority?: ProjectPriority;
  startDate: string;
  endDate?: string;
  deadline?: string;
  budget?: number;
  managerId: string;
  memberIds?: string[];
  tags?: string[];
}

export interface UpdateProjectData {
  name?: string;
  description?: string;
  status?: ProjectStatus;
  priority?: ProjectPriority;
  startDate?: string;
  endDate?: string;
  deadline?: string;
  budget?: number;
  managerId?: string;
  progress?: number;
  tags?: string[];
}

