/*
  # Remove counter-related tables and columns

  1. Changes
    - Remove customer-specific tables and columns that were used for counter operations
    - Clean up related fields from orders table
*/

-- Drop counter-specific tables
DROP TABLE IF EXISTS customers;

-- Remove counter-specific columns from orders
ALTER TABLE orders
  DROP COLUMN IF EXISTS customer_phone,
  DROP COLUMN IF EXISTS subtotal,
  DROP COLUMN IF EXISTS tax,
  DROP COLUMN IF EXISTS discount,
  DROP COLUMN IF EXISTS coupon_code;

-- Remove preparation tracking from order_items
ALTER TABLE order_items
  DROP COLUMN IF EXISTS preparation_status,
  DROP COLUMN IF EXISTS started_at,
  DROP COLUMN IF EXISTS completed_at;