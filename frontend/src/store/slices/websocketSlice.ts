import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Define PriceData and CryptoInfo interfaces here as they belong to the slice's state shape
interface PriceData {
  price: number;
  change: number;
  changePercent: number;
  image?: string;
  name?: string;
  volume?: number;
}

interface CryptoInfo {
  id: string;
  symbol: string;
  name: string;
  image: string;
  price: number;
  change_24h: number;
  change_percent_24h: number;
  market_cap: number;
  volume: number;
}

// Define WebSocketState interface
interface WebSocketState {
  prices: Record<string, PriceData>;
  cryptoList: CryptoInfo[];
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
    updatePrices: (state, action: PayloadAction<Record<string, PriceData>>) => {
      state.prices = { ...state.prices, ...action.payload };
      state.lastUpdate = new Date().toISOString();
    },
    setCryptoList: (state, action: PayloadAction<CryptoInfo[]>) => {
      state.cryptoList = action.payload;
    },
    setConnected: (state, action: PayloadAction<boolean>) => {
      state.connected = action.payload;
      if (!action.payload) {
        // Optionally clear prices or handle disconnect state further
        // state.prices = {}; // Uncomment if you want to clear prices on disconnect
      }
    },
    setError: (state, action: PayloadAction<string | null>) => { // Allow null to clear error
      state.error = action.payload;
    },
    clearData: (state) => {
      state.prices = {};
      state.cryptoList = [];
      state.lastUpdate = null;
      state.error = null;
      state.connected = false; // Also reset connected status if needed
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

// Export the reducer as default
export default websocketSlice.reducer;

// Export the state type if needed elsewhere, though RootState from store is preferred
export type { WebSocketState, PriceData, CryptoInfo };