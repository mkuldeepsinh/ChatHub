

import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Auth/Login';
import Signup from './components/Auth/Signup';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import { ChatProvider, useChatContext } from './contexts/ChatContext';
import ChatWindow from './components/ChatWindow';
import { SocketProvider } from './contexts/SocketContext';
import { FiArrowLeft } from 'react-icons/fi';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// const mockMessages = [
//   { id: 1, sender: 'Alice', text: 'Hey there! 👋', time: '09:10', isMe: false },
//   { id: 2, sender: 'Me', text: 'Hi Alice! How are you?', time: '09:11', isMe: true },
//   { id: 3, sender: 'Alice', text: 'I am good, thanks! What about you?', time: '09:12', isMe: false },
//   { id: 4, sender: 'Me', text: 'Doing great! Ready for our meeting?', time: '09:13', isMe: true },
//   { id: 5, sender: 'Alice', text: 'Absolutely! See you soon.', time: '09:14', isMe: false },
 
// ];

// Chat Page Component (placeholder for now)
const ChatPage: React.FC<{ onChatCreated: (id: string) => void; selectedChatId: string | null; setSelectedChatId: (id: string) => void; onSelectChat: (id: string) => void }> = ({ onChatCreated, selectedChatId, setSelectedChatId, onSelectChat }) => {
  const { setCurrentOpenChatId, chats } = useChatContext();
  const { user } = useAuth();

  // Handler for selecting a chat
  const handleSelectChat = (id: string) => {
    setSelectedChatId(id);
    setCurrentOpenChatId(id);
    if (onSelectChat) onSelectChat(id);
  };
  React.useEffect(() => {
    setCurrentOpenChatId(selectedChatId);
  }, [selectedChatId, setCurrentOpenChatId]);

  // Find the selected chat and receiver/group name
  const selectedChat = chats.find((c) => c._id === selectedChatId);
  let displayName = '';
  if (selectedChat) {
    if (selectedChat.isGroup) {
      displayName = selectedChat.groupName;
    } else if (Array.isArray(selectedChat.users)) {
      const receiver = selectedChat.users.find((u: any) => u._id !== user?._id);
      displayName = receiver?.username || 'Unknown User';
    }
  }

  // Sidebar with click handler for mobile
  const sidebar = (
    <div className="h-full">
      <Sidebar onSelectChat={handleSelectChat} selectedChatId={selectedChatId} />
    </div>
  );

  // Chat interface with back button for mobile
  const chatInterface = selectedChatId ? (
    <div className="flex flex-col flex-1 h-full">
      <div className="flex-1 flex">
        <ChatWindow chatId={selectedChatId} onBack={() => setSelectedChatId("")} />
      </div>
    </div>
  ) : null;

  return (
    <div className="flex h-full bg-gray-900 overflow-hidden">
      {/* Sidebar: show on md+ or when no chat is selected */}
      <div className={`h-full w-full md:w-72 ${selectedChatId ? 'hidden' : 'block'} md:block`}>
        {sidebar}
      </div>
      {/* Chat: show on md+ or when a chat is selected */}
      <div className={`flex-1 h-full ${!selectedChatId ? 'hidden' : 'flex'} md:flex`}>
        {chatInterface}
      </div>
    </div>
  );
};

const AppRoutes = () => {
  const location = useLocation();
  const hideNavbar = location.pathname === '/login' || location.pathname === '/signup';
  const [selectedChatId, setSelectedChatId] = React.useState<string | null>(null);
  const handleChatCreated = (chatId: string) => setSelectedChatId(chatId);
  const handleSelectChat = (chatId: string) => setSelectedChatId(chatId);
  return (
    <ChatProvider>
      <SocketProvider>
        {!hideNavbar && <Navbar onChatCreated={handleChatCreated} onSelectChat={handleSelectChat} />}
        <div className="flex-1 bg-gray-50 overflow-hidden">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route 
              path="/chat" 
              element={
                <ProtectedRoute>
                  <ChatPage onChatCreated={handleChatCreated} selectedChatId={selectedChatId} setSelectedChatId={setSelectedChatId} onSelectChat={handleSelectChat} />
                </ProtectedRoute>
              } 
            />
            <Route path="/" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
      </SocketProvider>
    </ChatProvider>
  );
};

function App() {
  return (
    <div className="h-screen flex flex-col">
      <AuthProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AuthProvider>
    </div>
  );
}

export default App;
