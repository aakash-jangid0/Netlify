import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';

// Types
export interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  message: string;
  sent_at: string;
  status: 'sent' | 'delivered' | 'read';
}

export interface SupportChat {
  id: string;
  order_id: string;
  customer_id: string;
  category?: string;
  issue?: string;
  status: 'open' | 'closed' | 'resolved';
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

      const response = await fetch(`${NETLIFY_FUNCTION_URL}/support-chat?customerId=${customerId}`);
      const chats = await response.json();
      
      const chat = chats.find((c: SupportChat) => c.order_id === orderId);
      
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
        setMessages(messages || []);
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

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to send message');
      }

      if (result.success) {
        if (!chatId && result.chatId) {
          setChatId(result.chatId);
          await loadChat();
        }
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

  // Subscribe to new messages
  useEffect(() => {
    if (!chatId) return;

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
          const newMessage = payload.new as Message;
          setMessages(prev => [...prev, newMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId]);

  const [status] = useState<'open' | 'resolved' | 'closed'>('open');

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
          status: 'open'
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to start chat');
      }

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
