/*
  # Fix Orders RLS Policies

  1. Changes
    - Update RLS policies for orders table to allow public access for kitchen dashboard
    - Add policy for kitchen staff to view and update orders
    - Remove authentication requirements for viewing orders

  2. Security
    - Allow public read access to orders and order items
    - Maintain write protection
*/

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can read own orders" ON orders;
DROP POLICY IF EXISTS "Users can insert own orders" ON orders;
DROP POLICY IF EXISTS "Staff can manage orders" ON orders;

-- Add new policies for orders
CREATE POLICY "Public can view orders"
  ON orders
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Staff can manage orders"
  ON orders
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Update order_items policies
DROP POLICY IF EXISTS "Users can read own order items" ON order_items;
DROP POLICY IF EXISTS "Users can insert own order items" ON order_items;
DROP POLICY IF EXISTS "Staff can manage order items" ON order_items;

CREATE POLICY "Public can view order items"
  ON order_items
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Staff can manage order items"
  ON order_items
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);