import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;
    const { status, resolvedBy } = req.body;

    if (!id || !status) {
      return res.status(400).json({ error: 'Chat ID and status are required' });
    }

    const updateData: {
      status: string;
      last_message_at: string;
      resolved_by?: string;
      resolved_at?: string;
    } = { 
      status,
      last_message_at: new Date().toISOString()
    };

    if (status === 'resolved' && resolvedBy) {
      updateData.resolved_by = resolvedBy;
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

    const enrichedChat = {
      ...chat,
      customer_details: customer || { name: 'Unknown', email: '', phone: '' },
      order_details: {
        ...(order || { total_amount: 0, status: 'unknown' }),
        order_number: chat.order_id.slice(-6) // Always use last 6 chars of order_id
      }
    };

    return res.status(200).json(enrichedChat);
  } catch (error) {
    console.error('Status update error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
