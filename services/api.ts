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
      // Allow GET requests, but block mutations
      if (['post', 'put', 'patch', 'delete'].includes(config.method?.toLowerCase() || '')) {
        // Cancel the request
        const controller = new AbortController();
        config.signal = controller.signal;
        controller.abort('Demo Mode: Write operations are simulated.');

        // We need to reject to stop the request, but we want to simulate success.
        // Axios interceptors dealing with cancellation usually throw. 
        // Better strategy: Attach a custom property to config and handle in response? 
        // Or use an adapter.

        // Simplest hack: let it fail but with a specific reason we catch later?
        // Or just use an adapter for this request.
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

