

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Auth/Login';
import Signup from './components/Auth/Signup';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import { ChatProvider, useChatContext } from './contexts/ChatContext';
import ChatWindow from './components/ChatWindow';
import { SocketProvider } from './contexts/SocketContext';
import LoadingPage from './components/LoadingPage';
import ProtectedRoute from './components/ProtectedRoute';

// Chat Page Component (placeholder for now)
const ChatPage: React.FC<{ onChatCreated: (id: string) => void; selectedChatId: string | null; setSelectedChatId: (id: string) => void; onSelectChat: (id: string) => void }> = ({  selectedChatId, setSelectedChatId, onSelectChat }) => {
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
  ) : (
    <div className="flex flex-1 items-center justify-center h-full bg-[var(--background)]">
      <div className="text-center">
        <div className="text-3xl font-bold text-foreground mb-2">Made with <span className="text-primary">♥</span> by Kuldeepsinh Makwana!</div>
        <div className="text-muted-foreground text-lg">Select a chat to start messaging.</div>
      </div>
    </div>
  );

  return (
    <div className="flex h-full bg-[var(--background)] overflow-hidden">
      {/* Sidebar: show on md+ or when no chat is selected */}
      <div className={`h-full w-full md:w-90 ${selectedChatId ? 'hidden' : 'block'} md:block`}>
        {sidebar}
      </div>
      {/* Chat: show on md+ or when a chat is selected */}
      <div className={`w-full h-screen ${!selectedChatId ? 'hidden' : 'flex'} md:flex md:w-[calc(100vw-22.5rem)]`}>
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
