import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // Needed if HTTPOnly cookies are used for refresh tokens
});

api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't already retried
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/auth/refresh')) {
      originalRequest._retry = true;

      try {
        // Attempt to refresh the token using the HttpOnly cookie
        const res = await axios.post(`${BASE_URL}/auth/refresh`, {}, { withCredentials: true });
        
        // If the backend returns a new access token, update the store
        if (res.data?.accessToken) {
          const authStore = useAuthStore.getState();
          if (authStore.user) {
            authStore.login(authStore.user, res.data.accessToken);
          }
          
          // Update the original request's Authorization header
          originalRequest.headers.Authorization = `Bearer ${res.data.accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed (e.g., refresh token expired)
        window.dispatchEvent(new CustomEvent('app:toast', { 
          detail: { message: 'Session expired. Please log in again.', type: 'error' } 
        }));
        useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
