import { useEffect, useState, useRef, useCallback } from 'react';
import { useAppSelector } from '@/store/hooks';
import { supportService } from '@/services/supportService';
import { SupportChat } from '@/shared/types/support';
import { usePolling } from '@/shared/hooks/usePolling';
import { useTranslation } from 'react-i18next';
import { useThemeClasses } from '@/shared/hooks/useThemeClasses';
import { useTheme } from '@/contexts/ThemeContext';
import {
  MessageSquare,
  Send,
  Paperclip,
  X,
  Shield,
  Clock,
  CheckCheck,
  Headphones,
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

  const { theme } = useTheme();
  const isLight = theme === 'light';

  if (loading) {
    return (
      <div className={`relative w-full min-h-screen pb-20 font-sans ${isLight ? 'bg-light-bg text-light-text-primary' : 'bg-[#050505] text-[#E0E0E0]'}`}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <MessageSquare className={`w-12 h-12 animate-pulse mx-auto mb-4 ${isLight ? 'text-purple-600' : 'text-purple-400'}`} />
            <p className={`font-mono ${isLight ? 'text-gray-600' : 'text-gray-500'}`}>{t('support.loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full pb-20 font-sans ${isLight ? 'bg-light-bg text-light-text-primary' : 'bg-[#050505] text-[#E0E0E0]'}`}>
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className={`absolute inset-0 ${isLight
          ? 'bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-200/40 via-light-bg to-light-bg'
          : 'bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-900/20 via-[#050505] to-[#050505]'}`}
        />
        <div className={`absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full animate-pulse border ${
          isLight ? 'border-purple-300/60 opacity-40' : 'border-purple-500/20 opacity-20'
        }`} style={{ animationDuration: '10s' }} />
        <div className={`absolute top-[20%] left-[-10%] w-[120%] h-[1px] -rotate-12 ${
          isLight ? 'bg-gradient-to-r from-transparent via-purple-400/30 to-transparent' : 'bg-gradient-to-r from-transparent via-purple-500/10 to-transparent'
        }`} />
        <div className={`absolute bottom-[-5%] right-[20%] w-[300px] h-[300px] rounded-full blur-3xl ${
          isLight ? 'bg-purple-300/20' : 'bg-purple-900/10'
        }`} />
        <div className={`absolute top-[40%] left-[-5%] w-[200px] h-[200px] rounded-full blur-2xl ${
          isLight ? 'bg-pink-200/20' : 'bg-pink-900/10'
        }`} />
      </div>

      <div className="relative z-10 w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 pt-16 sm:pt-20 lg:pt-24 flex flex-col gap-8 sm:gap-10 lg:gap-12 xl:gap-16">
        {/* Hero Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-2 flex flex-col justify-center">
            <div className={`inline-flex items-center gap-3 px-3 py-1 mb-6 lg:mb-8 rounded-sm w-fit backdrop-blur-sm border ${
              isLight ? 'border-purple-200 bg-purple-100/50' : 'border-purple-500/20 bg-purple-500/10'
            }`}>
              <Headphones className={`w-3.5 h-3.5 ${isLight ? 'text-purple-600' : 'text-purple-400'}`} />
              <span className={`text-[10px] font-mono font-bold uppercase tracking-[0.2em] ${isLight ? 'text-purple-700' : 'text-purple-400'}`}>
                {t('support.badge', 'Live Support')}
              </span>
            </div>

            <h1 className={`font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl leading-[0.9] mb-3 sm:mb-4 lg:mb-6 tracking-tight ${
              isLight ? 'text-gray-900' : 'text-white'
            }`}>
              {t('support.title', 'Support')}<br />
              <span className={`italic font-serif ${isLight ? 'text-purple-600' : 'text-purple-400'}`}>Center.</span>
            </h1>

            <p className={`text-sm sm:text-base lg:text-lg font-mono max-w-xl leading-relaxed pl-3 sm:pl-4 lg:pl-6 border-l ${
              isLight ? 'text-gray-600 border-purple-300' : 'text-gray-400 border-purple-500/20'
            }`}>
              {t('support.subtitle', 'Get instant help from our support team.')}<br />
              <span className="flex items-center gap-2 mt-1">
                <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${isLight ? 'bg-emerald-600' : 'bg-emerald-400'}`}></div>
                {t('support.subtitle2', 'Available 24/7 to assist you.')}
              </span>
            </p>
          </div>

          <div className="hidden lg:block" />
        </div>

        {/* Chat Container */}
        <div className={`backdrop-blur-xl rounded-sm flex flex-col overflow-hidden border min-h-[600px] ${
          isLight
            ? 'bg-white/80 border-gray-200 shadow-lg'
            : 'bg-[#0A0A0A]/60 border-white/10'
        }`}>
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {!chat || chat.messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-20">
                <div className={`w-16 h-16 mb-4 flex items-center justify-center rounded-full ${
                  isLight ? 'bg-purple-100' : 'bg-purple-950/30'
                }`}>
                  <MessageSquare className={`w-8 h-8 ${isLight ? 'text-purple-600' : 'text-purple-400'}`} />
                </div>
                <p className={`text-lg font-bold mb-2 ${isLight ? 'text-gray-900' : 'text-white'}`}>
                  {t('support.emptyChat.title')}
                </p>
                <p className={`text-sm font-mono max-w-md ${isLight ? 'text-gray-600' : 'text-gray-500'}`}>
                  {t('support.emptyChat.subtitle')}
                </p>
              </div>
            ) : (
              <>
                {chat.messages.map((msg, index) => {
                  const isUser = !msg.is_from_admin;
                  return (
                    <div key={msg.id}>
                      <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                        <div className={`flex gap-3 max-w-[70%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                          {!isUser && (
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                              isLight ? 'bg-purple-600' : 'bg-purple-600'
                            }`}>
                              <Shield className="w-5 h-5 text-white" />
                            </div>
                          )}
                          <div>
                            <div className={`rounded-sm px-4 py-3 ${
                              isUser
                                ? isLight
                                  ? 'bg-purple-600 text-white'
                                  : 'bg-purple-600 text-white'
                                : isLight
                                  ? 'bg-gray-100 border border-gray-200'
                                  : 'bg-white/5 border border-white/10'
                            }`}>
                              {!isUser && (
                                <p className={`text-xs font-mono uppercase tracking-wider mb-1 font-bold ${
                                  isLight ? 'text-purple-600' : 'text-purple-400'
                                }`}>
                                  {t('support.chat.supportTeam')}
                                </p>
                              )}
                              <p className={`text-sm font-mono ${
                                isUser ? 'text-white' : isLight ? 'text-gray-900' : 'text-white'
                              }`}>
                                {msg.message}
                              </p>
                              {msg.attachment_url && (
                                isImageUrl(msg.attachment_url) ? (
                                  <a href={msg.attachment_url} target="_blank" rel="noopener noreferrer">
                                    <img src={msg.attachment_url} alt="Attachment" className="mt-2 rounded-sm max-w-xs" />
                                  </a>
                                ) : (
                                  <a
                                    href={msg.attachment_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`mt-2 block text-xs font-mono underline ${
                                      isUser ? 'text-white' : isLight ? 'text-purple-600' : 'text-purple-400'
                                    }`}
                                  >
                                    Attachment
                                  </a>
                                )
                              )}
                            </div>
                            <div className={`flex items-center gap-1 mt-1 px-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
                              <Clock className={`w-3 h-3 ${isLight ? 'text-gray-400' : 'text-gray-600'}`} />
                              <p className={`text-xs font-mono ${isLight ? 'text-gray-600' : 'text-gray-500'}`}>
                                {formatTime(msg.created_at)}
                              </p>
                              {isUser && (
                                <CheckCheck className={`w-3 h-3 ${isLight ? 'text-purple-600' : 'text-purple-400'}`} />
                              )}
                            </div>
                          </div>
                          {isUser && (
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                              isLight ? 'bg-emerald-600' : 'bg-emerald-600'
                            }`}>
                              <span className="text-white font-bold text-sm">
                                {user?.email?.charAt(0).toUpperCase()}
                              </span>
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

          {/* Input Area */}
          <div className={`border-t p-4 ${
            isLight ? 'border-gray-200 bg-gray-50/50' : 'border-white/10 bg-[#0A0A0A]/50'
          }`}>
            {attachment && (
              <div className={`mb-3 flex items-center gap-2 p-3 rounded-sm border ${
                isLight ? 'bg-gray-100 border-gray-200' : 'bg-white/5 border-white/10'
              }`}>
                <Paperclip className={`w-4 h-4 ${isLight ? 'text-purple-600' : 'text-purple-400'}`} />
                <span className={`text-sm font-mono flex-1 ${isLight ? 'text-gray-900' : 'text-white'}`}>
                  {attachment.name}
                </span>
                <button
                  onClick={() => setAttachment(null)}
                  className={`p-1 rounded-sm transition-colors ${
                    isLight ? 'hover:bg-gray-200' : 'hover:bg-white/10'
                  }`}
                >
                  <X className={`w-4 h-4 ${isLight ? 'text-gray-600' : 'text-gray-400'}`} />
                </button>
              </div>
            )}
            <form onSubmit={handleSendMessage} className="flex items-center gap-3">
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => setAttachment(e.target.files?.[0] || null)}
                className="hidden"
                accept="image/*,.pdf,.doc,.docx"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`p-3 rounded-sm transition-colors flex-shrink-0 border ${
                  isLight
                    ? 'bg-gray-100 border-gray-200 hover:bg-gray-200'
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
                title={t('support.input.attachTitle')}
              >
                <Paperclip className={`w-5 h-5 ${isLight ? 'text-gray-600' : 'text-gray-400'}`} />
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
                className={`flex-1 border rounded-sm text-sm px-4 py-3 font-mono transition-all resize-none min-h-[52px] max-h-32 ${
                  isLight
                    ? 'bg-white border-gray-200 text-gray-900 focus:border-purple-500'
                    : 'bg-white/5 border-white/10 text-white focus:border-purple-500'
                } focus:outline-none focus:ring-1 focus:ring-purple-500`}
                rows={1}
                disabled={sending}
              />
              <button
                type="submit"
                disabled={sending || (!message.trim() && !attachment)}
                className={`px-5 py-3 font-mono uppercase tracking-wider text-xs font-bold rounded-sm transition-all flex items-center justify-center gap-2 flex-shrink-0 border disabled:opacity-50 disabled:cursor-not-allowed ${
                  isLight
                    ? 'bg-purple-600 text-white border-purple-700 hover:bg-purple-700'
                    : 'bg-purple-600 text-white border-purple-700 hover:bg-purple-700'
                }`}
              >
                {sending ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </form>
            <p className={`text-xs font-mono mt-3 text-center ${isLight ? 'text-gray-600' : 'text-gray-500'}`}>
              {t('support.input.footer')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}