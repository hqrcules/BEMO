import api from '@/shared/config/axios';
import { LoginCredentials, AuthResponse, User } from '@/shared/types';

export const authService = {
  hasCookies(): boolean {
    return document.cookie.length > 0;
  },

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post('/api/auth/login/', credentials);
    return response.data;
  },

  async logout(): Promise<void> {
    try {
      await api.post('/api/auth/logout/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  },

  async getProfile(): Promise<User> {
    const response = await api.get('/api/auth/profile/');
    return response.data;
  },

  async refreshToken(): Promise<void> {
    await api.post('/api/auth/refresh/');
  },

  async checkAuth(): Promise<boolean> {
    try {
      await this.getProfile();
      return true;
    } catch {
      return false;
    }
  },

  async getBalance(): Promise<{ balance: string }> {
    const response = await api.get('/api/auth/balance/');
    return response.data;
  },
};