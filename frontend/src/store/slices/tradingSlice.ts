import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface BotTradeData {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  entry_price: string;
  exit_price: string | null;
  quantity: string;
  profit_loss: string;
  profit_loss_percent: string;
  is_open: boolean;
  opened_at: string;
  closed_at: string | null;
}

export interface TradingState {
  latestTrade: BotTradeData | null;
  lastUpdateTimestamp: string | null;
  flashBalance: boolean;
}

const initialState: TradingState = {
  latestTrade: null,
  lastUpdateTimestamp: null,
  flashBalance: false,
};

const tradingSlice = createSlice({
  name: 'trading',
  initialState,
  reducers: {
    updateBotTrade: (state, action: PayloadAction<BotTradeData>) => {
      state.latestTrade = action.payload;
      state.lastUpdateTimestamp = new Date().toISOString();
      state.flashBalance = true;
    },
    clearFlashBalance: (state) => {
      state.flashBalance = false;
    },
    clearLatestTrade: (state) => {
      state.latestTrade = null;
    },
  },
});

export const { updateBotTrade, clearFlashBalance, clearLatestTrade } = tradingSlice.actions;
export default tradingSlice.reducer;
