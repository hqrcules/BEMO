import { useEffect, useState, useRef, useCallback } from 'react';
import { adminService } from '@/services/adminService';
import { SupportChat, SupportMessage } from '@/shared/types/support';
import { usePolling } from '@/shared/hooks/usePolling';
import { MessageSquare, Send, Paperclip, Trash2, Clock } from 'lucide-react';

export default function AdminSupportPage() {
  const [chats, setChats] = useState<SupportChat[]>([]);
  const [selectedChat, setSelectedChat] = useState<SupportChat | null>(null);
  const [message, setMessage] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastMessageTimestamps = useRef<Map<string, string>>(new Map());

  // Polling function for selected chat messages
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
                return {
                  ...chat,
                  messages: [...chat.messages, ...newMessages],
                  status: response.chat_status,
                  updated_at: response.last_updated
                };
              }
            }
            return chat;
          })
        );
        
        // Update timestamp for this chat
        const latestMessage = response.messages[response.messages.length - 1];
        if (latestMessage) {
          lastMessageTimestamps.current.set(selectedChat.id, latestMessage.created_at);
        }
      }
    } catch (error) {
      console.error('Error polling chat messages:', error);
    }
  }, [selectedChat]);

  // Enable polling only when chat is selected
  usePolling(pollSelectedChatMessages, {
    interval: 3000,
    enabled: !!selectedChat && !loading
  });

  // Initial load
  useEffect(() => {
    loadChats();
  }, []);

  // Update selected chat when chats change and scroll to bottom
  useEffect(() => {
    if (selectedChat) {
      const updatedSelectedChat = chats.find(c => c.id === selectedChat.id);
      if (updatedSelectedChat) {
        setSelectedChat(updatedSelectedChat);
      }
    }
    scrollToBottom();
  }, [chats, selectedChat?.id]);

  // Set initial timestamp when selecting a chat
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
      
      // Initialize timestamps for all chats
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
    if (window.confirm('Вы уверены, что хотите удалить этот чат?')) {
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
    if (attachment) {
      formData.append('attachment', attachment);
    }

    try {
      const updatedChat = await adminService.sendAdminSupportMessage(selectedChat.id, formData);
      
      // Update the chat in the list
      setChats(prevChats => 
        prevChats.map(chat => 
          chat.id === selectedChat.id ? updatedChat : chat
        )
      );
      
      // Update timestamp after sending message
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

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return <div>Loading chats...</div>;
  }

  return (
    <div className="flex h-[calc(100vh-120px)] text-white">
      <div className="w-1/3 border-r border-gray-700 overflow-y-auto">
        {chats.map(chat => (
          <div
            key={chat.id}
            className={`p-4 cursor-pointer hover:bg-gray-700 flex justify-between items-center ${
              selectedChat?.id === chat.id ? 'bg-gray-700' : ''
            }`}
            onClick={() => setSelectedChat(chat)}
          >
            <div>
                <p className="font-bold">{chat.user_email}</p>
                <p className="text-sm text-gray-400">{chat.subject || 'No Subject'}</p>
                <p className="text-xs text-gray-500">
                  {chat.messages.length} messages • {chat.status}
                </p>
            </div>
            <button 
              onClick={(e) => { 
                e.stopPropagation(); 
                handleDeleteChat(chat.id); 
              }} 
              className="text-red-500 hover:text-red-400"
            >
                <Trash2 size={20} />
            </button>
          </div>
        ))}
      </div>
      
      <div className="w-2/3 flex flex-col">
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-700 bg-gray-800">
              <h3 className="font-bold text-lg">{selectedChat.user_email}</h3>
              <p className="text-sm text-gray-400">
                Status: {selectedChat.status} • Messages: {selectedChat.messages.length}
              </p>
            </div>
            
            {/* Messages */}
            <div className="flex-1 p-4 overflow-y-auto">
              {selectedChat.messages.map(msg => (
                <div key={msg.id} className={`mb-4 flex flex-col ${
                  msg.is_from_admin ? 'items-end' : 'items-start'
                }`}>
                  <div className={`rounded-lg p-3 max-w-lg ${
                    msg.is_from_admin ? 'bg-blue-600 text-white' : 'bg-gray-700'
                  }`}>
                    <p className="font-bold text-sm">{msg.sender_name || msg.user_email}</p>
                    <p>{msg.message}</p>
                    {msg.attachment_url && (
                      <a 
                        href={msg.attachment_url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-cyan-400 underline mt-2 block"
                      >
                        Attachment
                      </a>
                    )}
                  </div>
                   <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                      <Clock className="w-3 h-3" />
                      <span>{formatTime(msg.created_at)}</span>
                    </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            
            {/* Message Input */}
            <div className="p-4 border-t border-gray-700">
                <div className="flex items-center">
                    <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="flex-1 p-2 bg-gray-800 rounded-l-lg outline-none"
                        placeholder="Type a message..."
                        onKeyDown={(e) => { if (e.key === 'Enter') handleSendMessage() }}
                    />
                     <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={(e) => setAttachment(e.target.files?.[0] || null)} 
                        className="hidden" 
                    />
                    <button 
                        onClick={() => fileInputRef.current?.click()} 
                        className="p-3 bg-gray-800 hover:bg-gray-700"
                    >
                        <Paperclip size={20} />
                    </button>
                    <button
                        onClick={handleSendMessage}
                        className="p-3 bg-blue-600 rounded-r-lg hover:bg-blue-700"
                        disabled={!message.trim() && !attachment}
                    >
                        <Send size={20}/>
                    </button>
                </div>
                {attachment && (
                    <div className="flex items-center gap-2 mt-2">
                        <p className="text-xs text-gray-400">Selected file: {attachment.name}</p>
                        <button 
                            onClick={() => setAttachment(null)}
                            className="text-xs text-red-400 hover:text-red-300"
                        >
                            Remove
                        </button>
                    </div>
                )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <MessageSquare size={48} />
            <p className="ml-4">Select a chat to view messages</p>
          </div>
        )}
      </div>
    </div>
  );
}