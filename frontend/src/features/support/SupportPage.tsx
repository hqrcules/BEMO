import { useEffect, useState, useRef } from 'react';
import { useAppSelector } from '@/store/hooks';
import { supportService } from '@/services/supportService';
import { SupportChat } from '@/shared/types/support';
import { useTranslation } from 'react-i18next';
import {
  MessageSquare,
  Send,
  Paperclip,
  FileText,
  X,
  Shield,
  Clock,
  CheckCheck,
} from 'lucide-react';

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

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [chat?.messages]);

  const loadMessages = async () => {
    try {
      const data = await supportService.getMessages();
      setChat(data);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

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

      await supportService.sendMessage(formData);
      setMessage('');
      setAttachment(null);
      loadMessages();
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 1) {
      const minutes = Math.floor(diff / (1000 * 60));
      return t('support.time.minutesAgo', { count: minutes });
    } else if (hours < 24) {
      return date.toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString(i18n.language, {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
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
        {/* Messages Area */}
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
                const showDate =
                  index === 0 ||
                  new Date(msg.created_at).toDateString() !== new Date(chat.messages[index - 1].created_at).toDateString();

                return (
                  <div key={msg.id}>
                    {showDate && (
                      <div className="flex items-center justify-center my-6">
                        <div className="px-4 py-2 bg-dark-hover rounded-full">
                          <p className="text-xs text-dark-text-tertiary font-medium">
                            {new Date(msg.created_at).toLocaleDateString(i18n.language, { day: 'numeric', month: 'long', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                    )}
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
                            {msg.attachment_url && msg.attachment_url.match(/\.(jpeg|jpg|gif|png)$/) != null ?
                              (<img src={msg.attachment_url} alt="attachment" className="mt-2 rounded-lg max-w-xs" />) :
                              (msg.attachment_url && <a href={msg.attachment_url} target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline mt-2 block">Attachment</a>)
                            }
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

        {/* Input Area */}
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

      {/* Help Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-4 hover:border-primary-500/50 transition-all cursor-pointer">
          <h4 className="font-semibold text-dark-text-primary mb-2 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-primary-500" />
            {t('support.cards.faq.title')}
          </h4>
          <p className="text-sm text-dark-text-secondary">{t('support.cards.faq.subtitle')}</p>
        </div>
        <div className="glass-card p-4 hover:border-success-500/50 transition-all cursor-pointer">
          <h4 className="font-semibold text-dark-text-primary mb-2 flex items-center gap-2">
            <FileText className="w-4 h-4 text-success-500" />
            {t('support.cards.docs.title')}
          </h4>
          <p className="text-sm text-dark-text-secondary">{t('support.cards.docs.subtitle')}</p>
        </div>
        <div className="glass-card p-4 hover:border-warning-500/50 transition-all cursor-pointer">
          <h4 className="font-semibold text-dark-text-primary mb-2 flex items-center gap-2">
            <Shield className="w-4 h-4 text-warning-500" />
            {t('support.cards.security.title')}
          </h4>
          <p className="text-sm text-dark-text-secondary">{t('support.cards.security.subtitle')}</p>
        </div>
      </div>
    </div>
  );
}