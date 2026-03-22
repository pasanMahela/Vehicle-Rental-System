import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log(`[API] Token present: ${token.substring(0, 20)}...`);
  } else {
    console.warn('[API] No token found in localStorage');
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    console.log(`[API] Response ${response.status} from ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('[API] Error response:', {
      status: error.response?.status,
      url: error.config?.url,
      message: error.response?.data?.message || error.message,
    });
    if (error.response?.status === 401) {
      console.warn('[API] 401 Unauthorized - clearing auth and redirecting to login');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
