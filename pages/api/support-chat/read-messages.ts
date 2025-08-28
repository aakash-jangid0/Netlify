import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { chatId, userId } = req.body;

    if (!chatId || !userId) {
      return res.status(400).json({ error: 'Chat ID and User ID are required' });
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

    // Mark unread messages as read if they were sent by others
    let updated = false;
    const updatedMessages = (chat.messages || []).map(msg => {
      if (!msg.read && msg.sender_id !== userId) {
        updated = true;
        return { ...msg, read: true };
      }
      return msg;
    });

    if (updated) {
      const { error: updateError } = await supabase
        .from('support_chats')
        .update({ messages: updatedMessages })
        .eq('id', chatId);

      if (updateError) {
        console.error('Error updating message read status:', updateError);
        return res.status(500).json({ error: 'Failed to mark messages as read' });
      }
    }

    return res.status(200).json({ success: true, updated });
  } catch (error) {
    console.error('Message read status update error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
