import { useEffect, useState, useRef, useCallback } from 'react';
import { useAppSelector } from '@/store/hooks';
import { supportService } from '@/services/supportService';
import { SupportChat } from '@/shared/types/support';
import { usePolling } from '@/shared/hooks/usePolling';
import { useTranslation } from 'react-i18next';
import {
  MessageSquare,
  Send,
  Paperclip,
  X,
  Shield,
  Clock,
  CheckCheck,
} from 'lucide-react';

const isImageUrl = (url: string) => {
    return /\.(jpeg|jpg|gif|png)$/.test(url.toLowerCase());
};

export default function SupportPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAppSelector((state) => state.auth);
  const [chat, setChat] = useState<SupportChat | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastMessageTimestamp = useRef<string | null>(null);

  // Polling function to get new messages
  const pollForMessages = useCallback(async () => {
    try {
      const response = await supportService.pollMessages(lastMessageTimestamp.current || undefined);

      if (response.messages.length > 0) {
        setChat(prevChat => {
          if (!prevChat) {
            // If no chat exists, create one with the new messages
            return {
              id: '', // Will be set properly from the first message
              messages: response.messages,
              status: response.chat_status as 'open' | 'in_progress' | 'closed',
              user: user?.id || '',
              user_email: user?.email || '',
              user_full_name: user?.full_name || '',
              subject: '',
              created_at: response.messages[0]?.created_at || new Date().toISOString(),
              updated_at: response.last_updated,
              assigned_admin: null,
              assigned_admin_email: null,
              closed_at: null,
              last_message: null,
              unread_count_for_user: 0,
              unread_count_for_admin: 0,
            };
          }

          // Add new messages to existing chat
          const existingMessageIds = new Set(prevChat.messages.map(m => m.id));
          const newMessages = response.messages.filter(m => !existingMessageIds.has(m.id));

          if (newMessages.length > 0) {
            return {
              ...prevChat,
              messages: [...prevChat.messages, ...newMessages],
              status: response.chat_status as 'open' | 'in_progress' | 'closed',
              updated_at: response.last_updated
            };
          }

          return prevChat;
        });

        // Update timestamp for next poll
        const latestMessage = response.messages[response.messages.length - 1];
        if (latestMessage) {
          lastMessageTimestamp.current = latestMessage.created_at;
        }
      }
    } catch (error) {
      console.error('Error polling messages:', error);
    }
  }, [user]);

  // Initialize polling
  usePolling(pollForMessages, {
    interval: 3000, // Poll every 3 seconds
    enabled: !loading && !!user
  });

  // Initial load
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const chatData = await supportService.getMessages();
        setChat(chatData);

        // Set initial timestamp for polling
        if (chatData.messages.length > 0) {
          const latestMessage = chatData.messages[chatData.messages.length - 1];
          lastMessageTimestamp.current = latestMessage.created_at;
        }
      } catch (error) {
        console.error('Error loading initial messages:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadInitialData();
    }
  }, [user]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [chat?.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() && !attachment) return;

    try {
      setSending(true);
      const formData = new FormData();
      formData.append('message', message);
      if (attachment) {
        formData.append('attachment', attachment);
      }

      const updatedChat = await supportService.sendMessage(formData);
      setChat(updatedChat);

      // Update timestamp after sending message
      if (updatedChat.messages.length > 0) {
        const latestMessage = updatedChat.messages[updatedChat.messages.length - 1];
        lastMessageTimestamp.current = latestMessage.created_at;
      }

      setMessage('');
      setAttachment(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <MessageSquare className="w-12 h-12 text-primary-500 animate-pulse mx-auto mb-4" />
          <p className="text-dark-text-secondary">{t('support.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/50">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-dark-text-primary flex items-center gap-2">
                {t('support.header.title')}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-2 h-2 bg-success-500 rounded-full animate-pulse"></div>
                <p className="text-sm text-dark-text-secondary">{t('support.header.subtitle')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <div className="glass-card flex flex-col h-[600px]">
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {!chat || chat.messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <MessageSquare className="w-16 h-16 text-dark-text-tertiary mb-4 opacity-50" />
              <p className="text-dark-text-secondary text-lg font-medium mb-2">
                {t('support.emptyChat.title')}
              </p>
              <p className="text-sm text-dark-text-tertiary max-w-md">
                {t('support.emptyChat.subtitle')}
              </p>
            </div>
          ) : (
            <>
              {chat.messages.map((msg, index) => {
                const isUser = !msg.is_from_admin;
                return (
                  <div key={msg.id}>
                    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`} style={{ animationDelay: `${index * 50}ms` }}>
                      <div className={`flex gap-3 max-w-[70%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                        {!isUser && (
                          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                            <Shield className="w-5 h-5 text-white" />
                          </div>
                        )}
                        <div>
                          <div className={`rounded-2xl px-5 py-3 ${isUser ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-lg' : 'bg-dark-card border border-dark-border'}`}>
                            {!isUser && <p className="text-xs text-primary-500 font-semibold mb-1">{t('support.chat.supportTeam')}</p>}
                            <p className={`text-sm ${isUser ? 'text-white' : 'text-dark-text-primary'}`}>{msg.message}</p>
                            {msg.attachment_url && (
                                isImageUrl(msg.attachment_url) ? (
                                    <a href={msg.attachment_url} target="_blank" rel="noopener noreferrer">
                                        <img src={msg.attachment_url} alt="Attachment" className="mt-2 rounded-lg max-w-xs" />
                                    </a>
                                ) : (
                                    <a href={msg.attachment_url} target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline mt-2 block">
                                        Attachment
                                    </a>
                                )
                            )}
                          </div>
                          <div className={`flex items-center gap-1 mt-1 px-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
                            <Clock className="w-3 h-3 text-dark-text-tertiary" />
                            <p className="text-xs text-dark-text-tertiary">{formatTime(msg.created_at)}</p>
                            {isUser && <CheckCheck className="w-3 h-3 text-primary-500" />}
                          </div>
                        </div>
                        {isUser && (
                          <div className="w-10 h-10 bg-gradient-to-br from-success-500 to-success-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                            <span className="text-white font-bold text-sm">{user?.email?.charAt(0).toUpperCase()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Message Input */}
        <div className="border-t border-dark-border p-4">
          {attachment && (
            <div className="mb-3 flex items-center gap-2 p-3 bg-dark-hover rounded-lg">
              <Paperclip className="w-4 h-4 text-primary-500" />
              <span className="text-sm text-dark-text-primary flex-1">{attachment.name}</span>
              <button onClick={() => setAttachment(null)} className="p-1 hover:bg-dark-border rounded-lg transition-colors">
                <X className="w-4 h-4 text-dark-text-secondary" />
              </button>
            </div>
          )}
          <form onSubmit={handleSendMessage} className="flex items-end gap-3">
            <input type="file" ref={fileInputRef} onChange={(e) => setAttachment(e.target.files?.[0] || null)} className="hidden" accept="image/*,.pdf,.doc,.docx" />
            <button type="button" onClick={() => fileInputRef.current?.click()} className="p-3 hover:bg-dark-hover rounded-xl transition-colors flex-shrink-0" title={t('support.input.attachTitle')}>
              <Paperclip className="w-5 h-5 text-dark-text-secondary" />
            </button>
            <div className="flex-1 relative">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
                placeholder={t('support.input.placeholder')}
                className="input-field resize-none pr-12 min-h-[52px] max-h-32"
                rows={1}
                disabled={sending}
              />
            </div>
            <button type="submit" disabled={sending || (!message.trim() && !attachment)} className="btn-primary px-5 py-3 flex-shrink-0 disabled:opacity-50">
              {sending ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </form>
          <p className="text-xs text-dark-text-tertiary mt-3 text-center">{t('support.input.footer')}</p>
        </div>
      </div>
    </div>
  );
}