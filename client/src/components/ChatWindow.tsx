import React, { useEffect, useState, useRef } from 'react';
import { chatAPI } from '../utils/api';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';
import { useChatContext } from '../contexts/ChatContext';
import { authAPI } from '../utils/api';
import { FiSend, FiPaperclip } from 'react-icons/fi';
import { FiMoreVertical } from 'react-icons/fi';
import ImageCropModal from './ImageCropModal';
import { uploadToCloudinary } from '../utils/cloudinary';

// SVGs for ticks
const SingleTick = () => (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none" className="inline align-middle" style={{marginLeft: 2}}><path d="M5 10.5L9 14.5L15 7.5" stroke="#a3a3a3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
);
const DoubleTickGray = () => (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none" className="inline align-middle" style={{marginLeft: 2}}><path d="M3.5 11.5L7.5 15.5L13.5 8.5" stroke="#a3a3a3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M8.5 11.5L12.5 15.5L18.5 8.5" stroke="#a3a3a3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
);
const DoubleTickGreen = () => (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none" className="inline align-middle" style={{marginLeft: 2}}>
    <path d="M3.5 11.5L7.5 15.5L13.5 8.5" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8.5 11.5L12.5 15.5L18.5 8.5" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

interface ChatWindowProps {
  chatId: string;
  onBack?: () => void;
}

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
  const [editGroupIcon, setEditGroupIcon] = useState('');
  const [editUsers, setEditUsers] = useState<any[]>([]);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');
  const [uploadingGroupIcon, setUploadingGroupIcon] = useState(false);
  const [showGroupIconCropModal, setShowGroupIconCropModal] = useState(false);
  const [selectedGroupIconImage, setSelectedGroupIconImage] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<{ type: string; url: string; name: string } | null>(null);
  const [pendingFiles, setPendingFiles] = useState<Array<{ content: string; messageType: string; mediaUrl: string }>>([]);
  const [enlargedProfileImage, setEnlargedProfileImage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileButtonClick = () => {
    if (fileInputRef.current) fileInputRef.current.value = '';
    fileInputRef.current?.click();
  };
  // for file transfer
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    setUploading(true);
    setUploadError('');
    
    try {
      const uploadPromises = files.map(async (file) => {
        let mediaUrl = await uploadToCloudinary(file);
        let messageType = 'file';
        if (file.type.startsWith('image/')) messageType = 'image';
        else if (file.type.startsWith('video/')) messageType = 'video';
        return {
          content: file.name,
          messageType,
          mediaUrl,
        };
      });
      
      const uploadedFiles = await Promise.all(uploadPromises);
      
      const images = uploadedFiles.filter(file => file.messageType === 'image');
      const otherFiles = uploadedFiles.filter(file => file.messageType !== 'image');
      
      // Store uploaded files instead of sending them immediately
      setPendingFiles(prev => [...prev, ...uploadedFiles]);
      
    } catch (err: any) {
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
      setEditGroupIcon(chat.groupIcon || '');
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

  // Handle group icon upload
  const handleGroupIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setEditError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setEditError('Image size should be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setSelectedGroupIconImage(e.target?.result as string);
      setShowGroupIconCropModal(true);
    };
    reader.readAsDataURL(file);
  };

  // Group icon crop functions
  const handleGroupIconCropSave = async (croppedImageUrl: string) => {
    setEditGroupIcon(croppedImageUrl);
    setEditSuccess('Group icon uploaded successfully!');
    setShowGroupIconCropModal(false);
    setSelectedGroupIconImage(null);
  };

  const handleGroupIconCropClose = () => {
    setShowGroupIconCropModal(false);
    setSelectedGroupIconImage(null);
  };

  // Save group changes (admin only)
  const handleSaveGroup = async () => {
    setEditLoading(true);
    setEditError('');
    setEditSuccess('');
    try {
      const updatedChat = await chatAPI.updateGroup(chatId, {
        groupName: editGroupName,
        groupIcon: editGroupIcon,
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

  // Mark messages as read when chat is opened or new messages arrive
  useEffect(() => {
    if (!user || !messages.length || !socket) return;
    const unreadMsgIds = messages
      .filter(msg => !msg.readBy?.includes(user._id) && msg.sender?._id !== user._id)
      .map(msg => msg._id);
    if (unreadMsgIds.length > 0) {
      socket.emit('mark_as_read', { chatId, messageIds: unreadMsgIds });
    }
  }, [messages, user, socket, chatId]);

  // Listen for real-time read receipt updates
  useEffect(() => {
    if (!socket) return;
    const handleMessagesRead = ({ messageIds, userId }: { messageIds: string[]; userId: string }) => {
      setMessages(prevMsgs => prevMsgs.map(msg =>
        messageIds.includes(msg._id) && !msg.readBy.includes(userId)
          ? { ...msg, readBy: [...msg.readBy, userId] }
          : msg
      ));
    };
    socket.on('messages_read', handleMessagesRead);
    return () => { socket.off('messages_read', handleMessagesRead); };
  }, [socket]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && pendingFiles.length === 0) || !socket) return;
    
    // Send text message if there's text
    if (input.trim()) {
      socket.emit('send_message', {
        chatId,
        content: input,
        messageType: 'text'
      });
      setInput('');
    }
    
    // Send pending files
    if (pendingFiles.length > 0) {
      const images = pendingFiles.filter(file => file.messageType === 'image');
      const otherFiles = pendingFiles.filter(file => file.messageType !== 'image');
      
      // Send multiple images as a group
      if (images.length > 1) {
        socket.emit('send_message', {
          chatId,
          content: `Multiple images (${images.length})`,
          messageType: 'image_group',
          mediaUrls: images.map(img => img.mediaUrl),
          imageCount: images.length
        });
      } else if (images.length === 1) {
        // Send single image
        socket.emit('send_message', {
          chatId,
          ...images[0],
        });
      }
      
      // Send other files (videos, documents) separately
      otherFiles.forEach((fileData) => {
        socket.emit('send_message', {
          chatId,
          ...fileData,
        });
      });
      
      // Clear pending files
      setPendingFiles([]);
    }
  };

  // Remove a pending file
  const removePendingFile = (index: number) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="flex-1 flex flex-col h-screen min-h-0 bg-[var(--card)] text-[var(--foreground)] overflow-hidden rounded-2xl border border-[var(--border)]">
      {/* Chat header fixed below navbar */}
      <div className="sticky top-20 z-30 bg-[var(--background)] px-6 py-4 flex items-center justify-between shadow-md border-b border-[var(--border)]">
        {/* Back button for mobile */}
        <button
          className="md:hidden mr-3 text-[var(--foreground)]"
          onClick={onBack}
          style={{ display: onBack ? undefined : 'none' }}
        >
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-arrow-left"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
        </button>
        
        {/* Profile picture and name */}
        <div className="flex items-center space-x-3 flex-1">
          <div
            className={
              "w-10 h-10 bg-gradient-to-br from-[var(--sidebar-primary)] to-[var(--sidebar-accent)] rounded-full flex items-center justify-center text-base font-bold overflow-hidden" +
              ((isGroup && chat?.groupIcon) || (!isGroup && chat?.users?.find((u: any) => u._id !== user?._id)?.profilePicture)
                ? " cursor-pointer hover:opacity-80"
                : "")
            }
            onClick={() => {
              if (isGroup && chat?.groupIcon) setEnlargedProfileImage(chat.groupIcon);
              else if (!isGroup) {
                const receiver = chat?.users?.find((u: any) => u._id !== user?._id);
                if (receiver?.profilePicture) setEnlargedProfileImage(receiver.profilePicture);
              }
            }}
          >
            {isGroup ? (
              chat?.groupIcon ? (
                <img
                  src={chat.groupIcon}
                  alt={displayName || 'Group'}
                  className="w-full h-full object-cover"
                />
              ) : (
                displayName[0]?.toUpperCase() || 'G'
              )
            ) : (
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
          <span className="font-bold text-lg text-[var(--foreground)] truncate">{displayName}</span>
        </div>
        
        {isGroup && (
          <button
            className="flex items-center text-[var(--primary)] hover:text-[var(--primary-foreground)] transition"
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
            <div className="text-center text-muted-foreground text-lg font-semibold">
              Welcome to ChatHub!<br />Here we give you privacy.<br />Write any message you want.
            </div>
          </div>
        )}
        {messages.length >=1 &&(
            <div className="flex justify-center">
            <div className="text-center text-muted-foreground text-lg font-semibold">
              Welcome to ChatHub!
            </div>
          </div>
        )}
        {messages.map((msg) => {
          // Read receipt logic
          let tickIcon = null;
          if (user && msg.sender?._id === user._id) {
            if (isGroup) {
              const otherUserIds = chat.users.filter((u: any) => u._id !== user._id).map((u: any) => u._id);
              const allRead = otherUserIds.every((uid: string) => msg.readBy?.includes(uid));
              if (allRead && otherUserIds.length > 0) tickIcon = <DoubleTickGreen />;
              else if ((msg.readBy?.filter((uid: string) => otherUserIds.includes(uid)).length || 0) > 0) tickIcon = <DoubleTickGray />;
              else tickIcon = <SingleTick />;
            } else {
              const receiver = chat.users.find((u: any) => u._id !== user._id);
              if (receiver && msg.readBy?.includes(receiver._id)) tickIcon = <DoubleTickGreen />;
              else if ((msg.readBy?.length || 0) > 0) tickIcon = <DoubleTickGray />;
              else tickIcon = <SingleTick />;
            }
          }
          return (
            <div
              key={msg._id}
              className={`flex ${msg.sender?._id === user?._id ? 'justify-end' : 'justify-start'}`}
            >
              <div className="flex flex-col max-w-xs md:max-w-md">
                {/* Show sender name and profile picture in group chats for messages from others */}
                {isGroup && msg.sender?._id !== user?._id && (
                  <div className="flex items-center mb-1 ml-1">
                    {/* Profile picture */}
                    <div className="w-6 h-6 rounded-full overflow-hidden mr-2 flex-shrink-0">
                      {msg.sender?.profilePicture ? (
                        <img 
                          src={msg.sender.profilePicture} 
                          alt={msg.sender.username || 'Profile'} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] flex items-center justify-center text-xs font-bold text-[var(--primary-foreground)]">
                          {msg.sender?.username?.[0]?.toUpperCase() || 'U'}
                        </div>
                      )}
                    </div>
                    {/* Sender name */}
                    <div className="text-xs text-muted-foreground font-medium">
                      {msg.sender?.username || 'Unknown User'}
                    </div>
                  </div>
                )}
                {/* Media rendering */}
                {msg.messageType === 'image' && msg.mediaUrl && (
                  <img 
                    src={msg.mediaUrl} 
                    alt={msg.content || 'image'} 
                    className="rounded-xl mb-1 max-h-60 object-contain bg-[var(--background)] cursor-pointer hover:opacity-80 transition-opacity" 
                    style={{ maxWidth: '320px' }}
                    onClick={() => setSelectedMedia({ type: 'image', url: msg.mediaUrl, name: msg.content || 'Image' })}
                  />
                )}
                
                {/* Grouped images rendering */}
                {msg.messageType === 'image_group' && msg.mediaUrls && (
                  <div className="grid grid-cols-2 gap-1 mb-1" style={{ maxWidth: '320px' }}>
                    {msg.mediaUrls.slice(0, 4).map((url: string, index: number) => (
                      <div key={index} className="relative">
                        <img 
                          src={url} 
                          alt={`Image ${index + 1}`}
                          className={`rounded-lg object-cover bg-[var(--background)] cursor-pointer hover:opacity-80 transition-opacity ${
                            msg.mediaUrls.length === 1 ? 'col-span-2' : 
                            msg.mediaUrls.length === 2 ? 'h-32' : 'h-24'
                          }`}
                          onClick={() => setSelectedMedia({ type: 'image', url, name: `Image ${index + 1}` })}
                        />
                        {/* Show +X indicator for additional images */}
                        {index === 3 && msg.mediaUrls.length > 4 && (
                          <div className="absolute inset-0 bg-black/70 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-lg">
                              +{msg.mediaUrls.length - 4}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {msg.messageType === 'video' && msg.mediaUrl && (
                  <video 
                    src={msg.mediaUrl} 
                    controls 
                    className="rounded-xl mb-1 bg-[var(--background)] cursor-pointer hover:opacity-80 transition-opacity" 
                    style={{ width: '320px', height: '180px', objectFit: 'cover' }}
                    onClick={() => setSelectedMedia({ type: 'video', url: msg.mediaUrl, name: msg.content || 'Video' })}
                  />
                )}
                {msg.messageType === 'file' && msg.mediaUrl && (
                  <div 
                    className="text-[var(--primary)] underline mb-1 break-all cursor-pointer hover:text-[var(--primary-foreground)] transition-colors"
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
                      ? 'bg-[var(--primary)]/80 text-[var(--primary-foreground)] rounded-br-none'
                      : 'bg-[var(--muted)] text-[var(--foreground)] rounded-bl-none'
                  } max-w-[80vw] break-words whitespace-pre-wrap`}
                >
                  {/* Only show text if not a file-only message */}
                  {(!msg.mediaUrl || msg.messageType === 'text') && (
                    <div>{msg.content}</div>
                  )}
                  <div className={`text-xs mt-1 text-right ${
                    msg.sender?._id === user?._id 
                      ? 'text-[var(--primary-foreground)]/80' 
                      : 'text-[var(--muted-foreground)]/80'
                  } flex items-center justify-end`}>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {/* Read receipt ticks for my messages */}
                    {msg.sender?._id === user?._id && tickIcon}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
      {/* Pending files preview */}
      {pendingFiles.length > 0 && (
        <div className="bg-[var(--background)] px-4 py-2 border-t border-[var(--border)]">
          <div className="text-xs text-muted-foreground mb-2">Pending files ({pendingFiles.length}):</div>
          <div className="flex flex-wrap gap-2">
            {pendingFiles.map((file, index) => (
              <div key={index} className="flex items-center bg-[var(--muted)] rounded-lg px-3 py-1 text-sm">
                <span className="text-[var(--muted-foreground)] truncate max-w-32">{file.content}</span>
                <button
                  onClick={() => removePendingFile(index)}
                  className="ml-2 text-[var(--destructive)] hover:text-[var(--destructive-foreground)] text-lg font-bold"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <form onSubmit={handleSend} className="bg-[var(--background)] flex items-center space-x-2 px-2 py-2 rounded-b-2xl sticky bottom-0 z-20">
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          accept="image/*,video/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/zip,application/x-rar-compressed,application/octet-stream"
          onChange={handleFileChange}
          disabled={uploading}
          multiple
        />
        <button
          className="p-2 rounded-full hover:bg-[var(--muted)] transition"
          type="button"
          onClick={handleFileButtonClick}
          disabled={uploading}
          aria-label="Attach file"
        >
          <FiPaperclip size={22} className="text-muted-foreground" />
        </button>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={pendingFiles.length > 0 ? "Type your message or press Enter to send files..." : "Type your message..."}
          className="flex-1 px-4 py-2 rounded-full bg-[var(--muted)] text-[var(--muted-foreground)] placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition resize-none min-h-[40px] max-h-[40px] h-10 overflow-y-auto"
          disabled={uploading}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend(e);
            }
          }}
        />
        <button 
          className={`p-2 rounded-full transition flex items-center justify-center ${
            (input.trim() || pendingFiles.length > 0) ? 'bg-[var(--primary)] hover:bg-[var(--primary)]/90' : 'bg-[var(--muted)] cursor-not-allowed'
          }`} 
          type="submit" 
          disabled={uploading || (!input.trim() && pendingFiles.length === 0)}
        >
          <FiSend size={22} className="text-[var(--primary-foreground)]" />
        </button>
        {uploading && <span className="ml-2 text-[var(--primary)] text-xs">Uploading...</span>}
        {uploadError && <span className="ml-2 text-[var(--destructive)] text-xs">{uploadError}</span>}
      </form>
      {/* Edit group modal: admin can edit, others see members list */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-[var(--background)] rounded-2xl shadow-2xl p-8 w-full max-w-md relative">
            <button onClick={() => setShowEditModal(false)} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground text-xl">&times;</button>
            <h2 className="text-xl font-bold text-foreground mb-4 text-center">Group Info</h2>
            {isAdmin ? (
              <>
                {/* Group Icon Section */}
                <div className="mb-4">
                  <label className="block text-muted-foreground mb-2">Group Icon</label>
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-[var(--muted)] flex items-center justify-center">
                      {editGroupIcon ? (
                        <img 
                          src={editGroupIcon} 
                          alt="Group Icon" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] flex items-center justify-center text-[var(--primary-foreground)] font-bold text-lg">
                          {editGroupName?.[0]?.toUpperCase() || 'G'}
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleGroupIconUpload}
                        className="hidden"
                        id="groupIconInput"
                        disabled={uploadingGroupIcon || editLoading}
                      />
                      <label
                        htmlFor="groupIconInput"
                        className="block w-full px-4 py-2 rounded-lg bg-[var(--muted)] text-[var(--muted-foreground)] text-center cursor-pointer hover:bg-[var(--muted-foreground)]/80 transition disabled:opacity-60"
                        style={{ pointerEvents: uploadingGroupIcon || editLoading ? 'none' : 'auto' }}
                      >
                        {uploadingGroupIcon ? 'Uploading...' : editGroupIcon ? 'Change Icon' : 'Upload Icon'}
                      </label>
                    </div>
                  </div>
                </div>

                <label className="block text-muted-foreground mb-1">Group Name</label>
                <input
                  className="w-full px-4 py-2 rounded-lg bg-[var(--muted)] text-[var(--muted-foreground)] placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary mb-4"
                  value={editGroupName}
                  onChange={e => setEditGroupName(e.target.value)}
                  disabled={editLoading}
                />
                <div className="mb-2 text-muted-foreground font-semibold">Members</div>
                <ul className="divide-y divide-gray-800 mb-4">
                  {editUsers.map((u: any) => (
                    <li key={u._id} className="py-2 flex items-center justify-between">
                      <span className="text-foreground">{u.username} {u._id === (typeof chat?.groupAdmin === 'object' ? chat?.groupAdmin?._id : chat?.groupAdmin) && <span className='text-xs text-[var(--primary)]'>(admin)</span>}</span>
                      {u._id !== (typeof chat?.groupAdmin === 'object' ? chat?.groupAdmin?._id : chat?.groupAdmin) && (
                        <button
                          className="text-xs text-[var(--destructive)] hover:text-[var(--destructive-foreground)] ml-2"
                          onClick={() => handleRemoveUser(u._id)}
                          disabled={editLoading || editUsers.length <= 1}
                        >Remove</button>
                      )}
                    </li>
                  ))}
                </ul>
                {/* Add member section */}
                <div className="mb-4">
                  <label className="block text-muted-foreground mb-1">Add Member</label>
                  <input
                    type="text"
                    value={search}
                    onChange={handleSearch}
                    className="w-full px-4 py-2 rounded-lg bg-[var(--muted)] text-[var(--muted-foreground)] placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary mb-2"
                    placeholder="Search users to add..."
                    disabled={editLoading}
                  />
                  {searchLoading && <div className="text-muted-foreground text-center mb-2">Searching...</div>}
                  {searchError && <div className="text-[var(--destructive)] text-center mb-2">{searchError}</div>}
                  <div className="max-h-32 overflow-y-auto">
                    {searchResults.map((u: any) => (
                      <div key={u._id} className="flex items-center space-x-3 p-2 rounded-lg cursor-pointer hover:bg-[var(--muted)] transition mb-1">
                        <div className="w-8 h-8 bg-gradient-to-br from-[var(--sidebar-primary)] to-[var(--sidebar-accent)] rounded-full flex items-center justify-center text-base font-bold">
                          {u.username?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-foreground truncate">{u.username}</div>
                          <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                        </div>
                        <button
                          className="bg-[var(--primary)] text-[var(--primary-foreground)] px-2 py-1 rounded-lg text-xs font-semibold hover:bg-[var(--primary-foreground)]/80 transition"
                          onClick={() => handleAddUser(u)}
                          disabled={editLoading}
                        >Add</button>
                      </div>
                    ))}
                  </div>
                </div>
                {editError && <div className="text-[var(--destructive)] text-center mb-2">{editError}</div>}
                {editSuccess && <div className="text-green-400 text-center mb-2">{editSuccess}</div>}
                <button
                  className="w-full bg-[var(--primary)] hover:bg-[var(--primary-foreground)] text-[var(--primary-foreground)] font-semibold py-2 rounded-lg transition disabled:opacity-60"
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
                    <span className="text-foreground">{u.username} {u._id === chat?.groupAdmin && <span className='text-xs text-[var(--primary)]'>(admin)</span>}</span>
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
              className="absolute top-4 right-4 z-10 text-foreground hover:text-muted-foreground text-2xl font-bold bg-black/50 rounded-full w-10 h-10 flex items-center justify-center transition-colors"
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

      {/* Group Icon Crop Modal */}
      <ImageCropModal
        open={showGroupIconCropModal}
        onClose={handleGroupIconCropClose}
        onCropSave={handleGroupIconCropSave}
        title="Crop Group Icon"
        selectedImage={selectedGroupIconImage}
        uploading={uploadingGroupIcon}
      />

      {/* Enlarged Profile/Group Image Modal */}
      {enlargedProfileImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
          <div className="relative">
            <img
              src={enlargedProfileImage}
              alt="Enlarged"
              className="max-w-[60vw] max-h-[60vh] rounded-2xl shadow-2xl"
            />
            <button
              onClick={() => setEnlargedProfileImage(null)}
              className="absolute top-2 right-2 text-white text-3xl font-bold bg-black/60 rounded-full w-10 h-10 flex items-center justify-center"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWindow; 