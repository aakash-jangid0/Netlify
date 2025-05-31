import { useEffect, useState } from 'react';
import { MenuItem } from '../types/menu';
import { preloadImages } from '../utils/imageUtils';

export function useImagePreloader(items: MenuItem[]) {
  const [imagesPreloaded, setImagesPreloaded] = useState(false);
  
  useEffect(() => {
    if (items && items.length > 0) {
      const imageSrcs = items.map(item => item.image).filter(Boolean);
      
      // Don't block UI, run preloading in background
      (async () => {
        try {
          await preloadImages(imageSrcs);
          setImagesPreloaded(true);
        } catch (error) {
          console.error('Error preloading images:', error);
          // Still mark as preloaded even if some images failed
          setImagesPreloaded(true);
        }
      })();
    } else {
      setImagesPreloaded(true);
    }
  }, [items]);
  
  return { imagesPreloaded };
}
