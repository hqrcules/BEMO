import api from '@/shared/config/axios';

export interface BotTrade {
  id: string;
  user: string;
  user_email: string;
  symbol: string;
  side: 'buy' | 'sell';
  entry_price: string;
  exit_price: string;
  quantity: string;
  profit_loss: string;
  profit_loss_percent: string;
  is_open: boolean;
  opened_at: string;
  closed_at: string;
  duration: number;
}

export interface TradingStats {
  total_trades: number;
  open_trades: number;
  closed_trades: number;
  winning_trades: number;
  losing_trades: number;
  win_rate: number;
  total_profit: string;
  average_profit: string;
  best_trade: string;
  worst_trade: string;
}

export interface TradingSession {
  id: string;
  user: string;
  user_email: string;
  bot_type: string;
  starting_balance: string;
  current_balance: string;
  total_profit: string;
  total_trades: number;
  winning_trades: number;
  win_rate: number;
  profit_percent: number;
  is_active: boolean;
  started_at: string;
  ended_at: string | null;
}

export const tradingService = {
  // Get all trades
  async getTrades(): Promise<{ results: BotTrade[] }> {
    const response = await api.get('/api/trading/trades/');
    return response.data;
  },

  // Get open trades
  async getOpenTrades(): Promise<BotTrade[]> {
    const response = await api.get('/api/trading/trades/open/');
    return response.data;
  },

  // Get closed trades
  async getClosedTrades(): Promise<BotTrade[]> {
    const response = await api.get('/api/trading/trades/closed/');
    return response.data;
  },

  // Get trading stats
  async getStats(): Promise<TradingStats> {
    const response = await api.get('/api/trading/trades/stats/');
    return response.data;
  },

  // Get trading sessions
  async getSessions(): Promise<{ results: TradingSession[] }> {
    const response = await api.get('/api/trading/sessions/');
    return response.data;
  },

  // Get active session
  async getActiveSession(): Promise<TradingSession> {
    const response = await api.get('/api/trading/sessions/active/');
    return response.data;
  },
};
