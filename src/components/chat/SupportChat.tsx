import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSupportChat } from '../../hooks/useSupportChat';
import { formatDistanceToNow } from 'date-fns';
import { Send, ArrowLeft, MessageCircle, User, Smile } from 'lucide-react';

interface SupportChatProps {
  orderId: string;
  onClose?: () => void;
}

export const SupportChat: React.FC<SupportChatProps> = ({ orderId, onClose }) => {
  const [issue, setIssue] = useState('');
  const [newMessage, setNewMessage] = useState('');
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
    currentChat
  } = useSupportChat(orderId);

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

  // Debug: Log currentChat data
  useEffect(() => {
    console.log('SupportChat - currentChat data:', {
      currentChat,
      category: currentChat?.category,
      issue: currentChat?.issue,
      chatId,
      hasMessages: messages.length > 0
    });
  }, [currentChat, chatId, messages.length]);

  const [category, setCategory] = useState('');

  const handleStartChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (issue.trim() && category) {
      startChat(issue, category);
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

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="fixed inset-0 md:inset-auto md:bottom-4 md:right-4 md:w-96 bg-white md:rounded-3xl shadow-2xl flex flex-col h-full md:h-[700px] border-0 md:border-2 border-gray-200/50 z-50 backdrop-blur-md"
    >
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="p-4 md:p-6 border-b border-gray-200/80 flex justify-between items-center bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 text-white md:rounded-t-3xl shadow-lg"
      >
        <div className="flex items-center gap-3">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 400 }}
            className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/30"
          >
            <MessageCircle className="w-5 h-5" />
          </motion.div>
          <div>
            <motion.h3 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="font-bold text-lg"
            >
              Order Support
            </motion.h3>
            <motion.p 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="text-sm text-blue-100"
            >
              Order #{orderId.slice(-6)}
            </motion.p>
          </div>
        </div>
        <motion.button
          onClick={onClose}
          whileHover={{ scale: 1.1, rotate: 180 }}
          whileTap={{ scale: 0.9 }}
          transition={{ duration: 0.2 }}
          className="text-white hover:text-gray-200 text-2xl md:text-xl p-2 hover:bg-white/20 rounded-xl transition-all duration-200"
        >
          <ArrowLeft className="w-5 h-5" />
        </motion.button>
      </motion.div>

      {/* Chat Content */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex-1 overflow-y-auto p-4 md:p-6 bg-gradient-to-b from-gray-50/50 via-white to-blue-50/30 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
      >
        {!chatId ? (
          // Start Chat Form
          <motion.form 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            onSubmit={handleStartChat} 
            className="space-y-6"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <label className="block text-sm font-bold text-gray-700 mb-4 text-center">
                What category best describes your issue?
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'order-issue', label: 'Order Issue', icon: '📦' },
                  { value: 'food-quality', label: 'Food Quality', icon: '🍽️' },
                  { value: 'delivery', label: 'Delivery', icon: '🚚' },
                  { value: 'payment', label: 'Payment', icon: '💳' },
                  { value: 'other', label: 'Other', icon: '❓' },
                ].map((option, index) => (
                  <motion.button
                    key={option.value}
                    type="button"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    onClick={() => setCategory(option.value)}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className={`p-4 border-2 rounded-2xl text-center transition-all duration-300 hover:shadow-lg relative overflow-hidden ${
                      category === option.value
                        ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-purple-50 text-blue-700 shadow-xl'
                        : 'border-gray-200 hover:border-blue-300 bg-white hover:bg-gradient-to-br hover:from-gray-50 hover:to-blue-50'
                    }`}
                  >
                    {category === option.value && (
                      <motion.div
                        layoutId="selectedCategory"
                        className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl"
                      />
                    )}
                    <motion.div 
                      className="relative z-10"
                      whileHover={{ rotate: [0, -5, 5, 0] }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="text-2xl mb-2">{option.icon}</div>
                      <div className="font-bold text-xs">{option.label}</div>
                    </motion.div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <label className="block text-sm font-bold text-gray-700 mb-3">
                Please describe your issue in detail:
              </label>
              <div className="relative">
                <motion.textarea
                  value={issue}
                  onChange={(e) => setIssue(e.target.value)}
                  className="w-full rounded-2xl border-2 border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm md:text-base p-4 bg-gray-50 focus:bg-white transition-all duration-300 resize-none hover:border-gray-300 focus:shadow-lg"
                  rows={4}
                  required
                  maxLength={500}
                  placeholder="Please provide specific details about your issue..."
                  whileFocus={{ scale: 1.02 }}
                />
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: issue.length > 400 ? 1 : 0.6 }}
                  className={`absolute bottom-3 right-3 text-xs px-2 py-1 rounded-full ${
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
              transition={{ delay: 1.0 }}
              whileHover={{ scale: loading || !category || !issue.trim() ? 1 : 1.03, y: -2 }}
              whileTap={{ scale: loading || !category || !issue.trim() ? 1 : 0.97 }}
              className="w-full bg-gradient-to-r from-blue-500 via-purple-600 to-indigo-600 text-white rounded-2xl py-4 font-bold hover:from-blue-600 hover:via-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl relative overflow-hidden"
            >
              <div className="relative z-10 flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                    />
                    Starting chat...
                  </>
                ) : (
                  <>
                    <MessageCircle className="w-5 h-5" />
                    Start Chat
                  </>
                )}
              </div>
              {!loading && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  initial={{ x: '-100%' }}
                  whileHover={{ x: '100%' }}
                  transition={{ duration: 0.6 }}
                />
              )}
            </motion.button>
          </motion.form>
        ) : (
          // Chat Messages
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="space-y-4"
          >
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
                    className="text-sm text-gray-600 leading-relaxed mt-1 overflow-hidden"
                    style={{
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical'
                    }}
                  >
                    {currentChat?.issue || issue}
                  </motion.p>
                </div>
              </div>
              {/* Debug info - remove in production */}
              <div className="mt-4 p-3 bg-gray-100 rounded-lg text-xs text-gray-600">
                <strong>Debug:</strong> currentChat.category = "{currentChat?.category || 'undefined'}", local category = "{category || 'undefined'}"
              </div>
            </motion.div>

            {/* Messages Container */}
            {messages.map((message, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className={`flex items-end gap-2 ${
                  message.sender === 'customer' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.sender !== 'customer' && (
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.1 + 0.2 }}
                    className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center text-white text-xs font-semibold shadow-lg"
                  >
                    <User className="w-4 h-4" />
                  </motion.div>
                )}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-4 py-3 shadow-lg ${
                    message.sender === 'customer'
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-br-md'
                      : 'bg-white text-gray-900 border border-gray-200 rounded-bl-md'
                  }`}
                >
                  <p className="text-sm md:text-base leading-relaxed">{message.content}</p>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs opacity-75 font-medium">
                      {formatDistanceToNow(new Date(message.timestamp), {
                        addSuffix: true,
                      })}
                    </p>
                    {message.sender === 'customer' && (
                      <div className="flex gap-1">
                        <motion.div 
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 2, repeat: Infinity, delay: 0 }}
                          className="w-1 h-1 bg-white/60 rounded-full"
                        />
                        <motion.div 
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
                          className="w-1 h-1 bg-white/60 rounded-full"
                        />
                      </div>
                    )}
                  </div>
                </motion.div>
                {message.sender === 'customer' && (
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.1 + 0.2 }}
                    className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-semibold shadow-lg"
                  >
                    You
                  </motion.div>
                )}
              </motion.div>
            ))}
            <div ref={messagesEndRef} />
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-center mt-4"
          >
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
          </motion.div>
        )}
      </motion.div>

      {/* Message Input */}
      {chatId && status !== 'resolved' && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-4 border-t border-gray-200/50 bg-gradient-to-r from-white via-blue-50/30 to-white"
        >
          <form onSubmit={handleSendMessage} className="flex space-x-3">
            <div className="flex-1 relative">
              <motion.input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                className="w-full rounded-2xl border-2 border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm md:text-base py-3 px-4 pr-12 bg-white/80 focus:bg-white transition-all duration-300 hover:border-gray-300 focus:shadow-lg"
                whileFocus={{ scale: 1.02 }}
              />
              <motion.button
                type="button"
                whileHover={{ scale: 1.1, rotate: 10 }}
                whileTap={{ scale: 0.9 }}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-500 transition-colors duration-200"
              >
                <Smile className="w-5 h-5" />
              </motion.button>
            </div>
            <motion.button
              type="submit"
              disabled={!newMessage.trim()}
              whileHover={{ scale: newMessage.trim() ? 1.1 : 1, rotate: newMessage.trim() ? 15 : 0 }}
              whileTap={{ scale: newMessage.trim() ? 0.9 : 1 }}
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full py-3 px-4 hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg disabled:shadow-none hover:shadow-xl"
            >
              <Send className="w-5 h-5" />
            </motion.button>
          </form>
        </motion.div>
      )}

      {status === 'resolved' && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 border-t border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50 text-center"
        >
          <div className="flex items-center justify-center gap-3 text-green-700 mb-2">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="font-semibold">Chat Resolved</span>
          </div>
          <p className="text-sm text-gray-600">Thank you for contacting support.</p>
        </motion.div>
      )}
    </motion.div>
  );
};
