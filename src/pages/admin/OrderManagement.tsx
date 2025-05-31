import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Package, Check, X, Phone, AlertTriangle, Download, FileText, Printer, CreditCard } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { viewOrDownloadInvoice, fetchInvoiceByOrderId, printInvoice } from '../../utils/invoiceUtils';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  items: OrderItem[];
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  table_number: string;
  total_amount: number;
  status: 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  payment_status: 'pending' | 'completed' | 'failed';
  payment_method?: string;  // Added this optional property
  created_at: string;
}

function OrderManagement() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingInvoice, setLoadingInvoice] = useState<{[key: string]: boolean}>({});

  useEffect(() => {
    fetchOrders();
    
    // Set up real-time subscription
    const ordersSubscription = supabase
      .channel('orders_channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders'
        },
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      ordersSubscription.unsubscribe();
    };
  }, []);

  const fetchOrders = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('orders')
        .select(`
          id,
          customer_name,
          customer_phone,
          customer_email,
          table_number,
          total_amount,
          status,
          payment_status,
          created_at,
          order_items (
            id,
            name,
            quantity,
            price
          )
        `)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      const formattedOrders = data.map(order => ({
        ...order,
        items: order.order_items
      }));

      setOrders(formattedOrders);
      setError(null);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to fetch orders. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'preparing':
        return 'bg-blue-100 text-blue-800';
      case 'ready':
        return 'bg-green-100 text-green-800';
      case 'delivered':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      const { error: updateError } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (updateError) throw updateError;

      // Update local state to reflect the new status immediately
      setOrders(currentOrders => 
        currentOrders.map(order => 
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );

      toast.success(`Order status updated to ${newStatus}`);
    } catch (err) {
      console.error('Error updating order status:', err);
      toast.error('Failed to update order status');
    }
  };
  
  const updatePaymentStatus = async (orderId: string, newStatus: Order['payment_status']) => {
    try {
      const { error: updateError } = await supabase
        .from('orders')
        .update({ payment_status: newStatus })
        .eq('id', orderId);

      if (updateError) throw updateError;

      // Update local state to reflect the new payment status immediately
      setOrders(currentOrders => 
        currentOrders.map(order => 
          order.id === orderId ? { ...order, payment_status: newStatus } : order
        )
      );

      toast.success(`Payment status updated to ${newStatus}`);
    } catch (err) {
      console.error('Error updating payment status:', err);
      toast.error('Failed to update payment status');
    }
  };

  const handleViewInvoice = async (orderId: string) => {
    setLoadingInvoice(prev => ({...prev, [orderId]: true}));
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) {
        throw new Error('Order not found');
      }
      
      await viewOrDownloadInvoice(orderId, order, false);
    } catch (error) {
      console.error('Error viewing invoice:', error);
      toast.error('Failed to load invoice');
    } finally {
      setLoadingInvoice(prev => ({...prev, [orderId]: false}));
    }
  };

  const handlePrintInvoice = async (orderId: string) => {
    setLoadingInvoice(prev => ({...prev, [orderId]: true}));
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) {
        throw new Error('Order not found');
      }
      
      // First try to fetch from database
      const invoice = await fetchInvoiceByOrderId(orderId);
      
      if (invoice) {
        // Use the database invoice
        printInvoice(invoice);
      } else {
        // Generate an invoice with the order data if no invoice exists
        const invoiceData = {
          id: '',
          order_id: orderId,
          display_order_id: `#${order.id.slice(-6)}`, // Use shortened order ID format
          invoice_number: order.id.slice(-6).toUpperCase(),
          customer_name: order.customer_name || 'Guest',
          customer_phone: order.customer_phone,
          customer_email: order.customer_email,
          billing_address: '',
          invoice_date: new Date().toISOString(),
          subtotal: order.total_amount,
          tax_amount: order.total_amount * 0.18,
          discount_amount: 0,
          total_amount: order.total_amount * 1.18,
          status: 'issued' as 'issued',
          payment_method: order.payment_method || 'Cash',
          notes: '',
          terms_and_conditions: 'Standard terms apply',
          is_printed: false,
          print_count: 0,
          last_printed_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          items: order.items?.map((item: any) => ({
            id: item.id,
            invoice_id: '',
            item_name: item.name,
            quantity: item.quantity,
            unit_price: item.price,
            tax_rate: 0.18,
            tax_amount: item.price * item.quantity * 0.18,
            discount_amount: 0,
            total_amount: item.price * item.quantity * 1.18,
            created_at: new Date().toISOString()
          })) || []
        };
        
        printInvoice(invoiceData);
      }
    } catch (error) {
      console.error('Error printing invoice:', error);
      toast.error('Failed to print invoice');
    } finally {
      setLoadingInvoice(prev => ({...prev, [orderId]: false}));
    }
  };

  const handleDownloadInvoice = async (orderId: string) => {
    setLoadingInvoice(prev => ({...prev, [orderId]: true}));
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) {
        throw new Error('Order not found');
      }
      
      await viewOrDownloadInvoice(orderId, order, true);
      toast.success('Invoice downloaded successfully');
    } catch (error) {
      console.error('Error downloading invoice:', error);
      toast.error('Failed to download invoice');
    } finally {
      setLoadingInvoice(prev => ({...prev, [orderId]: false}));
    }
  };

  const filteredOrders = selectedStatus === 'all'
    ? orders
    : orders.filter(order => order.status === selectedStatus);

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Order Management</h1>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
        >
          <option value="all">All Orders</option>
          <option value="pending">Pending</option>
          <option value="preparing">Preparing</option>
          <option value="ready">Ready</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            <p className="text-yellow-700">{error}</p>
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {filteredOrders.map((order) => (
          <motion.div
            key={order.id}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-lg shadow p-6"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold">Order #{order.id.slice(-6)}</h3>
                <p className="text-sm text-gray-500">
                  <Clock className="w-4 h-4 inline mr-1" />
                  {new Date(order.created_at).toLocaleString()}
                </p>
                <div className="mt-2 space-y-1">
                  <p className="text-sm font-medium">
                    Customer: {order.customer_name}
                  </p>
                  <p className="text-sm text-gray-600 flex items-center">
                    <Phone className="w-4 h-4 mr-1" />
                    {order.customer_phone}
                  </p>
                  <p className="text-sm text-gray-600">
                    Table #{order.table_number}
                  </p>
                </div>
              </div>
              <div className="space-y-2 text-right">
                <span className={`inline-block px-3 py-1 rounded-full text-sm ${getStatusColor(order.status)}`}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
                <div className={`text-sm ${
                  order.payment_status === 'completed' ? 'text-green-600' : 'text-yellow-600'
                }`}>
                  Payment: {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
                </div>
              </div>
            </div>

            <div className="border-t border-b py-4 mb-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between items-center mb-2">
                  <span>{item.quantity}x {item.name}</span>
                  <span>Rs{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="flex justify-between items-center font-semibold mt-4 pt-4 border-t">
                <span>Total</span>
                <span>Rs{order.total_amount.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => updatePaymentStatus(
                  order.id, 
                  order.payment_status === 'pending' ? 'completed' : 'pending'
                )}
                className={`flex items-center px-4 py-2 ${
                  order.payment_status === 'pending' 
                    ? 'bg-green-500 hover:bg-green-600' 
                    : 'bg-yellow-500 hover:bg-yellow-600'
                } text-white rounded-lg`}
              >
                <CreditCard className="w-4 h-4 mr-2" />
                {order.payment_status === 'pending' 
                  ? 'Mark as Paid' 
                  : 'Mark as Pending'
                }
              </button>
              <button
                onClick={() => handleViewInvoice(order.id)}
                className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                disabled={loadingInvoice[order.id]}
              >
                <FileText className="w-4 h-4 mr-2" />
                View Invoice
              </button>
              <button
                onClick={() => handlePrintInvoice(order.id)}
                className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                disabled={loadingInvoice[order.id]}
              >
                <Printer className="w-4 h-4 mr-2" />
                Print Invoice
              </button>
              <button
                onClick={() => handleDownloadInvoice(order.id)}
                className="flex items-center px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                disabled={loadingInvoice[order.id]}
              >
                <Download className="w-4 h-4 mr-2" />
                Download Invoice
              </button>
            </div>
          </motion.div>
        ))}

        {filteredOrders.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg">
            <Package className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">No orders found</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default OrderManagement;