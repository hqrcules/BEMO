import { useEffect, useState, useRef } from 'react';
import { adminService } from '@/services/adminService';
import { SupportChat } from '@/shared/types/support';
import { MessageSquare, Send, Paperclip, Trash2 } from 'lucide-react';

export default function AdminSupportPage() {
  const [chats, setChats] = useState<SupportChat[]>([]);
  const [selectedChat, setSelectedChat] = useState<SupportChat | null>(null);
  const [message, setMessage] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadChats();
  }, []);

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
      const updatedChat = await adminService.sendAdminSupportMessage(selectedChat.id, formData);
      setSelectedChat(updatedChat);
      setMessage('');
      setAttachment(null);
      if(fileInputRef.current) fileInputRef.current.value = '';
      const newChats = chats.map(chat => chat.id === updatedChat.id ? updatedChat : chat);
      setChats(newChats);
    } catch (error) {
      console.error("Failed to send message", error);
    }
  };

  if (loading) {
    return <div>Loading chats...</div>;
  }

  return (
    <div className="flex h-[calc(100vh-120px)] text-white">
      {/* Chat List */}
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

      {/* Message View */}
      <div className="w-2/3 flex flex-col">
        {selectedChat ? (
          <>
            <div className="flex-1 p-4 overflow-y-auto">
              {selectedChat.messages.map(msg => (
                <div key={msg.id} className={`mb-4 flex ${msg.is_from_admin ? 'justify-end' : 'justify-start'}`}>
                  <div className={`rounded-lg p-3 max-w-lg ${msg.is_from_admin ? 'bg-blue-600 text-white' : 'bg-gray-700'}`}>
                    <p className="font-bold text-sm">{msg.sender_name}</p>
                    <p>{msg.message}</p>
                    {msg.attachment_url && msg.attachment_url.match(/\.(jpeg|jpg|gif|png)$/) != null ?
                      (<img src={msg.attachment_url} alt="attachment" className="mt-2 rounded-lg max-w-xs" />) :
                      (msg.attachment_url && <a href={msg.attachment_url} target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline mt-2 block">Attachment</a>)
                    }
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-gray-700">
                <div className="flex items-center">
                    <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="flex-1 p-2 bg-gray-800 rounded-l-lg outline-none"
                        placeholder="Type a message..."
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