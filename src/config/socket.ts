// Socket.IO configuration
export const SOCKET_URL = 'http://localhost:5000';

export const SOCKET_OPTIONS = {
  transports: ['websocket'], // Force WebSocket transport only
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 10000,
  autoConnect: false, // We'll manually connect after auth
  path: '/socket.io', // Make sure this matches server path
};