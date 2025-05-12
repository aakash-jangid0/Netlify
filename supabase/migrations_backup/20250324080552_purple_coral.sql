/*
  # Add customer phone number and related fields

  1. Changes
    - Add customer_phone to orders table
    - Add subtotal, tax, and discount fields to orders table
    - Add coupon_code field to orders table
    - Create customers table for tracking customer history

  2. Security
    - Enable RLS on customers table
    - Add appropriate policies
*/

-- Add new columns to orders table
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS customer_phone text,
  ADD COLUMN IF NOT EXISTS subtotal numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tax numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS coupon_code text;

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL UNIQUE,
  email text,
  total_orders integer DEFAULT 0,
  total_spent numeric DEFAULT 0,
  last_order_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Add policies for customers table
CREATE POLICY "Staff can manage customers"
  ON customers
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);