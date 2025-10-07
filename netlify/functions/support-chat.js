const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with debug logging
let supabase;
try {
  console.log('Environment check:', {
    hasSupabaseUrl: !!process.env.SUPABASE_URL,
    hasSupabaseKey: !!process.env.SUPABASE_ANON_KEY,
    supabaseUrl: process.env.SUPABASE_URL ? 'SET' : 'MISSING',
    supabaseKey: process.env.SUPABASE_ANON_KEY ? 'SET' : 'MISSING'
  });

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    throw new Error('Missing required environment variables: SUPABASE_URL or SUPABASE_ANON_KEY');
  }

  supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );
  console.log('Supabase client initialized successfully');
} catch (error) {
  console.error('Error initializing Supabase client:', error);
  // Don't throw here, let the function continue and fail gracefully
}

// Helper function to get enriched chat data
async function getEnrichedChatData(chat) {
  const { data: customer } = await supabase
    .from('customers')
    .select('name, email, phone')
    .eq('id', chat.customer_id)
    .single();

  const { data: order } = await supabase
    .from('orders')
    .select('total_amount, status, created_at')
    .eq('id', chat.order_id)
    .single();

  return {
    ...chat,
    customer_details: customer || { name: 'Unknown', email: '', phone: '' },
    order_details: {
      ...(order || { total_amount: 0, status: 'unknown', created_at: null }),
      order_number: chat.order_id.slice(-6)
    }
  };
}

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  };

  // Handle OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers
    };
  }

  try {
    console.log('Function invoked:', {
      method: event.httpMethod,
      path: event.path,
      queryParams: event.queryStringParameters,
      hasBody: !!event.body,
      headers: Object.keys(event.headers || {})
    });

    // Check if Supabase is initialized
    if (!supabase) {
      console.error('Supabase client not initialized');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Database connection failed',
          details: 'Supabase client not initialized - check environment variables'
        })
      };
    }
    if (event.httpMethod === 'GET') {
      const params = new URLSearchParams(event.queryStringParameters);
      const role = params.get('role');
      const customerId = params.get('customerId');
      const healthCheck = params.get('health');

      // Health check endpoint
      if (healthCheck === 'true') {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            hasSupabase: !!supabase,
            environment: {
              hasSupabaseUrl: !!process.env.SUPABASE_URL,
              hasSupabaseKey: !!process.env.SUPABASE_ANON_KEY
            }
          })
        };
      }

      // Admin route - get all chats
      if (role === 'admin') {
        const { data: chats, error } = await supabase
          .from('support_chats')
          .select('*')
          .order('last_message_at', { ascending: false });

        if (error) throw error;

        const enrichedChats = await Promise.all(
          chats.map(chat => getEnrichedChatData(chat))
        );

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(enrichedChats)
        };
      }

      // Customer route - get customer's chats
      if (customerId) {
        const { data: chats, error } = await supabase
          .from('support_chats')
          .select('*')
          .eq('customer_id', customerId)
          .order('last_message_at', { ascending: false });

        if (error) throw error;

        const enrichedChats = await Promise.all(
          chats.map(chat => getEnrichedChatData(chat))
        );

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(enrichedChats)
        };
      }

      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required parameters' })
      };
    }

    // Handle POST request - Create new chat or send message
    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body);
      const { customerId, orderId, message, issue, category, status } = body;

      if (!customerId || !orderId || (!message && !issue)) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ 
            error: 'Missing required fields',
            details: 'Must provide either message or issue with customerId and orderId'
          })
        };
      }

      // Check if chat exists for this order
      let { data: existingChat } = await supabase
        .from('support_chats')
        .select('id')
        .eq('order_id', orderId)
        .single();

      let chatId;

      if (!existingChat) {
        // Create new chat - ensure issue and category are provided
        const chatData = {
          customer_id: customerId,
          order_id: orderId,
          status: status || 'active',
          last_message_at: new Date().toISOString(),
          issue: issue || 'General inquiry',
          category: category || 'general'
        };

        const { data: newChat, error: chatError } = await supabase
          .from('support_chats')
          .insert([chatData])
          .select()
          .single();

        if (chatError) {
          console.error('Error creating chat:', chatError);
          throw chatError;
        }
        chatId = newChat.id;
      } else {
        chatId = existingChat.id;
      }

      // Add message to chat - handle both regular message and issue/category case
      let messageText = message;
      
      // If no message but has issue/category, format them as the first message
      if (!message && issue) {
        messageText = `Category: ${category || 'General'}\nIssue: ${issue}`;
      }
      
      if (messageText) {
        const { error: messageError } = await supabase
          .from('chat_messages')
          .insert([{
            chat_id: chatId,
            sender_id: customerId,
            sender_type: 'customer',
            content: messageText,
            sent_at: new Date().toISOString()
          }]);

        if (messageError) throw messageError;
      }

      // Update last_message_at
      await supabase
        .from('support_chats')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', chatId);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, chatId })
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };

  } catch (error) {
    console.error('Support chat error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message
      })
    };
  }
};
