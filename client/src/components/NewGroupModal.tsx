import React, { useState } from 'react';
import { chatAPI, authAPI } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { useChatContext } from '../contexts/ChatContext';
import ImageCropModal from './ImageCropModal';
import LoadingSpinner from './LoadingSpinner';
import { Button } from './ui/button';

interface NewGroupModalProps {
  open: boolean;
  onClose: () => void;
  onGroupCreated: (chatId: string) => void;
  navbarHeight?: number;
}

const NewGroupModal: React.FC<NewGroupModalProps> = ({ open, onClose, onGroupCreated, navbarHeight = 80 }) => {
  const { user } = useAuth();
  const [groupName, setGroupName] = useState('');
  const [groupIcon, setGroupIcon] = useState('');
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [uploadingIcon] = useState(false);
  const [showCropModal, setShowCropModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
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

  // Handle group icon upload
  const handleGroupIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setSelectedImage(e.target?.result as string);
      setShowCropModal(true);
    };
    reader.readAsDataURL(file);
  };

  // Crop functions
  const handleCropSave = async (croppedImageUrl: string) => {
    setGroupIcon(croppedImageUrl);
    setInfo('Group icon uploaded successfully!');
    setShowCropModal(false);
    setSelectedImage(null);
  };

  const handleCropClose = () => {
    setShowCropModal(false);
    setSelectedImage(null);
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
        groupIcon: groupIcon,
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
    <>
      {/* Blurred overlay */}
      <div className="fixed inset-0 z-40 bg-transparent backdrop-blur-sm transition-all duration-300" onClick={onClose} />
      {/* Modal below navbar, full width, fixed */}
      <div
        className="bg-[var(--card)] rounded-2xl shadow-2xl p-6 w-full max-w-md border border-[var(--border)] mx-auto z-50"
        style={{ position: 'fixed', top: navbarHeight, left: 0, right: 0 }}
      >
        <Button onClick={onClose} variant="ghost" className="absolute top-3 right-3 text-muted-foreground text-xl p-0 h-auto w-auto min-w-0 min-h-0">&times;</Button>
        <h2 className="text-xl font-bold text-[var(--card-foreground)] mb-4 text-center">Create New Group</h2>
        
        {/* Group Icon Section */}
        <div className="mb-4">
          <label className="block text-muted-foreground mb-2">Group Icon (Optional)</label>
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-[var(--muted)] flex items-center justify-center">
              {groupIcon ? (
                <img 
                  src={groupIcon} 
                  alt="Group Icon" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] flex items-center justify-center text-[var(--primary-foreground)] font-bold text-lg">
                  {groupName?.[0]?.toUpperCase() || 'G'}
                </div>
              )}
            </div>
            <div className="flex-1">
              <input
                type="file"
                accept="image/*"
                onChange={handleGroupIconUpload}
                className="hidden"
                id="newGroupIconInput"
                disabled={uploadingIcon || creating}
              />
              <label
                htmlFor="newGroupIconInput"
                className="block w-full px-4 py-2 rounded-lg bg-[var(--muted)] text-[var(--muted-foreground)] text-center cursor-pointer hover:bg-[var(--muted-foreground)]/80 transition disabled:opacity-60"
                style={{ pointerEvents: uploadingIcon || creating ? 'none' : 'auto' }}
              >
                {uploadingIcon ? 'Uploading...' : groupIcon ? 'Change Icon' : 'Upload Icon'}
              </label>
            </div>
          </div>
        </div>

        <input
          type="text"
          value={groupName}
          onChange={e => setGroupName(e.target.value)}
          className="w-full px-4 py-2 rounded-lg bg-[var(--muted)] text-[var(--muted-foreground)] placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary mb-4"
          placeholder="Group name..."
        />
        <input
          type="text"
          value={search}
          onChange={handleSearch}
          className="w-full px-4 py-2 rounded-lg bg-[var(--muted)] text-[var(--muted-foreground)] placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary mb-2"
          placeholder="Search users to add..."
        />
        {loading && (
          <div className="text-center mb-2">
            <LoadingSpinner size="sm" text="Searching..." showLogo={false} />
          </div>
        )}
        {error && <div className="text-[var(--destructive)] text-center mb-2">{error}</div>}
        {info && <div className="text-[var(--primary)] text-center mb-2">{info}</div>}
        <div className="flex flex-wrap gap-2 mb-2">
          {selectedUsers.map(u => (
            <span key={u._id} className="bg-[var(--primary)] text-[var(--primary-foreground)] px-3 py-1 rounded-full flex items-center">
              {u.username}
              <Button className="ml-2 text-xs px-1 py-0 h-auto min-h-0 min-w-0" variant="ghost" onClick={() => handleRemoveUser(u)}>&times;</Button>
            </span>
          ))}
        </div>
        <div className="max-h-32 overflow-y-auto mb-4">
          {results.map(u => (
            <div
              key={u._id}
              className="flex items-center space-x-3 p-2 rounded-lg cursor-pointer hover:bg-[var(--muted)] transition mb-1"
              onClick={() => handleSelectUser(u)}
            >
              <div className="w-8 h-8 bg-gradient-to-br from-[var(--muted)] to-[var(--accent)] rounded-full flex items-center justify-center text-base font-bold text-[var(--muted-foreground)]">
                {u.username?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-[var(--card-foreground)] truncate">{u.username}</div>
                <div className="text-xs text-muted-foreground truncate">{u.email}</div>
              </div>
              <Button
                className="px-2 py-1 text-xs font-semibold"
                disabled={creating}
                variant="secondary"
              >
                Add
              </Button>
            </div>
          ))}
        </div>
        <Button
          className="w-full font-semibold py-2 hover:bg-green-600 hover:text-white"
          onClick={handleCreateGroup}
          disabled={creating}
          variant="default"
        >
          {creating ? 'Creating...' : 'Create Group'}
        </Button>
      </div>

      {/* Crop Modal */}
      <ImageCropModal
        open={showCropModal}
        onClose={handleCropClose}
        onCropSave={handleCropSave}
        title="Crop Group Icon"
        selectedImage={selectedImage}
        uploading={uploadingIcon}
      />
    </>
  );
};

export default NewGroupModal; 