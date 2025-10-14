import api from '@/shared/config/axios';
import { LoginCredentials, AuthResponse, User } from '@/shared/types';

export const authService = {
  hasCookies(): boolean {
    return document.cookie.length > 0; // Basic check
  },

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post('/api/auth/login/', credentials);
    return response.data;
  },

  // Logout - removes cookies on backend
  async logout(): Promise<void> {
    try {
      await api.post('/api/auth/logout/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  },

  // Get current user profile
  async getProfile(): Promise<User> {
    const response = await api.get('/api/auth/profile/');
    return response.data;
  },

  // Refresh access token
  async refreshToken(): Promise<void> {
    await api.post('/api/auth/refresh/');
  },

  // Check if user is authenticated
  async checkAuth(): Promise<boolean> {
    try {
      await this.getProfile();
      return true;
    } catch {
      return false;
    }
  },
};
