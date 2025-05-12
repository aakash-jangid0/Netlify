import React, { useState, useEffect } from 'react';
import { AlertCircle, WifiOff, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function NetworkErrorAlert() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    // Initial state
    setIsOnline(navigator.onLine);
    if (!navigator.onLine) {
      setShowAlert(true);
    }

    // Setup event listeners for online status changes
    const handleOnline = () => {
      setIsOnline(true);
      // Keep showing for a bit to show "Back Online" status
      setTimeout(() => setShowAlert(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowAlert(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // If we're online and not showing the alert, don't render anything
  if (!showAlert) return null;

  return (
    <AnimatePresence>
      {showAlert && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          transition={{ duration: 0.3 }}
          className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 pt-4"
        >
          <div className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${
            isOnline ? 'bg-green-50 border border-green-300' : 'bg-red-50 border border-red-300'
          }`}>
            {isOnline ? (
              <>
                <RefreshCw className="w-5 h-5 text-green-500" />
                <span className="text-green-700 font-medium">Back online! Connection restored.</span>
                <button 
                  onClick={() => setShowAlert(false)}
                  className="ml-2 rounded-full p-1 hover:bg-green-100"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </>
            ) : (
              <>
                <WifiOff className="w-5 h-5 text-red-500" />
                <div>
                  <span className="text-red-700 font-medium">You're offline.</span>
                  <span className="text-red-600 ml-1 text-sm">Please check your internet connection.</span>
                </div>
                <button 
                  onClick={() => window.location.reload()}
                  className="ml-2 bg-red-100 rounded-full p-1 hover:bg-red-200"
                >
                  <RefreshCw className="h-4 w-4 text-red-600" />
                </button>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
