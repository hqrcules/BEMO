import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { currencyService, CurrencyRates } from '@/services/currencyService';

export interface CurrencyState {
  selectedCurrency: string;
  baseCurrency: string;
  rates: CurrencyRates;
  symbols: Record<string, string>;
  loading: boolean;
  error: string | null;
}

const initialState: CurrencyState = {
  selectedCurrency: 'EUR',
  baseCurrency: 'EUR',
  rates: { EUR: 1 },
  symbols: { EUR: '€' },
  loading: false,
  error: null,
};

export const fetchCurrencyRates = createAsyncThunk(
  'currency/fetchRates',
  async (_, { rejectWithValue }) => {
    try {
      const data = await currencyService.getLatestRates(initialState.baseCurrency);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch currency rates');
    }
  }
);

const currencySlice = createSlice({
  name: 'currency',
  initialState,
  reducers: {
    setCurrency: (state, action: PayloadAction<string>) => {
      if (state.rates[action.payload]) {
        state.selectedCurrency = action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCurrencyRates.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCurrencyRates.fulfilled, (state, action: PayloadAction<{ rates: CurrencyRates; symbols: Record<string, string> }>) => {
        state.loading = false;
        state.rates = { ...state.rates, ...action.payload.rates };
        state.symbols = { ...state.symbols, ...action.payload.symbols };
        if (!state.rates[state.selectedCurrency]) {
          state.selectedCurrency = state.baseCurrency;
        }
      })
      .addCase(fetchCurrencyRates.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setCurrency } = currencySlice.actions;
export default currencySlice.reducer;