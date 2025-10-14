import axios from 'axios';

const api = axios.create({
  baseURL: '',  // Empty because we use Vite proxy
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // CRITICAL! Send cookies with requests
});

// Flag to prevent multiple simultaneous refresh attempts
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

// Response interceptor - automatic token refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If response is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {

      // If this is the refresh endpoint failing, don't retry
      if (originalRequest.url?.includes('/auth/refresh/')) {
        isRefreshing = false;
        processQueue(error, null);

        // Redirect to login only if not already there
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }

        return Promise.reject(error);
      }

      // If this is the login endpoint failing, don't retry
      if (originalRequest.url?.includes('/auth/login/')) {
        return Promise.reject(error);
      }

      // If this is the profile endpoint and we're not authenticated, don't retry
      if (originalRequest.url?.includes('/auth/profile/') && !isRefreshing) {
        // Just reject, don't redirect (user might not be logged in yet)
        return Promise.reject(error);
      }

      // If already refreshing, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => {
          return api(originalRequest);
        }).catch((err) => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Try to refresh the token
        await api.post('/api/auth/refresh/');

        isRefreshing = false;
        processQueue(null, null);

        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        processQueue(refreshError, null);

        // If refresh fails, redirect to login (only if not already on login page)
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }

        return Promise.reject(refreshError);
      }
    }

    // For all other errors, just reject
    return Promise.reject(error);
  }
);

export default api;
