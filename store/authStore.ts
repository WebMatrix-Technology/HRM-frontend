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
      isActive: true, // Default to true since backend doesn't return it in login response
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

