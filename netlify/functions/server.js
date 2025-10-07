import serverless from 'serverless-http';
import express from 'express';
import cors from 'cors';

const app = express();

// Middleware
app.use(cors({
  origin: '*',
  credentials: true,
}));

app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', serverless: true, timestamp: new Date().toISOString() });
});

// API routes placeholder - since we're using Supabase directly for most operations
app.get('/api/status', (req, res) => {
  res.json({ 
    status: 'running',
    mode: 'serverless',
    features: ['supabase-realtime', 'rest-api'],
    note: 'Chat system now uses Supabase realtime instead of WebSocket'
  });
});

// Create serverless handler
const handler = serverless(app, {
  binary: ['application/octet-stream'],
});

export { handler };
