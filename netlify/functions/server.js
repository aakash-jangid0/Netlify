import serverless from 'serverless-http';
import { app, io } from './api.js';

// Create serverless handler for both HTTP and WebSocket
const handler = serverless(app);

// Export the handler with WebSocket support
export { handler, io };
