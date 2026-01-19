import { create } from 'zustand';
import { User, Employee, AuthResponse, Role } from '@/types';
import { authService } from '@/services/auth.service';

interface AuthState {
  user: User | null;
  employee: Employee | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  login: (response: AuthResponse) => void;
  loginDemo: () => void;
  logout: () => void;
  setUser: (user: User) => void;
  setLoading: (loading: boolean) => void;
  fetchUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  employee: null,
  accessToken: typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null,
  refreshToken: typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null,
  isAuthenticated: typeof window !== 'undefined' ? !!localStorage.getItem('accessToken') : false,
  isLoading: false,

  login: (response: AuthResponse) => {
    console.log('Login function called with:', response);
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('refreshToken', response.refreshToken);
      console.log('Tokens saved to localStorage');
    }

    // Ensure role is properly typed
    const userData: User = {
      id: response.user.id,
      email: response.user.email,
      role: response.user.role as Role,
      isActive: true,
    };

    set({
      user: userData,
      employee: response.employee,
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
      isAuthenticated: true,
    });

    console.log('Auth state updated, isAuthenticated:', true);
  },

  loginDemo: () => {
    // Dummy User Object
    const dummyUser: User = {
      id: 'demo-user-id',
      email: 'demo@hrm.com',
      role: Role.ADMIN,
      isActive: true,
    };

    const dummyEmployee: Employee = {
      id: 'demo-emp-id',
      employeeId: 'DEMO001',
      firstName: 'Demo',
      lastName: 'User',
      position: 'System Evaluator',
      department: 'Evaluation',
      avatar: undefined // could add a robot avatar URL here
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', 'demo-token');
      localStorage.setItem('refreshToken', 'demo-refresh-token');
      localStorage.setItem('isDemoMode', 'true');
    }

    set({
      user: dummyUser,
      employee: dummyEmployee,
      accessToken: 'demo-token',
      refreshToken: 'demo-refresh-token',
      isAuthenticated: true,
    });
  },

  logout: () => {
    authService.logout();
    set({
      user: null,
      employee: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
    });
  },

  setUser: (user: User) => {
    set({ user });
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  fetchUser: async () => {
    try {
      set({ isLoading: true });
      const user = await authService.getMe();
      set({
        user: user as User,
        employee: user.employee,
        isAuthenticated: true,
      });
    } catch (error) {
      console.error('Failed to fetch user:', error);
      get().logout();
    } finally {
      set({ isLoading: false });
    }
  },
}));

