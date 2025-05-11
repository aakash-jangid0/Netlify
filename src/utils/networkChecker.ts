/**
 * Utility for checking network connectivity and API availability
 */

// Check if browser is online
export const isOnline = (): boolean => {
  return navigator.onLine;
};

// Check if API server is available
export const checkApiAvailability = async (): Promise<boolean> => {
  try {
    // Use a short timeout to keep UI responsive
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch('http://localhost:5000/api/health', { 
      method: 'GET',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.error('API availability check failed:', error);
    return false;
  }
};

// Register network event listeners
export const registerNetworkListeners = (callback: (isOnline: boolean) => void): (() => void) => {
  const handleOnline = () => {
    callback(true);
  };
  
  const handleOffline = () => {
    callback(false);
  };
  
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  
  // Return cleanup function
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
};
