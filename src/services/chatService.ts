import { createClient } from '@supabase/supabase-js';

const NETLIFY_FUNCTION_URL = '/.netlify/functions';

// Initialize Supabase client for real-time features
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export interface ChatMessage {
  id: string;
  chat_id: string;
  sender_id: string;
  message: string;
  sent_at: string;
  status: 'sent' | 'delivered' | 'read';
}

export interface SupportChat {
  id: string;
  customer_id: string;
  order_id: string;
  status: 'open' | 'closed';
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

class ChatService {
  private static instance: ChatService;

  private constructor() {}

  static getInstance(): ChatService {
    if (!ChatService.instance) {
      ChatService.instance = new ChatService();
    }
    return ChatService.instance;
  }

  async getChats(role: string, customerId?: string): Promise<SupportChat[]> {
    try {
      const params = new URLSearchParams();
      if (role) params.append('role', role);
      if (customerId) params.append('customerId', customerId);

      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      const response = await fetch(`${NETLIFY_FUNCTION_URL}/support-chat?${params}`, {
        headers: {
          'Authorization': accessToken ? `Bearer ${accessToken}` : ''
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch chats');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching chats:', error);
      throw error;
    }
  }

  async sendMessage(customerId: string, orderId: string, message: string): Promise<{ success: boolean; chatId: string }> {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      const response = await fetch(`${NETLIFY_FUNCTION_URL}/support-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': accessToken ? `Bearer ${accessToken}` : ''
        },
        body: JSON.stringify({ customerId, orderId, message }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      return await response.json();
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  subscribeToChat(chatId: string, onMessage: (message: ChatMessage) => void): (() => void) {
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
          onMessage(payload.new as ChatMessage);
        }
      )
      .subscribe();

    // Return unsubscribe function
    return () => {
      supabase.removeChannel(channel);
    };
  }

  async markMessagesAsRead(chatId: string): Promise<void> {
    try {
      await supabase
        .from('chat_messages')
        .update({ status: 'read' })
        .eq('chat_id', chatId)
        .not('status', 'eq', 'read');
    } catch (error) {
      console.error('Error marking messages as read:', error);
      throw error;
    }
  }
}

export const chatService = ChatService.getInstance();
