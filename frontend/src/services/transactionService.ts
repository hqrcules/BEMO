import api from '@/shared/config/axios';

export interface Transaction {
  id: string;
  user_email?: string;
  transaction_type: 'deposit' | 'withdrawal' | 'commission' | 'bot_profit';
  amount: string;
  commission?: string;
  total_amount?: string;
  status: 'pending' | 'completed' | 'rejected' | 'processing';
  payment_method: string;
  payment_receipt?: string;
  admin_notes?: string;
  created_at: string;
  processed_at?: string;
}

export interface TransactionStats {
  total_deposits: number;
  total_withdrawals: number;
  pending_transactions: number;
  total_deposit_amount: string;
  total_withdrawal_amount: string;
}

export const transactionService = {
  async getTransactions(): Promise<{ results: Transaction[]; count: number }> {
    const res = await api.get('/api/transactions/');
    return res.data;
  },
  async getStats(): Promise<TransactionStats> {
    const res = await api.get('/api/transactions/stats/');
    return res.data;
  },
  async createDeposit(data: { amount: number; payment_method: string; payment_receipt: File; }): Promise<{
    transaction: Transaction; message: string; user_balance: string;
  }> {
    const fd = new FormData();
    fd.append('amount', data.amount.toString());
    fd.append('payment_method', data.payment_method);
    fd.append('payment_receipt', data.payment_receipt);
    const res = await api.post('/api/transactions/deposit/', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    return res.data;
  },
  async requestWithdrawal(data: { amount: number; }): Promise<{
    transaction: Transaction; message: string; user_balance: string;
  }> {
    const res = await api.post('/api/transactions/withdraw/', data);
    return res.data;
  },
};
