import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type AssetCategory = 'crypto' | 'stocks' | 'forex' | 'commodities';

export interface AssetItem {
  id: string;
  symbol: string;
  name: string;
  image: string;
  category: AssetCategory;
  price: number;
  change_24h: number;
  change_percent_24h: number;
  volume: number;
  isFavorite?: boolean;
}

export interface WebSocketState {
  assets: Record<string, AssetItem>;
  connected: boolean;
  lastUpdate: string | null;
  error: string | null;
  loading: boolean;
}

const initialState: WebSocketState = {
  assets: {},
  connected: false,
  lastUpdate: null,
  error: null,
  loading: true,
};

const websocketSlice = createSlice({
  name: 'websocket',
  initialState,
  reducers: {
    marketUpdate: (state, action: PayloadAction<AssetItem[]>) => {
      const newAssets: Record<string, AssetItem> = {};

      for (const asset of action.payload) {
        const existing = state.assets[asset.symbol];
        newAssets[asset.symbol] = {
          ...asset,
          isFavorite: existing?.isFavorite || false,
        };
      }

      state.assets = newAssets;
      state.lastUpdate = new Date().toISOString();
      state.loading = false;
    },
    toggleFavorite: (state, action: PayloadAction<string>) => {
      const symbol = action.payload;
      if (state.assets[symbol]) {
        state.assets[symbol].isFavorite = !state.assets[symbol].isFavorite;
      }
    },
    setConnected: (state, action: PayloadAction<boolean>) => {
      state.connected = action.payload;
      if (!action.payload) {
        state.loading = true;
      }
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.loading = false;
    },
    clearData: (state) => {
      state.assets = {};
      state.lastUpdate = null;
      state.error = null;
      state.connected = false;
      state.loading = true;
    },
  },
});

export const {
  marketUpdate,
  toggleFavorite,
  setConnected,
  setError,
  clearData,
} = websocketSlice.actions;

export default websocketSlice.reducer;