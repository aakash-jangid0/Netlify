import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabase';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { chatId, content, sender, senderId } = req.body;

    if (!chatId || !content || !sender || !senderId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get the current chat
    const { data: chat, error: chatError } = await supabase
      .from('support_chats')
      .select('messages')
      .eq('id', chatId)
      .single();

    if (chatError) {
      console.error('Error fetching chat:', chatError);
      return res.status(500).json({ error: 'Failed to fetch chat' });
    }

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    // Create new message
    const message = {
      id: uuidv4(),
      sender,
      sender_id: senderId,
      content,
      timestamp: new Date().toISOString(),
      read: false
    };

    // Update chat with new message
    const updatedMessages = [...(chat.messages || []), message];
    
    const { error: updateError } = await supabase
      .from('support_chats')
      .update({ 
        messages: updatedMessages,
        last_message_at: new Date().toISOString()
      })
      .eq('id', chatId);

    if (updateError) {
      console.error('Error updating chat:', updateError);
      return res.status(500).json({ error: 'Failed to send message' });
    }

    return res.status(201).json({ message, success: true });
  } catch (error) {
    console.error('Message sending error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
