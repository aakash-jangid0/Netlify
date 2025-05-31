import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader2, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ImageUploadService } from '../../services/imageUpload';
import { toast } from 'react-hot-toast';

interface ImageUploadProps {
  onUpload: (url: string) => void;
  currentImageUrl?: string;
  folder?: string;
  label?: string;
  placeholder?: string;
  aspectRatio?: 'square' | 'landscape' | 'portrait' | 'auto';
  maxWidth?: number;
  maxHeight?: number;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  onUpload,
  currentImageUrl,
  folder = 'general',
  label = 'Upload Image',
  placeholder = 'Click to upload or drag and drop',
  aspectRatio = 'auto',
  maxWidth = 800,
  maxHeight = 600
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      const result = await ImageUploadService.uploadImage(file, folder);
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      setTimeout(() => {
        onUpload(result.url);
        setUploadProgress(0);
        toast.success('Image uploaded successfully!');
      }, 500);

    } catch (error: any) {
      toast.error(error.message || 'Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const removeImage = () => {
    onUpload('');
    toast.success('Image removed');
  };

  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case 'square': return 'aspect-square';
      case 'landscape': return 'aspect-video';
      case 'portrait': return 'aspect-[3/4]';
      default: return 'min-h-[200px]';
    }
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      
      <div className="relative">
        <motion.div
          className={`
            relative border-2 border-dashed rounded-lg transition-all duration-200 cursor-pointer
            ${isDragging ? 'border-orange-400 bg-orange-50' : 'border-gray-300 hover:border-gray-400'}
            ${getAspectRatioClass()}
          `}
          onClick={handleClick}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInputChange}
            className="hidden"
          />

          {currentImageUrl ? (
            <div className="relative w-full h-full group">
              <img
                src={currentImageUrl}
                alt="Uploaded"
                className="w-full h-full object-cover rounded-lg"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 rounded-lg flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClick();
                    }}
                    className="px-3 py-2 bg-white text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50"
                  >
                    Change
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeImage();
                    }}
                    className="px-3 py-2 bg-red-500 text-white rounded-md text-sm font-medium hover:bg-red-600"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <AnimatePresence mode="wait">
                {isUploading ? (
                  <motion.div
                    key="uploading"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex flex-col items-center"
                  >
                    <div className="relative mb-4">
                      <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
                      {uploadProgress === 100 && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute inset-0 flex items-center justify-center"
                        >
                          <Check className="w-6 h-6 text-green-500" />
                        </motion.div>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {uploadProgress === 100 ? 'Upload complete!' : 'Uploading...'}
                    </p>
                    <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-orange-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${uploadProgress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="upload"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex flex-col items-center"
                  >
                    <div className={`
                      p-3 rounded-full mb-4 transition-colors duration-200
                      ${isDragging ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-400'}
                    `}>
                      <ImageIcon className="w-8 h-8" />
                    </div>
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      {placeholder}
                    </p>
                    <p className="text-xs text-gray-500">
                      PNG, JPG, GIF up to 5MB
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </motion.div>

        {/* Upload overlay for drag state */}
        <AnimatePresence>
          {isDragging && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-orange-500 bg-opacity-10 border-2 border-orange-400 rounded-lg flex items-center justify-center"
            >
              <div className="text-orange-600 text-center">
                <Upload className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm font-medium">Drop image here</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {currentImageUrl && (
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Check className="w-3 h-3 text-green-500" />
          <span>Image uploaded successfully</span>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
