import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useRealtimeSync } from './useRealtimeSync';
import { toast } from 'react-hot-toast';

export interface AdminChat {
  id: string;
  order_id: string;
  customer_id: string;
  status: 'active' | 'resolved' | 'closed';
  issue: string;
  category: string;
  messages: Array<{
    id: string;
    sender_id: string;
    message: string;
    sent_at: string;
    read: boolean;
  }>;
  created_at: string;
  last_message_at: string;
  order_details?: {
    order_number: string;
    total_amount: number;
    status: string;
  };
  customer_details?: {
    name: string;
    email: string;
    phone: string;
  };
  isCustomerTyping?: boolean;
}

export function useServerlessAdminChats() {
  const [chats, setChats] = useState<AdminChat[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Setup realtime sync for admin chats
  useRealtimeSync<AdminChat>({
    table: 'support_chats',
    onInsert: (newChat) => {
      setChats(prev => [newChat, ...prev]);
      toast.success('New support request received!');
    },
    onUpdate: (updatedChat) => {
      setChats(prev => prev.map(chat => 
        chat.id === updatedChat.id ? updatedChat : chat
      ));
    },
    onDelete: (deletedChat) => {
      setChats(prev => prev.filter(chat => chat.id !== deletedChat.id));
    }
  });

  // Fetch all chats
  const fetchChats = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);

      const { data: chats, error } = await supabase
        .from('support_chats')
        .select(`
          *,
          order_details:orders!support_chats_order_id_fkey (
            id,
            total_amount,
            status
          ),
          customer_details:customers!support_chats_customer_id_fkey (
            name,
            email,
            phone
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setChats(chats || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch chats';
      console.error('Error fetching chats:', err);
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  // Send a message
  const sendMessage = useCallback(async (chatId: string, message: string) => {
    if (!user) {
      throw new Error('Must be logged in to send messages');
    }

    try {
      setError(null);

      // Create optimistic message
      const optimisticId = `temp-${Date.now()}`;
      const optimisticMessage = {
        id: optimisticId,
        sender_id: 'admin',
        message,
        sent_at: new Date().toISOString(),
        read: false
      };

      // Update UI immediately
      setChats(prev => prev.map(chat => {
        if (chat.id === chatId) {
          return {
            ...chat,
            messages: [...chat.messages, optimisticMessage],
            last_message_at: optimisticMessage.sent_at
          };
        }
        return chat;
      }));

      // Send to server
      const { data: newMessage, error } = await supabase
        .from('support_chat_messages')
        .insert({
          chat_id: chatId,
          sender_id: user.id,
          message,
          sent_at: new Date().toISOString(),
          read: false
        })
        .select()
        .single();

      if (error) throw error;

      // Update UI with real message
      setChats(prev => prev.map(chat => {
        if (chat.id === chatId) {
          return {
            ...chat,
            messages: chat.messages.map(msg => 
              msg.id === optimisticId ? newMessage : msg
            )
          };
        }
        return chat;
      }));

      return newMessage;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      console.error('Error sending message:', err);
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    }
  }, [user]);

  // Mark messages as read
  const markMessagesAsRead = useCallback(async (chatId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('support_chat_messages')
        .update({ read: true })
        .eq('chat_id', chatId)
        .eq('sender_id', user.id);

      if (error) throw error;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to mark messages as read';
      console.error('Error marking messages as read:', err);
      setError(errorMessage);
    }
  }, [user]);

  // Resolve chat
  const resolveChat = useCallback(async (chatId: string) => {
    if (!user) return;

    try {
      setError(null);

      const { error } = await supabase
        .from('support_chats')
        .update({ status: 'resolved' })
        .eq('id', chatId);

      if (error) throw error;

      setChats(prev => prev.map(chat => 
        chat.id === chatId 
          ? { ...chat, status: 'resolved' } 
          : chat
      ));

      toast.success('Chat resolved successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to resolve chat';
      console.error('Error resolving chat:', err);
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    }
  }, [user]);

  // Select a chat
  const selectChat = useCallback((chatId: string | null) => {
    setActiveChat(chatId);
    if (chatId) {
      markMessagesAsRead(chatId);
    }
  }, [markMessagesAsRead]);

  // Get current chat data
  const getCurrentChat = useCallback(() => {
    if (!activeChat) return null;
    return chats.find(chat => chat.id === activeChat) || null;
  }, [activeChat, chats]);

  return {
    chats,
    isLoading,
    error,
    activeChat,
    currentChat: getCurrentChat(),
    selectChat,
    sendMessage,
    markMessagesAsRead,
    resolveChat,
    refreshChats: fetchChats
  };
}
