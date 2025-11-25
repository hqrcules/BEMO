import api from '@/shared/config/axios';
import { SupportChat } from '@/shared/types/support';
import { PollingResponse } from './supportService';

export interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  balance: string;
  bot_type: string;
  is_active: boolean;
  is_staff: boolean;
  is_verified: boolean;
  created_at: string;
  last_login: string;
  last_login_ip?: string;
  total_deposits: number;
  total_withdrawals: number;
  pending_transactions: number;
  transaction_count: number;
}

export interface AdminTransaction {
  id: string;
  user: string;
  user_email: string;
  user_full_name?: string;
  user_balance: string;
  transaction_type: 'deposit' | 'withdrawal' | 'commission' | 'bot_profit';
  amount: string;
  commission: string;
  total_amount: string;
  status: 'pending' | 'completed' | 'rejected' | 'processing';
  payment_method: string;
  payment_receipt?: string;
  admin_notes?: string;
  processed_by?: string;
  processed_by_email?: string;
  created_at: string;
  processed_at?: string;
}

export interface PaymentDetails {
  id: string;
  currency: string;
  wallet_address: string;
  bank_details: string;
  network: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  updated_by?: string;
  updated_by_email?: string;
}

export interface AdminStats {
  total_users: number;
  active_users: number;
  verified_users: number;
  inactive_users: number;
  total_balance: string;
  pending_transactions: number;
  total_deposits: string;
  total_withdrawals: string;
}

export interface TransactionStats {
  total_transactions: number;
  pending_transactions: number;
  completed_transactions: number;
  total_deposits: number;
  total_withdrawals: number;
}

export interface AdminResponse<T> {
  results: T[];
  count: number;
  stats?: AdminStats | TransactionStats;
}

export const adminService = {
  // User Management
  async getUsers(): Promise<AdminResponse<AdminUser>> {
    const response = await api.get('/api/admin/users/');
    return response.data;
  },

  async updateUserBalance(userId: string, data: { balance: number }): Promise<{
    message: string;
    old_balance: string;
    new_balance: string;
  }> {
    const response = await api.patch(`/api/admin/users/${userId}/update_balance/`, data);
    return response.data;
  },

  async updateUserBotType(userId: string, data: { bot_type: string }): Promise<{
    message: string;
    new_bot_type: string;
  }> {
    const response = await api.patch(`/api/admin/users/${userId}/update_bot/`, data);
    return response.data;
  },

  async verifyUser(userId: string): Promise<{ message: string }> {
    const response = await api.post(`/api/admin/users/${userId}/verify/`);
    return response.data;
  },

  // Transaction Management
  async getTransactions(): Promise<AdminResponse<AdminTransaction>> {
    const response = await api.get('/api/admin/transactions/');
    return response.data;
  },

  async getPendingTransactions(): Promise<AdminResponse<AdminTransaction>> {
    const response = await api.get('/api/admin/transactions/pending/');
    return response.data;
  },

  async approveTransaction(transactionId: string): Promise<{
    message: string;
    transaction: AdminTransaction;
    user_balance: string;
  }> {
    const response = await api.post(`/api/admin/transactions/${transactionId}/approve/`);
    return response.data;
  },

  async rejectTransaction(transactionId: string, data: { reason?: string }): Promise<{
    message: string;
    transaction: AdminTransaction;
    user_balance: string;
  }> {
    const response = await api.post(`/api/admin/transactions/${transactionId}/reject/`, data);
    return response.data;
  },

  // Payment Details Management
  async getPaymentDetails(): Promise<PaymentDetails[]> {
    const response = await api.get('/api/admin/payment-details/');
    return response.data;
  },

  async getActivePaymentDetails(): Promise<PaymentDetails[]> {
    const response = await api.get('/api/admin/payment-details/active/');
    return response.data;
  },

  async createPaymentDetails(data: Omit<PaymentDetails, 'id' | 'created_at' | 'updated_at' | 'updated_by' | 'updated_by_email'>): Promise<PaymentDetails> {
    const response = await api.post('/api/admin/payment-details/', data);
    return response.data;
  },

  async updatePaymentDetails(id: string, data: Partial<PaymentDetails>): Promise<PaymentDetails> {
    const response = await api.patch(`/api/admin/payment-details/${id}/`, data);
    return response.data;
  },

  async deletePaymentDetails(id: string): Promise<void> {
    await api.delete(`/api/admin/payment-details/${id}/`);
  },

  // Trading Management
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

  // Support Management
  async getSupportChats(): Promise<SupportChat[]> {
    const response = await api.get('/api/support/chats/');
    return response.data;
  },

  async pollChatMessages(chatId: string, since?: string): Promise<PollingResponse> {
    const params = since ? { since } : {};
    const response = await api.get(`/api/support/chats/${chatId}/messages/`, { params });
    return response.data;
  },

  async sendAdminSupportMessage(chatId: string, data: FormData): Promise<SupportChat> {
    const response = await api.post(`/api/support/chats/${chatId}/send_admin_message/`, data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async deleteSupportChat(chatId: string): Promise<void> {
    await api.delete(`/api/support/chats/${chatId}/`);
  },

  // Dashboard Stats
  async getStats(): Promise<AdminStats> {
    const response = await api.get('/api/admin/stats/');
    return response.data;
  },

  // Site Settings
  async getPublicSettings(): Promise<Record<string, string>> {
    const response = await api.get('/api/admin/settings/public/');
    return response.data;
  }
};