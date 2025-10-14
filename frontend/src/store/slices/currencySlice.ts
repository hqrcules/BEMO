import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface CurrencyState {
  selectedCurrency: 'USD' | 'EUR' | 'UAH';
  rates: Record<string, number>;
}

const initialState: CurrencyState = {
  selectedCurrency: 'USD',
  rates: {
    USD: 1,
    EUR: 0.92,
    UAH: 36.5,
  },
};

const currencySlice = createSlice({
  name: 'currency',
  initialState,
  reducers: {
    setCurrency: (state, action: PayloadAction<'USD' | 'EUR' | 'UAH'>) => {
      state.selectedCurrency = action.payload;
    },
    updateRates: (state, action: PayloadAction<Record<string, number>>) => {
      state.rates = action.payload;
    },
  },
});

export const { setCurrency, updateRates } = currencySlice.actions;
export default currencySlice.reducer;
