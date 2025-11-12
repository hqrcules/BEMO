import { useEffect, useState, useRef, useCallback } from 'react';
import { useAppSelector } from '@/store/hooks';
import { supportService } from '@/services/supportService';
import { SupportChat } from '@/shared/types/support';
import { usePolling } from '@/shared/hooks/usePolling';
import { useTranslation } from 'react-i18next';
import { useThemeClasses } from '@/shared/hooks/useThemeClasses';
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
  const tc = useThemeClasses();
  const { user } = useAppSelector((state) => state.auth);
  const [chat, setChat] = useState<SupportChat | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastMessageTimestamp = useRef<string | null>(null);

  const pollForMessages = useCallback(async () => {
    try {
      const response = await supportService.pollMessages(lastMessageTimestamp.current || undefined);

      if (response.messages.length > 0) {
        setChat(prevChat => {
          if (!prevChat) {
            return {
              id: '',
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

        const latestMessage = response.messages[response.messages.length - 1];
        if (latestMessage) {
          lastMessageTimestamp.current = latestMessage.created_at;
        }
      }
    } catch (error) {
      console.error('Error polling messages:', error);
    }
  }, [user]);

  usePolling(pollForMessages, {
    interval: 3000,
    enabled: !loading && !!user
  });

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const chatData = await supportService.getMessages();
        setChat(chatData);

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
      <div className={`min-h-screen ${tc.bg} ${tc.textPrimary}`}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <MessageSquare className="w-12 h-12 text-primary-500 animate-pulse mx-auto mb-4" />
            <p className={tc.textSecondary}>{t('support.loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${tc.bg} ${tc.textPrimary} flex flex-col`}>
      <div className="max-w-8xl mx-auto w-full flex-1 flex flex-col">
        <div className="w-full px-6 py-8 space-y-6 flex flex-col flex-1">
          <div className={`${tc.cardBg} border ${tc.cardBorder} rounded-3xl p-6`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/50">
                  <Shield className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className={`text-3xl sm:text-4xl font-extralight ${tc.textPrimary} tracking-tight flex items-center gap-2`}>
                    {t('support.header.title')}
                  </h1>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <p className={`text-sm ${tc.textTertiary} font-light`}>{t('support.header.subtitle')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className={`${tc.cardBg} border ${tc.cardBorder} rounded-3xl flex flex-col overflow-hidden flex-1`}>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {!chat || chat.messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <MessageSquare className={`w-16 h-16 ${tc.textTertiary} mb-4 opacity-50`} />
                  <p className={`${tc.textSecondary} text-lg font-medium mb-2`}>
                    {t('support.emptyChat.title')}
                  </p>
                  <p className={`text-sm ${tc.textTertiary} max-w-md`}>
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
                              <div className={`rounded-2xl px-5 py-3 ${isUser ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-lg' : `${tc.hover} border ${tc.cardBorder}`}`}>
                                {!isUser && <p className="text-xs text-primary-500 font-semibold mb-1">{t('support.chat.supportTeam')}</p>}
                                <p className={`text-sm ${isUser ? 'text-white' : tc.textPrimary}`}>{msg.message}</p>
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
                                <Clock className={`w-3 h-3 ${tc.textTertiary}`} />
                                <p className={`text-xs ${tc.textTertiary}`}>{formatTime(msg.created_at)}</p>
                                {isUser && <CheckCheck className="w-3 h-3 text-primary-500" />}
                              </div>
                            </div>
                            {isUser && (
                              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
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

            <div className={`border-t ${tc.cardBorder} p-4 ${tc.cardBg}/50`}>
              {attachment && (
                <div className={`mb-3 flex items-center gap-2 p-3 ${tc.hover} rounded-lg`}>
                  <Paperclip className="w-4 h-4 text-primary-500" />
                  <span className={`text-sm ${tc.textPrimary} flex-1`}>{attachment.name}</span>
                  <button onClick={() => setAttachment(null)} className={`p-1 ${tc.hoverBg} rounded-lg transition-colors`}>
                    <X className={`w-4 h-4 ${tc.textSecondary}`} />
                  </button>
                </div>
              )}
              <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                <input type="file" ref={fileInputRef} onChange={(e) => setAttachment(e.target.files?.[0] || null)} className="hidden" accept="image/*,.pdf,.doc,.docx" />
                <button type="button" onClick={() => fileInputRef.current?.click()} className={`p-3 ${tc.hoverBg} rounded-xl transition-colors flex-shrink-0`} title={t('support.input.attachTitle')}>
                  <Paperclip className={`w-5 h-5 ${tc.textSecondary}`} />
                </button>
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
                  className={`flex-1 ${tc.hover} border ${tc.cardBorder} rounded-xl text-sm px-4 py-3 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors resize-none min-h-[52px] max-h-32 ${tc.textPrimary}`}
                  rows={1}
                  disabled={sending}
                />
                <button
                  type="submit"
                  disabled={sending || (!message.trim() && !attachment)}
                  className="bg-primary-500 hover:bg-primary-600 rounded-xl text-white font-medium flex items-center justify-center px-5 py-3 flex-shrink-0 disabled:opacity-50 transition-colors"
                >
                  {sending ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="w-5 h-5" />}
                </button>
              </form>
              <p className={`text-xs ${tc.textTertiary} mt-3 text-center`}>{t('support.input.footer')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}