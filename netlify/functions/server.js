const serverless = require('serverless-http');
const { app } = require('../../server/index.js');

// Export the serverless function
module.exports.handler = serverless(app, {
  binary: ['application/octet-stream', 'application/x-protobuf', 'application/json'],
});
