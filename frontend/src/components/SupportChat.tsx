// frontend/src/components/SupportChat.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useSupportPolling } from '@/shared/hooks/useSupportPolling';
import { useThemeClasses } from '@/shared/hooks/useThemeClasses';

export const SupportChat: React.FC = () => {
  const tc = useThemeClasses();
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
    <div className={`support-chat flex flex-col h-96 border ${tc.cardBorder} rounded-lg`}>
      {/* Заголовок */}
      <div className={`${tc.hover} p-3 border-b ${tc.cardBorder} rounded-t-lg`}>
        <h3 className={`font-semibold ${tc.textPrimary}`}>Чат підтримки</h3>
        <div className={`text-sm ${tc.textSecondary}`}>
          🔄 Автооновлення кожні 3 сек
          {error && (
            <span className="text-red-500 ml-2">⚠️ {error}</span>
          )}
        </div>
      </div>

      {/* Повідомлення */}
      <div className={`flex-1 p-3 overflow-y-auto ${tc.bg}`}>
        {messages.length === 0 ? (
          <div className={`text-center ${tc.textTertiary} mt-8`}>
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
                    ? `${tc.cardBg} border ${tc.cardBorder} ${tc.textPrimary}`
                    : 'bg-blue-500 text-white'
                }`}
              >
                <div className="text-sm">{msg.message}</div>
                <div className={`text-xs mt-1 ${
                  msg.is_from_admin ? tc.textTertiary : 'text-blue-100'
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
      <div className={`p-3 border-t ${tc.cardBorder} ${tc.cardBg} rounded-b-lg`}>
        <div className="flex gap-2">
          <input
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Введіть повідомлення..."
            disabled={isLoading}
            className={`flex-1 px-3 py-2 border ${tc.cardBorder} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 ${tc.textPrimary} ${tc.bg}`}
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !messageText.trim()}
            className={`px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isLoading ? '📤' : 'Відправити'}
          </button>
          <button
            onClick={refreshMessages}
            className={`px-3 py-2 ${tc.hover} ${tc.textPrimary} rounded-md ${tc.hoverBg}`}
            title="Оновити повідомлення"
          >
            🔄
          </button>
        </div>
      </div>
    </div>
  );
};
