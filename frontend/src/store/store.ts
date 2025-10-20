import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import websocketReducer from './slices/websocketSlice';
import currencyReducer from './slices/currencySlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    websocket: websocketReducer,
    currency: currencyReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;