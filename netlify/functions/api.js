import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import { Server } from 'socket.io';

// Initialize Express app
const app = express();

// Middleware
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// Basic health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Socket.IO setup for Netlify
const io = new Server({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Socket connection handler
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('chat:join', (chatId) => {
    socket.join(`chat:${chatId}`);
    console.log(`Socket ${socket.id} joined chat room: ${chatId}`);
  });

  socket.on('chat:leave', (chatId) => {
    socket.leave(`chat:${chatId}`);
    console.log(`Socket ${socket.id} left chat room: ${chatId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Export the serverless handler
export { app, io };
