import React, { useState } from 'react';
import { FiSearch, FiUser, FiPlus, FiUsers } from 'react-icons/fi';
import NewChatModal from './NewChatModal';
import NewGroupModal from './NewGroupModal';
import { useChatContext } from '../contexts/ChatContext';
import { useAuth } from '../contexts/AuthContext';

interface NavbarProps {
  onChatCreated: (chatId: string) => void;
  onSelectChat: (chatId: string) => void;
}

const Navbar: React.FC<NavbarProps> = ({ onChatCreated, onSelectChat }) => {
  const { chats } = useChatContext();
  const { user } = useAuth();
  const [showNewChat, setShowNewChat] = useState(false);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const filteredChats = searchQuery.trim()
    ? chats.filter(chat => {
        if (chat.isGroup) {
          return chat.groupName?.toLowerCase().includes(searchQuery.toLowerCase());
        } else {
          // Find the other user in the chat
          const receiver = chat.users.find((u: any) => u._id !== user?._id);
          return receiver?.username?.toLowerCase().includes(searchQuery.toLowerCase());
        }
      })
    : [];

  return (
    <>
      <nav className="w-full bg-gray-900 text-white shadow-2xl  transition-all duration-300 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-20">
          {/* Left: Logo */}
          <div className="flex items-center space-x-2">
            <span className="text-2xl font-bold tracking-tight">💬</span>
            <span className="hidden md:inline text-2xl font-bold tracking-tight">ChatHub</span>
          </div>
          {/* Center: Search */}
          <div className="flex-1 flex justify-center mx-4">
            <div className="relative w-full max-w-xs">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <FiSearch size={18} />
              </span>
              <input
                type="text"
                placeholder="Search chats"
                className="w-full pl-10 pr-3 py-2 rounded-full bg-gray-900 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white transition"
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  setShowResults(true);
                }}
                onFocus={() => setShowResults(true)}
                onBlur={() => setTimeout(() => setShowResults(false), 200)}
              />
              {showResults && filteredChats.length > 0 && (
                <div className="absolute left-0 right-0 mt-2 bg-gray-800 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                  {filteredChats.map(chat => {
                    const receiver = !chat.isGroup
                      ? chat.users.find((u: any) => u._id !== user?._id)
                      : null;
                    return (
                      <div
                        key={chat._id}
                        className="flex items-center px-4 py-2 cursor-pointer hover:bg-gray-700 transition"
                        onClick={() => {
                          onSelectChat(chat._id);
                          setShowResults(false);
                          setSearchQuery('');
                        }}
                      >
                        <div className="w-8 h-8 bg-gradient-to-br from-gray-700 to-gray-800 rounded-full flex items-center justify-center text-base font-bold mr-3">
                          {chat.isGroup
                            ? (chat.groupName?.[0]?.toUpperCase() || 'G')
                            : (receiver?.username?.[0]?.toUpperCase() || 'U')}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-white truncate">
                            {chat.isGroup ? chat.groupName : receiver?.username}
                          </div>
                          <div className="text-xs text-gray-400 truncate">
                            {chat.latestMessage?.content || ''}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          {/* Right: Actions */}
          <div className="flex items-center space-x-2 md:space-x-4">
            <button
              className="flex items-center space-x-2 bg-white text-black rounded-xl py-2 px-3 md:px-4 hover:bg-gray-200 transition font-medium shadow"
              onClick={() => setShowNewChat(true)}
            >
              <FiPlus size={20} />
              <span className="hidden md:inline">New Chat</span>
            </button>
            <button className="flex items-center space-x-2 bg-gray-800 text-white rounded-xl py-2 px-3 md:px-4 hover:bg-gray-700 transition font-medium shadow"
              onClick={() => setShowNewGroup(true)}
            >
              <FiUsers size={20} />
              <span className="hidden md:inline">New Group</span>
            </button>
            <div className="flex items-center space-x-2 cursor-pointer hover:bg-gray-900 rounded-xl px-3 py-2 transition">
              <div className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center font-bold text-lg">
                <FiUser size={24} />
              </div>
              <div className="hidden md:block">
                <div className="font-semibold">Username</div>
                <div className="text-xs text-gray-400">Profile</div>
              </div>
            </div>
          </div>
        </div>
      </nav>
      <NewChatModal
        open={showNewChat}
        onClose={() => setShowNewChat(false)}
        onChatCreated={onChatCreated || (() => {})}
      />
      <NewGroupModal
        open={showNewGroup}
        onClose={() => setShowNewGroup(false)}
        onGroupCreated={onSelectChat}
      />
    </>
  );
};

export default Navbar; 