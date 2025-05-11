import { Server } from 'socket.io';

export function setupSocketIO(server) {
  const io = new Server(server, {
    cors: {
      origin: 'http://localhost:5173', // Your frontend URL
      methods: ['GET', 'POST'],
      credentials: true,
    },
    path: '/socket.io', // Match client path
  });

  // Middleware for authentication
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (token) {
      // If token is provided, set userId
      socket.userId = token;
    } else {
      // Allow anonymous connections but mark them as such
      socket.userId = 'anonymous';
      console.log('Anonymous socket connection');
    }
    next();
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id, 'User ID:', socket.userId);
    
    // Log active connections count
    const activeSockets = Array.from(io.sockets.sockets).length;
    console.log(`Total active socket connections: ${activeSockets}`);

    // Handle client disconnection
    socket.on('disconnect', (reason) => {
      console.log('Client disconnected:', socket.id, 'Reason:', reason);
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    // Example: Join a room for order updates
    socket.on('join:orders', (orderId) => {
      socket.join(`order:${orderId}`);
    });

    // Example: Leave order room
    socket.on('leave:orders', (orderId) => {
      socket.leave(`order:${orderId}`);
    });
  });

  return io;
}