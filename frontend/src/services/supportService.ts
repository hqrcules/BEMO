import api from '@/shared/config/axios';
import { SupportChat, SupportMessage } from '@/shared/types/support';

export interface PollingResponse {
  messages: SupportMessage[];
  chat_status: string;
  last_updated: string;
}

export const supportService = {
  // Get all messages for the user's chat
  async getMessages(): Promise<SupportChat> {
    const response = await api.get('/api/support/chats/my-chat/');
    return response.data;
  },

  // Poll for new messages (can optionally filter by timestamp)
  async pollMessages(since?: string): Promise<PollingResponse> {
    const params = since ? { since } : {};
    const response = await api.get('/api/support/chats/my-chat/messages/', { params });
    return response.data;
  },

  // Send a message
  async sendMessage(data: FormData): Promise<SupportChat> {
    const response = await api.post('/api/support/chats/my-chat/send_message/', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};
