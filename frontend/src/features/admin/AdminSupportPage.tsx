import { useEffect, useState, useRef } from 'react';
import { adminService } from '@/services/adminService';
import { SupportChat, SupportMessage } from '@/shared/types/support';
import { MessageSquare, Send, Paperclip, Trash2, Clock } from 'lucide-react';

export default function AdminSupportPage() {
  const [chats, setChats] = useState<SupportChat[]>([]);
  const [selectedChat, setSelectedChat] = useState<SupportChat | null>(null);
  const [message, setMessage] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const ws = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadChats();

    const connectWebSocket = () => {
      const wsUrl = `ws://${window.location.host}/ws/support/`;
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => console.log("Admin WebSocket connected");

      ws.current.onmessage = (event) => {
          const data = JSON.parse(event.data);
          if (data.type === 'new_message') {
              const newMessage: SupportMessage = data.message;
              setChats(prevChats =>
                  prevChats.map(chat => {
                      if (chat.id === newMessage.chat) {
                          const messageExists = chat.messages.some(m => m.id === newMessage.id);
                          if (!messageExists) {
                              return { ...chat, messages: [...chat.messages, newMessage] };
                          }
                      }
                      return chat;
                  })
              );
          }
      };

      ws.current.onclose = () => {
          console.log("Admin WebSocket disconnected. Reconnecting...");
          setTimeout(connectWebSocket, 3000);
      };

      ws.current.onerror = (err) => {
          console.error("Admin WebSocket error:", err);
          ws.current?.close();
      };
    };

    connectWebSocket();

    return () => {
        ws.current?.close();
    };
  }, []);

  useEffect(() => {
    if (selectedChat) {
      const updatedSelectedChat = chats.find(c => c.id === selectedChat.id);
      if (updatedSelectedChat) {
        setSelectedChat(updatedSelectedChat);
      }
    }
    scrollToBottom();
  }, [chats, selectedChat]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChats = async () => {
    setLoading(true);
    try {
      const chatData = await adminService.getSupportChats();
      setChats(chatData);
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
      await adminService.sendAdminSupportMessage(selectedChat.id, formData);
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
            className={`p-4 cursor-pointer hover:bg-gray-700 flex justify-between items-center ${selectedChat?.id === chat.id ? 'bg-gray-700' : ''}`}
            onClick={() => setSelectedChat(chat)}
          >
            <div>
                <p className="font-bold">{chat.user_email}</p>
                <p className="text-sm text-gray-400">{chat.subject || 'No Subject'}</p>
            </div>
            <button onClick={(e) => { e.stopPropagation(); handleDeleteChat(chat.id); }} className="text-red-500 hover:text-red-400">
                <Trash2 size={20} />
            </button>
          </div>
        ))}
      </div>
      <div className="w-2/3 flex flex-col">
        {selectedChat ? (
          <>
            <div className="flex-1 p-4 overflow-y-auto">
              {selectedChat.messages.map(msg => (
                <div key={msg.id} className={`mb-4 flex flex-col ${msg.is_from_admin ? 'items-end' : 'items-start'}`}>
                  <div className={`rounded-lg p-3 max-w-lg ${msg.is_from_admin ? 'bg-blue-600 text-white' : 'bg-gray-700'}`}>
                    <p className="font-bold text-sm">{msg.sender_name}</p>
                    <p>{msg.message}</p>
                    {msg.attachment_url && <a href={msg.attachment_url} target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline mt-2 block">Attachment</a>}
                  </div>
                   <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                      <Clock className="w-3 h-3" />
                      <span>{formatTime(msg.created_at)}</span>
                    </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
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
                     <input type="file" ref={fileInputRef} onChange={(e) => setAttachment(e.target.files?.[0] || null)} className="hidden" />
                    <button onClick={() => fileInputRef.current?.click()} className="p-3 bg-gray-800 hover:bg-gray-700">
                        <Paperclip size={20} />
                    </button>
                    <button
                        onClick={handleSendMessage}
                        className="p-3 bg-blue-600 rounded-r-lg hover:bg-blue-700"
                    >
                        <Send size={20}/>
                    </button>
                </div>
                 {attachment && <p className="text-xs mt-2 text-gray-400">Selected file: {attachment.name}</p>}
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