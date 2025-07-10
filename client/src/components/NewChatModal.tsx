import React, { useState } from 'react';
import { authAPI, chatAPI } from '../utils/api';

interface NewChatModalProps {
  open: boolean;
  onClose: () => void;
  onChatCreated: (chatId: string) => void;
}

const NewChatModal: React.FC<NewChatModalProps> = ({ open, onClose, onChatCreated }) => {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    if (e.target.value.trim().length === 0) {
      setResults([]);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const users = await authAPI.searchUsers(e.target.value);
      setResults(users);
    } catch (err: any) {
      setError('Search failed');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChat = async (userId: string) => {
    setCreating(true);
    setError('');
    setInfo('');
    try {
      const chat = await chatAPI.createChat(userId);
      onChatCreated(chat._id);
      onClose();
    } catch (err: any) {
      // Try to handle "chat already exists" scenario
      const data = err?.response?.data;
      if (data && (data.chat || data.chatId)) {
        setInfo('Chat already exists, opening chat...');
        onChatCreated(data.chat?._id || data.chatId);
        setTimeout(onClose, 800);
      } else if (data && data.message) {
        setError(data.message);
      } else {
        setError('Failed to create chat');
      }
    } finally {
      setCreating(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-gray-900 rounded-2xl shadow-2xl p-6 w-full max-w-md relative">
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-white text-xl">&times;</button>
        <h2 className="text-xl font-bold text-white mb-4 text-center">Start New Chat</h2>
        <input
          type="text"
          value={search}
          onChange={handleSearch}
          className="w-full px-4 py-2 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
          placeholder="Search users by username..."
          autoFocus
        />
        {loading && <div className="text-gray-400 text-center mb-2">Searching...</div>}
        {error && <div className="text-red-400 text-center mb-2">{error}</div>}
        {info && <div className="text-blue-400 text-center mb-2">{info}</div>}
        <div className="max-h-60 overflow-y-auto">
          {results.length === 0 && !loading && search && (
            <div className="text-gray-400 text-center">No users found.</div>
          )}
          {results.map((user) => (
            <div
              key={user._id}
              className="flex items-center space-x-3 p-2 rounded-lg cursor-pointer hover:bg-gray-800 transition mb-1"
              onClick={() => handleCreateChat(user._id)}
            >
              <div className="w-10 h-10 bg-gradient-to-br from-gray-700 to-gray-800 rounded-full flex items-center justify-center text-lg font-bold">
                {user.username?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-white truncate">{user.username}</div>
                <div className="text-xs text-gray-400 truncate">{user.email}</div>
              </div>
              <button
                className="bg-blue-500 text-white px-3 py-1 rounded-lg text-sm font-semibold hover:bg-blue-600 transition"
                disabled={creating}
              >
                {creating ? 'Creating...' : 'Chat'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NewChatModal; 