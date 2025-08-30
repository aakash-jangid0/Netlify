import { handler } from './server.js';

export const wsHandler = async (event, context) => {
  if (event.httpMethod === 'GET' && event.path === '/.netlify/functions/server/socket-test') {
    return {
      statusCode: 200,
      body: JSON.stringify({ status: 'WebSocket endpoint is accessible' })
    };
  }
  
  return handler(event, context);
};
