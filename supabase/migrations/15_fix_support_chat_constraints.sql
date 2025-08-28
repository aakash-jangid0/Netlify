-- Fix support chat constraints for simplified resolution
-- Remove foreign key constraint on resolved_by to keep it simple
-- Date: 2025-08-25

-- Drop the foreign key constraint on resolved_by
ALTER TABLE support_chats DROP CONSTRAINT IF EXISTS support_chats_resolved_by_fkey;

-- Make resolved_by a simple text field instead of UUID reference
ALTER TABLE support_chats ALTER COLUMN resolved_by TYPE text;

-- Add a comment to clarify this is just a simple identifier
COMMENT ON COLUMN support_chats.resolved_by IS 'Simple identifier for who resolved the chat (e.g., "admin", staff name, etc.)';
