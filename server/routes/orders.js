import express from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory name properly in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the server directory
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

console.log('Orders route - SUPABASE_URL:', supabaseUrl ? 'Set ✓' : 'Not set ✗');
console.log('Orders route - SUPABASE_ANON_KEY:', supabaseKey ? 'Set ✓' : 'Not set ✗');

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Supabase environment variables missing in orders route!');
}

const supabase = createClient(supabaseUrl, supabaseKey);

const router = express.Router();

// Create a new order
router.post('/', async (req, res) => {
  try {
    const { items, customerInfo, totalAmount, status, paymentStatus } = req.body;
    
    const { data: savedOrder, error } = await supabase
      .from('orders')
      .insert([{
        items,
        customer_info: customerInfo,
        total_amount: totalAmount,
        status,
        payment_status: paymentStatus,
        created_at: new Date()
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    res.status(201).json(savedOrder);
  } catch (err) {
    console.error('Error creating order:', err);
    res.status(400).json({ message: err.message });
  }
});

// Get all orders
router.get('/', async (req, res) => {
  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    res.json(orders);
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ message: err.message });
  }
});

// Get a specific order
router.get('/:id', async (req, res) => {
  try {
    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', req.params.id)
      .single();
    
    if (error) throw error;
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    res.json(order);
  } catch (err) {
    console.error('Error fetching order:', err);
    res.status(500).json({ message: err.message });
  }
});

// Update order status
router.put('/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    
    if (!updatedOrder) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    res.json(updatedOrder);
  } catch (err) {
    console.error('Error updating order:', err);
    res.status(400).json({ message: err.message });
  }
});

export default router;