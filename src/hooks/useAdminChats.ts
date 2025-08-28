import { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

export interface Chat {
  id: string;
  order_id: string;
  customer_id: string;
  status: 'active' | 'resolved' | 'closed';
  issue: string;
  category: string;
  messages: Array<{
    id: string;
    sender: 'customer' | 'admin';
    sender_id: string;
    content: string;
    timestamp: string;
    read: boolean;
  }>;
  created_at: string;
  last_message_at: string;
  order_details?: {
    order_number: string; // Always derived from order_id.slice(-6)
    total_amount: number;
    totalAmount?: number; // For backward compatibility
    status: string;
  };
  customer_details?: {
    name: string;
    email: string;
    phone: string;
  };
  isCustomerTyping?: boolean;
}

interface SocketError {
  message: string;
  code?: string;
}

export const useAdminChats = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize socket connection
  useEffect(() => {
    const initSocket = async () => {
      try {
        // Get socket port from server
        const response = await fetch('http://localhost:5000/api/socket-port');
        const { port } = await response.json();
        
        const socketInstance = io(`http://localhost:${port}`, {
          transports: ['websocket'],
          timeout: 10000,
        });

        socketInstance.on('connect', () => {
          console.log('Admin: Connected to WebSocket server');
          setConnected(true);
          setError(null);
          
          // Load initial chats via WebSocket
          socketInstance.emit('admin:getChats', (error: SocketError | null, chats: Chat[] | null) => {
            if (error) {
              console.error('Failed to load admin chats:', error);
              setError(error.message);
            } else if (chats) {
              setChats(chats);
            }
            setLoading(false);
          });
        });

        socketInstance.on('disconnect', () => {
          console.log('Admin: Disconnected from WebSocket server');
          setConnected(false);
        });

        socketInstance.on('connect_error', (err) => {
          console.error('Admin: Socket connection error:', err);
          setError('Failed to connect to chat server');
          setConnected(false);
          setLoading(false);
        });

        setSocket(socketInstance);

        return () => socketInstance.close();
      } catch (err) {
        console.error('Failed to initialize socket:', err);
        setError('Failed to initialize chat connection');
        setLoading(false);
      }
    };

    initSocket();
  }, []);

  // Listen for real-time updates
  useEffect(() => {
    if (!socket || !connected) return;

    const handleNewChat = (chat: Chat) => {
      console.log('Admin: New chat started:', chat);
      setChats(prev => [chat, ...prev]);
    };

    const handleChatMessage = ({ chatId, message }: { 
      chatId: string; 
      message: Chat['messages'][0] 
    }) => {
      console.log('Admin: New message received:', message);
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

    const handleChatResolved = ({ chatId }: { chatId: string }) => {
      console.log('Admin: Chat resolved:', chatId);
      setChats(prev => prev.map(chat => {
        if (chat.id === chatId) {
          return { ...chat, status: 'resolved' as const };
        }
        return chat;
      }));
    };
    
    const handleTypingIndicator = ({ chatId, isTyping, userType }: { 
      chatId: string; 
      isTyping: boolean;
      userId: string;
      userType: 'admin' | 'customer'
    }) => {
      // Only handle customer typing indicators for admin interface
      if (userType !== 'customer') return;
      
      console.log('Admin: Customer typing status:', chatId, isTyping);
      setChats(prev => prev.map(chat => {
        if (chat.id === chatId) {
          return { ...chat, isCustomerTyping: isTyping };
        }
        return chat;
      }));
    };

    socket.on('chat:started', handleNewChat);
    socket.on('chat:message', handleChatMessage);
    socket.on('chat:resolved', handleChatResolved);
    socket.on('chat:typing', handleTypingIndicator);

    return () => {
      socket.off('chat:started', handleNewChat);
      socket.off('chat:message', handleChatMessage);
      socket.off('chat:resolved', handleChatResolved);
      socket.off('chat:typing', handleTypingIndicator);
    };
  }, [socket, connected]);

  // Send a message
  const sendMessage = useCallback((chatId: string, content: string) => {
    if (!socket || !connected) {
      setError('Not connected to server');
      return Promise.reject(new Error('Not connected to server'));
    }

    // Create optimistic message for immediate UI update
    const optimisticMessage = {
      id: `temp-${Date.now()}`,
      sender: 'admin' as const,
      sender_id: 'admin',
      content,
      timestamp: new Date().toISOString(),
      read: false
    };

    // Add message to local state immediately for instant feedback
    setChats(prev => prev.map(chat => {
      if (chat.id === chatId) {
        return {
          ...chat,
          messages: [...chat.messages, optimisticMessage],
          last_message_at: optimisticMessage.timestamp
        };
      }
      return chat;
    }));

    return new Promise<void>((resolve, reject) => {
      socket.emit('chat:send', { 
        chatId, 
        content, 
        senderId: 'admin' 
      }, (error: SocketError | null, message: Chat['messages'][0] | null) => {
        if (error) {
          console.error('Failed to send message:', error);
          setError(error.message);
          
          // Remove optimistic message on error
          setChats(prev => prev.map(chat => {
            if (chat.id === chatId) {
              return {
                ...chat,
                messages: chat.messages.filter(m => m.id !== optimisticMessage.id)
              };
            }
            return chat;
          }));
          
          reject(error);
        } else if (message) {
          console.log('Message sent successfully:', message);
          
          // Replace optimistic message with real message
          setChats(prev => prev.map(chat => {
            if (chat.id === chatId) {
              return {
                ...chat,
                messages: chat.messages.map(m => 
                  m.id === optimisticMessage.id ? message : m
                )
              };
            }
            return chat;
          }));
          
          resolve();
        }
      });
    });
  }, [socket, connected]);

  // Mark messages as read
  const markMessagesAsRead = useCallback((chatId: string) => {
    if (!socket || !connected) return;
    
    socket.emit('chat:markRead', chatId, (error: SocketError | null) => {
      if (error) {
        console.error('Failed to mark messages as read:', error);
      }
    });
  }, [socket, connected]);
  
  // Set typing indicator
  const setTyping = useCallback((chatId: string, isTyping: boolean) => {
    if (!socket || !connected) return;
    
    socket.emit('chat:typing', { chatId, isTyping });
  }, [socket, connected]);

  // Resolve a chat
  const resolveChat = useCallback(async (chatId: string) => {
    try {
      setError(null);
      
      // Use the correct API base URL
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      
      // Update via API call for immediate response
      const response = await fetch(`${API_URL}/support-chat/${chatId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'resolved' }),
      });

      if (!response.ok) {
        throw new Error('Failed to resolve chat');
      }

      const updatedChat = await response.json();
      
      // Update local state immediately
      setChats(prev => prev.map(chat => 
        chat.id === chatId 
          ? { ...chat, status: 'resolved', resolved_at: updatedChat.resolved_at }
          : chat
      ));

      // Also emit via socket for real-time updates
      if (socket && connected) {
        socket.emit('chat:resolve', chatId, (error: SocketError | null) => {
          if (error) {
            console.error('Socket resolve error:', error);
          }
        });
      }

      console.log('Chat resolved successfully:', chatId);
      return Promise.resolve();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to resolve chat';
      console.error('Failed to resolve chat:', err);
      setError(errorMessage);
      return Promise.reject(err);
    }
  }, [socket, connected]);

  // Select a chat
  const selectChat = useCallback((chatId: string) => {
    setActiveChat(chatId);
    // Automatically mark messages as read when selecting a chat
    markMessagesAsRead(chatId);
  }, [markMessagesAsRead]);

  // Get active chat data
  const getCurrentChat = useCallback(() => {
    if (!activeChat) return null;
    return chats.find(chat => chat.id === activeChat) || null;
  }, [activeChat, chats]);

  return {
    // Connection state
    connected,
    loading,
    error,
    
    // Data
    chats,
    activeChat,
    currentChat: getCurrentChat(),
    
    // Actions
    selectChat,
    sendMessage,
    markMessagesAsRead,
    resolveChat,
    setTyping,
    
    // Utilities
    refreshChats: () => {
      if (socket && connected) {
        socket.emit('admin:getChats', (error: SocketError | null, chats: Chat[] | null) => {
          if (error) {
            setError(error.message);
          } else if (chats) {
            setChats(chats);
          }
        });
      }
    }
  };
};
