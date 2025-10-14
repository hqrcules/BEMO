// frontend/src/components/SupportChat.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useSupportPolling } from '@/shared/hooks/useSupportPolling';

export const SupportChat: React.FC = () => {
  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    isLoading,
    error,
    sendMessage,
    refreshMessages
  } = useSupportPolling({
    intervalMs: 3000, // Кожні 3 секунди
    onNewMessage: (message) => {
      console.log('🎉 Нове повідомлення:', message.message);
      // Можна додати звукове сповіщення або toast
    }
  });

  // Автоскрол до низу при нових повідомленнях
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || isLoading) return;

    try {
      await sendMessage(messageText);
      setMessageText('');
    } catch (err) {
      console.error('Помилка відправки:', err);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="support-chat flex flex-col h-96 border border-gray-300 rounded-lg">
      {/* Заголовок */}
      <div className="bg-gray-100 p-3 border-b border-gray-300 rounded-t-lg">
        <h3 className="font-semibold">Чат підтримки</h3>
        <div className="text-sm text-gray-600">
          🔄 Автооновлення кожні 3 сек
          {error && (
            <span className="text-red-500 ml-2">⚠️ {error}</span>
          )}
        </div>
      </div>

      {/* Повідомлення */}
      <div className="flex-1 p-3 overflow-y-auto bg-gray-50">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            Немає повідомлень. Напишіть щось!
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`mb-3 ${msg.is_from_admin ? 'text-left' : 'text-right'}`}
            >
              <div
                className={`inline-block max-w-xs px-3 py-2 rounded-lg ${
                  msg.is_from_admin 
                    ? 'bg-white border border-gray-300 text-gray-800' 
                    : 'bg-blue-500 text-white'
                }`}
              >
                <div className="text-sm">{msg.message}</div>
                <div className={`text-xs mt-1 ${
                  msg.is_from_admin ? 'text-gray-500' : 'text-blue-100'
                }`}>
                  {new Date(msg.created_at).toLocaleTimeString('uk-UA', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                  {msg.is_from_admin && <span className="ml-1">👨‍💼</span>}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Поле вводу */}
      <div className="p-3 border-t border-gray-300 bg-white rounded-b-lg">
        <div className="flex gap-2">
          <input
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Введіть повідомлення..."
            disabled={isLoading}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !messageText.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isLoading ? '📤' : 'Відправити'}
          </button>
          <button
            onClick={refreshMessages}
            className="px-3 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
            title="Оновити повідомлення"
          >
            🔄
          </button>
        </div>
      </div>
    </div>
  );
};
