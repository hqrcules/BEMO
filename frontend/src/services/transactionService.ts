import api from '@/shared/config/axios';

export interface Transaction {
  id: string;
  user: string;
  transaction_type: 'deposit' | 'withdrawal';
  amount: string;
  payment_method: string;
  status: 'pending' | 'completed' | 'rejected';
  receipt_file?: string;
  admin_comment?: string;
  created_at: string;
  updated_at: string;
}

export interface TransactionStats {
  total_deposits: number;
  total_withdrawals: number;
  pending_transactions: number;
  total_deposit_amount: string;
  total_withdrawal_amount: string;
}

export const transactionService = {
  // Get all transactions
  async getTransactions(): Promise<{ results: Transaction[] }> {
    const response = await api.get('/api/transactions/');
    return response.data;
  },

  // Get transaction stats
  async getStats(): Promise<TransactionStats> {
    const response = await api.get('/api/transactions/stats/');
    return response.data;
  },

  // Create deposit
  async createDeposit(data: FormData): Promise<Transaction> {
    const response = await api.post('/api/transactions/deposit/', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Request withdrawal
  async requestWithdrawal(data: {
    amount: number;
    payment_method: string;
    wallet_address?: string;
  }): Promise<Transaction> {
    const response = await api.post('/api/transactions/withdraw/', data);
    return response.data;
  },
};
