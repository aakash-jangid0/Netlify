const serverless = require('serverless-http');
const app = require('./index.js');

// Wrap your app with serverless
module.exports.handler = serverless(app);
