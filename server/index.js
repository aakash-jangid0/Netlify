import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import http from 'http';
import { fileURLToPath } from 'url';
import { setupSocketIO } from './socket.js';
import menuRoutes from './routes/menu.js';
import orderRoutes from './routes/orders.js';
import authRoutes from './routes/auth.js';
import razorpayRoutes from './routes/razorpay.js';
import categoryRoutes from './routes/categories.js';
import paymentsRoutes from './routes/payments.js';

// Get directory name properly in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the server directory
dotenv.config({ path: path.resolve(__dirname, '.env') });

// Log environment status
console.log('Server - SUPABASE_URL:', process.env.SUPABASE_URL ? 'Set ' : 'Not set ');
console.log('Server - SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? 'Set ' : 'Not set ');

// Create Express app
const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/razorpay', razorpayRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/payments', paymentsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Store the socket port once it's established
let currentSocketPort = null;

// Function to attempt socket server start on various ports
const startSocketServer = async () => {
  // Array of ports to try
  const socketPorts = [5000, 5001, 5002, 5003, 5004, 5005];
  
  for (const port of socketPorts) {
    try {
      // Skip the main server port if we're using it
      if (port === parseInt(process.env.PORT || 5000)) {
        continue;
      }
      
      const socketServer = http.createServer();
      const io = setupSocketIO(socketServer);
      
      await new Promise((resolve, reject) => {
        socketServer.once('error', (err) => {
          console.log(`Failed to start WebSocket server on port ${port}: ${err.message}`);
          reject(err);
        });
        
        socketServer.listen(port, () => {
          console.log(`WebSocket server running on port ${port}`);
          currentSocketPort = port;
          resolve();
        });
      });
      
      // If we reach here, the server started successfully
      console.log(`Successfully established WebSocket server on port: ${currentSocketPort}`);
      
      // Create an endpoint to inform clients which socket port to use
      app.get('/api/socket-port', (req, res) => {
        res.json({ port: currentSocketPort });
      });
      
      return;
    } catch (err) {
      // Continue trying the next port
      continue;
    }
  }
  
  console.error('Failed to start WebSocket server on any port');
  
  // Even if we couldn't start a separate WebSocket server,
  // provide the main server port as a fallback
  app.get('/api/socket-port', (req, res) => {
    res.json({ port: process.env.PORT || 5000 });
  });
};

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Create HTTP server for the main API
const server = http.createServer(app);

// Also setup Socket.IO on the main server as a fallback
setupSocketIO(server);

// Start servers
const PORT = process.env.PORT || 5000;
server.listen(PORT, async () => {
  console.log(`HTTP Server running on port ${PORT}`);
  
  // Start the WebSocket server after the HTTP server is running
  await startSocketServer();
});
