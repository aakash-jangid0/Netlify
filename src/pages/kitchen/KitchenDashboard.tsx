import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, AlertCircle, CheckCircle2, Timer, ChefHat, Search, 
  Filter, User, Phone, MapPin, Coffee, AlertTriangle, ArrowRight,
  CheckCircle, XCircle, Clock4, Utensils, DollarSign, Users
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../../lib/supabase';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  notes?: string;
  preparation_status: 'not_started' | 'in_progress' | 'completed' | 'on_hold';
  started_at?: string;
  completed_at?: string;
  estimated_time?: number;
}

interface Order {
  id: string;
  order_items: OrderItem[];
  customer_name: string;
  table_number?: string;
  order_type: 'dine-in' | 'takeaway';
  status: 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  created_at: string;
  estimated_completion_time?: string;
  priority_level?: 'low' | 'normal' | 'high' | 'urgent';
  special_requirements?: string;
  assigned_chef?: string;
  preparation_notes?: string;
  delay_reason?: string;
  total_amount: number;
  payment_status: string;
  payment_method: string;
  customer_phone?: string;
}

function KitchenDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [orderType, setOrderType] = useState<string>('all');
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    preparingOrders: 0,
    completedOrders: 0
  });

  useEffect(() => {
    fetchOrders();
    const subscription = setupRealtimeSubscription();
    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const newStats = {
      totalOrders: orders.length,
      pendingOrders: orders.filter(o => o.status === 'pending').length,
      preparingOrders: orders.filter(o => o.status === 'preparing').length,
      completedOrders: orders.filter(o => o.status === 'ready').length
    };
    setStats(newStats);
  }, [orders]);

  const setupRealtimeSubscription = () => {
    return supabase
      .channel('orders_channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders'
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const { data: orderData, error: orderError } = await supabase
              .from('orders')
              .select('*, order_items(*)')
              .eq('id', payload.new.id)
              .single();

            if (!orderError && orderData) {
              setOrders(prev => [orderData, ...prev]);
              toast.success('New order received!', {
                icon: '🔔',
                style: {
                  background: '#10B981',
                  color: '#fff'
                }
              });
            }
          } else if (payload.eventType === 'UPDATE') {
            const { data: orderData, error: orderError } = await supabase
              .from('orders')
              .select('*, order_items(*)')
              .eq('id', payload.new.id)
              .single();

            if (!orderError && orderData) {
              setOrders(prev => 
                prev.map(order => 
                  order.id === payload.new.id ? orderData : order
                )
              );
            }
          }
        }
      )
      .subscribe();
  };

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .not('status', 'eq', 'delivered')
        .not('status', 'eq', 'cancelled')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
      setError(null);
    } catch (error: any) {
      console.error('Error in fetchOrders:', error);
      setError(error.message);
      toast.error('Failed to fetch orders');
    } finally {
      setIsLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      const updateData = { 
        status: newStatus,
        ...(newStatus === 'preparing' ? {
          estimated_completion_time: new Date(Date.now() + 20 * 60000).toISOString()
        } : {})
      };

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId);

      if (error) throw error;
      
      // Immediately update the local state for a responsive UI
      setOrders(prev => 
        prev.map(order => 
          order.id === orderId 
            ? { 
                ...order, 
                status: newStatus, 
                ...(newStatus === 'preparing' ? {
                  estimated_completion_time: new Date(Date.now() + 20 * 60000).toISOString()
                } : {})
              } 
            : order
        )
      );
      
      toast.success(`Order status updated to ${newStatus}`, {
        icon: '✅',
        style: {
          background: '#10B981',
          color: '#fff'
        }
      });
    } catch (error: any) {
      console.error('Error updating order status:', error);
      toast.error(error.message || 'Failed to update order status');
    }
  };

  const updateItemStatus = async (orderId: string, itemId: string, newStatus: OrderItem['preparation_status']) => {
    try {
      const { error } = await supabase
        .from('order_items')
        .update({ 
          preparation_status: newStatus,
          ...(newStatus === 'in_progress' ? { started_at: new Date().toISOString() } : {}),
          ...(newStatus === 'completed' ? { completed_at: new Date().toISOString() } : {})
        })
        .eq('id', itemId);

      if (error) throw error;

      setOrders(prev => 
        prev.map(order => 
          order.id === orderId 
            ? {
                ...order,
                order_items: order.order_items.map(item =>
                  item.id === itemId 
                    ? { ...item, preparation_status: newStatus }
                    : item
                )
              }
            : order
        )
      );

      toast.success(`Item status updated to ${newStatus}`, {
        icon: '👨‍🍳',
        style: {
          background: '#10B981',
          color: '#fff'
        }
      });
    } catch (error: any) {
      console.error('Error updating item status:', error);
      toast.error(error.message || 'Failed to update item status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'preparing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ready':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'delivered':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getOrderBgColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-50 border-amber-200';
      case 'preparing':
        return 'bg-blue-50 border-blue-200';
      case 'ready':
        return 'bg-emerald-50 border-emerald-200';
      default:
        return 'bg-white border-gray-200';
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesStatus = selectedStatus === 'all' || order.status === selectedStatus;
    const matchesType = orderType === 'all' || order.order_type === orderType;
    const matchesSearch = searchQuery === '' || 
      order.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.id.slice(-6).toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.order_items.some(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      );

    return matchesStatus && matchesType && matchesSearch;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Error Loading Orders</h2>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={fetchOrders}
          className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-all"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center">
                <div className="bg-emerald-500 p-3 rounded-lg mr-4">
                  <ChefHat className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Kitchen Dashboard</h1>
                  <p className="text-sm text-gray-500">
                    {orders.length} active orders • Last updated: {new Date().toLocaleTimeString()}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 items-center">
                <div className="relative flex-1 md:min-w-[300px]">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search orders..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  />
                </div>

                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 transition-all"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="preparing">Preparing</option>
                  <option value="ready">Ready</option>
                </select>

                <select
                  value={orderType}
                  onChange={(e) => setOrderType(e.target.value)}
                  className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 transition-all"
                >
                  <option value="all">All Types</option>
                  <option value="dine-in">Dine In</option>
                  <option value="takeaway">Takeaway</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <Utensils className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending</p>
                <p className="text-2xl font-bold text-amber-600">{stats.pendingOrders}</p>
              </div>
              <div className="bg-amber-100 p-3 rounded-lg">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Preparing</p>
                <p className="text-2xl font-bold text-blue-600">{stats.preparingOrders}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <ChefHat className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Completed</p>
                <p className="text-2xl font-bold text-emerald-600">{stats.completedOrders}</p>
              </div>
              <div className="bg-emerald-100 p-3 rounded-lg">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Orders List */}
        <div className="grid grid-cols-1 gap-4">
          <AnimatePresence>
            {filteredOrders.map((order) => {
              const timeElapsed = new Date(order.created_at).toLocaleString();
              const isDelayed = order.status !== 'ready' && order.status !== 'delivered' && 
                order.estimated_completion_time && new Date(order.estimated_completion_time) < new Date();

              return (
                <motion.div
                  key={order.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`bg-white rounded-lg shadow-sm border ${getOrderBgColor(order.status)} p-4`}
                >
                  <div className="flex flex-wrap md:flex-nowrap gap-4 items-start">
                    {/* Order Info */}
                    <div className="w-full md:w-1/4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          #{order.id.slice(-6)}
                          {isDelayed && (
                            <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                              Delayed
                            </span>
                          )}
                        </h3>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </div>
                      <div className="mt-2 space-y-1 text-sm">
                        <div className="flex items-center gap-2 text-gray-500">
                          <Clock className="w-4 h-4" />
                          <span>{timeElapsed}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span>{order.customer_name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span>{order.order_type === 'dine-in' ? `Table ${order.table_number}` : 'Takeaway'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="flex-1">
                      <div className="space-y-2">
                        {order.order_items?.map((item) => (
                          <div key={item.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="bg-white p-2 rounded-lg">
                                <Coffee className="w-5 h-5 text-gray-600" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{item.quantity}x</span>
                                  <span>{item.name}</span>
                                </div>
                                {item.notes && (
                                  <p className="text-sm text-emerald-600 mt-1">{item.notes}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {item.preparation_status === 'not_started' && (
                                <button
                                  onClick={() => updateItemStatus(order.id, item.id, 'in_progress')}
                                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors flex items-center gap-1"
                                >
                                  <Clock4 className="w-4 h-4" />
                                  <span>Start</span>
                                </button>
                              )}
                              {item.preparation_status === 'in_progress' && (
                                <button
                                  onClick={() => updateItemStatus(order.id, item.id, 'completed')}
                                  className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors flex items-center gap-1"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                  <span>Complete</span>
                                </button>
                              )}
                              {item.preparation_status === 'completed' && (
                                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg flex items-center gap-1">
                                  <CheckCircle className="w-4 h-4" />
                                  <span>Done</span>
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Order Actions */}
                    <div className="w-full md:w-auto flex md:flex-col gap-2 justify-end">
                      {order.status === 'pending' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'preparing')}
                          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 whitespace-nowrap"
                        >
                          <Timer className="w-4 h-4" />
                          Start Preparing
                        </button>
                      )}
                      {order.status === 'preparing' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'ready')}
                          className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors flex items-center gap-2 whitespace-nowrap"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Mark Ready
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {filteredOrders.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
              <CheckCircle2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No orders found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default KitchenDashboard;