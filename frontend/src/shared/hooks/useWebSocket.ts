import { useEffect, useRef, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { marketUpdate, setConnected, setError } from '@/store/slices/websocketSlice';
import { RootState } from '@/store/store';

interface UseWebSocketProps {
  url?: string;
  autoConnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  onMessage?: (message: any) => void;
}

const WEBSOCKET_MARKET_URL =  'ws://localhost:8000/ws/market/';

export function useWebSocket({
  url = WEBSOCKET_MARKET_URL,
  autoConnect = true,
  reconnectInterval = 3000,
  maxReconnectAttempts = 10,
  onMessage
}: UseWebSocketProps = {}) {
  const dispatch = useAppDispatch();
  const { connected } = useAppSelector((state: RootState) => state.websocket);

  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const shouldReconnect = useRef(autoConnect);
  const isConnecting = useRef(false);

  const connect = useCallback(() => {
    if (!url || typeof url !== 'string' || (!url.startsWith('ws://') && !url.startsWith('wss://'))) {
        dispatch(setError('Неправильна URL WebSocket'));
        return;
    }

    if (isConnecting.current || (ws.current && ws.current.readyState === WebSocket.OPEN)) {
      return;
    }

    if (reconnectAttempts.current >= maxReconnectAttempts) {
      dispatch(setError('Перевищено максимальну кількість спроб підключення'));
      return;
    }

    isConnecting.current = true;

    try {
      ws.current = new WebSocket(url);

      ws.current.onopen = () => {
        dispatch(setConnected(true));
        reconnectAttempts.current = 0;
        isConnecting.current = false;
      };

      ws.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (onMessage) {
            onMessage(message);
          }
          if (url.includes('/ws/market/')) {
            if (message.type === 'market_update') {
              dispatch(marketUpdate(message.data));
            }
          }
        } catch (err) {
        }
      };

      ws.current.onerror = () => {
        dispatch(setError('Помилка підключення WebSocket'));
        isConnecting.current = false;
      };

      ws.current.onclose = () => {
        dispatch(setConnected(false));
        isConnecting.current = false;
        ws.current = null;
        if (shouldReconnect.current && reconnectAttempts.current < maxReconnectAttempts) {
          const timeout = Math.min(
            reconnectInterval * Math.pow(2, reconnectAttempts.current),
            30000
          );
          reconnectTimeout.current = setTimeout(() => {
            reconnectAttempts.current += 1;
            connect();
          }, timeout);
        } else if (reconnectAttempts.current >= maxReconnectAttempts) {
            dispatch(setError('Не вдалося відновити з\'єднання WebSocket.'));
        }
      };

    } catch (err) {
      dispatch(setError('Не вдалося підключитися'));
      isConnecting.current = false;
    }
  }, [url, dispatch, reconnectInterval, maxReconnectAttempts, onMessage]);

  const disconnect = useCallback(() => {
    shouldReconnect.current = false;
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
      reconnectTimeout.current = null;
    }
    if (ws.current) {
      ws.current.close(1000, 'Client disconnect');
      ws.current = null;
    }
    isConnecting.current = false;
    reconnectAttempts.current = 0;
  }, []);

  const send = useCallback((data: any) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(data));
    }
  }, []);

  useEffect(() => {
    if (autoConnect) {
      shouldReconnect.current = true;
      connect();
    } else {
      shouldReconnect.current = false;
    }
    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect, url]);

  return {
    isConnected: connected,
    send,
    connect,
    disconnect
  };
}