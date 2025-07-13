import React, { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../utils/api';
import ImageCropModal from './ImageCropModal';

const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

interface ProfileSidePanelProps {
  open: boolean;
  onClose: () => void;
}

const ProfileSidePanel: React.FC<ProfileSidePanelProps> = ({ open, onClose }) => {
  const { user, checkAuth } = useAuth();
  const [form, setForm] = useState({
    username: user?.username || '',
    email: user?.email || '',
    phone: user?.phone || '',
    about: user?.about || '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [uploadingProfilePic, setUploadingProfilePic] = useState(false);
  const [profilePicError, setProfilePicError] = useState('');
  const [showCropModal, setShowCropModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const profilePicInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (user) {
      setForm({
        username: user.username || '',
        email: user.email || '',
        phone: user.phone || '',
        about: user.about || '',
      });
    }
  }, [user, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await authAPI.updateUser(form);
      setSuccess('Profile updated!');
      checkAuth();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  const handleProfilePicClick = () => {
    if (profilePicInputRef.current) profilePicInputRef.current.value = '';
    profilePicInputRef.current?.click();
  };

  const handleProfilePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setSelectedImage(e.target?.result as string);
      setShowCropModal(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCropSave = async (croppedImageUrl: string) => {
    try {
      await authAPI.updateUser({ ...form, profilePicture: croppedImageUrl });
      setSuccess('Profile picture updated!');
      checkAuth();
      setShowCropModal(false);
      setSelectedImage(null);
    } catch (err: any) {
      setProfilePicError('Failed to upload profile picture');
    }
  };

  const handleCropClose = () => {
    setShowCropModal(false);
    setSelectedImage(null);
  };

  const handleLogout = async () => {
    await authAPI.logout();
    window.location.reload();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-sm transition-all duration-300">
      <div
        className="w-full max-w-md h-full bg-gray-900 shadow-2xl p-8 flex flex-col relative animate-slide-in-right rounded-xl transition-all duration-300"
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl">&times;</button>
        <h2 className="text-2xl font-bold text-white mb-6">Profile</h2>
        
        {/* Profile Picture Section */}
        <div className="flex flex-col items-center mb-6">
          <input
            type="file"
            ref={profilePicInputRef}
            style={{ display: 'none' }}
            accept="image/*"
            onChange={handleProfilePicChange}
            disabled={uploadingProfilePic}
          />
          <div 
            className="relative cursor-pointer group"
            onClick={handleProfilePicClick}
          >
            <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center text-3xl font-bold text-white">
              {user?.profilePicture ? (
                <img 
                  src={user.profilePicture} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              ) : (
                user?.username?.[0]?.toUpperCase() || 'U'
              )}
            </div>
            <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {uploadingProfilePic ? 'Uploading...' : 'Change'}
              </span>
            </div>
          </div>
          {profilePicError && <div className="text-red-400 text-sm mt-2">{profilePicError}</div>}
        </div>
        
        <div className="flex flex-col gap-4 flex-1">
          <div>
            <label className="block text-gray-300 mb-1">Username</label>
            <input name="username" value={form.username} onChange={handleChange} className="w-full px-4 py-2 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-gray-300 mb-1">Email</label>
            <input name="email" value={form.email} onChange={handleChange} className="w-full px-4 py-2 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-gray-300 mb-1">Phone</label>
            <input name="phone" value={form.phone} onChange={handleChange} className="w-full px-4 py-2 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-gray-300 mb-1">About</label>
            <textarea name="about" value={form.about} onChange={handleChange} className="w-full px-4 py-2 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" rows={3} />
          </div>
        </div>
        {error && <div className="text-red-400 text-center mt-2">{error}</div>}
        {success && <div className="text-green-400 text-center mt-2">{success}</div>}
        <div className="mt-6 flex flex-row gap-4">
          <button onClick={handleSave} disabled={loading} className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 rounded-lg transition disabled:opacity-60">
            {loading ? 'Saving...' : 'Save'}
          </button>
          <button onClick={handleLogout} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2 rounded-lg transition">
            Logout
          </button>
        </div>
      </div>
      
      {/* Crop Modal */}
      <ImageCropModal
        open={showCropModal}
        onClose={handleCropClose}
        onCropSave={handleCropSave}
        title="Crop Profile Picture"
        selectedImage={selectedImage}
        uploading={uploadingProfilePic}
      />
    </div>
  );
};

export default ProfileSidePanel; 