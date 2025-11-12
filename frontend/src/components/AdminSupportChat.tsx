// frontend/src/components/AdminSupportChat.tsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useThemeClasses } from '@/shared/hooks/useThemeClasses';

interface Chat {
  id: string;
  user: { email: string; id: number };
  status: string;
  updated_at: string;
  messages: Array<{
    id: string;
    message: string;
    is_from_admin: boolean;
    created_at: string;
  }>;
}

export const AdminSupportChat: React.FC = () => {
  const tc = useThemeClasses();
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messageText, setMessageText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Polling для списку чатів
  useEffect(() => {
    const fetchChats = async () => {
      try {
        const response = await axios.get<Chat[]>('/api/support/chats/');
        setChats(response.data);

        // Оновлюємо обраний чат якщо він є
        if (selectedChat) {
          const updatedChat = response.data.find(chat => chat.id === selectedChat.id);
          if (updatedChat) {
            setSelectedChat(updatedChat);
          }
        }
      } catch (err) {
        console.error('Помилка завантаження чатів:', err);
      }
    };

    fetchChats();
    const interval = setInterval(fetchChats, 3000); // Кожні 3 секунди

    return () => clearInterval(interval);
  }, [selectedChat]);

  const sendAdminMessage = async () => {
    if (!messageText.trim() || !selectedChat || isLoading) return;

    try {
      setIsLoading(true);
      await axios.post(`/api/support/chats/${selectedChat.id}/send_admin_message/`, {
        message: messageText
      });
      setMessageText('');
    } catch (err) {
      console.error('Помилка відправки:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`admin-support-chat flex h-96 border ${tc.cardBorder} rounded-lg`}>
      {/* Список чатів */}
      <div className={`w-1/3 border-r ${tc.cardBorder} ${tc.bg}`}>
        <div className={`p-3 ${tc.hover} border-b ${tc.cardBorder}`}>
          <h3 className={`font-semibold ${tc.textPrimary}`}>Активні чати ({chats.length})</h3>
        </div>
        <div className="overflow-y-auto">
          {chats.map((chat) => (
            <div
              key={chat.id}
              onClick={() => setSelectedChat(chat)}
              className={`p-3 border-b ${tc.border} cursor-pointer ${tc.hoverBg} ${
                selectedChat?.id === chat.id ? 'bg-blue-100 border-blue-300' : ''
              }`}
            >
              <div className={`font-medium ${tc.textPrimary}`}>{chat.user.email}</div>
              <div className={`text-sm ${tc.textSecondary}`}>
                {chat.status} • {new Date(chat.updated_at).toLocaleTimeString()}
              </div>
              {chat.messages.length > 0 && (
                <div className={`text-xs ${tc.textTertiary} truncate mt-1`}>
                  {chat.messages[chat.messages.length - 1].message}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Чат */}
      <div className="flex-1 flex flex-col">
        {selectedChat ? (
          <>
            {/* Заголовок чату */}
            <div className={`p-3 ${tc.hover} border-b ${tc.cardBorder}`}>
              <div className={`font-semibold ${tc.textPrimary}`}>Чат з {selectedChat.user.email}</div>
              <div className={`text-sm ${tc.textSecondary}`}>
                Статус: {selectedChat.status} • 🔄 Автооновлення
              </div>
            </div>

            {/* Повідомлення */}
            <div className={`flex-1 p-3 overflow-y-auto ${tc.cardBg}`}>
              {selectedChat.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`mb-3 ${msg.is_from_admin ? 'text-right' : 'text-left'}`}
                >
                  <div
                    className={`inline-block max-w-xs px-3 py-2 rounded-lg ${
                      msg.is_from_admin
                        ? 'bg-green-500 text-white'
                        : `${tc.hover} ${tc.textPrimary}`
                    }`}
                  >
                    <div className="text-sm">{msg.message}</div>
                    <div className={`text-xs mt-1 ${
                      msg.is_from_admin ? 'text-green-100' : tc.textTertiary
                    }`}>
                      {new Date(msg.created_at).toLocaleTimeString()}
                      {msg.is_from_admin && <span className="ml-1">👨‍💼</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Поле вводу */}
            <div className={`p-3 border-t ${tc.cardBorder}`}>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendAdminMessage()}
                  placeholder="Відповідь адміністратора..."
                  disabled={isLoading}
                  className={`flex-1 px-3 py-2 border ${tc.cardBorder} rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${tc.textPrimary} ${tc.bg}`}
                />
                <button
                  onClick={sendAdminMessage}
                  disabled={isLoading || !messageText.trim()}
                  className={`px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50`}
                >
                  {isLoading ? '📤' : 'Відправити'}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className={`flex-1 flex items-center justify-center ${tc.textTertiary}`}>
            Оберіть чат для початку спілкування
          </div>
        )}
      </div>
    </div>
  );
};
