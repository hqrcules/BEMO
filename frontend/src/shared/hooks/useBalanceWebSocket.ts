import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { updateBalance } from '@/store/slices/authSlice';
import { useWebSocket } from '@/shared/hooks/useWebSocket';

const BALANCE_WEBSOCKET_URL = 'ws://localhost:8000/ws/balance/';

export function useBalanceWebSocket() {
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  const { lastJsonMessage } = useWebSocket(BALANCE_WEBSOCKET_URL, {
    shouldReconnect: () => isAuthenticated,
  });

  useEffect(() => {
    if (lastJsonMessage) {
      const message = lastJsonMessage as { type?: string; balance?: string; };
      if (message.type === 'balance_update' && message.balance) {
        dispatch(updateBalance(message.balance));
      }
    }
  }, [lastJsonMessage, dispatch]);
}