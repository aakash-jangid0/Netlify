import { useState, useEffect, useCallback } from 'react';
import { useSocket } from './useSocket';
import { supabase } from '../supabaseClient';

export interface Message {
  id: string;
  sender: 'customer' | 'admin';
  sender_id: string;
  content: string;
  timestamp: string;
  read: boolean;
}

interface SocketError {
  message?: string;
}

export interface SupportChat {
  id: string;
  order_id: string;
  customer_id: string;
  issue: string;
  category: string;
  status: 'active' | 'resolved' | 'closed';
  messages: Message[];
  created_at: string;
  last_message_at: string;
  order_details?: {
    order_number: string; // Always derived from order_id.slice(-6)
    total_amount: number;
    status: string;
  };
  customer_details?: {
    name: string;
    email: string;
    phone: string;
  };
  resolved_by?: string;
  resolved_at?: string;
}

export const useSupportChat = (orderId: string) => {
  const { socket, isConnected } = useSocket(); // Use shared socket connection
  const [chats, setChats] = useState<SupportChat[]>([]);
  const [currentChat, setCurrentChat] = useState<SupportChat | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debug: Log socket connection status
  useEffect(() => {
    console.log('useSupportChat - Socket status:', {
      socketExists: !!socket,
      isConnected,
      orderId
    });
  }, [socket, isConnected, orderId]);

  // Set up socket event listeners
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleChatStarted = (chat: SupportChat) => {
      console.log('Chat started:', chat);
      setCurrentChat(chat);
      setChats(prev => [chat, ...prev]);
    };

    const handleChatMessage = ({ chatId, message }: { chatId: string, message: Message }) => {
      console.log('New message received:', message);
      
      // Update current chat if it matches
      setCurrentChat(prev => {
        if (prev && prev.id === chatId) {
          return {
            ...prev,
            messages: [...prev.messages, message],
            last_message_at: message.timestamp
          };
        }
        return prev;
      });

      // Update chats list
      setChats(prev => prev.map(chat => {
        if (chat.id === chatId) {
          return {
            ...chat,
            messages: [...chat.messages, message],
            last_message_at: message.timestamp
          };
        }
        return chat;
      }));
    };

    const handleChatUpdated = (updatedChat: SupportChat) => {
      setChats(prev => prev.map(chat => 
        chat.id === updatedChat.id ? updatedChat : chat
      ));
      
      setCurrentChat(prev => {
        if (prev && prev.id === updatedChat.id) {
          return updatedChat;
        }
        return prev;
      });
    };

    const handleChatError = (error: { message: string }) => {
      console.log('Chat error received:', error);
      setError(error.message);
      setLoading(false);
    };

    // Register event listeners
    socket.on('chat:started', handleChatStarted);
    socket.on('chat:message', handleChatMessage);
    socket.on('chat:updated', handleChatUpdated);
    socket.on('chat:error', handleChatError);

    // Cleanup function
    return () => {
      socket.off('chat:started', handleChatStarted);
      socket.off('chat:message', handleChatMessage);
      socket.off('chat:updated', handleChatUpdated);
      socket.off('chat:error', handleChatError);
    };
  }, [socket, isConnected]);

  // Load existing chat for this order using direct Supabase call
  useEffect(() => {
    if (!orderId) return;
    
    const loadExistingChat = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Loading existing chat for order:', orderId);
        
        const { data, error } = await supabase
          .from('support_chats')
          .select('*')
          .eq('order_id', orderId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
          console.error('Database error loading chat:', error);
          throw new Error(`Database error: ${error.message}`);
        }

        if (data) {
          // Messages are stored directly in the messages JSONB array column
          const chat: SupportChat = {
            ...data,
            // Ensure messages is an array, even if it's null or undefined
            messages: Array.isArray(data.messages) ? data.messages : []
          };
          console.log('Found existing chat:', chat);
          setCurrentChat(chat);
        } else {
          console.log('No existing chat found for order:', orderId);
        }
      } catch (err) {
        console.error('Error loading existing chat:', err);
        setError(err instanceof Error ? err.message : 'Failed to load chat history. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadExistingChat();
  }, [orderId]);

  const sendMessage = useCallback((content: string) => {
    return new Promise<Message>((resolve, reject) => {
      if (!socket || !isConnected || !currentChat) {
        reject(new Error('Not connected to chat server or no active chat'));
        return;
      }

      // Create optimistic message for immediate UI update
      const optimisticMessage: Message = {
        id: `temp-${Date.now()}`, // Temporary ID
        sender: 'customer',
        sender_id: currentChat.customer_id,
        content,
        timestamp: new Date().toISOString(),
        read: false
      };

      // Add message to local state immediately for instant feedback
      setCurrentChat(prev => {
        if (prev) {
          return {
            ...prev,
            messages: [...prev.messages, optimisticMessage],
            last_message_at: optimisticMessage.timestamp
          };
        }
        return prev;
      });

      const messageData = {
        chatId: currentChat.id,
        content,
        senderId: currentChat.customer_id
      };

      socket.emit('chat:send', messageData, (error: SocketError | null, message: Message) => {
        if (error) {
          console.error('Error sending message:', error);
          setError(error.message || 'Failed to send message');
          
          // Remove optimistic message on error
          setCurrentChat(prev => {
            if (prev) {
              return {
                ...prev,
                messages: prev.messages.filter(m => m.id !== optimisticMessage.id)
              };
            }
            return prev;
          });
          
          reject(error);
        } else {
          console.log('Message sent successfully:', message);
          
          // Replace optimistic message with real message
          setCurrentChat(prev => {
            if (prev) {
              return {
                ...prev,
                messages: prev.messages.map(m => 
                  m.id === optimisticMessage.id ? message : m
                )
              };
            }
            return prev;
          });
          
          resolve(message);
        }
      });
    });
  }, [socket, isConnected, currentChat]);

  const markMessagesAsRead = useCallback(() => {
    if (socket && isConnected && currentChat) {
      socket.emit('chat:markRead', currentChat.id, (error: SocketError | null) => {
        if (error) {
          console.error('Error marking messages as read:', error);
        }
      });
    }
  }, [socket, isConnected, currentChat]);
  
  const setTypingStatus = useCallback((isTyping: boolean) => {
    if (socket && isConnected && currentChat) {
      socket.emit('chat:typing', { 
        chatId: currentChat.id, 
        isTyping 
      });
    }
  }, [socket, isConnected, currentChat]);

  const startChat = useCallback((issue: string, category: string) => {
    console.log('startChat called with:', { orderId, issue, category, socket: !!socket, isConnected });
    
    return new Promise<SupportChat>((resolve, reject) => {
      if (!socket || !isConnected) {
        const errorMsg = `Not connected to chat server. Socket: ${!!socket}, Connected: ${isConnected}`;
        console.error(errorMsg);
        reject(new Error(errorMsg));
        return;
      }

      if (!orderId) {
        const errorMsg = 'No order ID provided';
        console.error(errorMsg);
        reject(new Error(errorMsg));
        return;
      }

      setLoading(true);
      setError(null);

      console.log('Emitting chat:start event...');
      socket.emit('chat:start', { orderId, issue, category }, (error: SocketError | null, chat: SupportChat) => {
        console.log('chat:start callback received:', { error, chat });
        setLoading(false);
        if (error) {
          console.error('Error starting chat:', error);
          setError(error.message || 'Failed to start chat');
          reject(error);
        } else {
          console.log('Chat started successfully:', chat);
          setCurrentChat(chat);
          resolve(chat);
        }
      });
    });
  }, [socket, isConnected, orderId]);

  return {
    // Legacy interface for compatibility
    chatId: currentChat?.id || null,
    messages: currentChat?.messages || [],
    status: currentChat?.status || null,
    error,
    loading,
    startChat,
    sendMessage,
    markMessagesAsRead,
    setTypingStatus,
    
    // Additional properties
    chats,
    currentChat,
    connected: isConnected,
    setCurrentChat
  };
};
