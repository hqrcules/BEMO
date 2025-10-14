// frontend/src/components/Chat/ChatProvider.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'admin';
    timestamp: Date;
    isRead: boolean;
}

interface ChatContextType {
    messages: Message[];
    isConnected: boolean;
    sendMessage: (text: string) => void;
    markAsRead: (messageId: string) => void;
    isTyping: boolean;
}

const ChatContext = createContext<ChatContextType | null>(null);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const [isTyping, setIsTyping] = useState(false);

    useEffect(() => {
        const wsUrl = `ws://localhost:8000/ws/support/`;
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            setIsConnected(true);
            console.log('WebSocket connected');
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);

            switch (data.type) {
                case 'new_message':
                    setMessages(prev => [...prev, data.message]);
                    break;
                case 'typing':
                    setIsTyping(data.is_typing);
                    break;
                case 'message_read':
                    setMessages(prev =>
                        prev.map(msg =>
                            msg.id === data.message_id
                                ? { ...msg, isRead: true }
                                : msg
                        )
                    );
                    break;
            }
        };

        ws.onclose = () => {
            setIsConnected(false);
            console.log('WebSocket disconnected');
            // Автоматичне перепідключення
            setTimeout(() => {
                setSocket(new WebSocket(wsUrl));
            }, 3000);
        };

        setSocket(ws);

        return () => {
            ws.close();
        };
    }, []);

    const sendMessage = (text: string) => {
        if (socket && isConnected) {
            socket.send(JSON.stringify({
                type: 'message',
                message: text
            }));
        }
    };

    const markAsRead = (messageId: string) => {
        if (socket && isConnected) {
            socket.send(JSON.stringify({
                type: 'mark_read',
                message_id: messageId
            }));
        }
    };

    return (
        <ChatContext.Provider value={{
            messages,
            isConnected,
            sendMessage,
            markAsRead,
            isTyping
        }}>
            {children}
        </ChatContext.Provider>
    );
};

export const useChat = () => {
    const context = useContext(ChatContext);
    if (!context) {
        throw new Error('useChat must be used within ChatProvider');
    }
    return context;
};
