import React, { useEffect, useState, useRef } from 'react';
import { chatAPI } from '../utils/api';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';
import { useChatContext } from '../contexts/ChatContext';
import { authAPI } from '../utils/api';
import { FiSend, FiPaperclip } from 'react-icons/fi';
import { FiMoreVertical } from 'react-icons/fi';

interface ChatWindowProps {
  chatId: string;
  onBack?: () => void;
}

const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

console.log('Cloudinary Cloud Name:', CLOUDINARY_CLOUD_NAME);
console.log('Cloudinary Upload Preset:', CLOUDINARY_UPLOAD_PRESET);
console.log('All env vars:', import.meta.env);

const ChatWindow: React.FC<ChatWindowProps> = ({ chatId, onBack }) => {
  const { user } = useAuth();
  const socket = useSocket();
  const { chats, addOrUpdateChat } = useChatContext();
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [editGroupName, setEditGroupName] = useState('');
  const [editUsers, setEditUsers] = useState<any[]>([]);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<{ type: string; url: string; name: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileButtonClick = () => {
    if (fileInputRef.current) fileInputRef.current.value = '';
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    console.log('File selected:', file.name, file.type);
    console.log('Upload preset:', CLOUDINARY_UPLOAD_PRESET);
    console.log('Cloud name:', CLOUDINARY_CLOUD_NAME);
    
    if (!CLOUDINARY_UPLOAD_PRESET) {
      setUploadError('Upload preset not configured');
      return;
    }
    
    setUploading(true);
    setUploadError('');
    try {
      // Prepare form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
      
      console.log('Uploading to Cloudinary...');
      console.log('URL:', `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`);
      
      // Upload to Cloudinary
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`, {
        method: 'POST',
        body: formData,
      });
      
      console.log('Upload response status:', res.status);
      const data = await res.json();
      console.log('Upload response:', data);
      
      if (!data.secure_url) {
        console.error('Upload failed:', data);
        throw new Error(data.error?.message || 'Upload failed');
      }
      
      // Determine message type
      let messageType = 'file';
      if (file.type.startsWith('image/')) messageType = 'image';
      else if (file.type.startsWith('video/')) messageType = 'video';
      
      console.log('Sending message with type:', messageType, 'and URL:', data.secure_url);
      
      // Send message with mediaUrl
      if (socket) {
        socket.emit('send_message', {
          chatId,
          content: file.name,
          messageType,
          mediaUrl: data.secure_url,
        });
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      setUploadError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  // Find the chat object
  const chat = chats.find((c) => c._id === chatId);
  let displayName = '';
  let isGroup = false;
  let isAdmin = false;
  if (chat) {
    isGroup = chat.isGroup;
    if (isGroup) {
      displayName = chat.groupName;
      isAdmin =
        chat.groupAdmin === user?._id ||
        (typeof chat.groupAdmin === 'object' && chat.groupAdmin?._id === user?._id);
    } else if (Array.isArray(chat.users)) {
      const receiver = chat.users.find((u: any) => u._id !== user?._id);
      displayName = receiver?.username || 'Unknown User';
    }
  }

  // When opening modal as admin, initialize edit state
  useEffect(() => {
    if (showEditModal && isGroup && isAdmin && chat) {
      setEditGroupName(chat.groupName || '');
      setEditUsers(chat.users || []);
      setEditError('');
      setEditSuccess('');
    }
  }, [showEditModal, isGroup, isAdmin, chat]);

  // Remove user from group (admin only)
  const handleRemoveUser = (userId: string) => {
    if (editUsers.length <= 1) return; // Don't allow removing last user
    setEditUsers(editUsers.filter((u: any) => u._id !== userId));
  };

  // Save group changes (admin only)
  const handleSaveGroup = async () => {
    setEditLoading(true);
    setEditError('');
    setEditSuccess('');
    try {
      const updatedChat = await chatAPI.updateGroup(chatId, {
        groupName: editGroupName,
        users: editUsers.map((u: any) => u._id), // <-- use 'users' not 'userIds'
      });
      addOrUpdateChat(updatedChat); // Update context with new group info
      setEditSuccess('Group updated!');
      setTimeout(() => setShowEditModal(false), 1000);
    } catch (err: any) {
      setEditError(err?.response?.data?.message || 'Failed to update group');
    } finally {
      setEditLoading(false);
    }
  };

  // Search users to add
  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setSearchError('');
    if (e.target.value.trim().length === 0) {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);
    try {
      const users = await authAPI.searchUsers(e.target.value);
      // Exclude already added users
      setSearchResults(users.filter((u: any) => !editUsers.some((eu: any) => eu._id === u._id)));
    } catch {
      setSearchError('Search failed');
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // Add user to group (admin only)
  const handleAddUser = (user: any) => {
    setEditUsers(prev => [...prev, user]);
    setSearchResults(prev => prev.filter((u: any) => u._id !== user._id));
    setSearch('');
  };

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
    <div className="flex-1 flex flex-col h-screen min-h-0 bg-gray-800 overflow-hidden rounded-2xl">
      {/* Chat header fixed below navbar */}
      <div className="sticky top-20 z-30 bg-gray-900 px-6 py-4 flex items-center justify-between shadow-md border-b border-gray-800">
        {/* Back button for mobile */}
        <button
          className="md:hidden mr-3 text-white"
          onClick={onBack}
          style={{ display: onBack ? undefined : 'none' }}
        >
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-arrow-left"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
        </button>
        
        {/* Profile picture and name */}
        <div className="flex items-center space-x-3 flex-1">
          <div className="w-10 h-10 bg-gradient-to-br from-gray-700 to-gray-800 rounded-full flex items-center justify-center text-base font-bold overflow-hidden">
            {isGroup ? (
              // Group chat - show group icon or first letter
              displayName[0]?.toUpperCase() || 'G'
            ) : (
              // Individual chat - show receiver's profile picture or first letter
              chat?.users?.find((u: any) => u._id !== user?._id)?.profilePicture ? (
                <img 
                  src={chat.users.find((u: any) => u._id !== user?._id)?.profilePicture} 
                  alt={displayName || 'Profile'} 
                  className="w-full h-full object-cover"
                />
              ) : (
                displayName[0]?.toUpperCase() || 'U'
              )
            )}
          </div>
          <span className="font-bold text-lg text-white truncate">{displayName}</span>
        </div>
        
        {isGroup && (
          <button
            className="flex items-center text-blue-400 hover:text-blue-600 transition"
            onClick={() => setShowEditModal(true)}
            aria-label="Group options"
          >
            <FiMoreVertical size={22} />
          </button>
        )}
      </div>
      {/* Messages area */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-4 m-2 pt-20">
        {messages.length === 0 && (
          <div className="flex justify-center items-center h-full">
            <div className="text-center text-gray-400 text-lg font-semibold">
              Welcome to ChatHub!<br />Here we give you privacy.<br />Write any message you want.
            </div>
          </div>
        )}
        {messages.length >=1 &&(
            <div className="flex justify-center">
            <div className="text-center text-gray-400 text-lg font-semibold">
              Welcome to ChatHub!
            </div>
          </div>
        )}
        {messages.map((msg) => (
          <div
            key={msg._id}
            className={`flex ${msg.sender?._id === user?._id ? 'justify-end' : 'justify-start'}`}
          >
            <div className="flex flex-col max-w-xs md:max-w-md">
              {/* Show sender name in group chats for messages from others */}
              {isGroup && msg.sender?._id !== user?._id && (
                <div className="text-xs text-gray-400 mb-1 ml-1 font-medium">
                  {msg.sender?.username || 'Unknown User'}
                </div>
              )}
              {/* Media rendering */}
              {msg.messageType === 'image' && msg.mediaUrl && (
                <img 
                  src={msg.mediaUrl} 
                  alt={msg.content || 'image'} 
                  className="rounded-xl mb-1 max-h-60 object-contain bg-black cursor-pointer hover:opacity-80 transition-opacity" 
                  style={{ maxWidth: '320px' }}
                  onClick={() => setSelectedMedia({ type: 'image', url: msg.mediaUrl, name: msg.content || 'Image' })}
                />
              )}
              {msg.messageType === 'video' && msg.mediaUrl && (
                <video 
                  src={msg.mediaUrl} 
                  controls 
                  className="rounded-xl mb-1 bg-black cursor-pointer hover:opacity-80 transition-opacity" 
                  style={{ width: '320px', height: '180px', objectFit: 'cover' }}
                  onClick={() => setSelectedMedia({ type: 'video', url: msg.mediaUrl, name: msg.content || 'Video' })}
                />
              )}
              {msg.messageType === 'file' && msg.mediaUrl && (
                <div 
                  className="text-blue-400 underline mb-1 break-all cursor-pointer hover:text-blue-300 transition-colors"
                  onClick={() => {
                    if (msg.content?.toLowerCase().includes('.pdf')) {
                      setSelectedMedia({ type: 'pdf', url: msg.mediaUrl, name: msg.content || 'PDF' });
                    } else {
                      window.open(msg.mediaUrl, '_blank');
                    }
                  }}
                >
                  {msg.content || 'Download file'}
                </div>
              )}
              <div
                className={`px-4 py-2 rounded-2xl shadow text-sm ${
                  msg.sender?._id === user?._id
                    ? 'bg-blue-500 text-white rounded-br-none'
                    : 'bg-gray-700 text-gray-100 rounded-bl-none'
                }`}
              >
                {/* Only show text if not a file-only message */}
                {(!msg.mediaUrl || msg.messageType === 'text') && <div>{msg.content}</div>}
                <div className={`text-xs mt-1 text-right ${
                  msg.sender?._id === user?._id 
                    ? 'text-blue-100' 
                    : 'text-gray-300'
                }`}>
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSend} className="bg-gray-900 flex items-center space-x-2 px-2 py-2 rounded-b-2xl sticky bottom-0 z-20">
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          accept="image/*,video/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/zip,application/x-rar-compressed,application/octet-stream"
          onChange={handleFileChange}
          disabled={uploading}
        />
        <button
          className="p-2 rounded-full hover:bg-gray-800 transition"
          type="button"
          onClick={handleFileButtonClick}
          disabled={uploading}
          aria-label="Attach file"
        >
          <FiPaperclip size={22} className="text-gray-400" />
        </button>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 px-4 py-2 rounded-full bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          disabled={uploading}
        />
        <button className="p-2 rounded-full bg-blue-500 hover:bg-blue-600 transition flex items-center justify-center" type="submit" disabled={uploading}>
          <FiSend size={22} className="text-white" />
        </button>
        {uploading && <span className="ml-2 text-blue-400 text-xs">Uploading...</span>}
        {uploadError && <span className="ml-2 text-red-400 text-xs">{uploadError}</span>}
      </form>
      {/* Edit group modal: admin can edit, others see members list */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl shadow-2xl p-8 w-full max-w-md relative">
            <button onClick={() => setShowEditModal(false)} className="absolute top-3 right-3 text-gray-400 hover:text-white text-xl">&times;</button>
            <h2 className="text-xl font-bold text-white mb-4 text-center">Group Info</h2>
            {isAdmin ? (
              <>
                <label className="block text-gray-300 mb-1">Group Name</label>
                <input
                  className="w-full px-4 py-2 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                  value={editGroupName}
                  onChange={e => setEditGroupName(e.target.value)}
                  disabled={editLoading}
                />
                <div className="mb-2 text-gray-300 font-semibold">Members</div>
                <ul className="divide-y divide-gray-800 mb-4">
                  {editUsers.map((u: any) => (
                    <li key={u._id} className="py-2 flex items-center justify-between">
                      <span className="text-white">{u.username} {u._id === (typeof chat?.groupAdmin === 'object' ? chat?.groupAdmin?._id : chat?.groupAdmin) && <span className='text-xs text-blue-400'>(admin)</span>}</span>
                      {u._id !== (typeof chat?.groupAdmin === 'object' ? chat?.groupAdmin?._id : chat?.groupAdmin) && (
                        <button
                          className="text-xs text-red-400 hover:text-red-600 ml-2"
                          onClick={() => handleRemoveUser(u._id)}
                          disabled={editLoading || editUsers.length <= 1}
                        >Remove</button>
                      )}
                    </li>
                  ))}
                </ul>
                {/* Add member section */}
                <div className="mb-4">
                  <label className="block text-gray-300 mb-1">Add Member</label>
                  <input
                    type="text"
                    value={search}
                    onChange={handleSearch}
                    className="w-full px-4 py-2 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                    placeholder="Search users to add..."
                    disabled={editLoading}
                  />
                  {searchLoading && <div className="text-gray-400 text-center mb-2">Searching...</div>}
                  {searchError && <div className="text-red-400 text-center mb-2">{searchError}</div>}
                  <div className="max-h-32 overflow-y-auto">
                    {searchResults.map((u: any) => (
                      <div key={u._id} className="flex items-center space-x-3 p-2 rounded-lg cursor-pointer hover:bg-gray-800 transition mb-1">
                        <div className="w-8 h-8 bg-gradient-to-br from-gray-700 to-gray-800 rounded-full flex items-center justify-center text-base font-bold">
                          {u.username?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-white truncate">{u.username}</div>
                          <div className="text-xs text-gray-400 truncate">{u.email}</div>
                        </div>
                        <button
                          className="bg-blue-500 text-white px-2 py-1 rounded-lg text-xs font-semibold hover:bg-blue-600 transition"
                          onClick={() => handleAddUser(u)}
                          disabled={editLoading}
                        >Add</button>
                      </div>
                    ))}
                  </div>
                </div>
                {editError && <div className="text-red-400 text-center mb-2">{editError}</div>}
                {editSuccess && <div className="text-green-400 text-center mb-2">{editSuccess}</div>}
                <button
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 rounded-lg transition disabled:opacity-60"
                  onClick={handleSaveGroup}
                  disabled={editLoading}
                >
                  {editLoading ? 'Saving...' : 'Save'}
                </button>
              </>
            ) : (
              <ul className="divide-y divide-gray-800">
                {chat?.users?.map((u: any) => (
                  <li key={u._id} className="py-2 flex items-center justify-between">
                    <span className="text-white">{u.username} {u._id === chat?.groupAdmin && <span className='text-xs text-blue-400'>(admin)</span>}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
      
      {/* Media Modal/Lightbox */}
      {selectedMedia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
          <div className="relative w-full h-full flex items-center justify-center p-4">
            {/* Close button */}
            <button 
              onClick={() => setSelectedMedia(null)}
              className="absolute top-4 right-4 z-10 text-white hover:text-gray-300 text-2xl font-bold bg-black/50 rounded-full w-10 h-10 flex items-center justify-center transition-colors"
            >
              ×
            </button>
            
            {/* Media content */}
            <div className="w-full h-full flex items-center justify-center">
              {selectedMedia.type === 'image' && (
                <img 
                  src={selectedMedia.url} 
                  alt={selectedMedia.name}
                  className="max-w-full max-h-full object-contain"
                />
              )}
              
              {selectedMedia.type === 'video' && (
                <video 
                  src={selectedMedia.url} 
                  controls 
                  autoPlay
                  className="max-w-full max-h-full object-contain"
                />
              )}
              
              {selectedMedia.type === 'pdf' && (
                <iframe 
                  src={selectedMedia.url}
                  className="w-full h-full border-0"
                  title={selectedMedia.name}
                />
              )}
            </div>
            
            {/* File name */}
            <div className="absolute bottom-4 left-4 right-4 text-center">
              <div className="bg-black/70 text-white px-4 py-2 rounded-lg inline-block">
                {selectedMedia.name}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWindow; 