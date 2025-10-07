import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Helper function to validate JWT token from Supabase
async function validateToken(authHeader) {
  if (!authHeader) return null;
  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error) return null;
  return user;
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
    // Validate authentication
    const user = await validateToken(event.headers.authorization);
    
    if (event.httpMethod === 'GET') {
      const params = new URLSearchParams(event.queryStringParameters);
      const role = params.get('role');
      const customerId = params.get('customerId');

      // Admin route - get all chats
      if (role === 'admin') {
        // Verify admin role here if needed
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

      // Check if we're creating a new chat (issue & category) or sending a message
      const isNewChat = issue && category;
      const isMessage = message && !isNewChat;

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
        // Create new chat
        const { data: newChat, error: chatError } = await supabase
          .from('support_chats')
          .insert([{
            customer_id: customerId,
            order_id: orderId,
            status: status || 'open',
            last_message_at: new Date().toISOString(),
            // Add issue and category if provided
            ...(issue && { issue }),
            ...(category && { category })
          }])
          .select()
          .single();

        if (chatError) throw chatError;
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
            message: messageText,
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
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
