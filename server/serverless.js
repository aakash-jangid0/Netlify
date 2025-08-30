import serverless from 'serverless-http';
import { app } from './index.js';

// Export both the Express app and the serverless handler
export const handler = serverless(app, {
  binary: ['application/octet-stream', 'application/x-protobuf', 'application/json'],
});

export { app };
