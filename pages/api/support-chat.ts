import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      // For admin: get all chats
      if (req.query.role === 'admin') {
        const { data: chats, error } = await supabase
          .from('support_chats')
          .select('*')
          .order('last_message_at', { ascending: false });

        if (error) throw error;

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
              ...(order || { total_amount: 0, status: 'unknown' }),
              order_number: chat.order_id.slice(-6) // Always use last 6 chars of order_id
            }
          };
        }));

        return res.status(200).json(enrichedChats);
      }

      // For customer: get their chats
      const customerId = req.query.customerId as string;
      if (!customerId) {
        return res.status(400).json({ error: 'Customer ID is required' });
      }

      const { data: chats, error } = await supabase
        .from('support_chats')
        .select('*')
        .eq('customer_id', customerId)
        .order('last_message_at', { ascending: false });

      if (error) throw error;

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
            ...(order || { total_amount: 0, status: 'unknown' }),
            order_number: chat.order_id.slice(-6) // Always use last 6 chars of order_id
          }
        };
      }));

      return res.status(200).json(enrichedChats);
    }

    // For creating a new chat
    if (req.method === 'POST') {
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

      if (checkError && checkError.code !== 'PGRST116') throw checkError;
      
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

      if (error) throw error;
      
      // Enrich the response with customer and order details
      const { data: customer } = await supabase
        .from('customers')
        .select('name, email, phone')
        .eq('id', customer_id)
        .single();

      const { data: order } = await supabase
        .from('orders')
        .select('order_number, total_amount, status')
        .eq('id', order_id)
        .single();

      const enrichedChat = {
        ...chat,
        customer_details: customer || { name: 'Unknown', email: '', phone: '' },
        order_details: order || { order_number: 'N/A', total_amount: 0, status: 'unknown' }
      };

      return res.status(201).json(enrichedChat);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
