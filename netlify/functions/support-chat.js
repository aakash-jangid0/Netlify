const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with debug logging
let supabase;
try {
  console.log('Environment check:', {
    hasSupabaseUrl: !!process.env.SUPABASE_URL,
    hasSupabaseKey: !!process.env.SUPABASE_ANON_KEY,
    supabaseUrl: process.env.SUPABASE_URL || 'MISSING',
    supabaseKey: process.env.SUPABASE_ANON_KEY ? 'SET' : 'MISSING',
    allEnvKeys: Object.keys(process.env).filter(key => key.includes('SUPABASE'))
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
  console.log(`🔍 Enriching chat data for chat ID: ${chat.id}`);
  
  try {
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('name, email, phone')
      .eq('id', chat.customer_id)
      .single();

    if (customerError && customerError.code !== 'PGRST116') {
      console.warn('⚠️ Error fetching customer:', customerError);
    } else {
      console.log('✅ Customer data fetched:', !!customer);
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('total_amount, status, created_at')
      .eq('id', chat.order_id)
      .single();

    if (orderError && orderError.code !== 'PGRST116') {
      console.warn('⚠️ Error fetching order:', orderError);
    } else {
      console.log('✅ Order data fetched:', !!order);
    }

    const enrichedData = {
      ...chat,
      customer_details: customer || { name: 'Unknown', email: '', phone: '' },
      order_details: {
        ...(order || { total_amount: 0, status: 'unknown', created_at: null }),
        order_number: chat.order_id.slice(-6)
      }
    };

    console.log('✅ Chat data enriched successfully');
    return enrichedData;
  } catch (error) {
    console.error('❌ Error enriching chat data:', error);
    // Return basic data even if enrichment fails
    return {
      ...chat,
      customer_details: { name: 'Unknown', email: '', phone: '' },
      order_details: { total_amount: 0, status: 'unknown', order_number: chat.order_id.slice(-6) }
    };
  }
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
    console.log('OPTIONS request handled');
    return {
      statusCode: 204,
      headers
    };
  }

  try {
    console.log('=== SUPPORT CHAT FUNCTION START ===');
    console.log('Function invoked:', {
      method: event.httpMethod,
      path: event.path,
      queryParams: event.queryStringParameters,
      hasBody: !!event.body,
      headers: Object.keys(event.headers || {})
    });

    // Check if Supabase is initialized
    if (!supabase) {
      console.error('❌ Supabase client not initialized');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Database connection failed',
          details: 'Supabase client not initialized - check environment variables'
        })
      };
    }

    console.log('✅ Supabase client is initialized');
    if (event.httpMethod === 'GET') {
      console.log('📥 Processing GET request');
      const params = new URLSearchParams(event.queryStringParameters);
      const role = params.get('role');
      const customerId = params.get('customerId');
      const healthCheck = params.get('health');

      console.log('GET params:', { role, customerId, healthCheck });

      // Health check endpoint
      if (healthCheck === 'true') {
        console.log('🏥 Health check requested');
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
        console.log('👨‍💼 Admin route - fetching all chats');
        try {
          const { data: chats, error } = await supabase
            .from('support_chats')
            .select('*')
            .order('last_message_at', { ascending: false });

          if (error) {
            console.error('❌ Error fetching admin chats:', error);
            throw error;
          }

          console.log(`✅ Found ${chats?.length || 0} chats for admin`);

          const enrichedChats = await Promise.all(
            chats.map(chat => getEnrichedChatData(chat))
          );

          console.log('✅ Admin chats enriched successfully');
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify(enrichedChats)
          };
        } catch (error) {
          console.error('❌ Admin route error:', error);
          throw error;
        }
      }

      // Customer route - get customer's chats
      if (customerId) {
        console.log(`👤 Customer route - fetching chats for customer: ${customerId}`);
        try {
          const { data: chats, error } = await supabase
            .from('support_chats')
            .select('*')
            .eq('customer_id', customerId)
            .order('last_message_at', { ascending: false });

          if (error) {
            console.error('❌ Error fetching customer chats:', error);
            throw error;
          }

          console.log(`✅ Found ${chats?.length || 0} chats for customer ${customerId}`);

          const enrichedChats = await Promise.all(
            chats.map(chat => getEnrichedChatData(chat))
          );

          console.log('✅ Customer chats enriched successfully');
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify(enrichedChats)
          };
        } catch (error) {
          console.error('❌ Customer route error:', error);
          throw error;
        }
      }

      console.log('❌ GET request missing required parameters');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required parameters' })
      };
    }

    // Handle POST request - Create new chat or send message
    if (event.httpMethod === 'POST') {
      console.log('📤 Processing POST request');
      
      let body;
      try {
        body = JSON.parse(event.body);
        console.log('✅ Request body parsed successfully');
        console.log('Request data:', {
          hasCustomerId: !!body.customerId,
          hasOrderId: !!body.orderId,
          hasMessage: !!body.message,
          hasIssue: !!body.issue,
          hasCategory: !!body.category,
          status: body.status
        });
      } catch (parseError) {
        console.error('❌ Error parsing request body:', parseError);
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ 
            error: 'Invalid JSON in request body',
            details: parseError.message
          })
        };
      }

      const { customerId, orderId, message, issue, category, status } = body;

      if (!customerId || !orderId || (!message && !issue)) {
        console.log('❌ Validation failed:', {
          customerId: !!customerId,
          orderId: !!orderId,
          message: !!message,
          issue: !!issue
        });
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ 
            error: 'Missing required fields',
            details: 'Must provide either message or issue with customerId and orderId'
          })
        };
      }

      console.log('✅ Validation passed');

      try {
        // Check if chat exists for this order
        console.log(`🔍 Checking for existing chat for order: ${orderId}`);
        let { data: existingChat, error: searchError } = await supabase
          .from('support_chats')
          .select('id')
          .eq('order_id', orderId)
          .single();

        if (searchError && searchError.code !== 'PGRST116') {
          console.error('❌ Error searching for existing chat:', searchError);
          throw searchError;
        }

        console.log('Existing chat result:', { 
          found: !!existingChat, 
          chatId: existingChat?.id,
          searchError: searchError?.code 
        });

        // Find customer record (needed for both new and existing chats)
        console.log(`🔍 Finding customer by auth user_id: ${customerId}`);
        let customerRecord = null;
        
        // Try to find by user_id first (auth ID)
        const { data: customerByUserId, error: userIdError } = await supabase
          .from('customers')
          .select('id, name, email, phone, user_id')
          .eq('user_id', customerId)
          .single();

        if (!userIdError && customerByUserId) {
          customerRecord = customerByUserId;
          console.log(`✅ Customer found by user_id: ${customerRecord.name} (${customerRecord.email})`);
        } else {
          // Fallback: try to find by id
          console.log(`🔍 Customer not found by user_id, trying by id: ${customerId}`);
          const { data: customerById, error: idError } = await supabase
            .from('customers')
            .select('id, name, email, phone, user_id')
            .eq('id', customerId)
            .single();
          
          if (!idError && customerById) {
            customerRecord = customerById;
            console.log(`✅ Customer found by id: ${customerRecord.name} (${customerRecord.email})`);
          }
        }

        if (!customerRecord) {
          console.log(`❌ Customer ${customerId} not found by user_id or id`);
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
              error: 'Customer not found',
              message: `Customer with auth ID ${customerId} not found. Please ensure you are logged in with a registered account.`,
              code: 'CUSTOMER_NOT_FOUND'
            })
          };
        }

        // Use the actual customer ID from database
        const actualCustomerId = customerRecord.id;

        let chatId;

        if (!existingChat) {
          console.log('📝 Creating new chat');

          // Create new chat - ensure issue and category are provided
          const chatData = {
            customer_id: actualCustomerId, // Use the actual customer ID from database
            order_id: orderId,
            status: status || 'active',
            last_message_at: new Date().toISOString(),
            issue: issue || 'General inquiry',
            category: category || 'general'
          };

          console.log('Chat data to insert:', chatData);

          const { data: newChat, error: chatError } = await supabase
            .from('support_chats')
            .insert([chatData])
            .select()
            .single();

          if (chatError) {
            console.error('❌ Error creating chat:', chatError);
            throw chatError;
          }
          
          console.log('✅ New chat created:', { id: newChat.id });
          chatId = newChat.id;
        } else {
        console.log('✅ Using existing chat:', existingChat.id);
        chatId = existingChat.id;
      }

      // Add message to chat - handle both regular message and issue/category case
      let messageText = message;
      
      // If no message but has issue/category, format them as the first message
      if (!message && issue) {
        messageText = `Category: ${category || 'General'}\nIssue: ${issue}`;
        console.log('📝 Formatted initial message from issue/category');
      }
      
      if (messageText) {
        console.log('💬 Adding message to chat');
        const messageData = {
          chat_id: chatId,
          sender_id: actualCustomerId, // Use actual customer ID instead of auth user ID
          sender_type: 'customer',
          content: messageText,
          sent_at: new Date().toISOString()
        };

        console.log('Message data to insert:', messageData);

        const { error: messageError } = await supabase
          .from('chat_messages')
          .insert([messageData]);

        if (messageError) {
          console.error('❌ Error adding message:', messageError);
          throw messageError;
        }
        
        console.log('✅ Message added successfully');
      }

      // Update last_message_at
      console.log('🕒 Updating last_message_at timestamp');
      const { error: updateError } = await supabase
        .from('support_chats')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', chatId);

      if (updateError) {
        console.error('❌ Error updating last_message_at:', updateError);
        throw updateError;
      }

      console.log('✅ Chat updated successfully');
      console.log('🎉 POST request completed successfully');

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, chatId })
      };

      } catch (postError) {
        console.error('❌ POST request error:', postError);
        throw postError;
      }
    }

    console.log('❌ Method not allowed:', event.httpMethod);
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };

  } catch (error) {
    console.error('❌ FUNCTION ERROR:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      stack: error.stack
    });
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message,
        code: error.code,
        details: error.details
      })
    };
  }
};