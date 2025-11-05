import api from '@/shared/config/axios';

export interface ChartDataPoint {
  time: number;
  value: number;
}

export interface CandlestickData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface VolumeData {
  time: number;
  value: number;
  color: string;
}

export interface OHLCVResponse {
  ohlc: CandlestickData[];
  volume: VolumeData[];
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

  async getHistoryOHLC(binanceSymbol: string, interval: ChartInterval): Promise<OHLCVResponse> {
    try {
      const response = await api.get<OHLCVResponse>('/api/trading/history/', {
        params: {
          symbol: binanceSymbol,
          interval: interval,
        },
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching OHLC history for ${binanceSymbol}:`, error);
      throw error;
    }
  },
};