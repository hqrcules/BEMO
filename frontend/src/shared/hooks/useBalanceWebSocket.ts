import { useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { updateBalance } from '@/store/slices/authSlice';
import { useWebSocket } from '@/shared/hooks/useWebSocket';

const BALANCE_WEBSOCKET_URL =  'ws://localhost:8000/ws/balance/';

export function useBalanceWebSocket() {
  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);

  const handleBalanceMessage = useCallback((message: any) => {
    if (message.type === 'balance_update' && message.balance !== undefined) {
      dispatch(updateBalance(message.balance));
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