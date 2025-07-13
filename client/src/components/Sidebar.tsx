import React from 'react';
import { useChatContext } from '../contexts/ChatContext';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  onSelectChat?: (id: string) => void;
  selectedChatId?: string | null;
}

const Sidebar: React.FC<SidebarProps> = ({ onSelectChat, selectedChatId }) => {
  const { chats, loading } = useChatContext();
  const { user } = useAuth();

  return (
    <aside className="flex flex-col w-full md:w-90 h-screen bg-gray-900 text-white shadow-2xl rounded-bl-2xl rounded-tr-none rounded-tl-none p-2 transition-all duration-300 z-30">
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
        {/* Fake ChatHub chat always at top */}
        <div className="flex items-center space-x-3 p-3 mb-2 rounded-xl cursor-pointer transition-all duration-200 hover:bg-gray-800 bg-gray-800">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full flex items-center justify-center text-lg font-bold">
            C
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-center">
              <span className="font-semibold truncate text-blue-400">
                ChatHub
              </span>
              <span className="text-xs text-gray-400 ml-2 whitespace-nowrap">
                Always Online
              </span>
            </div>
            <div className="text-sm text-gray-300 truncate">
              Welcome to ChatHub! Start chatting with friends.
            </div>
          </div>
        </div>
        
        {loading ? (
          <div className="text-center text-gray-400 py-8">Loading chats...</div>
        ) : chats.length === 0 ? (
          <div className="text-center text-gray-400 py-8">No chats found.</div>
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
                className={`flex items-center space-x-3 p-3 mb-2 rounded-xl cursor-pointer transition-all duration-200 hover:bg-gray-800 ${
                  selectedChatId === chat._id ? 'bg-gray-800' : ''
                }`}
                onClick={() => onSelectChat && onSelectChat(chat._id)}
              >
                <div className="w-12 h-12 bg-gradient-to-br from-gray-700 to-gray-800 rounded-full flex items-center justify-center text-lg font-bold overflow-hidden">
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
                  <div className="flex justify-between items-center text-blue-400">
                    <span className="font-semibold truncate">
                      {displayName}
                    </span>
                    <span className="text-xs text-gray-400 ml-2 whitespace-nowrap">
                      {chat.latestMessage?.createdAt
                        ? new Date(chat.latestMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : ''}
                    </span>
                  </div>
                  <div className="text-sm text-gray-300 truncate">
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