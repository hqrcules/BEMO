// frontend/src/shared/hooks/useSupportPolling.ts
import { useEffect, useRef, useState, useCallback } from 'react';
import { useAppSelector } from '@/store/hooks';
import axios from 'axios';

interface SupportMessage {
  id: string;
  message: string;
  user: number;
  is_from_admin: boolean;
  created_at: string;
  chat: string;
}

interface SupportChat {
  id: string;
  messages: SupportMessage[];
  status: string;
  updated_at: string;
}

interface UseSupportPollingProps {
  intervalMs?: number;
  onNewMessage?: (message: SupportMessage) => void;
}

export function useSupportPolling({
  intervalMs = 2000, // Кожні 2 секунди
  onNewMessage
}: UseSupportPollingProps = {}) {

  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastMessageIdRef = useRef<string | null>(null);
  const isPollingRef = useRef(false);

  const fetchMessages = useCallback(async () => {
    if (!isAuthenticated || isPollingRef.current) {
      return;
    }

    try {
      isPollingRef.current = true;
      setError(null);

      const response = await axios.get<SupportChat>('/api/support/chats/my-chat/');
      const newMessages = response.data.messages || [];

      // Перевіряємо чи є нові повідомлення
      if (newMessages.length > 0) {
        const latestMessage = newMessages[newMessages.length - 1];

        if (lastMessageIdRef.current !== latestMessage.id) {
          // Знайдемо тільки нові повідомлення
          const newMessagesOnly = lastMessageIdRef.current
            ? newMessages.filter(msg => {
                const currentIndex = messages.findIndex(m => m.id === lastMessageIdRef.current);
                const newIndex = newMessages.findIndex(m => m.id === msg.id);
                return newIndex > currentIndex;
              })
            : newMessages;

          setMessages(newMessages);
          lastMessageIdRef.current = latestMessage.id;

          // Викликаємо callback для нових повідомлень
          if (onNewMessage && newMessagesOnly.length > 0) {
            newMessagesOnly.forEach(msg => onNewMessage(msg));
          }
        }
      }

    } catch (err: any) {
      console.error('❌ Помилка завантаження повідомлень:', err);
      setError(err.response?.data?.message || 'Помилка завантаження');
    } finally {
      isPollingRef.current = false;
    }
  }, [isAuthenticated, messages, onNewMessage]);

  const sendMessage = useCallback(async (messageText: string) => {
    if (!messageText.trim()) return;

    try {
      setIsLoading(true);
      setError(null);

      await axios.post('/api/support/chats/my-chat/send_message/', {
        message: messageText
      });

      // Одразу завантажуємо нові повідомлення
      await fetchMessages();

    } catch (err: any) {
      console.error('❌ Помилка відправки повідомлення:', err);
      setError(err.response?.data?.message || 'Помилка відправки');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [fetchMessages]);

  const startPolling = useCallback(() => {
    if (intervalRef.current || !isAuthenticated) {
      return;
    }

    console.log(`🔄 Запуск polling кожні ${intervalMs}ms`);

    // Завантажуємо одразу
    fetchMessages();

    // Запускаємо інтервал
    intervalRef.current = setInterval(() => {
      fetchMessages();
    }, intervalMs);

  }, [isAuthenticated, intervalMs, fetchMessages]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      console.log('⏸️ Зупинка polling');
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Автоматичне керування polling
  useEffect(() => {
    if (isAuthenticated) {
      startPolling();
    } else {
      stopPolling();
    }

    return () => stopPolling();
  }, [isAuthenticated, startPolling, stopPolling]);

  // Зупинка при закритті вкладки
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPolling();
      } else if (isAuthenticated) {
        startPolling();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      stopPolling();
    };
  }, [isAuthenticated, startPolling, stopPolling]);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    startPolling,
    stopPolling,
    refreshMessages: fetchMessages
  };
}
