import serverless from 'serverless-http';
import express from 'express';
import { Server } from 'socket.io';
import { createServer } from 'http';
import cors from 'cors';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: true,
    methods: ['GET', 'POST'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
  },
  path: '/socket.io',
});

// Middleware
app.use(cors({
  origin: '*',
  credentials: true,
}));

app.use(express.json());

// Socket.IO handlers
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('chat:join', (chatId) => {
    socket.join(`chat:${chatId}`);
    console.log(`Socket ${socket.id} joined chat:${chatId}`);
  });

  socket.on('chat:message', (message) => {
    io.to(`chat:${message.chatId}`).emit('chat:message', message);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', socketConnected: io.engine.clientsCount });
});

// Create serverless handler that works with WebSocket
const handler = serverless(app, {
  binary: ['application/octet-stream'],
  provider: {
    platformId: process.env.NETLIFY || 'local',
  },
});

export { handler };
