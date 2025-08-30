// Socket.IO configuration with dynamic URL and port detection
const getBaseUrl = () => {
  // Get the base URL dynamically from the current window location
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  const port = window.location.port;

  // In development (localhost)
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return `http://localhost:${port || '5000'}`;
  }

  // In production (Netlify)
  return `${protocol}//${hostname}${port ? `:${port}` : ''}`;
};

export const SOCKET_URL = getBaseUrl();

export const SOCKET_OPTIONS = {
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
  autoConnect: false,
  path: '/socket.io',
  withCredentials: true,
  forceNew: true,
  secure: window.location.protocol === 'https:',
  rejectUnauthorized: false // Allow self-signed certificates in development
};