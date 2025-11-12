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
  // Bot control
  async startBot(): Promise<{ status: string }> {
    const response = await api.post('/api/trading/sessions/start-bot/');
    return response.data;
  },

  async stopBot(): Promise<{ status: string }> {
    const response = await api.post('/api/trading/sessions/stop-bot/');
    return response.data;
  },

  // Trades
  async getTrades(): Promise<BotTrade[]> {
    const response = await api.get('/api/trading/trades/');
    // Handle both paginated and non-paginated responses
    return response.data.results || response.data;
  },

  async getOpenPositions(): Promise<BotTrade[]> {
    const response = await api.get('/api/trading/trades/open/');
    return response.data.results || response.data;
  },

  async getOpenTrades(): Promise<BotTrade[]> {
    return this.getOpenPositions();
  },

  async getClosedTrades(): Promise<BotTrade[]> {
    const response = await api.get('/api/trading/trades/closed/');
    return response.data.results || response.data;
  },

  // Statistics
  async getTradingStats(): Promise<TradingStats> {
    const response = await api.get('/api/trading/trades/stats/');
    return response.data;
  },

  async getStats(): Promise<TradingStats> {
    return this.getTradingStats();
  },

  // Sessions
  async getSessions(): Promise<TradingSession[]> {
    const response = await api.get('/api/trading/sessions/');
    return response.data.results || response.data;
  },

  async getActiveSession(): Promise<TradingSession | null> {
    try {
      const response = await api.get('/api/trading/sessions/active/');
      return response.data;
    } catch (error) {
      console.error('No active session:', error);
      return null;
    }
  },

  // Additional methods
  async getTrade(tradeId: string): Promise<BotTrade> {
    const response = await api.get(`/api/trading/trades/${tradeId}/`);
    return response.data;
  },

  async closePosition(tradeId: string): Promise<BotTrade> {
    const response = await api.post(`/api/trading/trades/${tradeId}/close/`);
    return response.data;
  },
};

export default tradingService;
