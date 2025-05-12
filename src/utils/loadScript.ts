
/**
 * Loads an external JavaScript script dynamically
 * Prevents duplicate loading if script is already loaded
 * 
 * @param src URL of the script to load
 * @returns Promise that resolves to boolean indicating success
 */
export const loadScript = (src: string): Promise<boolean> => {
  return new Promise((resolve) => {
    // Check if script is already loaded
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve(true);
      return;
    }
    
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    
    script.onload = () => {
      resolve(true);
    };
    
    script.onerror = () => {
      console.error(`Failed to load script: ${src}`);
      resolve(false);
    };
    
    document.body.appendChild(script);
  });
};