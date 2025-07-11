import React, { useState } from 'react';
import { chatAPI, authAPI } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { useChatContext } from '../contexts/ChatContext';

interface NewGroupModalProps {
  open: boolean;
  onClose: () => void;
  onGroupCreated: (chatId: string) => void;
}

const NewGroupModal: React.FC<NewGroupModalProps> = ({ open, onClose, onGroupCreated }) => {
  const { user } = useAuth();
  const [groupName, setGroupName] = useState('');
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<any[]>([]);
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
      // Exclude self and already selected
      setResults(users.filter((u: any) => u._id !== user?._id && !selectedUsers.some((sel: any) => sel._id === u._id)));
    } catch (err: any) {
      setError('Search failed');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUser = (u: any) => {
    setSelectedUsers(prev => [...prev, u]);
    setResults(results.filter((user) => user._id !== u._id));
  };

  const handleRemoveUser = (u: any) => {
    setSelectedUsers(prev => prev.filter((user) => user._id !== u._id));
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedUsers.length === 0) {
      setError('Group name and at least one member required');
      return;
    }
    setCreating(true);
    setError('');
    setInfo('');
    try {
      const groupData = {
        groupName: groupName.trim(),
        userIds: selectedUsers.map(u => u._id),
      };
      const chat = await chatAPI.createGroup(groupData);
      addOrUpdateChat(chat); // <-- update chat list immediately
      onGroupCreated(chat._id);
      onClose();
    } catch (err: any) {
      setError('Failed to create group');
    } finally {
      setCreating(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-gray-900 rounded-2xl shadow-2xl p-6 w-full max-w-md relative">
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-white text-xl">&times;</button>
        <h2 className="text-xl font-bold text-white mb-4 text-center">Create New Group</h2>
        <input
          type="text"
          value={groupName}
          onChange={e => setGroupName(e.target.value)}
          className="w-full px-4 py-2 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
          placeholder="Group name..."
        />
        <input
          type="text"
          value={search}
          onChange={handleSearch}
          className="w-full px-4 py-2 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
          placeholder="Search users to add..."
        />
        {loading && <div className="text-gray-400 text-center mb-2">Searching...</div>}
        {error && <div className="text-red-400 text-center mb-2">{error}</div>}
        {info && <div className="text-blue-400 text-center mb-2">{info}</div>}
        <div className="flex flex-wrap gap-2 mb-2">
          {selectedUsers.map(u => (
            <span key={u._id} className="bg-blue-600 text-white px-3 py-1 rounded-full flex items-center">
              {u.username}
              <button className="ml-2 text-xs" onClick={() => handleRemoveUser(u)}>&times;</button>
            </span>
          ))}
        </div>
        <div className="max-h-32 overflow-y-auto mb-4">
          {results.map(u => (
            <div
              key={u._id}
              className="flex items-center space-x-3 p-2 rounded-lg cursor-pointer hover:bg-gray-800 transition mb-1"
              onClick={() => handleSelectUser(u)}
            >
              <div className="w-8 h-8 bg-gradient-to-br from-gray-700 to-gray-800 rounded-full flex items-center justify-center text-base font-bold">
                {u.username?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-white truncate">{u.username}</div>
                <div className="text-xs text-gray-400 truncate">{u.email}</div>
              </div>
              <button
                className="bg-blue-500 text-white px-2 py-1 rounded-lg text-xs font-semibold hover:bg-blue-600 transition"
                disabled={creating}
              >
                Add
              </button>
            </div>
          ))}
        </div>
        <button
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 rounded-lg transition disabled:opacity-60"
          onClick={handleCreateGroup}
          disabled={creating}
        >
          {creating ? 'Creating...' : 'Create Group'}
        </button>
      </div>
    </div>
  );
};

export default NewGroupModal; 