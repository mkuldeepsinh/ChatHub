import React from 'react';
import { useChatContext } from '../contexts/ChatContext';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';

interface SidebarProps {
  onSelectChat?: (id: string) => void;
  selectedChatId?: string | null;
}

const Sidebar: React.FC<SidebarProps> = ({ onSelectChat, selectedChatId }) => {
  const { chats, loading } = useChatContext();
  const { user } = useAuth();

  return (
    <aside
      className="flex flex-col w-full md:w-90 h-screen bg-[var(--sidebar)] text-[var(--sidebar-foreground)] shadow-2xl rounded-bl-2xl rounded-tr-none rounded-tl-none p-2 transition-all duration-300 z-30"
    >
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-[var(--sidebar-border)] scrollbar-track-[var(--sidebar)]">
        {/* Fake ChatHub chat always at top */}
        <div
          className="flex items-center space-x-3 p-3 mb-2 rounded-xl cursor-pointer transition-all duration-200 hover:bg-[var(--sidebar-accent)] bg-[var(--sidebar-accent)]"
        >
          <div className="w-12 h-12 bg-gradient-to-br from-[var(--sidebar-primary)] to-[var(--sidebar-accent)] rounded-full flex items-center justify-center text-lg font-bold">
            C
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-center">
              <span className="font-semibold truncate text-[var(--sidebar-primary)]">
                ChatHub
              </span>
              <span className="text-xs text-[var(--sidebar-border)] ml-2 whitespace-nowrap">
                Always Online
              </span>
            </div>
            <div className="text-sm text-[var(--sidebar-foreground)]/70 truncate">
              Welcome to ChatHub! Start chatting with friends.
            </div>
          </div>
        </div>
        
        {loading ? (
          <div className="text-center py-8">
            <LoadingSpinner size="sm" text="Loading chats..." showLogo={false} />
          </div>
        ) : chats.length === 0 ? (
          <div className="text-center text-[var(--sidebar-border)] py-8">No chats found.</div>
        ) : (
          chats.map((chat) => {
            const receiver = !chat.isGroup && Array.isArray(chat.users)
              ? chat.users.find((u: any) => u._id !== user?._id)
              : null;
            const displayName = chat.isGroup
              ? chat.groupName
              : receiver?.username || "Unknown User";
            return (
              <div
                key={chat._id || chat.id || Math.random()}
                className={`flex items-center space-x-3 p-3 mb-2 rounded-xl cursor-pointer transition-all duration-200 hover:bg-[var(--sidebar-accent)] ${
                  selectedChatId === chat._id ? 'bg-[var(--sidebar-accent)]' : ''
                }`}
                onClick={() => onSelectChat && onSelectChat(chat._id)}
              >
                <div className="w-12 h-12 bg-gradient-to-br from-[var(--sidebar-primary)] to-[var(--sidebar-accent)] rounded-full flex items-center justify-center text-lg font-bold overflow-hidden">
                  {chat.isGroup ? (
                    // Group chat - show group icon or first letter
                    chat.groupIcon ? (
                      <img 
                        src={chat.groupIcon} 
                        alt={displayName || 'Group'} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      displayName[0]?.toUpperCase() || 'G'
                    )
                  ) : (
                    // Individual chat - show receiver's profile picture or first letter
                    receiver?.profilePicture ? (
                      <img 
                        src={receiver.profilePicture} 
                        alt={receiver.username || 'Profile'} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      displayName[0]?.toUpperCase() || 'U'
                    )
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center text-[var(--sidebar-primary)]">
                    <span className="font-semibold truncate">
                      {displayName}
                    </span>
                    <span className="text-xs text-[var(--sidebar-primary)] ml-2 whitespace-nowrap">
                      {chat.latestMessage?.createdAt
                        ? new Date(chat.latestMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : ''}
                    </span>
                  </div>
                  <div className="text-sm text-[var(--sidebar-foreground)]/70 truncate">
                    {chat.latestMessage?.content || ''}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};

export default Sidebar; 