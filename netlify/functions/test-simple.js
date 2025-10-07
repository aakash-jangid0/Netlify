// Simple test function to verify Netlify Functions are working correctly
exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };
  
  // Handle OPTIONS request for CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers
    };
  }
  
  // Log request details for debugging
  console.log('Test function received request:', {
    method: event.httpMethod,
    path: event.path,
    headers: event.headers,
    body: event.body ? '(body present)' : '(no body)'
  });
  
  // Simple success response for any request
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      success: true,
      message: 'Test function is working',
      timestamp: new Date().toISOString(),
      requestMethod: event.httpMethod
    })
  };
};