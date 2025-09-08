import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers
    };
  }

  try {
    if (event.httpMethod === 'POST') {
      const { chatId, messageId } = JSON.parse(event.body);

      // Get the message details
      const { data: message, error: messageError } = await supabase
        .from('chat_messages')
        .select(`
          *,
          sender:sender_id (
            name,
            role
          )
        `)
        .eq('id', messageId)
        .single();

      if (messageError) throw messageError;

      // Broadcast the message using Supabase realtime
      await supabase
        .from('chat_messages')
        .on('INSERT', payload => {
          // Handle new message
          if (payload.new.chat_id === chatId) {
            return {
              statusCode: 200,
              headers,
              body: JSON.stringify(payload.new)
            };
          }
        })
        .subscribe();

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, message })
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };

  } catch (error) {
    console.error('Real-time chat error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
