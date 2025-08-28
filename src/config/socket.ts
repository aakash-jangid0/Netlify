// Socket.IO configuration with dynamic URL detection
const isDevelopment = import.meta.env.MODE === 'development' || window.location.hostname === 'localhost';

// Dynamic socket URL detection
const getSocketUrl = () => {
  // In development, try environment variable first, then fallback to localhost
  if (isDevelopment) {
    return import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
  }
  
  // In production, use the same origin as the current page
  return window.location.origin;
};

export const SOCKET_URL = getSocketUrl();

export const SOCKET_OPTIONS = {
  transports: ['websocket', 'polling'], // Allow fallback to polling in production
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 10000,
  autoConnect: false, // We'll manually connect after auth
  path: '/socket.io', // Make sure this matches server path
};