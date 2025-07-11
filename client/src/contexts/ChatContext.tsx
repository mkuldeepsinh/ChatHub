import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { chatAPI } from '../utils/api';
import { useAuth } from './AuthContext';

interface ChatContextType {
  chats: any[];
  loading: boolean;
  refreshChats: () => Promise<void>;
  addOrUpdateChat: (chat: any) => void;
  unreadChats: Record<string, boolean>;
  markChatAsRead: (chatId: string) => void;
  currentOpenChatId: string | null;
  setCurrentOpenChatId: (id: string | null) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChatContext = () => {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChatContext must be used within ChatProvider');
  return ctx;
};

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadChats, setUnreadChats] = useState<Record<string, boolean>>({});
  const [currentOpenChatId, setCurrentOpenChatId] = useState<string | null>(null);

  const markChatAsRead = (chatId: string) => {
    setUnreadChats((prev) => {
      const copy = { ...prev };
      delete copy[chatId];
      return copy;
    });
  };

  // Fetch and sort chats
  const refreshChats = async () => {
    setLoading(true);
    try {
      let data = await chatAPI.getChats();
      // Sort by latestMessage or updatedAt
      data = data.sort((a: any, b: any) => {
        const aTime = a.latestMessage?.createdAt || a.updatedAt || a.createdAt;
        const bTime = b.latestMessage?.createdAt || b.updatedAt || b.createdAt;
        return new Date(bTime).getTime() - new Date(aTime).getTime();
      });
      setChats(data);
    } catch {
      setChats([]);
    } finally {
      setLoading(false);
    }
  };

  // Add or update a chat in the list
  const addOrUpdateChat = (chat: any) => {
    setChats((prev) => {
      const idx = prev.findIndex((c) => c._id === chat._id);
      let newList;
      if (idx !== -1) {
        newList = [...prev];
        newList[idx] = chat;
      } else {
        newList = [chat, ...prev];
      }
      // Resort after update
      return newList.sort((a: any, b: any) => {
        const aTime = a.latestMessage?.createdAt || a.updatedAt || a.createdAt;
        const bTime = b.latestMessage?.createdAt || b.updatedAt || b.createdAt;
        return new Date(bTime).getTime() - new Date(aTime).getTime();
      });
    });
  };

  useEffect(() => {
    if (user) refreshChats();
  }, [user]);

  return (
    <ChatContext.Provider value={{
      chats,
      loading,
      refreshChats,
      addOrUpdateChat,
      unreadChats,
      markChatAsRead,
      currentOpenChatId,
      setCurrentOpenChatId
    }}>
      {children}
    </ChatContext.Provider>
  );
}; 