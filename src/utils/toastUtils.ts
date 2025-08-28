import { toast } from 'react-hot-toast';

// Default options for dismissible toasts
const defaultToastOptions = {
  style: {
    cursor: 'pointer',
    userSelect: 'none' as const,
    transition: 'all 0.2s ease',
  },
  duration: 3000,
};

// Enhanced toast utilities with consistent dismissible styling
export const toastUtils = {
  success: (message: string, options = {}) => {
    const toastId = toast.success(message, {
      ...defaultToastOptions,
      duration: 3000,
      style: {
        ...defaultToastOptions.style,
        background: '#f0fdf4',
        border: '1px solid #bbf7d0',
        color: '#166534',
      },
      ...options,
    });
    
    // Add click handler after creation
    setTimeout(() => {
      const toastElement = document.querySelector(`[data-hot-toast="${toastId}"]`);
      if (toastElement) {
        toastElement.addEventListener('click', () => toast.dismiss(toastId));
      }
    }, 10);
    
    return toastId;
  },

  error: (message: string, options = {}) => {
    const toastId = toast.error(message, {
      ...defaultToastOptions,
      duration: 3000,
      style: {
        ...defaultToastOptions.style,
        background: '#fef2f2',
        border: '1px solid #fecaca',
        color: '#dc2626',
      },
      ...options,
    });
    
    // Add click handler after creation
    setTimeout(() => {
      const toastElement = document.querySelector(`[data-hot-toast="${toastId}"]`);
      if (toastElement) {
        toastElement.addEventListener('click', () => toast.dismiss(toastId));
      }
    }, 10);
    
    return toastId;
  },

  info: (message: string, options = {}) => {
    const toastId = toast(message, {
      ...defaultToastOptions,
      duration: 3000,
      icon: 'ℹ️',
      style: {
        ...defaultToastOptions.style,
        background: '#eff6ff',
        border: '1px solid #bfdbfe',
        color: '#1d4ed8',
      },
      ...options,
    });
    
    // Add click handler after creation
    setTimeout(() => {
      const toastElement = document.querySelector(`[data-hot-toast="${toastId}"]`);
      if (toastElement) {
        toastElement.addEventListener('click', () => toast.dismiss(toastId));
      }
    }, 10);
    
    return toastId;
  },

  loading: (message: string, options = {}) => {
    const toastId = toast.loading(message, {
      ...defaultToastOptions,
      duration: 10000, // 10 seconds instead of Infinity
      style: {
        ...defaultToastOptions.style,
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        color: '#475569',
      },
      ...options,
    });
    
    // Add click handler after creation for cancelling loading
    setTimeout(() => {
      const toastElement = document.querySelector(`[data-hot-toast="${toastId}"]`);
      if (toastElement) {
        toastElement.addEventListener('click', () => toast.dismiss(toastId));
      }
    }, 10);
    
    return toastId;
  },

  dismiss: (toastId?: string) => {
    return toast.dismiss(toastId);
  },

  dismissAll: () => {
    return toast.dismiss();
  },

  // Quick dismissible variants
  quickSuccess: (message: string) => toastUtils.success(message, { duration: 2000 }),
  quickError: (message: string) => toastUtils.error(message, { duration: 3000 }),
  quickInfo: (message: string) => toastUtils.info(message, { duration: 2500 }),
};

// Helper to make any existing toast dismissible by click
export const makeDismissible = (toastFn: typeof toast.success | typeof toast.error) => {
  return (message: string, options = {}) => {
    const toastId = toastFn(message, {
      ...defaultToastOptions,
      ...options,
    });
    return toastId;
  };
};

// Simplified global click-to-dismiss setup
export const setupGlobalToastDismiss = () => {
  // Add global click listener for all toasts using event delegation
  document.addEventListener('click', (event) => {
    const target = event.target as Element;
    const toastElement = target.closest('[data-hot-toast]') as HTMLElement;
    
    if (toastElement) {
      // Get toast ID directly from the data-hot-toast attribute
      const toastId = toastElement.getAttribute('data-hot-toast');
      if (toastId) {
        console.log('Dismissing toast with ID:', toastId); // Debug log
        toast.dismiss(toastId);
      } else {
        console.log('No toast ID found, dismissing all toasts'); // Debug log
        toast.dismiss();
      }
      
      // Prevent event bubbling
      event.stopPropagation();
      event.preventDefault();
    }
  }, true); // Use capture phase for better event handling

  // Add keyboard support (ESC to dismiss all)
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      toast.dismiss();
    }
  });

  // Enhanced mobile touch support
  let startX = 0;
  let startY = 0;
  let startTime = 0;
  
  document.addEventListener('touchstart', (event) => {
    const toastElement = (event.target as Element).closest('[data-hot-toast]');
    if (toastElement) {
      startX = event.touches[0].clientX;
      startY = event.touches[0].clientY;
      startTime = Date.now();
    }
  }, { passive: true });

  document.addEventListener('touchend', (event) => {
    const toastElement = (event.target as Element).closest('[data-hot-toast]');
    if (toastElement) {
      const endX = event.changedTouches[0].clientX;
      const endY = event.changedTouches[0].clientY;
      const endTime = Date.now();
      
      const deltaX = endX - startX;
      const deltaY = endY - startY;
      const deltaTime = endTime - startTime;
      
      // Check for swipe right (dismiss) or quick tap
      if (Math.abs(deltaX) > Math.abs(deltaY) && deltaX > 50 && deltaTime < 300) {
        // Swipe right to dismiss
        const toastId = toastElement.getAttribute('data-hot-toast');
        if (toastId) {
          toast.dismiss(toastId);
        } else {
          toast.dismiss();
        }
      } else if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10 && deltaTime < 200) {
        // Quick tap to dismiss
        const toastId = toastElement.getAttribute('data-hot-toast');
        if (toastId) {
          toast.dismiss(toastId);
        } else {
          toast.dismiss();
        }
      }
    }
  }, { passive: true });
};

export default toastUtils;
