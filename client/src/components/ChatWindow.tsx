import React, { useEffect, useState, useRef } from 'react';
import { chatAPI } from '../utils/api';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';
import { FiSend, FiPaperclip } from 'react-icons/fi';

interface ChatWindowProps {
  chatId: string;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ chatId }) => {
  const { user } = useAuth();
  const socket = useSocket();
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch previous messages and join chat room
  useEffect(() => {
    let isMounted = true;
    chatAPI.getChatMessages(chatId).then((msgs) => {
      if (isMounted) setMessages(msgs);
    });

    if (socket) {
      socket.emit('join_chat', chatId);

      const handleNewMessage = (msg: any) => {
        if (msg.chat && (msg.chat._id === chatId || msg.chat === chatId)) {
          setMessages((prev) => [...prev, msg]);
        }
      };
      socket.on('new_message', handleNewMessage);

      return () => {
        socket.emit('leave_chat', chatId);
        socket.off('new_message', handleNewMessage);
        isMounted = false;
      };
    }
  }, [chatId, socket]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !socket) return;
    socket.emit('send_message', {
      chatId,
      content: input,
      messageType: 'text'
    });
    setInput('');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-800 overflow-hidden rounded-2xl">
      <div className="flex-1 overflow-y-auto space-y-4 m-2">
        {messages.map((msg) => (
          <div
            key={msg._id}
            className={`flex ${msg.sender?._id === user?._id ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs md:max-w-md px-4 py-2 rounded-2xl shadow text-sm ${
                msg.sender?._id === user?._id
                  ? 'bg-blue-500 text-white rounded-br-none'
                  : 'bg-gray-700 text-gray-100 rounded-bl-none'
              }`}
            >
              <div>{msg.content}</div>
              <div className="text-xs text-gray-300 mt-1 text-right">
                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSend} className="bg-gray-900 flex items-center space-x-2 px-2 py-2 rounded-b-2xl">
        <button className="p-2 rounded-full hover:bg-gray-800 transition" type="button" disabled>
          <FiPaperclip size={22} className="text-gray-400" />
        </button>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 px-4 py-2 rounded-full bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
        />
        <button className="p-2 rounded-full bg-blue-500 hover:bg-blue-600 transition flex items-center justify-center" type="submit">
          <FiSend size={22} className="text-white" />
        </button>
      </form>
    </div>
  );
};

export default ChatWindow; 