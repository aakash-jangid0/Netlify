import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client - wrapped in try/catch for debugging
let supabase;
try {
  supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );
  console.log('Supabase client initialized successfully');
} catch (error) {
  console.error('Error initializing Supabase client:', error);
  // Continue without Supabase to see if we can identify where the error is
}

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  };

  // Debug info - log the environment variables (redacted for security)
  console.log('Environment variables check:', {
    hasSupabaseUrl: !!process.env.SUPABASE_URL,
    hasSupabaseKey: !!process.env.SUPABASE_ANON_KEY
  });

  // Handle OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers
    };
  }

  try {
    console.log('Request received:', {
      method: event.httpMethod,
      path: event.path,
      headers: {
        ...event.headers,
        authorization: event.headers.authorization ? 'REDACTED' : undefined
      },
      queryParams: event.queryStringParameters,
      hasBody: !!event.body
    });

    if (event.body) {
      try {
        const parsedBody = JSON.parse(event.body);
        console.log('Parsed request body:', {
          ...parsedBody,
          // Redact any sensitive information
          customerId: parsedBody.customerId ? 'PRESENT' : 'MISSING',
          orderId: parsedBody.orderId ? 'PRESENT' : 'MISSING',
          issue: parsedBody.issue ? 'PRESENT' : 'MISSING',
          category: parsedBody.category ? 'PRESENT' : 'MISSING',
          message: parsedBody.message ? 'PRESENT' : 'MISSING'
        });
      } catch (parseError) {
        console.error('Error parsing request body:', parseError);
      }
    }
    
    // For GET requests - return dummy data
    if (event.httpMethod === 'GET') {
      console.log('Handling GET request');
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify([
          { 
            id: 'debug-chat-id',
            customer_id: 'customer-123',
            order_id: 'order-456',
            status: 'open',
            last_message_at: new Date().toISOString(),
            customer_details: { name: 'Debug Customer', email: 'test@example.com', phone: '555-1234' },
            order_details: { total_amount: 100, status: 'delivered', order_number: '123456' }
          }
        ])
      };
    }

    // For POST requests - simple success response
    if (event.httpMethod === 'POST') {
      console.log('Handling POST request');
      
      // Try to parse the body
      const body = JSON.parse(event.body);
      const { customerId, orderId, message, issue, category, status } = body;

      // Simple validation
      if (!customerId || !orderId || (!message && !issue)) {
        console.log('Validation failed: Missing required fields');
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ 
            error: 'Missing required fields',
            details: 'Must provide either message or issue with customerId and orderId'
          })
        };
      }
      
      console.log('All validation passed, returning debug success response');
      
      // Return successful response without actually interacting with Supabase
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          success: true, 
          chatId: 'debug-chat-id',
          message: 'Debug response - function working without database interaction'
        })
      };
    }

    // If the method is not GET or POST
    console.log('Method not allowed:', event.httpMethod);
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ 
        error: 'Method not allowed',
        supportedMethods: ['GET', 'POST', 'OPTIONS']
      })
    };

  } catch (error) {
    console.error('Support chat error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message,
        stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined
      })
    };
  }
};
