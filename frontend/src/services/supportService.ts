import api from '@/shared/config/axios';

export interface SupportMessage {
  id: string;
  user: string;
  user_email: string;
  message: string;
  is_admin: boolean;
  attachment?: string;
  created_at: string;
}

export const supportService = {
  // Get all messages
  async getMessages(): Promise<{ results: SupportMessage[] }> {
    const response = await api.get('/api/support/messages/');
    return response.data;
  },

  // Send message
  async sendMessage(data: FormData): Promise<SupportMessage> {
    const response = await api.post('/api/support/messages/', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};
