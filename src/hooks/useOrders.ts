import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useRealtimeSync } from './useRealtimeSync';

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  notes?: string;
}

interface CreateOrderParams {
  items: OrderItem[];
  subtotal?: number;
  tax?: number;
  discount?: number;
  totalAmount: number;
  customerName: string;
  customerPhone?: string;
  tableNumber?: string;
  orderType: 'dine-in' | 'takeaway';
  paymentMethod: 'cash' | 'card' | 'upi' | 'razorpay' | 'pending';
  user_id?: string; // Added user_id property to fix type error
  coupon?: {
    id: number;
    code: string;
    discount_type: 'percentage' | 'fixed_amount';
    discount_value: number;
    discount_amount: number;
  } | null;
}

export function useOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Setup real-time sync for orders
  useRealtimeSync({
    table: 'orders',
    onInsert: (newOrder) => {
      setOrders(prev => [newOrder, ...prev]);
      toast.success('New order received!');
    },
    onUpdate: (updatedOrder) => {
      setOrders(prev => 
        prev.map(order => 
          order.id === updatedOrder.id ? updatedOrder : order
        )
      );
      if (updatedOrder.status === 'ready') {
        toast.success('Your order is ready!');
      }
    },
    onDelete: (deletedOrder) => {
      setOrders(prev => prev.filter(order => order.id !== deletedOrder.id));
    }
  });

  useEffect(() => {
    fetchOrders();
  }, [user]);

  const fetchOrders = async () => {
    try {
      if (!user) return;

      // First try to fetch orders using user_id if the column exists
      let orderData;
      try {
        const { data, error } = await supabase
          .from('orders')
          .select(`
            *,
            order_items (*)
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (!error) {
          orderData = data;
        }
      } catch (err) {
        console.log('Falling back to customer_name field for orders');
      }

      // If user_id query failed, try using customer_name as a fallback
      if (!orderData) {
        const { data, error } = await supabase
          .from('orders')
          .select(`
            *,
            order_items (*)
          `)
          .eq('customer_name', user.user_metadata?.name || user.email)
          .order('created_at', { ascending: false });

        if (error) throw error;
        orderData = data;
      }

      setOrders(orderData || []);
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const createOrder = async ({
    items,
    subtotal = 0,
    tax = 0,
    discount = 0,
    totalAmount,
    customerName,
    customerPhone,
    tableNumber,
    orderType,
    paymentMethod
  }: CreateOrderParams) => {
    try {
      if (!user) {
        throw new Error('User must be logged in to create an order');
      }

      // Validate phone number format if provided
      if (customerPhone && !/^[0-9]{10}$/.test(customerPhone)) {
        throw new Error('Invalid phone number format. Please enter 10 digits only.');
      }

      // Check if user_id column exists
      let orderData = {
        // Always include these fields
        customer_name: customerName,
        subtotal,
        tax,
        discount,
        total_amount: totalAmount,
        status: 'pending',
        // For cash and pending payments, always set to 'pending'
        payment_status: (paymentMethod === 'cash' || paymentMethod === 'pending') ? 'pending' : 'completed',
        customer_phone: customerPhone,
        table_number: tableNumber,
        order_type: orderType,
        payment_method: paymentMethod === 'pending' ? 'cash' : paymentMethod // Default to cash for pending payments
      };

      // First, try creating the order with user_id
      try {
        const { data, error } = await supabase
          .from('orders')
          .insert([{
            ...orderData,
            user_id: user.id
          }])
          .select()
          .single();

        if (!error) {
          // Successfully created order with user_id
          const { error: itemsError } = await supabase
            .from('order_items')
            .insert(
              items.map(item => ({
                order_id: data.id,
                name: item.name,
                quantity: item.quantity,
                price: item.price,
                notes: item.notes
              }))
            );

          if (itemsError) throw itemsError;
          toast.success('Order placed successfully!');
          return data;
        }
      } catch (err) {
        // If the user_id column doesn't exist, try without it
        console.log('Falling back to order creation without user_id');
      }

      // Fallback: Insert without user_id if the previous attempt failed
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([orderData])
        .select()
        .single();

      if (orderError) throw orderError;

      // Insert order items
      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(
          items.map(item => ({
            order_id: order.id,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            notes: item.notes
          }))
        );

      if (itemsError) throw itemsError;

      // Remove this toast to avoid duplicate success messages
      // The success message will be shown in the payment completion handler
      return order;
    } catch (error: any) {
      toast.error(error.message || 'Failed to create order');
      throw error;
    }
  };

  return {
    orders,
    loading,
    createOrder,
    fetchOrders
  };
}