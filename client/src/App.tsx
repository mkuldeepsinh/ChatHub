

import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Auth/Login';
import Signup from './components/Auth/Signup';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import { FiSend, FiPaperclip, FiArrowLeft } from 'react-icons/fi';
import { ChatProvider } from './contexts/ChatContext';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const mockMessages = [
  { id: 1, sender: 'Alice', text: 'Hey there! 👋', time: '09:10', isMe: false },
  { id: 2, sender: 'Me', text: 'Hi Alice! How are you?', time: '09:11', isMe: true },
  { id: 3, sender: 'Alice', text: 'I am good, thanks! What about you?', time: '09:12', isMe: false },
  { id: 4, sender: 'Me', text: 'Doing great! Ready for our meeting?', time: '09:13', isMe: true },
  { id: 5, sender: 'Alice', text: 'Absolutely! See you soon.', time: '09:14', isMe: false },
 
];

// Chat Page Component (placeholder for now)
const ChatPage: React.FC = () => {
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

  // Handler for selecting a chat (mock)
  const handleSelectChat = (id: string) => setSelectedChatId(id);
  const handleBack = () => setSelectedChatId(null);

  // Sidebar with click handler for mobile
  const sidebar = (
    <div className="h-full">
      <Sidebar onSelectChat={handleSelectChat} selectedChatId={selectedChatId} />
    </div>
  );

  // Chat interface with back button for mobile
  const chatInterface = (
    <div className="flex-1 flex flex-col h-[calc(100vh-5rem)] bg-gray-800 overflow-hidden rounded-2xl">
      {/* Back button for mobile */}
      <div className="md:hidden flex items-center p-3 bg-gray-900">
        <button onClick={handleBack} className="mr-2 p-2 rounded-full hover:bg-gray-800 transition">
          <FiArrowLeft size={22} className="text-white" />
        </button>
        <span className="text-white font-semibold">Chat</span>
      </div>
      {/* Info banner */}
      <div className="w-full flex justify-center pt-4 pb-2">
        <div className="bg-gray-700 text-gray-200 text-xs px-4 py-1 rounded-full shadow-sm">
          YOU CAN CHAT NOW ON <span className="font-bold text-white">ChatHub</span>
        </div>
      </div>
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto space-y-4 m-2">
        {mockMessages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs md:max-w-md px-4 py-2 rounded-2xl shadow text-sm ${
                msg.isMe
                  ? 'bg-blue-500 text-white rounded-br-none'
                  : 'bg-gray-700 text-gray-100 rounded-bl-none'
              }`}
            >
              <div>{msg.text}</div>
              <div className="text-xs text-gray-300 mt-1 text-right">{msg.time}</div>
            </div>
          </div>
        ))}
      </div>
      {/* Input area */}
      <div className="bg-gray-900 flex items-center space-x-2 px-2 py-2 rounded-b-2xl">
        <button className="p-2 rounded-full hover:bg-gray-800 transition" disabled>
          <FiPaperclip size={22} className="text-gray-400" />
        </button>
        <input
          type="text"
          placeholder="Type your message..."
          className="flex-1 px-4 py-2 rounded-full bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          disabled
        />
        <button className="p-2 rounded-full bg-blue-500 hover:bg-blue-600 transition flex items-center justify-center" disabled>
          <FiSend size={22} className="text-white" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen h-screen bg-gray-900 overflow-hidden">
      <Navbar />
      <div className="flex h-full">
        {/* Sidebar: always visible on md+, only if no chat selected on mobile */}
        <div className={`h-full w-full md:w-72 ${selectedChatId !== null ? 'hidden' : 'block'} md:block`}>{sidebar}</div>
        {/* Chat: always visible on md+, only if chat selected on mobile */}
        <div className={`flex-1 h-full ${selectedChatId === null ? 'hidden' : 'flex'} md:flex`}>{chatInterface}</div>
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <ChatProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route 
                path="/chat" 
                element={
                  <ProtectedRoute>
                    <ChatPage />
                  </ProtectedRoute>
                } 
              />
              <Route path="/" element={<Navigate to="/login" replace />} />
            </Routes>
          </div>
        </Router>
      </ChatProvider>
    </AuthProvider>
  );
}

export default App;
