import React, { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../utils/api';

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
  const [cropArea, setCropArea] = useState({ x: 0, y: 0, size: 300 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const profilePicInputRef = useRef<HTMLInputElement>(null);
  const cropContainerRef = useRef<HTMLDivElement>(null);

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

  const handleCropSave = async () => {
    if (!selectedImage || !cropContainerRef.current) return;
    
    setUploadingProfilePic(true);
    setProfilePicError('');
    
    try {
      // Create canvas to crop the image
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Get the actual container dimensions
        const containerRect = cropContainerRef.current?.getBoundingClientRect();
        const containerWidth = containerRect?.width || 400;
        const containerHeight = containerRect?.height || 400;
        
        // Calculate the actual image dimensions in the container
        const imgAspectRatio = img.width / img.height;
        const containerAspectRatio = containerWidth / containerHeight;
        
        let displayWidth, displayHeight, offsetX, offsetY;
        
        if (imgAspectRatio > containerAspectRatio) {
          // Image is wider than container
          displayHeight = containerHeight;
          displayWidth = containerHeight * imgAspectRatio;
          offsetX = (containerWidth - displayWidth) / 2;
          offsetY = 0;
        } else {
          // Image is taller than container
          displayWidth = containerWidth;
          displayHeight = containerWidth / imgAspectRatio;
          offsetX = 0;
          offsetY = (containerHeight - displayHeight) / 2;
        }
        
        // Calculate scale factors
        const scaleX = img.width / displayWidth;
        const scaleY = img.height / displayHeight;
        
        // Calculate actual crop coordinates
        const actualCropX = (cropArea.x - offsetX) * scaleX;
        const actualCropY = (cropArea.y - offsetY) * scaleY;
        const actualCropSize = cropArea.size * scaleX; // Use scaleX for consistent scaling
        
        // Ensure crop coordinates are within image bounds
        const finalCropX = Math.max(0, Math.min(actualCropX, img.width - actualCropSize));
        const finalCropY = Math.max(0, Math.min(actualCropY, img.height - actualCropSize));
        const finalCropSize = Math.min(actualCropSize, Math.min(img.width - finalCropX, img.height - finalCropY));
        
        // Set canvas size to final crop size
        canvas.width = finalCropSize;
        canvas.height = finalCropSize;
        
        // Draw cropped image
        ctx?.drawImage(
          img,
          finalCropX, finalCropY, finalCropSize, finalCropSize,
          0, 0, finalCropSize, finalCropSize
        );
        
        // Convert to blob and upload
        canvas.toBlob(async (blob) => {
          if (!blob) return;
          
          const formData = new FormData();
          formData.append('file', blob, 'profile.jpg');
          formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
          
          const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`, {
            method: 'POST',
            body: formData,
          });
          const data = await res.json();
          
          if (!data.secure_url) throw new Error('Upload failed');
          
          await authAPI.updateUser({ ...form, profilePicture: data.secure_url });
          setSuccess('Profile picture updated!');
          checkAuth();
          setShowCropModal(false);
          setSelectedImage(null);
          setUploadingProfilePic(false);
        }, 'image/jpeg', 0.95);
      };
      
      img.src = selectedImage;
    } catch (err: any) {
      setProfilePicError('Failed to upload profile picture');
      setUploadingProfilePic(false);
    }
  };

  const handleCropCancel = () => {
    setShowCropModal(false);
    setSelectedImage(null);
    setCropArea({ x: 0, y: 0, size: 300 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!cropContainerRef.current) return;
    const rect = cropContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setIsDragging(true);
    setDragStart({ x: x - cropArea.x, y: y - cropArea.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !cropContainerRef.current) return;
    const rect = cropContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - dragStart.x;
    const y = e.clientY - rect.top - dragStart.y;
    
    // Get actual container dimensions
    const containerWidth = rect.width;
    const containerHeight = rect.height;
    
    // Constrain to container bounds
    const maxX = containerWidth - cropArea.size;
    const maxY = containerHeight - cropArea.size;
    
    setCropArea(prev => ({
      ...prev,
      x: Math.max(0, Math.min(x, maxX)),
      y: Math.max(0, Math.min(y, maxY))
    }));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
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
      {showCropModal && selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-white mb-4 text-center">Crop Profile Picture</h3>
            
            <div className="mb-4 text-center text-gray-300 text-sm">
              Drag to move the crop area and select the part of the image you want to use
            </div>
            
            <div 
              ref={cropContainerRef}
              className="relative w-full h-96 bg-gray-800 rounded-lg overflow-hidden mb-4"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <img 
                src={selectedImage} 
                alt="Crop preview" 
                className="w-full h-full object-cover"
                draggable={false}
              />
              
              {/* Crop overlay */}
              <div 
                className="absolute border-2 border-blue-500 bg-blue-500/20 cursor-move"
                style={{
                  left: cropArea.x,
                  top: cropArea.y,
                  width: cropArea.size,
                  height: cropArea.size,
                  borderRadius: '50%'
                }}
              >
                <div className="absolute inset-0 border-2 border-white rounded-full"></div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={handleCropCancel}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 rounded-lg transition"
              >
                Cancel
              </button>
              <button 
                onClick={handleCropSave}
                disabled={uploadingProfilePic}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 rounded-lg transition disabled:opacity-60"
              >
                {uploadingProfilePic ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileSidePanel; 