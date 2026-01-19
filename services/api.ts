import axios from 'axios';

// For production (Vercel), use relative URL so proxy works; for local dev, use env variable.
const API_URL = process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:5000' : '');

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // Check for Demo Mode blocking
    // We import the store dynamically to avoid circular dependencies if possible, 
    // but direct import is usually fine in Next.js client-side.
    // However, api.ts might be imported before store initialization. 
    // Safer to check localStorage for the flag.
    const isDemoMode = typeof window !== 'undefined' && localStorage.getItem('isDemoMode') === 'true';

    if (isDemoMode) {
      // Mock /auth/me for user data
      if (config.method?.toLowerCase() === 'get' && config.url?.endsWith('/auth/me')) {
        config.adapter = async (config) => {
          return {
            data: {
              status: 'success',
              data: {
                id: 'demo-user-id',
                email: 'demo@hrm.com',
                role: 'ADMIN',
                isActive: true,
                employee: {
                  id: 'demo-emp-id',
                  employeeId: 'DEMO001',
                  firstName: 'Demo',
                  lastName: 'User',
                  position: 'System Evaluator',
                  department: 'Evaluation',
                  avatar: undefined
                }
              }
            },
            status: 200,
            statusText: 'OK',
            headers: {},
            config,
            request: {}
          };
        };
      }

      // Mock /reports/employees for dashboard stats
      if (config.method?.toLowerCase() === 'get' && config.url?.endsWith('/reports/employees')) {
        config.adapter = async (config) => {
          return {
            data: {
              status: 'success',
              data: {
                total: 25,
                active: 24,
                inactive: 1,
                byDepartment: [
                  { department: 'Engineering', _count: { _all: 12 } },
                  { department: 'Design', _count: { _all: 5 } },
                  { department: 'HR', _count: { _all: 3 } },
                  { department: 'Sales', _count: { _all: 5 } }
                ],
                byRole: [
                  { role: 'EMPLOYEE', _count: { _all: 20 } },
                  { role: 'MANAGER', _count: { _all: 4 } },
                  { role: 'ADMIN', _count: { _all: 1 } }
                ]
              }
            },
            status: 200,
            statusText: 'OK',
            headers: {},
            config,
            request: {}
          };
        };
      }

      // Mock /leave for leave stats
      if (config.method?.toLowerCase() === 'get' && config.url?.includes('/leave')) {
        config.adapter = async (config) => {
          return {
            data: {
              status: 'success',
              data: [] // Return empty list for now, or could mock some leaves
            },
            status: 200,
            statusText: 'OK',
            headers: {},
            config,
            request: {}
          };
        };
      }

      // Block mutations
      if (['post', 'put', 'patch', 'delete'].includes(config.method?.toLowerCase() || '')) {
        const controller = new AbortController();
        config.signal = controller.signal;
        controller.abort('Demo Mode: Write operations are simulated.');

        config.adapter = async (config) => {
          return {
            data: { status: 'success', message: 'Action simulated (Demo Mode)' },
            status: 200,
            statusText: 'OK',
            headers: {},
            config,
            request: {}
          };
        };
      }
    }

    const token = localStorage.getItem('accessToken');
    // In demo mode, we might use a fake token, which matches what we set in authStore.
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - clear tokens and redirect to login
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

