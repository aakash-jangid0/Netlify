-- Create a stored procedure to insert support chat record directly
-- This bypasses any ORM issues with the foreign key constraints

CREATE OR REPLACE FUNCTION insert_support_chat(
  p_customer_id uuid,
  p_order_id uuid,
  p_issue text,
  p_category text,
  p_customer_details jsonb,
  p_order_details jsonb
) RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_chat_id uuid;
BEGIN
  -- Insert directly using SQL to bypass any ORM layer issues
  INSERT INTO support_chats (
    customer_id,
    order_id,
    issue,
    category,
    status,
    messages,
    customer_details,
    order_details,
    created_at,
    last_message_at
  ) VALUES (
    p_customer_id,
    p_order_id,
    p_issue,
    p_category,
    'active',
    ARRAY[]::jsonb[],
    p_customer_details,
    p_order_details,
    NOW(),
    NOW()
  )
  RETURNING id INTO v_chat_id;
  
  RETURN v_chat_id;
END;
$$;
