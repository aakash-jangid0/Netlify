import { Server } from 'socket.io';
import setupChatHandlers from './socket/chatHandlers.js';

export function setupSocketIO(server) {
  const io = new Server(server, {
    cors: {
      origin: process.env.NODE_ENV === 'production' 
        ? ['https://tastybites-v2.netlify.app', /\.netlify\.app$/]
        : 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization']
    },
    path: process.env.NODE_ENV === 'production' 
      ? '/.netlify/functions/server/socket.io'
      : '/socket.io',
    allowEIO3: true,
    serveClient: false,
    connectTimeout: 45000,
    pingTimeout: 30000,
    pingInterval: 25000,
    upgradeTimeout: 30000,
    transports: ['websocket', 'polling']
  });

  // Middleware for authentication
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    const userData = socket.handshake.auth.user;
    
    if (token) {
      // If token is provided, set userId
      socket.userId = token;
      
      // Store user data if provided
      if (userData) {
        socket.user = userData;
      }
    } else {
      // Allow anonymous connections but mark them as such
      socket.userId = 'anonymous';
      console.log('Anonymous socket connection');
    }
    next();
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id, 'User ID:', socket.userId, 'Role:', socket.user?.role || 'none');
    
    // Log active connections count
    const activeSockets = Array.from(io.sockets.sockets).length;
    console.log(`Total active socket connections: ${activeSockets}`);

    // Set up support chat handlers
    setupChatHandlers(io, socket);

    // Handle order updates
    socket.on('join:orders', (orderId) => {
      socket.join(`order:${orderId}`);
      console.log(`Socket ${socket.id} joined order room: ${orderId}`);
    });

    socket.on('leave:orders', (orderId) => {
      socket.leave(`order:${orderId}`);
      console.log(`Socket ${socket.id} left order room: ${orderId}`);
    });

    // Handle client disconnection
    socket.on('disconnect', (reason) => {
      console.log('Client disconnected:', socket.id, 'Reason:', reason);
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });

  return io;
}