import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';

// Types
export interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  sent_at: string;
  sender_type: 'customer' | 'admin';
  read?: boolean;
}

export interface SupportChat {
  id: string;
  order_id: string;
  customer_id: string;
  category?: string;
  issue?: string;
  status: 'active' | 'closed' | 'resolved';
  last_message_at: string;
  customer_details?: {
    name: string;
    email: string;
    phone: string;
  };
  order_details?: {
    total_amount: number;
    status: string;
    order_number: string;
  };
}

const NETLIFY_FUNCTION_URL = '/.netlify/functions';

export function useSupportChat(orderId: string, customerId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chatId, setChatId] = useState<string | null>(null);
  const [currentChat, setCurrentChat] = useState<SupportChat | null>(null);

  // Load chat history
  const loadChat = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('🔍 Loading chat for:', { orderId, customerId });

      const response = await fetch(`${NETLIFY_FUNCTION_URL}/support-chat?customerId=${customerId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('📦 Chat data received:', data);
      
      // Ensure data is an array before calling .find()
      const chats = Array.isArray(data) ? data : [];
      
      const chat = chats.find((c: SupportChat) => c.order_id === orderId);
      console.log('🎯 Found chat for order:', chat);
      
      if (chat) {
        setChatId(chat.id);
        setCurrentChat(chat);
        
        // Load messages for this chat
        const { data: messages, error } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('chat_id', chat.id)
          .order('sent_at', { ascending: true });
        
        if (error) throw error;
        console.log('💬 Messages loaded:', messages);
        setMessages(messages || []);
      } else {
        console.log('❌ No chat found for this order');
      }
    } catch (err) {
      console.error('Error loading chat:', err);
      setError('Failed to load chat history');
    } finally {
      setIsLoading(false);
    }
  }, [orderId, customerId]);

  // Send a message
  const sendMessage = async (message: string) => {
    if (!message.trim()) return;

    try {
      setIsLoading(true);
      setError(null);

      console.log('📤 Sending message:', { message, customerId, orderId });

      // Create optimistic message for instant UI update
      const optimisticId = `temp-${Date.now()}`;
      const optimisticMessage = {
        id: optimisticId,
        chat_id: chatId || '',
        sender_id: customerId,
        content: message.trim(),
        sent_at: new Date().toISOString(),
        sender_type: 'customer' as const,
        read: false
      };

      // Update UI immediately with optimistic message
      setMessages(prev => [...prev, optimisticMessage]);

      const response = await fetch(`${NETLIFY_FUNCTION_URL}/support-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          customerId,
          orderId,
          message: message.trim()
        }),
      });

      console.log('📡 Send message response status:', response.status);

      if (!response.ok) {
        // Remove optimistic message on error
        setMessages(prev => prev.filter(msg => msg.id !== optimisticId));
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Send message result:', result);
      
      if (!result.success) {
        // Remove optimistic message on error
        setMessages(prev => prev.filter(msg => msg.id !== optimisticId));
        throw new Error(result.error || 'Failed to send message');
      }

      // If chat was just created, set the chat ID and reload
      if (!chatId && result.chatId) {
        console.log('🆕 New chat created, setting chatId and reloading');
        setChatId(result.chatId);
        await loadChat(); // This will replace the optimistic message with real messages
      } else if (result.message) {
        console.log('🔄 Replacing optimistic message with real message:', {
          optimisticId,
          realMessage: result.message
        });
        // Replace optimistic message with real message from server
        setMessages(prev => {
          const updated = prev.map(msg => 
            msg.id === optimisticId ? result.message : msg
          );
          console.log('📝 Messages after replacement:', updated.length);
          return updated;
        });
      } else {
        console.log('⚠️ No message returned from server, keeping optimistic message');
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  // Mark messages as read
  const markMessagesAsRead = useCallback(async () => {
    if (!chatId) return;
    
    try {
      await supabase
        .from('chat_messages')
        .update({ status: 'read' })
        .eq('chat_id', chatId)
        .not('status', 'eq', 'read');
    } catch (err) {
      console.error('Error marking messages as read:', err);
    }
  }, [chatId]);

  // Load chat on mount
  useEffect(() => {
    loadChat();
  }, [loadChat]);

  // Test Supabase connection and real-time
  useEffect(() => {
    const testRealtimeConnection = async () => {
      try {
        console.log('🧪 Testing Supabase real-time connection...');
        const { data } = await supabase.from('chat_messages').select('count').limit(1);
        console.log('✅ Supabase connection working, count:', data);
      } catch (error) {
        console.error('❌ Supabase connection error:', error);
      }
    };
    
    testRealtimeConnection();
  }, []);

  // Subscribe to new messages
  useEffect(() => {
    if (!chatId) {
      console.log('❌ No chatId, skipping real-time subscription');
      return;
    }

    console.log('🔄 Setting up real-time subscription for chat:', chatId);

    const channel = supabase
      .channel(`chat:${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `chat_id=eq.${chatId}`
        },
        (payload) => {
          console.log('📨 Real-time message received:', payload.new);
          const newMessage = payload.new as Message;
          
          console.log('🔍 Message details:', {
            id: newMessage.id,
            sender_type: newMessage.sender_type,
            sender_id: newMessage.sender_id,
            content: newMessage.content,
            chat_id: newMessage.chat_id
          });
          
          // Add admin messages immediately, don't add customer messages (handled optimistically)
          if (newMessage.sender_type === 'admin') {
            console.log('👨‍💼 Adding admin message to customer chat');
            setMessages(prev => {
              // Check if message already exists to prevent duplicates
              const exists = prev.some(msg => msg.id === newMessage.id);
              if (exists) {
                console.log('⚠️ Message already exists, skipping');
                return prev;
              }
              console.log('✅ Adding new admin message');
              return [...prev, newMessage];
            });
          } else if (newMessage.sender_type === 'customer') {
            console.log('👤 Customer message (handled optimistically, skipping real-time)');
          }
        }
      )
      .subscribe((status) => {
        console.log('🔌 Subscription status:', status);
      });

    return () => {
      console.log('🔌 Unsubscribing from real-time for chat:', chatId);
      supabase.removeChannel(channel);
    };
  }, [chatId]);

  // Subscribe to chat status changes
  useEffect(() => {
    if (!chatId) return;

    console.log('🔄 Setting up chat status subscription for chat:', chatId);

    const statusChannel = supabase
      .channel(`chat-status:${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'support_chats',
          filter: `id=eq.${chatId}`
        },
        (payload) => {
          console.log('📊 Chat status updated:', payload.new);
          const updatedChat = payload.new as SupportChat;
          
          if (updatedChat.status !== currentChat?.status) {
            console.log('🔄 Chat status changed from', currentChat?.status, 'to', updatedChat.status);
            setCurrentChat(prev => prev ? { ...prev, status: updatedChat.status } : null);
          }
        }
      )
      .subscribe((status) => {
        console.log('🔌 Chat status subscription status:', status);
      });

    return () => {
      console.log('🔌 Unsubscribing from chat status updates');
      supabase.removeChannel(statusChannel);
    };
  }, [chatId, currentChat?.status]);

  const status = currentChat?.status || 'active';

  const startChat = async (issue: string, category: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`${NETLIFY_FUNCTION_URL}/support-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          customerId,
          orderId,
          issue,
          category,
          status: 'active'
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success) {
        setChatId(result.chatId);
        await loadChat();
      }
    } catch (err) {
      console.error('Error starting chat:', err);
      setError('Failed to start chat');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    messages,
    isLoading,
    error,
    chatId,
    currentChat,
    status,
    sendMessage,
    markMessagesAsRead,
    startChat,
  };
}
