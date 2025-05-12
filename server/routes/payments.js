import express from 'express';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const router = express.Router();

// Save payment details
router.post('/', async (req, res) => {
  try {
    console.log('Received payment details:', req.body);
    
    const { 
      orderId, 
      amount,
      method, 
      status, 
      transactionId, 
      transactionData 
    } = req.body;

    // Validate the request
    if (!orderId || !method || !status || !amount) {
      console.error('Missing required fields in payment request');
      return res.status(400).json({ error: 'Missing required fields' });
    }

    console.log('Saving payment to database');

    // Save payment details to database
    const { data, error } = await supabase
      .from('payments')
      .insert([
        {
          order_id: orderId,
          amount: amount,
          payment_method: method,
          payment_status: status,
          transaction_id: transactionId || null,
          payment_details: transactionData || null,
          created_at: new Date().toISOString(),
        },
      ])
      .select();

    if (error) {
      console.error('Error saving payment:', error);
      return res.status(500).json({ error: 'Failed to save payment details' });
    }

    console.log('Payment saved. Updating order payment status');

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

    console.log('Order updated successfully');
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Error processing payment:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Get payment details for an order
router.get('/order/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error fetching payment:', error);
      return res.status(500).json({ error: 'Failed to fetch payment details' });
    }
    
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error retrieving payment:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Make sure we're exporting as default
export { router as default };
