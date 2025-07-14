import React, { useState } from 'react';
import { authAPI, chatAPI } from '../utils/api';
import { useChatContext } from '../contexts/ChatContext';
import LoadingSpinner from './LoadingSpinner';
import { Button } from './ui/button';

interface NewChatModalProps {
  open: boolean;
  onClose: () => void;
  onChatCreated: (chatId: string) => void;
  navbarHeight?: number;
}

const NewChatModal: React.FC<NewChatModalProps> = ({ open, onClose, onChatCreated, navbarHeight = 80 }) => {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const { addOrUpdateChat } = useChatContext();

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
      const response = await chatAPI.createChat(userId);
      const chat = response.chat || response; // Use the chat object, not the whole response
      addOrUpdateChat(chat);
      onChatCreated(chat._id);
      onClose();
    } catch (err: any) {
      // Try to handle "chat already exists" scenario
      const data = err?.response?.data;
      if (data && (data.chat || data.chatId)) {
        setInfo('Chat already exists, opening chat...');
        if (data.chat) addOrUpdateChat(data.chat); // update if chat object is present
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
    <>
      {/* Blurred overlay */}
      <div className="fixed inset-0 z-40 bg-transparent backdrop-blur-sm transition-all duration-300" onClick={onClose} />
      {/* Modal below navbar, full width, fixed */}
      <div
        className="bg-[var(--card)] rounded-2xl shadow-2xl p-6 w-full max-w-md border border-[var(--border)] mx-auto z-50"
        style={{ position: 'fixed', top: navbarHeight, left: 0, right: 0 }}
      >
        <Button onClick={onClose} variant="ghost" className="absolute top-3 right-3 text-muted-foreground text-xl p-0 h-auto w-auto min-w-0 min-h-0">&times;</Button>
        <h2 className="text-xl font-bold text-[var(--card-foreground)] mb-4 text-center">Start New Chat</h2>
        <input
          type="text"
          value={search}
          onChange={handleSearch}
          className="w-full px-4 py-2 rounded-lg bg-[var(--muted)] text-[var(--muted-foreground)] placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary mb-4"
          placeholder="Search users by username..."
          autoFocus
        />
        {loading && (
          <div className="text-center mb-2">
            <LoadingSpinner size="sm" text="Searching..." showLogo={false} />
          </div>
        )}
        {error && <div className="text-[var(--destructive)] text-center mb-2">{error}</div>}
        {info && <div className="text-[var(--primary)] text-center mb-2">{info}</div>}
        <div className="max-h-60 overflow-y-auto">
          {results.length === 0 && !loading && search && (
            <div className="text-muted-foreground text-center">No users found.</div>
          )}
          {results.map((user) => (
            <div
              key={user._id}
              className="flex items-center space-x-3 p-2 rounded-lg cursor-pointer hover:bg-[var(--muted)] transition mb-1"
              onClick={() => handleCreateChat(user._id)}
            >
              <div className="w-10 h-10 bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] rounded-full flex items-center justify-center text-lg font-bold text-[var(--primary-foreground)]">
                {user.username?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-[var(--card-foreground)] truncate">{user.username}</div>
                <div className="text-xs text-muted-foreground truncate">{user.email}</div>
              </div>
              <Button
                className="px-3 py-1 text-sm font-semibold"
                disabled={creating}
                variant="secondary"
              >
                {creating ? 'Creating...' : 'Chat'}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default NewChatModal; 