// Image upload service for website customization
import { supabase } from '../lib/supabase';

export interface UploadResult {
  url: string;
  path: string;
}

export class ImageUploadService {
  private static readonly BUCKET_NAME = 'website-assets';

  /**
   * Upload an image file to Supabase Storage
   */
  static async uploadImage(file: File, folder: string = 'general'): Promise<UploadResult> {
    try {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Only image files are allowed');
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        throw new Error('Image size must be less than 5MB');
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(ImageUploadService.BUCKET_NAME)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        throw error;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(ImageUploadService.BUCKET_NAME)
        .getPublicUrl(fileName);

      return {
        url: urlData.publicUrl,
        path: fileName
      };
    } catch (error: any) {
      console.error('Error uploading image:', error);
      throw new Error(error.message || 'Failed to upload image');
    }
  }

  /**
   * Delete an image from Supabase Storage
   */
  static async deleteImage(path: string): Promise<void> {
    try {
      const { error } = await supabase.storage
        .from(ImageUploadService.BUCKET_NAME)
        .remove([path]);

      if (error) {
        throw error;
      }
    } catch (error: any) {
      console.error('Error deleting image:', error);
      throw new Error('Failed to delete image');
    }
  }

  /**
   * Upload multiple images
   */
  static async uploadMultipleImages(files: File[], folder: string = 'general'): Promise<UploadResult[]> {
    const uploadPromises = files.map(file => this.uploadImage(file, folder));
    return Promise.all(uploadPromises);
  }

  /**
   * Get optimized image URL with transformations
   */
  static getOptimizedImageUrl(url: string, options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'jpg' | 'png';
  } = {}): string {
    if (!url) return url;

    // If it's not a Supabase URL, return as is
    if (!url.includes('supabase')) {
      return url;
    }

    const { width, height, quality = 80, format = 'webp' } = options;
    
    let transformedUrl = url;
    const params = new URLSearchParams();

    if (width) params.append('width', width.toString());
    if (height) params.append('height', height.toString());
    params.append('quality', quality.toString());
    params.append('format', format);

    if (params.toString()) {
      const separator = url.includes('?') ? '&' : '?';
      transformedUrl = `${url}${separator}${params.toString()}`;
    }

    return transformedUrl;
  }

  /**
   * Create storage bucket if it doesn't exist
   */
  static async initializeBucket(): Promise<void> {
    try {
      const { data: buckets, error: listError } = await supabase.storage.listBuckets();
      
      if (listError) {
        throw listError;
      }

      const bucketExists = buckets?.some(bucket => bucket.name === ImageUploadService.BUCKET_NAME);
      
      if (!bucketExists) {
        const { error: createError } = await supabase.storage.createBucket(ImageUploadService.BUCKET_NAME, {
          public: true,
          allowedMimeTypes: ['image/*'],
          fileSizeLimit: 5242880 // 5MB
        });

        if (createError) {
          throw createError;
        }
      }
    } catch (error: any) {
      console.error('Error initializing storage bucket:', error);
      // Don't throw here as this is initialization
    }
  }
}

// Initialize bucket on module load
ImageUploadService.initializeBucket();
