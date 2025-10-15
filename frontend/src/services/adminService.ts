import api from '@/shared/config/axios';
import { SupportChat } from '@/shared/types/support';
import { PollingResponse } from './supportService';

export interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  balance: string;
  bot_type: string;
  is_verified: boolean;
  created_at: string;
  last_login: string;
}

export interface AdminTransaction {
  id: string;
  user: string;
  user_email: string;
  transaction_type: 'deposit' | 'withdrawal';
  amount: string;
  payment_method: string;
  status: 'pending' | 'completed' | 'rejected';
  receipt_file?: string;
  admin_comment?: string;
  created_at: string;
}

export interface AdminStats {
  total_users: number;
  active_users: number;
  total_balance: string;
  pending_transactions: number;
  total_deposits: string;
  total_withdrawals: string;
}

export const adminService = {
  // Get all users
  async getUsers(): Promise<{ results: AdminUser[] }> {
    const response = await api.get('/api/admin/users/');
    return response.data;
  },

  // Update user balance
  async updateUserBalance(userId: string, data: { balance: number }): Promise<AdminUser> {
    const response = await api.patch(`/api/admin/users/${userId}/update-balance/`, data);
    return response.data;
  },

  // Update user bot type
  async updateUserBotType(userId: string, data: { bot_type: string }): Promise<AdminUser> {
    const response = await api.patch(`/api/admin/users/${userId}/update-bot/`, data);
    return response.data;
  },

  // Get all transactions
  async getTransactions(): Promise<{ results: AdminTransaction[] }> {
    const response = await api.get('/api/admin/transactions/');
    return response.data;
  },

  // Update transaction status
  async updateTransactionStatus(
    transactionId: string,
    data: { status: 'completed' | 'rejected'; admin_comment?: string }
  ): Promise<AdminTransaction> {
    const response = await api.patch(`/api/admin/transactions/${transactionId}/update-status/`, data);
    return response.data;
  },

  // Get admin statistics
  async getStats(): Promise<AdminStats> {
    const response = await api.get('/api/admin/stats/');
    return response.data;
  },

  // Create fake trade for user
  async createFakeTrade(userId: string, data: {
    symbol: string;
    side: 'buy' | 'sell';
    entry_price: number;
    exit_price: number;
    quantity: number;
  }): Promise<any> {
    const response = await api.post(`/api/admin/users/${userId}/create-trade/`, data);
    return response.data;
  },

  // Get all support chats
  async getSupportChats(): Promise<SupportChat[]> {
    const response = await api.get('/api/support/chats/');
    return response.data;
  },

  // Poll for messages in a specific chat (admin version)
  async pollChatMessages(chatId: string, since?: string): Promise<PollingResponse> {
    const params = since ? { since } : {};
    const response = await api.get(`/api/support/chats/${chatId}/messages/`, { params });
    return response.data;
  },

  // Send admin message to a chat
  async sendAdminSupportMessage(chatId: string, data: FormData): Promise<SupportChat> {
    const response = await api.post(`/api/support/chats/${chatId}/send_admin_message/`, data, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
  },

  // Delete a support chat
  async deleteSupportChat(chatId: string): Promise<void> {
    await api.delete(`/api/support/chats/${chatId}/`);
  }
};