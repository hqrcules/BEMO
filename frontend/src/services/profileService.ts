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

export interface UserProfileData {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone: string;
  date_of_birth: string | null;
  wallet_address: string;
  balance: string;
  bot_type: string;
  is_verified: boolean;
  created_at: string;
}

export interface UpdateWalletData {
  wallet_address: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
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

  // Get detailed profile with wallet
  async getProfileDetails(): Promise<UserProfileData> {
    const response = await api.get('/api/auth/profile/details/');
    return response.data;
  },

  // Update wallet address and other profile fields
  async updateWalletAddress(data: UpdateWalletData): Promise<{ success: boolean; message: string; data: UserProfileData }> {
    const response = await api.patch('/api/auth/profile/details/', data);
    return response.data;
  },
};
