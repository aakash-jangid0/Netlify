import express from 'express';
import { supabase } from '../lib/supabase.js';
import { auth as authMiddleware, requireAdmin as adminMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Get all customers
router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    res.json(data);
  } catch (error) {
    console.error('Error fetching customers:', error.message);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// Get customer by ID with orders and details
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    // Get customer basic info
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', req.params.id)
      .single();
    
    if (customerError) throw customerError;
    
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Get customer orders with detailed information
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        id,
        order_number,
        status,
        payment_status,
        total_amount,
        subtotal,
        tax,
        discount,
        coupon_code,
        coupon_discount_amount,
        customer_name,
        customer_phone,
        customer_email,
        table_number,
        order_type,
        payment_method,
        created_at,
        updated_at,
        user_id,
        coupon_id,
        order_items (
          id,
          name,
          quantity,
          price,
          total_price,
          category,
          description,
          image_url
        )
      `)
      .or(`customer_id.eq.${req.params.id},customer_phone.eq.${customer.phone},customer_email.eq.${customer.email}`)
      .order('created_at', { ascending: false });

    if (ordersError) throw ordersError;

    // Get invoices for the customer's orders
    let invoices = [];
    if (orders && orders.length > 0) {
      const orderIds = orders.map(order => order.id);
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .select(`
          id,
          order_id,
          invoice_number,
          amount,
          status,
          payment_status,
          due_date,
          issued_date,
          paid_date,
          notes,
          created_at,
          updated_at
        `)
        .in('order_id', orderIds)
        .order('created_at', { ascending: false });

      if (!invoiceError) {
        invoices = invoiceData || [];
      }
    }

    // Get payments for the customer
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select(`
        id,
        order_id,
        amount,
        payment_method,
        status,
        transaction_id,
        payment_date,
        created_at,
        razorpay_payment_id,
        razorpay_order_id
      `)
      .or(`customer_id.eq.${req.params.id}`)
      .order('created_at', { ascending: false });

    // Combine all data
    const customerWithDetails = {
      ...customer,
      orders: orders || [],
      invoices: invoices || [],
      payments: payments || [],
      statistics: {
        totalOrders: orders?.length || 0,
        totalSpent: orders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0,
        averageOrderValue: orders?.length > 0 ? 
          (orders.reduce((sum, order) => sum + (order.total_amount || 0), 0) / orders.length) : 0,
        lastOrderDate: orders?.length > 0 ? orders[0].created_at : null,
        completedOrders: orders?.filter(order => order.status === 'completed').length || 0,
        pendingOrders: orders?.filter(order => ['pending', 'confirmed', 'preparing', 'ready'].includes(order.status)).length || 0,
        cancelledOrders: orders?.filter(order => order.status === 'cancelled').length || 0
      }
    };
    
    res.json(customerWithDetails);
  } catch (error) {
    console.error(`Error fetching customer with ID ${req.params.id}:`, error.message);
    res.status(500).json({ error: 'Failed to fetch customer details' });
  }
});

export default router;
