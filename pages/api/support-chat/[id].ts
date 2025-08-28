import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: 'Chat ID is required' });
    }

    if (req.method === 'GET') {
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
          ...(order || { total_amount: 0, status: 'unknown' }),
          order_number: chat.order_id.slice(-6) // Always use last 6 chars of order_id
        }
      };

      return res.status(200).json(enrichedChat);
    }

    if (req.method === 'PUT') {
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({ error: 'Status is required' });
      }

      // Validate status
      const validStatuses = ['active', 'resolved', 'closed'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }

      const updateData: Record<string, unknown> = { status };
      
      // Add resolved timestamp if resolving
      if (status === 'resolved') {
        updateData.resolved_at = new Date().toISOString();
      }

      const { data: updatedChat, error } = await supabase
        .from('support_chats')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating chat status:', error);
        return res.status(500).json({ error: 'Failed to update chat status' });
      }

      if (!updatedChat) {
        return res.status(404).json({ error: 'Chat not found' });
      }

      return res.status(200).json(updatedChat);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Chat API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
