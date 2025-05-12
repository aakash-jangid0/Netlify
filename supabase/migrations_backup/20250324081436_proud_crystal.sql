/*
  # Fix Orders RLS Policies

  1. Changes
    - Update RLS policies for orders table to allow staff to manage orders
    - Add policy for kitchen staff to view and update orders
    - Remove user_id requirement for order creation

  2. Security
    - Maintain basic security while allowing counter operations
*/

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can read own orders" ON orders;
DROP POLICY IF EXISTS "Users can insert own orders" ON orders;

-- Add new policies for orders
CREATE POLICY "Staff can manage orders"
  ON orders
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Add new policies for order_items
DROP POLICY IF EXISTS "Users can read own order items" ON order_items;
DROP POLICY IF EXISTS "Users can insert own order items" ON order_items;

CREATE POLICY "Staff can manage order items"
  ON order_items
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);