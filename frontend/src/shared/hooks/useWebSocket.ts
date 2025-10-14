import { useEffect, useRef, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { updatePrices, setCryptoList, setConnected, setError } from '@/store/slices/websocketSlice';

interface UseWebSocketProps {
  url: string;
  autoConnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export function useWebSocket({
  url,
  autoConnect = true,
  reconnectInterval = 3000,
  maxReconnectAttempts = 10
}: UseWebSocketProps) {
  const dispatch = useAppDispatch();
  const { connected } = useAppSelector((state) => state.websocket);

  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const shouldReconnect = useRef(autoConnect);
  const isConnecting = useRef(false);

  const connect = useCallback(() => {
    if (isConnecting.current || (ws.current && ws.current.readyState === WebSocket.OPEN)) {
      console.log('⏳ Connection already in progress or active');
      return;
    }

    if (reconnectAttempts.current >= maxReconnectAttempts) {
      dispatch(setError('Превышено максимальное количество попыток подключения'));
      return;
    }

    isConnecting.current = true;

    try {
      console.log(`🔌 Подключение к WebSocket: ${url}`);
      ws.current = new WebSocket(url);

      ws.current.onopen = () => {
        console.log('✅ WebSocket подключен успешно');
        dispatch(setConnected(true));
        reconnectAttempts.current = 0;
        isConnecting.current = false;

        // Request crypto list on connect
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
          ws.current.send(JSON.stringify({ type: 'get_crypto_list' }));
        }
      };

      ws.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);

          // Handle price updates
          if (message.type === 'price_update') {
            console.log(`📊 Получены цены для ${Object.keys(message.data).length} инструментов`);
            dispatch(updatePrices(message.data));
          }

          // Handle crypto list with logos
          if (message.type === 'crypto_list') {
            console.log(`🪙 Получен список из ${message.data.length} криптовалют`);
            dispatch(setCryptoList(message.data));
          }

          if (message.type === 'pong') {
            console.log('🏓 Pong received');
          }
        } catch (err) {
          console.error('❌ Ошибка парсинга WebSocket сообщения:', err);
        }
      };

      ws.current.onerror = (error) => {
        console.error('❌ WebSocket ошибка:', error);
        dispatch(setError('Ошибка подключения WebSocket'));
        isConnecting.current = false;
      };

      ws.current.onclose = (event) => {
        console.log(`🔌 WebSocket отключен (код: ${event.code}, причина: ${event.reason || 'нет'})`);
        dispatch(setConnected(false));
        isConnecting.current = false;
        ws.current = null;

        if (shouldReconnect.current && reconnectAttempts.current < maxReconnectAttempts) {
          const timeout = Math.min(
            reconnectInterval * Math.pow(2, reconnectAttempts.current),
            30000
          );

          console.log(`⏳ Переподключение через ${timeout}ms (попытка ${reconnectAttempts.current + 1}/${maxReconnectAttempts})`);

          reconnectTimeout.current = setTimeout(() => {
            reconnectAttempts.current += 1;
            connect();
          }, timeout);
        }
      };

    } catch (err) {
      console.error('❌ Не удалось создать WebSocket:', err);
      dispatch(setError('Не удалось подключиться'));
      isConnecting.current = false;
    }
  }, [url, dispatch, reconnectInterval, maxReconnectAttempts]);

  const disconnect = useCallback(() => {
    console.log('🔌 Закрытие WebSocket соединения');
    shouldReconnect.current = false;

    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
      reconnectTimeout.current = null;
    }

    if (ws.current) {
      ws.current.close(1000, 'Client disconnect');
      ws.current = null;
    }

    dispatch(setConnected(false));
    isConnecting.current = false;
  }, [dispatch]);

  const send = useCallback((data: any) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(data));
    } else {
      console.warn('⚠️ WebSocket не подключен, невозможно отправить сообщение');
    }
  }, []);

  useEffect(() => {
    if (autoConnect) {
      const timer = setTimeout(() => {
        connect();
      }, 100);

      return () => {
        clearTimeout(timer);
        disconnect();
      };
    }
  }, [autoConnect]);

  return {
    isConnected: connected,
    send,
    connect,
    disconnect
  };
}