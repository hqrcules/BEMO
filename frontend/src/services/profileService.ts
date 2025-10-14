import api from '@/shared/config/axios';
import { User } from '@/shared/types';

export interface ChangePasswordData {
  old_password: string;
  new_password: string;
  new_password_confirm: string;
}

export interface UpdateProfileData {
  full_name?: string;
}

export const profileService = {
  // Change password
  async changePassword(data: ChangePasswordData): Promise<{ message: string }> {
    const response = await api.post('/api/auth/change-password/', data);
    return response.data;
  },

  // Update profile
  async updateProfile(data: UpdateProfileData): Promise<User> {
    const response = await api.patch('/api/auth/profile/', data);
    return response.data;
  },
};
