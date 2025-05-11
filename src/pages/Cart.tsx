import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Minus, Plus, Trash2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useOrders } from '../hooks/useOrders';
import { toast } from 'react-hot-toast';
import PageTransition from '../components/PageTransition';
import PaymentModal from '../components/PaymentModal';
import { generateAndProcessInvoice } from '../utils/orderInvoiceUtils';

function Cart() {
  const { cartItems, updateQuantity, removeFromCart, clearCart } = useCart();
  const { user } = useAuth();
  const { createOrder } = useOrders();
  const navigate = useNavigate();
  const [tableNumber, setTableNumber] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderType, setOrderType] = useState<'dine-in' | 'takeaway'>('dine-in');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'upi'>('cash');

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.18; // 18% tax
  const total = subtotal + tax;

  const handleQuantityChange = (id: string, newQuantity: number) => {
    if (newQuantity === 0) {
      removeFromCart(id);
    } else {
      updateQuantity(id, newQuantity);
    }
  };

  const handleCheckout = () => {
    if (!user) {
      toast.error('Please login to place an order');
      navigate('/auth');
      return;
    }

    if (orderType === 'dine-in' && !tableNumber.trim()) {
      toast.error('Please enter your table number');
      return;
    }

    setShowPaymentModal(true);
  };

  const handlePaymentComplete = async (receivedPaymentMethod?: string) => {
    if (!user?.id) {
      toast.error('User authentication error. Please try logging in again.');
      navigate('/auth');
      return;
    }

    setIsProcessing(true);
    try {
      // Use the received payment method if provided, otherwise use the selected one from state
      const finalPaymentMethod = receivedPaymentMethod || paymentMethod;
      
      const order = await createOrder({
        items: cartItems.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price
        })),
        totalAmount: total,
        user_id: user.id, 
        customerName: user?.user_metadata?.name || user?.email || '',
        tableNumber: orderType === 'dine-in' ? tableNumber : undefined,
        orderType,
        paymentMethod: finalPaymentMethod
      });
      
      // Use our consistent utility function to handle invoice generation, saving, and printing
      try {
        const invoiceResult = await generateAndProcessInvoice(
          order,               // order object
          cartItems,           // order items
          subtotal,            // subtotal
          tax,                 // tax
          total,               // total
          user?.user_metadata?.name || user?.email || 'Guest', // customer name
          undefined,           // customer phone (not captured in this flow)
          orderType === 'dine-in' ? tableNumber : 'Takeaway', // table number
          finalPaymentMethod   // payment method
        );
        
        // Invoice has been generated and saved to database, but we don't auto-print it
        // The invoice can be viewed/printed/downloaded from the order tracking page
        if (!invoiceResult) {
          // Only show a message if invoice creation failed
          console.warn('Could not generate invoice but order was placed successfully.');
        }
      } catch (invoiceError) {
        console.error('Error processing invoice:', invoiceError);
        toast.error('Failed to process invoice, but order was placed.');
      }
      
      clearCart();
      navigate(`/track/${order.id}`);
      toast.success('Order placed successfully!');
    } catch (error) {
      console.error('Error placing order:', error);
      toast.error('Failed to place order. Please try again.');
    } finally {
      setIsProcessing(false);
      setShowPaymentModal(false);
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-8">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </motion.button>
            <h1 className="text-2xl font-bold">Your Cart</h1>
          </div>

          {cartItems.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-4">
                {cartItems.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="bg-white rounded-lg shadow-sm p-4 flex items-center gap-4"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h3 className="font-medium">{item.name}</h3>
                      <p className="text-gray-500">₹{item.price}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                        className="p-1 hover:bg-gray-100 rounded-full"
                      >
                        <Minus className="w-4 h-4" />
                      </motion.button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                        className="p-1 hover:bg-gray-100 rounded-full"
                      >
                        <Plus className="w-4 h-4" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => removeFromCart(item.id)}
                        className="p-1 text-red-500 hover:bg-red-50 rounded-full ml-2"
                      >
                        <Trash2 className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
                  
                  <div className="mb-6">
                    <div className="flex gap-4 mb-4">
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

                    {orderType === 'dine-in' && (
                      <input
                        type="text"
                        value={tableNumber}
                        onChange={(e) => setTableNumber(e.target.value)}
                        placeholder="Enter your table number"
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                      />
                    )}
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal</span>
                      <span>₹{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tax (18%)</span>
                      <span>₹{tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-semibold pt-3 border-t">
                      <span>Total</span>
                      <span>₹{total.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-medium">Payment Method</h3>
                    <div className="flex gap-4">
                      {(['cash', 'card', 'upi'] as const).map((method) => (
                        <button
                          key={method}
                          onClick={() => setPaymentMethod(method)}
                          className={`flex-1 py-2 rounded-lg capitalize ${
                            paymentMethod === method
                              ? 'bg-orange-500 text-white'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {method}
                        </button>
                      ))}
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleCheckout}
                    disabled={isProcessing}
                    className="w-full bg-orange-500 text-white py-3 rounded-lg font-semibold hover:bg-orange-600 mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? 'Processing...' : 'Place Order'}
                  </motion.button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">Your cart is empty</p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/menu')}
                className="px-6 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600"
              >
                Browse Menu
              </motion.button>
            </div>
          )}
        </div>

        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          amount={total}
          onPaymentComplete={handlePaymentComplete}
          customerName={user?.user_metadata?.name}
          customerEmail={user?.email}
        />
      </div>
    </PageTransition>
  );
}

export default Cart;