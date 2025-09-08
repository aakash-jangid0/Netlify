-- Migration: Chat System Improvements
-- Description: Separates chat messages into their own table and adds improved chat management features
-- Created At: 2025-09-08

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create backup of existing data
CREATE TABLE IF NOT EXISTS support_chats_backup AS 
SELECT * FROM support_chats;

-- Create new chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chat_id UUID NOT NULL,
    sender_id UUID NOT NULL,
    sender_type TEXT NOT NULL CHECK (sender_type IN ('customer', 'admin')),
    content TEXT NOT NULL,
    sent_at TIMESTAMPTZ DEFAULT now(),
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    FOREIGN KEY (chat_id) REFERENCES support_chats(id) ON DELETE CASCADE
);

-- Create indices for better performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_chat_id ON chat_messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sent_at ON chat_messages(sent_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON chat_messages(sender_id, sender_type);

-- Migrate existing messages to the new table
DO $$
DECLARE
    chat record;
    message_data jsonb;
BEGIN
    FOR chat IN SELECT id, messages FROM support_chats WHERE messages IS NOT NULL AND jsonb_array_length(messages) > 0
    LOOP
        FOR message_data IN SELECT jsonb_array_elements(chat.messages)
        LOOP
            INSERT INTO chat_messages (
                chat_id,
                sender_id,
                sender_type,
                content,
                sent_at,
                read
            ) VALUES (
                chat.id,
                (message_data->>'sender_id')::uuid,
                message_data->>'sender',
                message_data->>'content',
                COALESCE((message_data->>'timestamp')::timestamptz, now()),
                COALESCE((message_data->>'read')::boolean, false)
            );
        END LOOP;
    END LOOP;
END;
$$;

-- Modify support_chats table
ALTER TABLE support_chats 
    DROP COLUMN IF EXISTS messages,
    ADD COLUMN IF NOT EXISTS issue_type TEXT,
    ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal',
    ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES auth.users(id);

-- Add constraints for priority values
ALTER TABLE support_chats
    ADD CONSTRAINT valid_priority CHECK (priority IN ('low', 'normal', 'high', 'urgent'));

-- Enable RLS on chat_messages
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chat_messages

-- Customers can read their own chat messages
CREATE POLICY "Customers can read their own chat messages"
ON chat_messages FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM support_chats sc
        WHERE sc.id = chat_messages.chat_id
        AND sc.customer_id = auth.uid()
    )
);

-- Customers can insert messages in their own chats
CREATE POLICY "Customers can insert messages in their own chats"
ON chat_messages FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM support_chats sc
        WHERE sc.id = chat_messages.chat_id
        AND sc.customer_id = auth.uid()
        AND sender_type = 'customer'
    )
);

-- Admins can read all chat messages
CREATE POLICY "Admins can read all chat messages"
ON chat_messages FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.uid() = id
        AND role = 'admin'
    )
);

-- Admins can insert messages
CREATE POLICY "Admins can insert messages"
ON chat_messages FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.uid() = id
        AND role = 'admin'
        AND sender_type = 'admin'
    )
);

-- Create function for real-time notifications
CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM pg_notify(
        'new_message',
        json_build_object(
            'chat_id', NEW.chat_id,
            'message', json_build_object(
                'id', NEW.id,
                'sender_id', NEW.sender_id,
                'sender_type', NEW.sender_type,
                'content', NEW.content,
                'sent_at', NEW.sent_at,
                'read', NEW.read
            )
        )::text
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for real-time message notifications
DROP TRIGGER IF EXISTS on_new_message ON chat_messages;
CREATE TRIGGER on_new_message
    AFTER INSERT ON chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION notify_new_message();

-- Create function to update last_message_at in support_chats
CREATE OR REPLACE FUNCTION update_chat_last_message_time()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE support_chats
    SET last_message_at = NEW.sent_at
    WHERE id = NEW.chat_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update last_message_at
DROP TRIGGER IF EXISTS on_new_message_update_chat ON chat_messages;
CREATE TRIGGER on_new_message_update_chat
    AFTER INSERT ON chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_chat_last_message_time();

-- Add indices for common queries
CREATE INDEX IF NOT EXISTS idx_support_chats_status ON support_chats(status);
CREATE INDEX IF NOT EXISTS idx_support_chats_customer ON support_chats(customer_id);
CREATE INDEX IF NOT EXISTS idx_support_chats_assigned ON support_chats(assigned_to);
CREATE INDEX IF NOT EXISTS idx_support_chats_last_message ON support_chats(last_message_at DESC);

-- Create view for active chats with latest message
CREATE OR REPLACE VIEW active_chats_with_latest_message AS
SELECT 
    sc.*,
    cm.content as latest_message,
    cm.sent_at as latest_message_time,
    cm.sender_type as latest_message_sender
FROM support_chats sc
LEFT JOIN LATERAL (
    SELECT content, sent_at, sender_type
    FROM chat_messages
    WHERE chat_id = sc.id
    ORDER BY sent_at DESC
    LIMIT 1
) cm ON true
WHERE sc.status = 'active';

-- Add comments to the new objects
COMMENT ON TABLE chat_messages IS 'Stores individual chat messages for the support system';
COMMENT ON TABLE active_chats_with_latest_message IS 'View of active chats with their most recent message';
