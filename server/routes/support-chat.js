import express from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

const router = express.Router();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// GET /api/support-chat - Get support chats
router.get('/', async (req, res) => {
  try {
    const { role } = req.query;
    console.log(`API Call: GET /api/support-chat?role=${role}`);

    if (role === 'admin') {
      // Get all support chats for admin with customer and order details
      const { data: chats, error } = await supabase
        .from('support_chats')
        .select('*')
        .order('last_message_at', { ascending: false });

      if (error) {
        console.error('Error fetching admin chats:', error);
        return res.status(500).json({ error: 'Failed to fetch chats' });
      }

      // Enrich chats with customer and order details
      const enrichedChats = await Promise.all(chats.map(async (chat) => {
        // Get customer details
        const { data: customer } = await supabase
          .from('customers')
          .select('name, email, phone')
          .eq('id', chat.customer_id)
          .single();

        // Get order details
        const { data: order } = await supabase
          .from('orders')
          .select('total_amount, status, created_at')
          .eq('id', chat.order_id)
          .single();

        return {
          ...chat,
          customer_details: customer || { name: 'Unknown', email: '', phone: '' },
          order_details: {
            ...(order || { totalAmount: 0, status: 'unknown' }),
            order_number: chat.order_id.slice(-6) // Always use last 6 chars of order_id
          }
        };
      }));
      
      return res.status(200).json(enrichedChats);
    }

    // For customer: get their chats
    const customerId = req.query.customerId;
    if (!customerId) {
      return res.status(400).json({ error: 'Customer ID is required' });
    }

    const { data: chats, error } = await supabase
      .from('support_chats')
      .select('*')
      .eq('customer_id', customerId)
      .order('last_message_at', { ascending: false });

    if (error) {
      console.error('Error fetching customer chats:', error);
      return res.status(500).json({ error: 'Failed to fetch chats' });
    }

      // Enrich with order details for customer
      const enrichedChats = await Promise.all(chats.map(async (chat) => {
        const { data: order } = await supabase
          .from('orders')
          .select('total_amount, status')
          .eq('id', chat.order_id)
          .single();

        return {
          ...chat,
          order_details: {
            ...(order || { totalAmount: 0, status: 'unknown' }),
            order_number: chat.order_id.slice(-6) // Always use last 6 chars of order_id
          }
        };
      }));    return res.status(200).json(enrichedChats);
    
  } catch (error) {
    console.error('Support chat API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/support-chat - Create a new support chat
router.post('/', async (req, res) => {
  try {
    const { order_id, customer_id, issue, category } = req.body;

    if (!order_id || !customer_id || !issue || !category) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if there's an active chat for this order
    const { data: existingChat, error: checkError } = await supabase
      .from('support_chats')
      .select()
      .eq('order_id', order_id)
      .eq('customer_id', customer_id)
      .eq('status', 'active')
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing chat:', checkError);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (existingChat) {
      return res.status(409).json({ error: 'Active chat already exists for this order' });
    }

    const { data: chat, error } = await supabase
      .from('support_chats')
      .insert({
        order_id,
        customer_id,
        issue,
        category,
        status: 'active',
        messages: [],
        last_message_at: new Date().toISOString()
      })
      .select('*')
      .single();

    if (error) {
      console.error('Error creating chat:', error);
      return res.status(500).json({ error: 'Failed to create chat' });
    }
    
    return res.status(201).json(chat);
  } catch (error) {
    console.error('Support chat creation error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/support-chat/message - Send a message to a chat
router.post('/message', async (req, res) => {
  try {
    const { chatId, content, sender, senderId } = req.body;

    if (!chatId || !content || !sender || !senderId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get the current chat
    const { data: chat, error: chatError } = await supabase
      .from('support_chats')
      .select('messages')
      .eq('id', chatId)
      .single();

    if (chatError) {
      console.error('Error fetching chat:', chatError);
      return res.status(500).json({ error: 'Failed to fetch chat' });
    }

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    // Create new message
    const message = {
      id: crypto.randomUUID(),
      sender,
      sender_id: senderId,
      content,
      timestamp: new Date().toISOString(),
      read: false
    };

    // Update chat with new message
    const updatedMessages = [...(chat.messages || []), message];
    
    const { error: updateError } = await supabase
      .from('support_chats')
      .update({ 
        messages: updatedMessages,
        last_message_at: new Date().toISOString()
      })
      .eq('id', chatId);

    if (updateError) {
      console.error('Error updating chat:', updateError);
      return res.status(500).json({ error: 'Failed to send message' });
    }

    return res.status(201).json({ message, success: true });
  } catch (error) {
    console.error('Message sending error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/support-chat/:id/status - Update chat status
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const updateData = { 
      status,
      last_message_at: new Date().toISOString()
    };

    if (status === 'resolved') {
      updateData.resolved_by = 'admin';
      updateData.resolved_at = new Date().toISOString();
    }

    const { data: chat, error } = await supabase
      .from('support_chats')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error('Error updating chat status:', error);
      return res.status(500).json({ error: 'Failed to update status' });
    }

    return res.status(200).json(chat);
  } catch (error) {
    console.error('Status update error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/support-chat/:id - Get a specific chat by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: chat, error } = await supabase
      .from('support_chats')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching chat:', error);
      return res.status(500).json({ error: 'Failed to fetch chat' });
    }

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    // Get order details
    const { data: order } = await supabase
      .from('orders')
      .select('total_amount, status, created_at')
      .eq('id', chat.order_id)
      .single();

    // Get customer details
    const { data: customer } = await supabase
      .from('customers')
      .select('name, email, phone')
      .eq('id', chat.customer_id)
      .single();

    const enrichedChat = {
      ...chat,
      customer_details: customer || { name: 'Unknown', email: '', phone: '' },
      order_details: {
        ...(order || { totalAmount: 0, status: 'unknown' }),
        order_number: chat.order_id.slice(-6) // Always use last 6 chars of order_id
      }
    };

    return res.status(200).json(enrichedChat);
  } catch (error) {
    console.error('Chat fetch error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
