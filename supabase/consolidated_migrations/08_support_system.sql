-- Support System Tables
-- Support Chats
-- Date: 2025-08-24

CREATE TABLE IF NOT EXISTS support_chats (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  order_id uuid NOT NULL,
  customer_id uuid NOT NULL,
  issue text NOT NULL,
  category text NOT NULL,
  status text NOT NULL DEFAULT 'active'::text,
  messages jsonb[] NOT NULL DEFAULT '{}'::jsonb[],
  created_at timestamp with time zone DEFAULT now(),
  last_message_at timestamp with time zone DEFAULT now(),
  order_details jsonb,
  customer_details jsonb,
  resolved_by uuid,
  resolved_at timestamp with time zone,
  PRIMARY KEY (id)
);

-- Support system indexes
CREATE INDEX IF NOT EXISTS idx_support_chats_order_id ON support_chats(order_id);
CREATE INDEX IF NOT EXISTS idx_support_chats_customer_id ON support_chats(customer_id);
