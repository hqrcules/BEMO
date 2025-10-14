import api from '@/shared/config/axios';
import { SupportChat, SupportMessage } from '@/shared/types/support';

export const supportService = {
  // Get all messages for the user's chat
  async getMessages(): Promise<SupportChat> {
    const response = await api.get('/api/support/chats/my-chat/');
    return response.data;
  },

  // Send a message
  async sendMessage(data: FormData): Promise<SupportMessage> {
    const response = await api.post('/api/support/chats/my-chat/send_message/', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};