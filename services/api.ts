import axios from 'axios';

// For production (Vercel), use relative URL so proxy works; for local dev, use env variable.
const API_URL = process.env.NODE_ENV === 'development' ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000') : '';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
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

