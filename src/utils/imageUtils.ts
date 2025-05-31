/**
 * Utility functions for image handling
 */

/**
 * Preloads an image and returns a promise that resolves when the image is loaded
 * @param src Image URL to preload
 * @returns Promise that resolves when image is loaded
 */
export const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
};

/**
 * Preloads multiple images in parallel
 * @param srcs Array of image URLs to preload
 * @returns Promise that resolves when all images are loaded
 */
export const preloadImages = (srcs: string[]): Promise<void[]> => {
  return Promise.all(srcs.map(preloadImage));
};

/**
 * Gets appropriate image size based on device width for responsive loading
 * @param originalUrl The original image URL
 * @param width The desired width
 * @returns Modified URL with size parameters
 */
export const getResponsiveImageUrl = (originalUrl: string, width: number = 400): string => {
  // Only modify URLs that are from cloud services that support dynamic resizing
  if (originalUrl.includes('unsplash.com')) {
    // Format for Unsplash: add w={width} parameter
    if (originalUrl.includes('?')) {
      return `${originalUrl}&w=${width}&q=80`;
    } else {
      return `${originalUrl}?w=${width}&q=80`;
    }
  }
  
  // Return original for non-supported URLs
  return originalUrl;
};
