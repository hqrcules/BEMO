import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import websocketReducer from './slices/websocketSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    websocket: websocketReducer, // Add WebSocket reducer
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
