import React from 'react';

// Mock chat data
const chats = [
  {
    id: 1,
    name: 'Alice',
    lastMessage: 'See you soon! 😊',
    time: '09:15',
    avatar: 'A',
    active: true,
  },
  {
    id: 2,
    name: 'Bob',
    lastMessage: 'Let me know.',
    time: '08:50',
    avatar: 'B',
    active: false,
  },
  {
    id: 3,
    name: 'Charlie',
    lastMessage: 'Thanks for the update.',
    time: 'Yesterday',
    avatar: 'C',
    active: false,
  },
  {
    id: 4,
    name: 'Diana',
    lastMessage: 'Can we call?',
    time: 'Yesterday',
    avatar: 'D',
    active: false,
  },
];

interface SidebarProps {
  onSelectChat?: (id: number) => void;
  selectedChatId?: number | null;
}

const Sidebar: React.FC<SidebarProps> = ({ onSelectChat, selectedChatId }) => {
  return (
    <aside className="block md:flex md:flex-col w-full md:w-72 h-[calc(100vh-5rem)] bg-gray-900 text-white shadow-2xl rounded-bl-2xl rounded-tr-none rounded-tl-none p-2 transition-all duration-300 z-30">
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
        {chats.map((chat) => (
          <div
            key={chat.id}
            className={`flex items-center space-x-3 p-3 mb-2 rounded-xl cursor-pointer transition-all duration-200 hover:bg-gray-800 ${
              (selectedChatId === chat.id || chat.active) ? 'bg-gray-800' : ''
            }`}
            onClick={() => onSelectChat && onSelectChat(chat.id)}
          >
            <div className="w-12 h-12 bg-gradient-to-br from-gray-700 to-gray-800 rounded-full flex items-center justify-center text-lg font-bold">
              {chat.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center">
                <span className="font-semibold truncate">{chat.name}</span>
                <span className="text-xs text-gray-400 ml-2 whitespace-nowrap">{chat.time}</span>
              </div>
              <div className="text-sm text-gray-300 truncate">{chat.lastMessage}</div>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
};

export default Sidebar; 