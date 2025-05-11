/*
  # Add customer phone number to orders

  1. Changes
    - Add customer_phone column to orders table
    - Add validation check for phone number format
    - Update existing indexes
*/

-- Add customer_phone column with validation
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS customer_phone text,
  ADD CONSTRAINT customer_phone_format CHECK (
    customer_phone IS NULL OR 
    customer_phone ~ '^[0-9]{10}$'
  );

-- Add index for customer phone lookups
CREATE INDEX IF NOT EXISTS orders_customer_phone_idx ON orders(customer_phone);