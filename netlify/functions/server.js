import serverless from 'serverless-http';
import { app } from '../../server/index.js';

// Export the serverless function
export const handler = serverless(app, {
  binary: ['application/octet-stream', 'application/x-protobuf', 'application/json'],
});
