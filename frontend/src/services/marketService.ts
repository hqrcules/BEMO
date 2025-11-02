import api from '@/shared/config/axios';

export interface ChartDataPoint {
  time: number;
  value: number;
}

export type ChartInterval = '1h' | '4h' | '1d' | '1w';

export const marketService = {
  async getHistory(symbol: string, interval: ChartInterval): Promise<ChartDataPoint[]> {
    try {
      const response = await api.get('/api/trading/history/', {
        params: {
          symbol: symbol,
          interval: interval,
        },
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching history for ${symbol}:`, error);
      throw error;
    }
  },
};