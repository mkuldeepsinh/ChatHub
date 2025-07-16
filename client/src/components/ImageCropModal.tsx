import React, { useState, useRef } from 'react';

interface ImageCropModalProps {
  open: boolean;
  onClose: () => void;
  onCropSave: (croppedImageUrl: string) => void;
  title: string;
  selectedImage: string | null;
  uploading: boolean;
}

const ImageCropModal: React.FC<ImageCropModalProps> = ({
  open,
  onClose,
  onCropSave,
  title,
  selectedImage,
  uploading
}) => {
  const [cropArea, setCropArea] = useState({ x: 0, y: 0, size: 300 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const cropContainerRef = useRef<HTMLDivElement>(null);

  const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  const handleCropSave = async () => {
    if (!selectedImage || !cropContainerRef.current) return;
    
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
          formData.append('file', blob, 'cropped-image.jpg');
          formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
          
          const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`, {
            method: 'POST',
            body: formData,
          });
          const data = await res.json();
          
          if (!data.secure_url) throw new Error('Upload failed');
          
          onCropSave(data.secure_url);
        }, 'image/jpeg', 0.95);
      };
      
      img.src = selectedImage;
    } catch (err: any) {
      console.error('Crop save error:', err);
      throw new Error('Failed to crop image');
    }
  };

  const handleCropCancel = () => {
    onClose();
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

  if (!open || !selectedImage) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
      <div className="bg-[var(--background)] rounded-2xl p-6 max-w-md w-full mx-4">
        <h3 className="text-xl font-bold text-foreground mb-4 text-center">{title}</h3>
        
        <div className="mb-4 text-center text-muted-foreground text-sm">
          Drag to move the crop area and select the part of the image you want to use
        </div>
        
        <div 
          ref={cropContainerRef}
          className="relative w-full h-96 bg-[var(--muted)] rounded-lg overflow-hidden mb-4"
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
            className="absolute border-2 border-[var(--primary)] bg-[var(--primary)]/20 cursor-move"
            style={{
              left: cropArea.x,
              top: cropArea.y,
              width: cropArea.size,
              height: cropArea.size,
              borderRadius: '50%'
            }}
          >
            <div className="absolute inset-0 border-2 border-foreground rounded-full"></div>
          </div>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={handleCropCancel}
            className="flex-1 bg-[var(--muted)] hover:bg-[var(--primary)] hover:text-[var(--primary-foreground)] text-[var(--muted-foreground)] font-semibold py-2 rounded-lg transition"
          >
            Cancel
          </button>
          <button 
            onClick={handleCropSave}
            disabled={uploading}
            className="flex-1 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-[var(--primary-foreground)] font-semibold py-2 rounded-lg transition disabled:opacity-60"
          >
            {uploading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageCropModal; 