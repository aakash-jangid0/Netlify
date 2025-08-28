import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSupportChat } from '../../hooks/useSupportChat';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '../../lib/supabase';
import { 
  ArrowLeft, 
  Send, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  MessageCircle, 
  User, 
  Headphones,
  Smile,
  MoreVertical,
  UserX
} from 'lucide-react';

interface SupportChatModalProps {
  orderId: string;
  onClose?: () => void;
  isOpen: boolean;
}

export const SupportChatModal: React.FC<SupportChatModalProps> = ({ orderId, onClose, isOpen }) => {
  const [issue, setIssue] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [category, setCategory] = useState('');
  const [isRegisteredCustomer, setIsRegisteredCustomer] = useState<boolean | null>(null);
  const [customerCheckLoading, setCustomerCheckLoading] = useState(true);
  const [hasEverInitialized, setHasEverInitialized] = useState<boolean | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const {
    chatId,
    messages,
    status,
    error,
    loading,
    startChat,
    sendMessage,
    markMessagesAsRead,
    setTypingStatus,
    currentChat
  } = useSupportChat(orderId);

  // Check if the order belongs to a registered customer and if chat has been initialized before
  useEffect(() => {
    const checkCustomerRegistration = async () => {
      if (!orderId || !isOpen) return;
      
      setCustomerCheckLoading(true);
      try {
        // Get the order and check if it has a customer_id or user_id
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select('customer_id, user_id')
          .eq('id', orderId)
          .single();

        if (orderError) {
          console.error('Error fetching order:', orderError);
          setIsRegisteredCustomer(false);
          setHasEverInitialized(false);
          return;
        }

        // Check if we have a customer_id 
        const customerIdToCheck = orderData.customer_id;
        
        if (!customerIdToCheck) {
          setIsRegisteredCustomer(false);
          setHasEverInitialized(false);
          return;
        }

        // Verify the customer exists in customers table (should always exist due to foreign key constraint)
        let customerExists = false;
        
        const { data: customerData, error: customerError } = await supabase
          .from('customers')
          .select('id, user_id')
          .eq('id', customerIdToCheck)
          .single();
        
        if (!customerError && customerData) {
          customerExists = true;
          
          // If customer has a user_id, check if it exists in profiles
          if (customerData.user_id) {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('id')
              .eq('id', customerData.user_id)
              .single();
              
            if (profileData) {
              // This is a registered user with a profile
              customerExists = true;
            }
          }
        }
        
        setIsRegisteredCustomer(customerExists);

        // Check if any chat has ever been created for this order (regardless of status)
        if (customerExists) {
          const { data: chatHistory, error: chatError } = await supabase
            .from('support_chats')
            .select('id, status')
            .eq('order_id', orderId)
            .limit(1);

          if (!chatError && chatHistory && chatHistory.length > 0) {
            console.log('Chat has been initialized before for this order:', chatHistory[0]);
            setHasEverInitialized(true);
          } else {
            console.log('No previous chat found for this order');
            setHasEverInitialized(false);
          }
        } else {
          setHasEverInitialized(false);
        }
        
      } catch (error) {
        console.error('Error checking customer registration:', error);
        setIsRegisteredCustomer(false);
        setHasEverInitialized(false);
      } finally {
        setCustomerCheckLoading(false);
      }
    };

    checkCustomerRegistration();
  }, [orderId, isOpen]);

  // Debug: Log the current state when modal opens
  useEffect(() => {
    if (isOpen) {
      console.log('SupportChatModal opened with:', {
        orderId,
        chatId,
        status,
        error,
        loading,
        messagesCount: messages?.length || 0,
        isRegisteredCustomer,
        hasEverInitialized,
        shouldShowCategoryForm: (hasEverInitialized === false || (hasEverInitialized === true && !chatId)),
        shouldShowExistingChat: chatId && hasEverInitialized === true
      });
    }
  }, [isOpen, orderId, chatId, status, error, loading, messages, isRegisteredCustomer, hasEverInitialized]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark messages as read when chat is mounted
  useEffect(() => {
    if (chatId) {
      markMessagesAsRead();
    }
  }, [chatId, markMessagesAsRead]);

  const handleStartChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (issue.trim() && category) {
      try {
        await startChat(issue, category);
        setHasEverInitialized(true); // Mark as initialized after successful chat start
        console.log('Chat started successfully');
      } catch (error) {
        console.error('Failed to start chat:', error);
        // Error is already handled in the hook, just log here
      }
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      sendMessage(newMessage);
      setNewMessage('');
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'order-issue':
        return '📦';
      case 'food-quality':
        return '🍽️';
      case 'delivery':
        return '🚚';
      case 'payment':
        return '💳';
      default:
        return '❓';
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'active':
        return { icon: <Clock className="w-4 h-4" />, text: 'Active', color: 'text-orange-600 bg-orange-100' };
      case 'resolved':
        return { icon: <CheckCircle className="w-4 h-4" />, text: 'Resolved', color: 'text-green-600 bg-green-100' };
      default:
        return { icon: <AlertCircle className="w-4 h-4" />, text: 'Pending', color: 'text-gray-600 bg-gray-100' };
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
        onClick={() => onClose?.()}
      >
        <motion.div
          initial={{ y: '100%', opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: '100%', opacity: 0, scale: 0.9 }}
          transition={{ type: 'spring', damping: 25, stiffness: 500 }}
          className="w-full max-w-2xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col h-[100vh] sm:h-[90vh] sm:max-h-[750px] backdrop-blur-sm border border-gray-200/50 safe-area-inset-bottom"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-gray-200/80 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 text-white rounded-t-3xl sticky top-0 z-10 shadow-lg backdrop-blur-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                <motion.button
                  onClick={onClose}
                  whileHover={{ scale: 1.1, rotate: 180 }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                  className="p-2 sm:p-2.5 hover:bg-white/20 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/50 backdrop-blur-sm touch-manipulation"
                  aria-label="Close chat"
                >
                  <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                </motion.button>
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                  <motion.div 
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
                    className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/30 flex-shrink-0"
                  >
                    <Headphones className="w-5 h-5 sm:w-6 sm:h-6" />
                  </motion.div>
                  <div className="min-w-0 flex-1">
                    <motion.h3 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                      className="font-bold text-lg sm:text-xl truncate"
                    >
                      Customer Support
                    </motion.h3>
                    <motion.div 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 }}
                      className="flex items-center gap-2 flex-wrap"
                    >
                      <p className="text-sm text-blue-100 font-medium truncate">Order #{orderId.slice(-6)}</p>
                      <div className="flex items-center gap-1 text-xs text-green-300 bg-green-500/20 px-2 py-1 rounded-full backdrop-blur-sm flex-shrink-0">
                        <motion.div 
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ repeat: Infinity, duration: 2 }}
                          className="w-2 h-2 bg-green-400 rounded-full"
                        />
                        Online
                      </div>
                    </motion.div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                {chatId && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 }}
                    className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-2 rounded-xl text-white backdrop-blur-sm border border-white/20 ${
                      status === 'active' ? 'bg-green-500/30' : 
                      status === 'resolved' ? 'bg-blue-500/30' : 'bg-orange-500/30'
                    }`}
                  >
                    <motion.div
                      animate={{ rotate: status === 'active' ? 360 : 0 }}
                      transition={{ duration: 2, repeat: status === 'active' ? Infinity : 0 }}
                    >
                      {getStatusInfo(status).icon}
                    </motion.div>
                    <span className="text-xs sm:text-sm font-semibold hidden sm:inline">{getStatusInfo(status).text}</span>
                  </motion.div>
                )}
                <motion.button 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-2 hover:bg-white/20 rounded-xl transition-all duration-200 touch-manipulation"
                >
                  <MoreVertical className="w-4 h-4 sm:w-5 sm:h-5" />
                </motion.button>
              </div>
            </div>
          </div>

          {/* Chat Content */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 bg-gradient-to-b from-gray-50/50 via-white to-blue-50/30 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
            {customerCheckLoading || hasEverInitialized === null ? (
              // Loading state while checking customer registration and chat history
              <div className="flex items-center justify-center h-full">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center"
                >
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-4"
                  />
                  <motion.p 
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="text-gray-600 font-medium"
                  >
                    Checking your access...
                  </motion.p>
                </motion.div>
              </div>
            ) : isRegisteredCustomer === false ? (
              // Show message for non-registered customers
              <div className="flex items-center justify-center h-full p-4">
                <motion.div
                  initial={{ opacity: 0, y: 30, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.6, type: 'spring', stiffness: 300 }}
                  className="text-center bg-white p-6 md:p-8 rounded-3xl shadow-xl border border-gray-100 max-w-md w-full backdrop-blur-sm"
                >
                  <motion.div 
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.3, type: 'spring', stiffness: 400 }}
                    className="w-20 h-20 bg-gradient-to-br from-orange-100 to-red-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
                  >
                    <UserX className="w-10 h-10 text-orange-600" />
                  </motion.div>
                  <motion.h4 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-2xl font-bold text-gray-900 mb-4 bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent"
                  >
                    Registration Required
                  </motion.h4>
                  <motion.p 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="text-gray-600 mb-6 leading-relaxed"
                  >
                    Live chat support is available exclusively for registered customers. 
                    Please create an account to access our premium support service.
                  </motion.p>
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="space-y-3"
                  >
                    <motion.button
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => window.location.href = '/auth?mode=signup'}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-2xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                    >
                      Create Account
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => window.location.href = '/auth?mode=signin'}
                      className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-2xl font-semibold hover:bg-gray-200 transition-all duration-300 border border-gray-200"
                    >
                      Sign In
                    </motion.button>
                  </motion.div>
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border border-blue-100"
                  >
                    <p className="text-sm text-gray-600 mb-2">For immediate assistance:</p>
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="font-bold text-blue-600 text-lg">+1 (555) 123-4567</span>
                    </div>
                  </motion.div>
                </motion.div>
              </div>
            ) : (hasEverInitialized === false || (hasEverInitialized === true && !chatId)) ? (
              // Start Chat Form (First time or no active chat)
              <motion.form
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, type: 'spring', stiffness: 300 }}
                onSubmit={handleStartChat}
                className="space-y-8 bg-white p-6 md:p-8 rounded-3xl shadow-xl border border-gray-100 backdrop-blur-sm"
              >
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-center mb-8"
                >
                  <motion.div 
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.3, type: 'spring', stiffness: 400 }}
                    className="w-24 h-24 bg-gradient-to-br from-blue-100 via-purple-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl border border-white"
                  >
                    <MessageCircle className="w-12 h-12 text-blue-600" />
                  </motion.div>
                  <motion.h4 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-3xl font-bold text-gray-900 mb-4 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent"
                  >
                    How can we help you?
                  </motion.h4>
                  <motion.p 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="text-gray-600 leading-relaxed text-lg"
                  >
                    Describe your issue and we'll connect you with our support team instantly.
                  </motion.p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <label className="block text-sm font-bold text-gray-700 mb-6 text-center">
                    What type of issue are you experiencing?
                  </label>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                      { value: 'order-issue', label: 'Order Issue', icon: '📦', color: 'from-orange-400 to-red-500' },
                      { value: 'food-quality', label: 'Food Quality', icon: '🍽️', color: 'from-green-400 to-emerald-500' },
                      { value: 'delivery', label: 'Delivery', icon: '🚚', color: 'from-blue-400 to-cyan-500' },
                      { value: 'payment', label: 'Payment', icon: '💳', color: 'from-purple-400 to-pink-500' },
                    ].map((option, index) => (
                      <motion.button
                        key={option.value}
                        type="button"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.7 + index * 0.1 }}
                        onClick={() => setCategory(option.value)}
                        whileHover={{ scale: 1.05, y: -5 }}
                        whileTap={{ scale: 0.95 }}
                        className={`relative p-4 sm:p-5 border-2 rounded-2xl sm:rounded-3xl text-center transition-all duration-300 hover:shadow-xl overflow-hidden group touch-manipulation ${
                          category === option.value
                            ? 'border-blue-500 bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50 text-blue-700 shadow-2xl scale-105'
                            : 'border-gray-200 hover:border-blue-300 bg-white hover:bg-gradient-to-br hover:from-gray-50 hover:to-blue-50'
                        }`}
                      >
                        {category === option.value && (
                          <motion.div
                            layoutId="selectedCategory"
                            className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-indigo-500/10 rounded-2xl sm:rounded-3xl"
                          />
                        )}
                        <motion.div 
                          className="relative z-10"
                          whileHover={{ rotate: [0, -10, 10, 0] }}
                          transition={{ duration: 0.5 }}
                        >
                          <div className="text-2xl sm:text-3xl mb-2 sm:mb-3 group-hover:scale-110 transition-transform duration-300">{option.icon}</div>
                          <div className="font-bold text-xs sm:text-sm leading-tight">{option.label}</div>
                        </motion.div>
                        <motion.div
                          className={`absolute inset-0 bg-gradient-to-r ${option.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-2xl sm:rounded-3xl`}
                        />
                      </motion.button>
                    ))}
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.0 }}
                >
                  <label className="block text-sm font-bold text-gray-700 mb-4">
                    Please describe your issue in detail:
                  </label>
                  <div className="relative">
                    <motion.textarea
                      value={issue}
                      onChange={(e) => setIssue(e.target.value)}
                      className="w-full rounded-3xl border-2 border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 resize-none transition-all duration-300 bg-gray-50 focus:bg-white hover:border-gray-300 focus:shadow-lg p-4"
                      rows={5}
                      required
                      maxLength={500}
                      placeholder="Please provide specific details about your issue... (e.g., what happened, when it occurred, any error messages)"
                      whileFocus={{ scale: 1.02 }}
                    />
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: issue.length > 400 ? 1 : 0.6 }}
                      className={`absolute bottom-4 right-4 text-xs px-2 py-1 rounded-full ${
                        issue.length > 450 ? 'bg-red-100 text-red-600' : 
                        issue.length > 400 ? 'bg-yellow-100 text-yellow-600' : 
                        'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {issue.length}/500
                    </motion.div>
                  </div>
                </motion.div>

                <motion.button
                  type="submit"
                  disabled={loading || !category || !issue.trim()}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.2 }}
                  whileHover={{ scale: loading || !category || !issue.trim() ? 1 : 1.03, y: -2 }}
                  whileTap={{ scale: loading || !category || !issue.trim() ? 1 : 0.97 }}
                  className="w-full bg-gradient-to-r from-blue-500 via-purple-600 to-indigo-600 text-white rounded-3xl py-5 font-bold text-lg hover:from-blue-600 hover:via-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-xl hover:shadow-2xl relative overflow-hidden group"
                >
                  <div className="relative z-10 flex items-center justify-center gap-3">
                    {loading ? (
                      <>
                        <motion.div 
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-6 h-6 border-2 border-white border-t-transparent rounded-full"
                        />
                        <span>Starting chat...</span>
                      </>
                    ) : (
                      <>
                        <MessageCircle className="w-6 h-6" />
                        <span>Start Live Chat Support</span>
                      </>
                    )}
                  </div>
                  {!loading && (
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                      initial={{ x: '-100%' }}
                      whileHover={{ x: '100%' }}
                      transition={{ duration: 0.8 }}
                    />
                  )}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100"
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  />
                </motion.button>
              </motion.form>
            ) : (
              // Chat Messages
              <div className="space-y-6">
                {/* Chat Header Info */}
                <motion.div 
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="bg-gradient-to-r from-blue-50 via-purple-50 to-indigo-50 rounded-3xl p-6 mb-8 border border-blue-200 shadow-lg backdrop-blur-sm"
                >
                  <div className="flex items-center gap-4 mb-3">
                    <motion.div 
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
                      className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg"
                    >
                      {getCategoryIcon(currentChat?.category || category || '')}

                    </motion.div>
                    <div className="flex-1">
                      <motion.h4 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className="font-bold text-gray-900 text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
                      >
                        {(currentChat?.category || category || '').replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </motion.h4>
                      <motion.p 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                        className="text-sm text-gray-600 line-clamp-2 leading-relaxed mt-1"
                      >
                        {currentChat?.issue || issue}
                      </motion.p>
                    </div>
                  </div>
                </motion.div>

                {/* Messages Container */}
                <div className="space-y-6">
                  {messages.map((message, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 30, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ 
                        delay: index * 0.1, 
                        type: 'spring', 
                        stiffness: 300,
                        damping: 20 
                      }}
                      className={`flex items-end gap-3 ${
                        message.sender === 'customer' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {message.sender !== 'customer' && (
                        <motion.div 
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: index * 0.1 + 0.2 }}
                          className="w-10 h-10 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg"
                        >
                          <User className="w-5 h-5" />
                        </motion.div>
                      )}
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        className={`max-w-[85%] md:max-w-[75%] rounded-3xl px-5 py-4 shadow-lg backdrop-blur-sm border ${
                          message.sender === 'customer'
                            ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-br-lg border-blue-300 shadow-blue-200'
                            : 'bg-white text-gray-900 border-gray-200 rounded-bl-lg shadow-gray-200'
                        }`}
                      >
                        <motion.p 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.1 + 0.3 }}
                          className="text-sm md:text-base leading-relaxed mb-3"
                        >
                          {message.content}
                        </motion.p>
                        <div className="flex items-center justify-between">
                          <motion.p 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: index * 0.1 + 0.4 }}
                            className="text-xs opacity-75 font-medium"
                          >
                            {formatDistanceToNow(new Date(message.timestamp), {
                              addSuffix: true,
                            })}
                          </motion.p>
                          {message.sender === 'customer' && (
                            <motion.div 
                              initial={{ opacity: 0, scale: 0 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: index * 0.1 + 0.5 }}
                              className="flex gap-1"
                            >
                              <motion.div 
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ duration: 2, repeat: Infinity, delay: 0 }}
                                className="w-1.5 h-1.5 bg-white/70 rounded-full"
                              />
                              <motion.div 
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
                                className="w-1.5 h-1.5 bg-white/70 rounded-full"
                              />
                            </motion.div>
                          )}
                        </div>
                      </motion.div>
                      {message.sender === 'customer' && (
                        <motion.div 
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: index * 0.1 + 0.2 }}
                          className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg"
                        >
                          You
                        </motion.div>
                      )}
                    </motion.div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </div>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-center"
              >
                <AlertCircle className="w-6 h-6 mx-auto mb-2" />
                <p className="font-medium">Error</p>
                <p className="text-sm">{error}</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="mt-3 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm"
                >
                  Reload Page
                </button>
              </motion.div>
            )}
          </div>

          {/* Message Input */}
          {chatId && status !== 'resolved' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="p-3 sm:p-4 md:p-6 border-t border-gray-200/50 bg-gradient-to-r from-white via-blue-50/30 to-white backdrop-blur-md safe-area-inset-bottom"
            >
              <form onSubmit={handleSendMessage} className="flex items-end gap-2 sm:gap-4">
                <div className="flex-1 relative">
                  <motion.input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onFocus={() => setTypingStatus(true)}
                    onBlur={() => setTypingStatus(false)}
                    onKeyDown={() => setTypingStatus(true)}
                    placeholder="Type your message..."
                    className="w-full rounded-2xl sm:rounded-3xl border-2 border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-3 sm:py-4 px-4 sm:px-6 pr-12 sm:pr-14 bg-white/80 focus:bg-white transition-all duration-300 text-sm sm:text-base placeholder-gray-400 backdrop-blur-sm hover:border-gray-300 focus:shadow-lg"
                    whileFocus={{ scale: 1.02 }}
                  />
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.1, rotate: 10 }}
                    whileTap={{ scale: 0.9 }}
                    className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-500 transition-colors duration-200 p-1 touch-manipulation"
                  >
                    <Smile className="w-5 h-5 sm:w-6 sm:h-6" />
                  </motion.button>
                </div>
                <motion.button
                  type="submit"
                  disabled={!newMessage.trim()}
                  whileHover={{ scale: newMessage.trim() ? 1.1 : 1, rotate: newMessage.trim() ? 15 : 0 }}
                  whileTap={{ scale: newMessage.trim() ? 0.9 : 1 }}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full p-3 sm:p-4 hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-xl disabled:shadow-none hover:shadow-2xl touch-manipulation"
                >
                  <Send className="w-5 h-5 sm:w-6 sm:h-6" />
                </motion.button>
              </form>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="flex items-center justify-between mt-3 sm:mt-4 text-xs text-gray-500"
              >
                <div className="flex items-center gap-2">
                  <kbd className="px-2 py-1 bg-gray-100 rounded-lg text-gray-600 font-mono text-xs hidden sm:inline">Enter</kbd>
                  <span className="hidden sm:inline">to send</span>
                  <span className="sm:hidden">Tap send to chat</span>
                </div>
                <motion.div 
                  className="flex items-center gap-2"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <div className="flex gap-1">
                    <motion.div 
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
                      className="w-2 h-2 bg-green-400 rounded-full"
                    />
                    <motion.div 
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
                      className="w-2 h-2 bg-green-400 rounded-full"
                    />
                    <motion.div 
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}
                      className="w-2 h-2 bg-green-400 rounded-full"
                    />
                  </div>
                  <span className="font-medium hidden sm:inline">Support team is online</span>
                  <span className="font-medium sm:hidden">Online</span>
                </motion.div>
              </motion.div>
            </motion.div>
          )}

          {status === 'resolved' && (
            <motion.div 
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="p-6 md:p-8 border-t border-gray-200/50 bg-gradient-to-r from-green-50 via-emerald-50 to-green-50 text-center backdrop-blur-md"
            >
              <motion.div 
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 400 }}
                className="flex items-center justify-center gap-4 text-green-700 mb-6"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
                <div className="text-left">
                  <motion.span 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="font-bold text-2xl"
                  >
                    Chat Resolved
                  </motion.span>
                  <motion.p 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-sm text-green-600 font-medium"
                  >
                    Thank you for contacting support!
                  </motion.p>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-white/80 rounded-2xl p-6 shadow-lg backdrop-blur-sm border border-green-200"
              >
                <p className="text-gray-700 mb-4 leading-relaxed">
                  Your issue has been successfully resolved. Our team is here 24/7 if you need any further assistance.
                </p>
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  Close Chat
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
