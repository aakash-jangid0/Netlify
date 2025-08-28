import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { X } from 'lucide-react';

// Emergency toast dismiss button component - only shows when toasts are active
export const EmergencyToastDismiss: React.FC = () => {
  const [hasActiveToasts, setHasActiveToasts] = useState(false);

  useEffect(() => {
    // Check for active toasts periodically
    const checkToasts = () => {
      const toastElements = document.querySelectorAll('[data-hot-toast]');
      setHasActiveToasts(toastElements.length > 0);
    };

    checkToasts();
    const interval = setInterval(checkToasts, 1000);

    return () => clearInterval(interval);
  }, []);

  const dismissAllToasts = () => {
    toast.dismiss();
    // Force remove any stuck toasts after a short delay
    setTimeout(() => {
      const toastElements = document.querySelectorAll('[data-hot-toast]');
      toastElements.forEach(element => {
        element.remove();
      });
      setHasActiveToasts(false);
    }, 100);
  };

  // Only render if there are active toasts
  if (!hasActiveToasts) {
    return null;
  }

  return (
    <button
      onClick={dismissAllToasts}
      className="fixed top-4 right-4 bg-red-500 text-white p-2 rounded-full shadow-lg hover:bg-red-600 transition-all z-[10000] opacity-80 hover:opacity-100"
      title="Dismiss all notifications"
      style={{ zIndex: 10000 }}
    >
      <X className="w-4 h-4" />
    </button>
  );
};

export default EmergencyToastDismiss;
