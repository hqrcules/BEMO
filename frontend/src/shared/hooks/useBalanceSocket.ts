import { useEffect, useRef } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { setUser } from '@/store/slices/authSlice';
import { User } from '@/shared/types';

const BALANCE_WEBSOCKET_URL = 'ws://localhost:8000/ws/balance/';

export function useBalanceSocket(user: User | null) {
  const dispatch = useAppDispatch();
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!user) return;

    const connect = () => {
      ws.current = new WebSocket(BALANCE_WEBSOCKET_URL);

      ws.current.onopen = () => {
        console.log('✅ Balance WebSocket connected');
      };

      ws.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'balance_update' && user) {
          console.log('💰 Balance updated via WebSocket:', data.balance);
          const updatedUser = { ...user, balance: data.balance };
          dispatch(setUser(updatedUser as User));
        }
      };

      ws.current.onclose = () => {
        console.log('🔌 Balance WebSocket disconnected, reconnecting...');
        setTimeout(connect, 3000);
      };

      ws.current.onerror = (error) => {
        console.error('❌ Balance WebSocket error:', error);
        ws.current?.close();
      };
    };

    connect();

    return () => {
      ws.current?.close();
    };
  }, [user, dispatch]);
}