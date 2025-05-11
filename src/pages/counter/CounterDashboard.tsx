import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Package, Clock, History, User, Box, DollarSign, Plus, Minus, Trash2, AlertCircle, Phone } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { useOrderManagement } from '../../hooks/useOrderManagement';
import { useOrderForm } from '../../hooks/useOrderForm';
import { useMenuItems } from '../../hooks/useMenuItems';
import { calculateOrderTotals } from '../../utils/orderUtils';
import { generateAndProcessInvoice } from '../../utils/orderInvoiceUtils';

export default function CounterDashboard() {
  const [selectedTab, setSelectedTab] = useState<'new' | 'queue' | 'history'>('new');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [customerPhone, setCustomerPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');

  const { orderItems, addOrderItem, updateQuantity, updateNotes, clearOrder } = useOrderManagement();
  const { customerName, setCustomerName, tableNumber, setTableNumber, orderType, setOrderType, paymentMethod, setPaymentMethod, handleSubmit } = useOrderForm({
    orderItems,
    onSubmitOrder: async () => {
      if (!validatePhone()) {
        return;
      }

      if (orderItems.length === 0) {
        toast.error('Please add items to the order');
        return;
      }

      setIsLoading(true);
      try {
        const { subtotal, tax, total } = calculateOrderTotals(orderItems);

        // First insert the order
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .insert({
            customer_name: customerName,
            customer_phone: customerPhone,
            table_number: orderType === 'dine-in' ? tableNumber : null,
            order_type: orderType,
            payment_method: paymentMethod,
            payment_status: paymentMethod === 'cash' ? 'pending' : 'completed',
            total_amount: total,
            status: 'pending',
            subtotal,
            tax,
            discount: 0
          })
          .select()
          .single();

        if (orderError) throw orderError;
        
        // Then insert all order items to ensure they're associated with the order
        const orderItemsToInsert = orderItems.map(item => ({
          order_id: order.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          tax_rate: 0.18,
          notes: item.notes || ''
        }));
        
        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItemsToInsert);
          
        if (itemsError) {
          console.error('Error inserting order items:', itemsError);
          // Continue even if there's an error with items, as the order was created
        }

        // Generate the invoice using our unified utility function
        try {
          // Use the utility function to handle all invoice processing consistently
          const invoiceResult = await generateAndProcessInvoice(
            order,              // order object
            orderItems,         // order items 
            subtotal,           // subtotal
            tax,                // tax
            total,              // total
            customerName,       // customer name
            customerPhone,      // customer phone
            orderType === 'dine-in' ? tableNumber : undefined, // table number
            paymentMethod       // payment method
          );
          
          if (invoiceResult) {
            // Print the invoice
            invoiceResult.print();
            
            // Show success message with invoice info
            toast.success("Order created successfully! " + 
              (window.innerWidth < 768 ? 'Check for download or print prompt' : 'Invoice is being printed/downloaded'),
              { duration: 5000 }
            );
          } else {
            // Fall back to showing a generic success message if invoice processing failed
            toast.success("Order created successfully!", { duration: 3000 });
          }
        } catch (err: any) {
          console.error('Error processing invoice:', err);
          // Show more detailed error
          toast.error(
            `Failed to process invoice. ${err?.message || 'Please check if popups are allowed'}`,
            { duration: 5000 }
          );
        }
        clearOrder();
        setCustomerName('');
        setCustomerPhone('');
        setTableNumber('');
      } catch (error: any) {
        console.error('Error creating order:', error);
        toast.error(error.message || 'Failed to create order');
      } finally {
        setIsLoading(false);
      }
    }
  });

  const validatePhone = (): boolean => {
    const phoneRegex = /^[0-9]{10}$/;
    if (!customerPhone) {
      setPhoneError('Phone number is required');
      return false;
    }
    if (!phoneRegex.test(customerPhone)) {
      setPhoneError('Please enter a valid 10-digit phone number');
      return false;
    }
    setPhoneError('');
    return true;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
    setCustomerPhone(value);
    if (value.length === 10) {
      validatePhone();
    } else {
      setPhoneError(value.length > 0 ? 'Please enter a valid 10-digit phone number' : '');
    }
  };

  // Get menu items from Supabase
  const { menuItems, isLoading: isMenuLoading } = useMenuItems();
  
  // Filter menu items based on search and category (but show all availability states)
  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Calculate order totals
  const { subtotal, tax, total } = calculateOrderTotals(orderItems);

  const categories = [
    { id: 'all', name: 'All Items', icon: Box },
    { id: 'main', name: 'Main Course', icon: Package },
    { id: 'appetizer', name: 'Appetizers', icon: Package },
    { id: 'dessert', name: 'Desserts', icon: Package },
    { id: 'beverage', name: 'Beverages', icon: Package },
  ];

  const handleCustomerLookup = async () => {
    if (!validatePhone()) {
      return;
    }

    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('phone', customerPhone)
        .single();

      if (error) throw error;

      if (data) {
        setCustomerName(data.name);
        toast.success('Customer found!');
      } else {
        toast.error('Customer not found');
      }
    } catch (error: any) {
      console.error('Customer lookup error:', error);
      toast.error(error.message || 'Failed to lookup customer');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Stats */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-50 p-2 rounded-lg">
                <Package className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Today's Orders</p>
                <p className="text-xl font-semibold">0</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-green-50 p-2 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Today's Revenue</p>
                <p className="text-xl font-semibold">₹0.00</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-orange-50 p-2 rounded-lg">
                <Clock className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pending Orders</p>
                <p className="text-xl font-semibold">0</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        {/* Order Type Tabs */}
        <div className="flex items-center gap-4 mb-6">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelectedTab('new')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-colors ${
              selectedTab === 'new'
                ? 'bg-orange-500 text-white shadow-lg'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Package className="w-5 h-5" />
            <span className="font-medium">New Order</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelectedTab('queue')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-colors ${
              selectedTab === 'queue'
                ? 'bg-orange-500 text-white shadow-lg'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Clock className="w-5 h-5" />
            <span className="font-medium">Order Queue</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelectedTab('history')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-colors ${
              selectedTab === 'history'
                ? 'bg-orange-500 text-white shadow-lg'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            <History className="w-5 h-5" />
            <span className="font-medium">Order History</span>
          </motion.button>
        </div>

        <div className="flex gap-6">
          {/* Left Sidebar - Categories */}
          <div className="w-20 flex-shrink-0">
            <div className="space-y-4">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`w-full aspect-square rounded-lg flex flex-col items-center justify-center p-2 ${
                    selectedCategory === category.id
                      ? 'bg-orange-500 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <category.icon className="w-6 h-6" />
                  <span className="text-xs mt-1">{category.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1">
            {/* Search Bar */}
            <div className="flex gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search menu items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <button
                onClick={handleCustomerLookup}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 flex items-center gap-2"
              >
                <User className="w-5 h-5" />
                <span>Customer Lookup</span>
              </button>
            </div>

            {/* Menu Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredItems.map((item) => (
                <motion.div
                  key={item.id}
                  whileHover={{ scale: 1.02 }}
                  className={`bg-white rounded-lg shadow-sm overflow-hidden ${!item.isAvailable ? 'opacity-75' : ''}`}
                >
                  <div className="relative">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-40 object-cover"
                    />
                    {!item.isAvailable && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <span className="bg-red-500 text-white px-3 py-1 rounded-lg font-medium text-sm">
                          Unavailable
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium">{item.name}</h3>
                      <span className="text-orange-500 font-semibold">₹{item.price}</span>
                    </div>
                    <p className="text-sm text-gray-500 mb-4">{item.description}</p>
                    <button
                      onClick={() => addOrderItem(item)}
                      disabled={!item.isAvailable}
                      className={`w-full py-2 rounded-lg ${
                        item.isAvailable 
                          ? 'bg-orange-500 text-white hover:bg-orange-600' 
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {item.isAvailable ? 'Add to Order' : 'Unavailable'}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Right Sidebar - Order Details */}
          <div className="w-80 flex-shrink-0">
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="text-lg font-semibold mb-4">Order Details</h2>
              
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setOrderType('dine-in')}
                  className={`flex-1 py-2 rounded-lg ${
                    orderType === 'dine-in'
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  Dine In
                </button>
                <button
                  onClick={() => setOrderType('takeaway')}
                  className={`flex-1 py-2 rounded-lg ${
                    orderType === 'takeaway'
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  Takeaway
                </button>
              </div>

              <div className="space-y-4 mb-6">
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Customer Name"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                  required
                />
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={handlePhoneChange}
                    onBlur={validatePhone}
                    placeholder="Phone Number (10 digits)"
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 ${
                      phoneError ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                  />
                  {phoneError && (
                    <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {phoneError}
                    </p>
                  )}
                </div>
                {orderType === 'dine-in' && (
                  <input
                    type="text"
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    placeholder="Table Number"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                    required={orderType === 'dine-in'}
                  />
                )}
              </div>

              <div className="border-t pt-4">
                {orderItems.length === 0 ? (
                  <p className="text-gray-500 text-center">No items added to order</p>
                ) : (
                  <div className="space-y-4">
                    {orderItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-gray-500">₹{item.price}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="p-1 hover:bg-gray-100 rounded"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="p-1 hover:bg-gray-100 rounded"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => updateQuantity(item.id, 0)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-6 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax (18%)</span>
                  <span>₹{tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-semibold pt-2 border-t">
                  <span>Total</span>
                  <span>₹{total.toFixed(2)}</span>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  {(['cash', 'card', 'upi'] as const).map((method) => (
                    <button
                      key={method}
                      onClick={() => setPaymentMethod(method)}
                      className={`py-2 rounded-lg capitalize ${
                        paymentMethod === method
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={isLoading || orderItems.length === 0 || !customerName || (orderType === 'dine-in' && !tableNumber)}
                  className="w-full py-3 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Processing...' : 'Place Order'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}