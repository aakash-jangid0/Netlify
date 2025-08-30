import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

const setupChatHandlers = (io, socket) => {
  // Initialize Supabase client here where env vars are available
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );

  // Helper function to get proper UUID for user ID
  const getUserId = () => {
    if (socket.userId === 'admin' || (typeof socket.userId === 'string' && socket.userId.length < 36)) {
      return '00000000-0000-4000-8000-000000000001'; // Fixed admin UUID
    }
    return socket.userId;
  };

  // Ensure admin user exists in customers table
  const ensureAdminCustomer = async () => {
    try {
      // Check if admin exists
      const { data: admin, error: checkError } = await supabase
        .from('customers')
        .select('id')
        .eq('id', '00000000-0000-4000-8000-000000000001')
        .single();
      
      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking admin customer:', checkError);
        return false;
      }
      
      if (admin) {
        console.log('Admin customer exists');
        return true;
      }
      
      // Create admin customer if not exists
      const { data: newAdmin, error: insertError } = await supabase
        .from('customers')
        .insert({
          id: '00000000-0000-4000-8000-000000000001',
          name: 'Admin User',
          email: 'admin@tastybites.com',
          phone: 'N/A',
          address: 'System Admin',
          created_at: new Date().toISOString(),
          last_visit: new Date().toISOString(),
          total_orders: 0,
          total_spent: 0,
          status: 'active'
        })
        .select()
        .single();
      
      if (insertError) {
        console.error('Error creating admin customer:', insertError);
        return false;
      }
      
      console.log('Admin customer created:', newAdmin);
      return true;
    } catch (error) {
      console.error('Error in ensureAdminCustomer:', error);
      return false;
    }
  };

  // Join a chat room
  const joinChat = async (chatId) => {
    socket.join(`chat:${chatId}`);
  };

  // Leave a chat room
  const leaveChat = async (chatId) => {
    socket.leave(`chat:${chatId}`);
  };

  // Get chat by order ID
  const getChatByOrder = async (orderId, callback) => {
    try {
      const { data: chat, error } = await supabase
        .from('support_chats')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: false })
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (chat) {
        // Enrich with order details
        const { data: orderDetails } = await supabase
          .from('orders')
          .select('id, total_amount, status, table_number, created_at, customer_name')
          .eq('id', orderId)
          .single();
          
        chat.order_details = {
          ...(orderDetails || {
            total_amount: 0,
            status: 'unknown'
          }),
          order_number: orderId.slice(-6) // Always use last 6 chars of order_id
        };
      }
      
      callback(null, chat);
    } catch (error) {
      callback(error);
    }
  };

  // Start a new support chat
  const startChat = async ({ orderId, issue, category }, callback = () => {}) => {
    try {
      console.log('Starting chat for order:', orderId);
      
      // Get customer ID from the order (registered customers only)
      const { data: orderData, error: fetchOrderError } = await supabase
        .from('orders')
        .select('customer_id, user_id, id, total_amount, status, table_number, created_at, order_number, customer_name')
        .eq('id', orderId)
        .single();
        
      if (fetchOrderError) {
        console.error('Error fetching order:', fetchOrderError);
        throw new Error('Order not found');
      }
      
      // Use customer_id if available, otherwise fallback to user_id
      const customerId = orderData.customer_id || orderData.user_id;
      
      if (!orderData || !customerId) {
        const errorMessage = 'Chat support is only available for registered customers. Please create an account to access live chat support.';
        console.log('Chat access denied - no customer ID or user ID for order:', orderId);
        // Use proper callback error format - error as first parameter
        callback(new Error(errorMessage), null);
        socket.emit('chat:error', { message: errorMessage });
        return;
      }
      
      console.log('Using customer ID from order:', customerId);
      
      // Validate that customer exists and get customer details from profiles table
      let customerData;
      const { data: profileData, error: fetchCustomerError } = await supabase
        .from('profiles')
        .select('id, name, first_name, last_name, email, phone')
        .eq('id', customerId)
        .single();
        
      if (fetchCustomerError || !profileData) {
        console.error('Customer profile not found:', fetchCustomerError);
        // Fallback to customers table if profiles doesn't exist
        const { data: fallbackCustomer, error: fallbackError } = await supabase
          .from('customers')
          .select('id, name, email, phone')
          .eq('id', customerId)
          .single();
          
        if (fallbackError || !fallbackCustomer) {
          throw new Error('Customer not found in database');
        }
        
        // Use fallback customer data
        customerData = {
          id: fallbackCustomer.id,
          name: fallbackCustomer.name,
          email: fallbackCustomer.email || 'No Email',
          phone: fallbackCustomer.phone || 'No Phone'
        };
      } else {
        // Use profiles data with proper field mapping
        const fullName = profileData.name || 
                        (profileData.first_name && profileData.last_name ? 
                         `${profileData.first_name} ${profileData.last_name}` : 
                         profileData.first_name || profileData.last_name || 'Customer');
        
        customerData = {
          id: profileData.id,
          name: fullName,
          email: profileData.email || 'No Email',
          phone: profileData.phone || 'No Phone'
        };
      }
      
      // Check if there's already an active chat for this order
      const { data: existingChat, error: checkError } = await supabase
        .from('support_chats')
        .select()
        .eq('order_id', orderId)
        .eq('status', 'active')
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking existing chat:', checkError);
        throw checkError;
      }

      if (existingChat) {
        console.log('Found existing chat:', existingChat.id);
        await joinChat(existingChat.id);
        callback(null, existingChat);
        return;
      }

      // Generate a standardized order number from the order ID (last 6 characters)
      const orderNumber = orderId.slice(-6);
      console.log('Order found, using standardized order number:', orderNumber);

      // Use customer data we already fetched from profiles table
      const customerInfo = {
        id: customerId,
        name: customerData.name,
        email: customerData.email,
        phone: customerData.phone
      };

      console.log('Using customer info from profiles:', customerInfo);

      // Create a new chat in the support_chats table with minimal data
      const chatData = {
        order_id: orderId,
        customer_id: customerId,
        issue,
        category: category || 'order-issue', // Use valid category default
        status: 'active',
        messages: [], // Empty array for jsonb[] type
        order_details: {
          id: orderId, // Include the actual order ID
          order_number: orderNumber, // Standardized last 6 chars of order ID
          total_amount: orderData.total_amount,
          status: orderData.status,
          items: [], // Empty array since items are in separate table
          tableNumber: orderData.table_number,
          createdAt: orderData.created_at,
          customerName: orderData.customer_name
        },
        customer_details: customerInfo
      };

      console.log('Creating chat with data:', JSON.stringify(chatData, null, 2));

      // Format messages as a proper array for PostgreSQL jsonb[]
      // This ensures it works with the database schema
      if (Array.isArray(chatData.messages) && chatData.messages.length === 0) {
        console.log('Using empty array for messages');
      }

      // Insert the chat record with explicit handling for empty array
      const { data: newChat, error: chatError } = await supabase
        .from('support_chats')
        .insert({
          ...chatData,
          messages: Array.isArray(chatData.messages) ? chatData.messages : []
        })
        .select()
        .single();

      if (chatError) {
        console.error('Error creating support chat:', chatError);
        console.error('Chat data was:', JSON.stringify(chatData, null, 2));
        console.error('Error details:', {
          message: chatError.message,
          details: chatError.details,
          hint: chatError.hint,
          code: chatError.code
        });
        
        // If we get a foreign key error about users table, try a direct SQL approach as fallback
        if (chatError.code === '23503' && chatError.details?.includes('users')) {
          console.log('Attempting SQL fallback due to foreign key constraint error...');
          
          try {
            // Try direct SQL insert
            const { data: sqlResult, error: sqlError } = await supabase.rpc(
              'insert_support_chat',
              {
                p_customer_id: customerId,
                p_order_id: orderId,
                p_issue: issue,
                p_category: category || 'order-issue',
                p_customer_details: JSON.stringify(customerInfo),
                p_order_details: JSON.stringify(chatData.order_details)
              }
            );
            
            if (sqlError) {
              console.error('SQL fallback also failed:', sqlError);
              throw sqlError;
            }
            
            console.log('SQL fallback successful:', sqlResult);
            // Get the newly created chat
            const { data: insertedChat, error: fetchError } = await supabase
              .from('support_chats')
              .select()
              .eq('customer_id', customerId)
              .eq('order_id', orderId)
              .order('created_at', { ascending: false })
              .limit(1)
              .single();
              
            if (fetchError) {
              console.error('Error fetching inserted chat:', fetchError);
              throw fetchError;
            }
            
            await joinChat(insertedChat.id);
            callback(null, insertedChat);
            return;
          } catch (sqlFallbackError) {
            console.error('SQL fallback approach failed:', sqlFallbackError);
            throw chatError; // Throw the original error
          }
        } else {
          throw chatError;
        }
      }

      console.log('Chat created successfully:', newChat.id);

      // Join the chat room
      await joinChat(newChat.id);

      // Notify admins about new chat with correct customer details
      io.to('admin').emit('chat:new', {
        chat: {
          id: newChat.id,
          customer_id: customerId,
          order_id: orderId,
          issue,
          category,
          status: 'active',
          messages: [],
          created_at: newChat.created_at,
          last_message_at: newChat.created_at,
          customer_details: customerInfo, // Use the customer info we fetched from profiles
          order_details: newChat.order_details
        }
      });

      console.log('Admin notification sent with customer details:', customerInfo);

      // Emit chat:started event to the client
      socket.emit('chat:started', newChat);

      callback(null, newChat);
    } catch (error) {
      console.error('Error starting chat:', error);
      // Ensure error has proper message property
      const errorObj = new Error(error.message || error.toString() || 'Failed to start chat');
      callback(errorObj, null);
    }
  };

  // Send a message
  const sendMessage = async ({ chatId, content, senderId }, callback = () => {}) => {
    try {
      // Get the chat
      const { data: chat, error: chatError } = await supabase
        .from('support_chats')
        .select('*')
        .eq('id', chatId)
        .single();

      if (chatError) throw chatError;
      if (!chat) {
        throw new Error('Chat not found');
      }

      const message = {
        id: uuidv4(),
        sender: senderId === chat.customer_id ? 'customer' : 'admin',
        sender_id: senderId,
        content,
        timestamp: new Date().toISOString(),
        read: false
      };

      // Update chat with new message
      const { error: updateError } = await supabase
        .from('support_chats')
        .update({ 
          messages: [...(chat.messages || []), message],
          last_message_at: new Date().toISOString()
        })
        .eq('id', chatId);

      if (updateError) throw updateError;

      // Broadcast message to chat room
      io.to(`chat:${chatId}`).emit('chat:message', {
        chatId,
        message
      });

      callback(null, message);
    } catch (error) {
      console.error('Error sending message:', error);
      callback(error);
    }
  };

  // Mark messages as read
  const markMessagesRead = async (chatId, callback) => {
    try {
      // Provide default callback if none provided
      if (typeof callback !== 'function') {
        callback = () => {};
      }

      const { data: chat, error: chatError } = await supabase
        .from('support_chats')
        .select('messages')
        .eq('id', chatId)
        .single();

      if (chatError) throw chatError;
      if (!chat) {
        throw new Error('Chat not found');
      }

      const userId = getUserId();
      // Mark unread messages as read
      let updated = false;
      const updatedMessages = (chat.messages || []).map(msg => {
        if (!msg.read && msg.sender_id !== userId) {
          updated = true;
          return { ...msg, read: true };
        }
        return msg;
      });

      if (updated) {
        const { error: updateError } = await supabase
          .from('support_chats')
          .update({ messages: updatedMessages })
          .eq('id', chatId);

        if (updateError) throw updateError;

        io.to(`chat:${chatId}`).emit('chat:messagesRead', {
          chatId,
          userId: userId
        });
      }

      callback(null, { success: true });
    } catch (error) {
      console.error('Error marking messages as read:', error);
      callback(error);
    }
  };

  // Resolve chat
  const resolveChat = async (chatId, callback = () => {}) => {
    try {
      const { error: updateError } = await supabase
        .from('support_chats')
        .update({ 
          status: 'resolved',
          resolved_by: 'admin',
          resolved_at: new Date().toISOString()
        })
        .eq('id', chatId);

      if (updateError) throw updateError;

      io.to(`chat:${chatId}`).emit('chat:resolved', {
        chatId,
        resolvedBy: 'admin'
      });

      callback(null, { success: true });
    } catch (error) {
      console.error('Error resolving chat:', error);
      callback(error);
    }
  };

  // Register event handlers
  socket.on('chat:join', joinChat);
  socket.on('chat:leave', leaveChat);
  socket.on('chat:start', startChat);
  socket.on('chat:send', sendMessage);
  socket.on('chat:markRead', markMessagesRead);
  socket.on('chat:resolve', resolveChat);
  socket.on('chat:getByOrder', getChatByOrder);
  
  // Handle typing indicators
  socket.on('chat:typing', ({ chatId, isTyping }) => {
    // Broadcast typing status to the chat room
    socket.to(`chat:${chatId}`).emit('chat:typing', {
      chatId,
      userId: socket.user?.id,
      isTyping,
      userType: socket.user?.role === 'admin' ? 'admin' : 'customer'
    });
  });

  // Get all chats for admin
  socket.on('admin:getChats', async (callback) => {
    try {
      if (!socket.user?.role === 'admin') {
        throw new Error('Unauthorized');
      }

      const { data: chats, error } = await supabase
        .from('support_chats')
        .select('*')
        .order('last_message_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      
      // Process chats and add customer/order details
      const processedChats = await Promise.all((chats || []).map(async (chat) => {
        // Get order details (if not already stored)
        let orderDetails = chat.order_details;
        if (!orderDetails) {
          const { data: order } = await supabase
            .from('orders')
            .select('id, total_amount, status')
            .eq('id', chat.order_id)
            .single();
          
          orderDetails = {
            ...(order || {
              total_amount: 0,
              status: 'unknown'
            }),
            order_number: chat.order_id.slice(-6) // Always use last 6 chars of order_id
          };
        } else {
          // Always override order_number to ensure consistency
          orderDetails.order_number = chat.order_id.slice(-6);
        }

        // Use stored customer details (already fetched from profiles table when chat was created)
        // If not available, fall back to fresh query
        let customerDetails = chat.customer_details;
        if (!customerDetails || !customerDetails.email) {
          console.log('No stored customer details, fetching from profiles table for customer:', chat.customer_id);
          
          // Try profiles table first (for registered users)
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, name, first_name, last_name, email, phone')
            .eq('id', chat.customer_id)
            .single();

          if (profile) {
            customerDetails = {
              id: profile.id,
              name: profile.name || `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'User',
              email: profile.email,
              phone: profile.phone
            };
          } else {
            // Fall back to customers table
            const { data: customer } = await supabase
              .from('customers')
              .select('id, name, email, phone')
              .eq('id', chat.customer_id)
              .single();

            customerDetails = customer || {
              name: 'Unknown Customer',
              email: 'No email provided',
              phone: 'No phone provided'
            };
          }
        }

        return {
          ...chat,
          order_details: orderDetails,
          customer_details: customerDetails
        };
      }));
      
      console.log('Processed chats for admin:', processedChats.map(c => ({
        id: c.id,
        order_id: c.order_id,
        order_number: c.order_id.slice(-6) // Always use last 6 chars of order_id
      })));
      
      callback(null, processedChats);
    } catch (error) {
      console.error('Error fetching admin chats:', error);
      callback(error);
    }
  });

  // If user is admin, join admin room
  if (socket.user?.role === 'admin') {
    socket.join('admin');
  }

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected from chat:', socket.id);
  });
};

export default setupChatHandlers;
