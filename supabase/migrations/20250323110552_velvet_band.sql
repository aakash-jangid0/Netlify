/*
  # Add additional order fields

  1. Changes
    - Add customer_name to orders table
    - Add table_number to orders table
    - Add order_type to orders table
    - Add payment_method to orders table

  2. Security
    - Maintain existing RLS policies
*/

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS customer_name text,
  ADD COLUMN IF NOT EXISTS table_number text,
  ADD COLUMN IF NOT EXISTS order_type text,
  ADD COLUMN IF NOT EXISTS payment_method text;