import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      orderId, 
      method, 
      status, 
      transactionId, 
      transactionData 
    } = req.body;

    // Validate the request
    if (!orderId || !method || !status) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Save payment details to database
    const { data, error } = await supabase
      .from('payments')
      .insert([
        {
          order_id: orderId,
          payment_method: method,
          payment_status: status,
          transaction_id: transactionId || null,
          payment_details: transactionData || null,
          created_at: new Date().toISOString(),
        },
      ]);

    if (error) {
      console.error('Error saving payment:', error);
      return res.status(500).json({ error: 'Failed to save payment details' });
    }

    // Update order payment status
    const { error: orderUpdateError } = await supabase
      .from('orders')
      .update({ 
        payment_status: status,
        payment_method: method
      })
      .eq('id', orderId);

    if (orderUpdateError) {
      console.error('Error updating order payment status:', orderUpdateError);
      return res.status(500).json({ error: 'Failed to update order payment status' });
    }

    return res.status(200).json({ success: true, data });
  } catch (error: any) {
    console.error('Error processing payment:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
