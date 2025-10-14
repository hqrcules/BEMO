// frontend/src/store/slices/websocketSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface PriceData {
  price: number;
  change: number;
  changePercent: number;
  image?: string; // Add image URL
  name?: string; // Add coin name
  volume?: number;
}

interface CryptoInfo {
  id: string;
  symbol: string;
  name: string;
  image: string; // Logo URL from CoinGecko
  price: number;
  change_24h: number;
  change_percent_24h: number;
  market_cap: number;
  volume: number;
}

interface WebSocketState {
  prices: Record<string, PriceData>;
  cryptoList: CryptoInfo[]; // List of all available cryptos
  connected: boolean;
  lastUpdate: string | null;
  error: string | null;
}

const initialState: WebSocketState = {
  prices: {},
  cryptoList: [],
  connected: false,
  lastUpdate: null,
  error: null,
};

const websocketSlice = createSlice({
  name: 'websocket',
  initialState,
  reducers: {
    // Update multiple prices from WebSocket
    updatePrices: (state, action: PayloadAction<Record<string, PriceData>>) => {
      state.prices = { ...state.prices, ...action.payload };
      state.lastUpdate = new Date().toISOString();
    },

    // Set crypto list (metadata)
    setCryptoList: (state, action: PayloadAction<CryptoInfo[]>) => {
      state.cryptoList = action.payload;
    },

    // Update connection status
    setConnected: (state, action: PayloadAction<boolean>) => {
      state.connected = action.payload;
    },

    // Set error message
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },

    // Clear all data
    clearData: (state) => {
      state.prices = {};
      state.cryptoList = [];
      state.lastUpdate = null;
    },
  },
});

export const {
  updatePrices,
  setCryptoList,
  setConnected,
  setError,
  clearData,
} = websocketSlice.actions;

export default websocketSlice.reducer;
