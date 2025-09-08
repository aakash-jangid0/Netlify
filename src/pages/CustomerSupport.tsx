import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, AlertCircle } from 'lucide-react';
import { useSupportChat } from '../hooks/useServerlessSupportChat';
import { formatDistanceToNow } from 'date-fns';
import PageTransition from '../components/common/PageTransition';

const CustomerSupport = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [issue, setIssue] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [category, setCategory] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    chatId,
    messages,
    error,
    isLoading,
    startChat,
    sendMessage,
    markMessagesAsRead
  } = useSupportChat(orderId || '', 'customer');

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark messages as read when mounted
  useEffect(() => {
    if (chatId) {
      markMessagesAsRead();
    }
  }, [chatId, markMessagesAsRead]);

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

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </motion.button>
              <h1 className="text-xl font-semibold">Customer Support</h1>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6">
          <div className="max-w-3xl mx-auto">
            {/* Chat Interface */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              {/* Chat Header */}
              <div className="p-4 bg-primary text-white">
                <h2 className="font-semibold">
                  {chatId ? 'Order Support Chat' : 'Start a New Chat'}
                </h2>
                {orderId && (
                  <p className="text-sm opacity-90">Order #{orderId.slice(-6)}</p>
                )}
              </div>

              {/* Chat Content */}
              <div className="h-[calc(100vh-300px)] flex flex-col">
                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {!chatId ? (
                    // Start Chat Form
                    <form onSubmit={handleStartChat} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          What category best describes your issue?
                        </label>
                        <select
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                          required
                        >
                          <option value="">Select a category</option>
                          <option value="order-issue">Order Issue</option>
                          <option value="food-quality">Food Quality</option>
                          <option value="delivery">Delivery</option>
                          <option value="payment">Payment</option>
                          <option value="other">Other</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Please describe your issue
                        </label>
                        <textarea
                          value={issue}
                          onChange={(e) => setIssue(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                          rows={4}
                          required
                          placeholder="Describe your issue here..."
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2 px-4 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
                      >
                        Start Chat
                      </button>
                    </form>
                  ) : (
                    // Chat Messages
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <motion.div
                          key={message.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex ${
                            message.sender_id === 'customer' ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          <div
                            className={`max-w-[80%] rounded-lg px-4 py-2 ${
                              message.sender_id === 'customer'
                                ? 'bg-primary text-white'
                                : 'bg-gray-100'
                            }`}
                          >
                            <p className="text-sm">{message.message}</p>
                            <p className="text-xs mt-1 opacity-75">
                              {formatDistanceToNow(new Date(message.sent_at), {
                                addSuffix: true,
                              })}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>

                {/* Message Input */}
                {chatId && (
                  <form onSubmit={handleSendMessage} className="p-4 border-t bg-gray-50">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors flex items-center gap-2"
                        disabled={!newMessage.trim()}
                      >
                        <Send className="w-4 h-4" />
                        Send
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="flex items-center gap-2 text-red-500 mt-4">
                <AlertCircle className="w-5 h-5" />
                <p>{error}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default CustomerSupport;
