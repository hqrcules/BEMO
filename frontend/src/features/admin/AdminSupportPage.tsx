import { useEffect, useState, useRef, useCallback } from 'react';
import { adminService } from '@/services/adminService';
import { SupportChat } from '@/shared/types/support';
import { usePolling } from '@/shared/hooks/usePolling';
import { MessageSquare, Send, Paperclip, Trash2, Clock, User, Search, X } from 'lucide-react';

const isImageUrl = (url: string | null): url is string => {
    return typeof url === 'string' && /\.(jpeg|jpg|gif|png)$/.test(url.toLowerCase());
};

export default function AdminSupportPage() {
  const [chats, setChats] = useState<SupportChat[]>([]);
  const [selectedChat, setSelectedChat] = useState<SupportChat | null>(null);
  const [message, setMessage] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastMessageTimestamps = useRef<Map<string, string>>(new Map());

  const pollSelectedChatMessages = useCallback(async () => {
    if (!selectedChat) return;
    try {
      const lastTimestamp = lastMessageTimestamps.current.get(selectedChat.id);
      const response = await adminService.pollChatMessages(selectedChat.id, lastTimestamp);
      if (response.messages.length > 0) {
        setChats(prevChats =>
          prevChats.map(chat => {
            if (chat.id === selectedChat.id) {
              const existingMessageIds = new Set(chat.messages.map(m => m.id));
              const newMessages = response.messages.filter(m => !existingMessageIds.has(m.id));
              if (newMessages.length > 0) {
                const updatedChat = {
                  ...chat,
                  messages: [...chat.messages, ...newMessages],
                  status: response.chat_status as 'open' | 'in_progress' | 'closed',
                  updated_at: response.last_updated
                };
                const latestMessage = newMessages[newMessages.length - 1];
                if (latestMessage) {
                  lastMessageTimestamps.current.set(chat.id, latestMessage.created_at);
                }
                return updatedChat;
              }
            }
            return chat;
          })
        );
      }
    } catch (error) {
      console.error('Error polling chat messages:', error);
    }
  }, [selectedChat]);

  usePolling(pollSelectedChatMessages, {
    interval: 3000,
    enabled: !!selectedChat && !loading
  });

  useEffect(() => {
    loadChats();
  }, []);

  useEffect(() => {
    if (selectedChat) {
      const updatedSelectedChat = chats.find(c => c.id === selectedChat.id);
      if (updatedSelectedChat) {
        setSelectedChat(updatedSelectedChat);
      }
    }
    scrollToBottom();
  }, [chats, selectedChat?.id]);

  useEffect(() => {
    if (selectedChat && selectedChat.messages.length > 0) {
      const latestMessage = selectedChat.messages[selectedChat.messages.length - 1];
      lastMessageTimestamps.current.set(selectedChat.id, latestMessage.created_at);
    }
  }, [selectedChat?.id]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChats = async () => {
    setLoading(true);
    try {
      const chatData = await adminService.getSupportChats();
      setChats(chatData);
      chatData.forEach(chat => {
        if (chat.messages.length > 0) {
          const latestMessage = chat.messages[chat.messages.length - 1];
          lastMessageTimestamps.current.set(chat.id, latestMessage.created_at);
        }
      });
    } catch (error) {
      console.error("Failed to load support chats", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteChat = async (chatId: string) => {
    if (window.confirm('Вы уверены, что хотите удалить этот чат? Это действие необратимо.')) {
        try {
            await adminService.deleteSupportChat(chatId);
            setChats(chats.filter(chat => chat.id !== chatId));
            lastMessageTimestamps.current.delete(chatId);
            if (selectedChat?.id === chatId) {
                setSelectedChat(null);
            }
        } catch (error) {
            console.error("Failed to delete chat", error);
        }
    }
  };

  const handleSendMessage = async () => {
    if (!selectedChat || (!message.trim() && !attachment)) return;
    const formData = new FormData();
    formData.append('message', message);
    if (attachment) formData.append('attachment', attachment);
    try {
      const updatedChat = await adminService.sendAdminSupportMessage(selectedChat.id, formData);
      setChats(prevChats => prevChats.map(chat => chat.id === selectedChat.id ? updatedChat : chat));
      if (updatedChat.messages.length > 0) {
        const latestMessage = updatedChat.messages[updatedChat.messages.length - 1];
        lastMessageTimestamps.current.set(selectedChat.id, latestMessage.created_at);
      }
      setMessage('');
      setAttachment(null);
      if(fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      console.error("Failed to send message", error);
    }
  };

  const formatTime = (dateString: string) => new Date(dateString).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

  const filteredChats = chats.filter(chat =>
    chat.user_email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <div className="p-6">Loading chats...</div>;

  return (
    <div className="flex h-[calc(100vh-120px)] text-white bg-dark-card rounded-2xl border border-dark-border overflow-hidden">
      <div className="w-1/3 border-r border-dark-border flex flex-col">
        <div className="p-4 border-b border-dark-border">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-text-tertiary" />
                <input
                    type="text"
                    placeholder="Поиск по email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="input-field w-full pl-9"
                />
            </div>
        </div>
        <div className="overflow-y-auto">
          {filteredChats.map(chat => (
            <div
              key={chat.id}
              className={`p-4 cursor-pointer hover:bg-dark-hover flex justify-between items-start border-b border-dark-border ${selectedChat?.id === chat.id ? 'bg-primary-500/10' : ''}`}
              onClick={() => setSelectedChat(chat)}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-white" />
                  </div>
                  <div className="overflow-hidden">
                      <p className="font-semibold truncate">{chat.user_email}</p>
                      <p className="text-xs text-dark-text-secondary truncate">{chat.messages[chat.messages.length-1]?.message || 'Нет сообщений'}</p>
                  </div>
              </div>
              <div className="flex flex-col items-end flex-shrink-0">
                  <span className="text-xs text-dark-text-tertiary mb-2">{formatTime(chat.updated_at)}</span>
                  <button onClick={(e) => { e.stopPropagation(); handleDeleteChat(chat.id); }} className="text-dark-text-tertiary hover:text-danger-500 transition-colors">
                      <Trash2 size={16} />
                  </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="w-2/3 flex flex-col bg-dark-bg">
        {selectedChat ? (
          <>
            <div className="p-4 border-b border-dark-border flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">{selectedChat.user_email}</h3>
                <p className="text-sm text-dark-text-secondary capitalize">{selectedChat.status}</p>
              </div>
            </div>

            <div className="flex-1 p-6 overflow-y-auto space-y-4">
              {selectedChat.messages.map(msg => (
                <div key={msg.id} className={`flex gap-3 ${msg.is_from_admin ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.is_from_admin ? 'bg-danger-500' : 'bg-primary-500'}`}>
                        <span className="text-sm font-bold">{msg.sender_name?.[0].toUpperCase()}</span>
                    </div>
                  <div className={`rounded-2xl p-4 max-w-lg ${msg.is_from_admin ? 'bg-dark-card rounded-br-none' : 'bg-primary-600 text-white rounded-bl-none'}`}>
                    <p>{msg.message}</p>
                    {msg.attachment_url && (
                        isImageUrl(msg.attachment_url) ? (
                            <a href={msg.attachment_url} target="_blank" rel="noopener noreferrer">
                                <img src={msg.attachment_url} alt="Attachment" className="mt-2 rounded-lg max-w-xs cursor-pointer" />
                            </a>
                        ) : (
                            <a href={msg.attachment_url} target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline mt-2 block">
                                Скачать вложение
                            </a>
                        )
                    )}
                    <div className="flex items-center gap-1 mt-2 text-xs opacity-70">
                      <Clock className="w-3 h-3" />
                      <span>{formatTime(msg.created_at)}</span>
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-dark-border bg-dark-card">
                {attachment && (
                    <div className="p-2 bg-dark-hover rounded-lg mb-2 flex items-center justify-between">
                        <p className="text-xs text-dark-text-secondary">Прикреплен: {attachment.name}</p>
                        <button onClick={() => setAttachment(null)} className="text-dark-text-tertiary hover:text-white"><X size={16} /></button>
                    </div>
                )}
                <div className="flex items-center gap-3">
                    <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="input-field flex-1"
                        placeholder="Ответить пользователю..."
                        onKeyDown={(e) => { if (e.key === 'Enter') handleSendMessage() }}
                    />
                     <input type="file" ref={fileInputRef} onChange={(e) => setAttachment(e.target.files?.[0] || null)} className="hidden" />
                    <button onClick={() => fileInputRef.current?.click()} className="btn-secondary p-3"><Paperclip size={20} /></button>
                    <button onClick={handleSendMessage} className="btn-primary p-3" disabled={!message.trim() && !attachment}><Send size={20}/></button>
                </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-dark-text-tertiary">
            <MessageSquare size={48} className="opacity-50 mb-4" />
            <p>Выберите чат для просмотра</p>
          </div>
        )}
      </div>
    </div>
  );
}