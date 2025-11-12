import { useEffect, useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { updateBalance } from '@/store/slices/authSlice';
import { updateBotTrade, clearFlashBalance } from '@/store/slices/tradingSlice';
import { useWebSocket } from '@/shared/hooks/useWebSocket';

// Determine WebSocket URL based on current location
const getBalanceWebSocketURL = () => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.hostname;
  const port = import.meta.env.VITE_WS_PORT || '8000';
  const wsHost = host === 'localhost' || host === '127.0.0.1' ? `${host}:${port}` : host;
  return `${protocol}//${wsHost}/ws/balance/`;
};

export function useBalanceWebSocket() {
  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);

  const BALANCE_WEBSOCKET_URL = useMemo(() => getBalanceWebSocketURL(), []);

  const handleBalanceMessage = useCallback((message: any) => {
    if (message.type === 'balance_update' && message.balance !== undefined) {
      dispatch(updateBalance(message.balance));
    } else if (message.type === 'bot_trade_update') {
      // Update balance
      if (message.balance !== undefined) {
        dispatch(updateBalance(message.balance));
      }
      // Update latest trade data
      if (message.trade) {
        dispatch(updateBotTrade(message.trade));
        // Clear flash effect after animation duration
        setTimeout(() => {
          dispatch(clearFlashBalance());
        }, 1000);
      }
    }
  }, [dispatch]);

  const { connect, disconnect } = useWebSocket({
      url: BALANCE_WEBSOCKET_URL,
      onMessage: handleBalanceMessage,
      autoConnect: false,
  });

  useEffect(() => {
    if (isAuthenticated && user) {
      connect();
    } else {
      disconnect();
    }
    return () => {
      disconnect();
    };
  }, [isAuthenticated, user, connect, disconnect]);
}