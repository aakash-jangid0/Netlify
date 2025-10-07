const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// In production, we need to use the Netlify Function URL which is at /.netlify/functions/server
export const SOCKET_URL = isDevelopment 
  ? 'http://localhost:5000' 
  : `${window.location.protocol}//${window.location.host}`;

export const SOCKET_OPTIONS = {
  path: isDevelopment ? '/socket.io' : '/.netlify/functions/server/socket.io',
  transports: ['websocket', 'polling'],
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
  forceNew: true,
  multiplex: false
};