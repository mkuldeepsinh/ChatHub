import React, { useState, useEffect } from 'react';
import { FiSearch, FiUser, FiPlus, FiUsers } from 'react-icons/fi';
import NewChatModal from './NewChatModal';
import NewGroupModal from './NewGroupModal';
import { useChatContext } from '../contexts/ChatContext';
import { useAuth } from '../contexts/AuthContext';
import ProfileSidePanel from './ProfileSidePanel';
import { Button } from "./ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { Sun, Moon } from "lucide-react";

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
  const [showProfile, setShowProfile] = useState(false);
  const [isDark, setIsDark] = useState(
    () => true // Default to dark mode
  );

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  const filteredChats = searchQuery.trim()
    ? chats.filter(chat => {
        if (chat.isGroup) {
          return chat.groupName?.toLowerCase().includes(searchQuery.toLowerCase());
        } else {
          const receiver = chat.users.find((u: any) => u._id !== user?._id);
          return receiver?.username?.toLowerCase().includes(searchQuery.toLowerCase());
        }
      })
    : [];

  return (
    <div className="w-full shadow-2xl transition-all duration-300 z-40 bg-background text-foreground border-b border-b-[var(--border)]">
      <div className="flex items-center w-full h-20 px-2 sm:px-4 lg:px-8 gap-2 sm:gap-4">
        {/* Left: Logo + ChatHub */}
        <img
          src="/logo.png"
          alt="ChatHub Logo"
          className="w-12 h-12 rounded-full border-2 border-primary object-cover mr-2"
        />
        <span className="text-2xl font-bold tracking-tight whitespace-nowrap text-foreground hidden xs:inline sm:inline md:inline lg:inline xl:inline">ChatHub</span>
        {/* Spacer to push search bar to the right */}
        <div className="flex-1" />
        {/* Search bar (responsive width) */}
        <div className="relative w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl flex-shrink">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            <FiSearch size={18} />
          </span>
          <input
            type="text"
            placeholder="Search chats"
            className="w-full pl-10 pr-3 py-2 rounded-full bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition"
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value);
              setShowResults(true);
            }}
            onFocus={() => setShowResults(true)}
            onBlur={() => setTimeout(() => setShowResults(false), 200)}
          />
          {showResults && filteredChats.length > 0 && (
            <div className="absolute left-0 right-0 mt-2 bg-card rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
              {filteredChats.map(chat => {
                const receiver = !chat.isGroup
                  ? chat.users.find((u: any) => u._id !== user?._id)
                  : null;
                return (
                  <div
                    key={chat._id}
                    className="flex items-center px-4 py-2 cursor-pointer hover:bg-muted transition"
                    onClick={() => {
                      onSelectChat(chat._id);
                      setShowResults(false);
                      setSearchQuery('');
                    }}
                  >
                    <Avatar className="w-8 h-8 mr-3">
                      {chat.isGroup ? (
                        chat.groupIcon ? (
                          <AvatarImage src={chat.groupIcon} alt={chat.groupName || 'G'} />
                        ) : (
                          <AvatarFallback>{chat.groupName?.[0]?.toUpperCase() || 'G'}</AvatarFallback>
                        )
                      ) : (
                        receiver?.profilePicture ? (
                          <AvatarImage src={receiver.profilePicture} alt={receiver.username || 'U'} />
                        ) : (
                          <AvatarFallback>{receiver?.username?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
                        )
                      )}
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-foreground truncate">
                        {chat.isGroup ? chat.groupName : receiver?.username}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {chat.latestMessage?.content || ''}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        {/* New Chat Button */}
        <Button variant="secondary" className="flex items-center space-x-2 font-medium shadow whitespace-nowrap px-2 sm:px-4 py-1 sm:py-2" onClick={() => setShowNewChat(true)}>
          <FiPlus size={20} />
          <span className="hidden md:inline">New Chat</span>
        </Button>
        {/* New Group Button */}
        <Button variant="outline" className="flex items-center space-x-2 font-medium shadow whitespace-nowrap px-2 sm:px-4 py-1 sm:py-2" onClick={() => setShowNewGroup(true)}>
          <FiUsers size={20} />
          <span className="hidden md:inline">New Group</span>
        </Button>
        {/* Theme Toggle */}
        <Button
          variant="outline"
          className="ml-1 sm:ml-2 px-2 sm:px-3 py-1 sm:py-2"
          onClick={() => setIsDark((prev) => !prev)}
          aria-label="Toggle theme"
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </Button>
        {/* Profile */}
        <div className="flex items-center space-x-1 sm:space-x-2 cursor-pointer hover:bg-muted rounded-xl px-2 sm:px-3 py-1 sm:py-2 transition" onClick={() => setShowProfile(true)}>
          <Avatar className="w-10 h-10">
            {user?.profilePicture ? (
              <AvatarImage src={user.profilePicture} alt="Profile" />
            ) : (
              <AvatarFallback><FiUser size={24} /></AvatarFallback>
            )}
          </Avatar>
          <div className="hidden md:block">
            <div className="font-semibold text-foreground">{user?.username || 'Username'}</div>
            <div className="text-xs text-muted-foreground">Profile</div>
          </div>
        </div>
      </div>
      {showNewChat && (
        <NewChatModal
          open={showNewChat}
          onClose={() => setShowNewChat(false)}
          onChatCreated={onChatCreated || (() => {})}
          navbarHeight={80}
        />
      )}
      {showNewGroup && (
        <NewGroupModal
          open={showNewGroup}
          onClose={() => setShowNewGroup(false)}
          onGroupCreated={onSelectChat}
          navbarHeight={80}
        />
      )}
      <ProfileSidePanel open={showProfile} onClose={() => setShowProfile(false)} />
    </div>
  );
};

export default Navbar; 