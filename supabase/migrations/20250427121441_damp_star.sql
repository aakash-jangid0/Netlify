/*
  # Fix Orders RLS Policies for Counter Dashboard

  1. Changes
    - Drop existing RLS policies that may be conflicting
    - Create new policies that allow:
      - Public read access for order tracking
      - Authenticated users to manage orders
      - Staff to perform counter operations
    
  2. Security
    - Maintain basic security while enabling counter operations
    - Allow unauthenticated order tracking
    - Ensure data integrity
*/

-- First, drop any existing policies that might conflict
DROP POLICY IF EXISTS "Users can view orders" ON orders;
DROP POLICY IF EXISTS "Users can insert orders" ON orders;
DROP POLICY IF EXISTS "Users can update orders" ON orders;
DROP POLICY IF EXISTS "Staff can view orders" ON orders;
DROP POLICY IF EXISTS "Staff can insert orders" ON orders;
DROP POLICY IF EXISTS "Staff can update orders" ON orders;
DROP POLICY IF EXISTS "Staff can delete orders" ON orders;

-- Create new, more permissive policies for counter operations

-- Allow public read access for order tracking
CREATE POLICY "Public can view orders"
ON orders FOR SELECT
TO public
USING (true);

-- Allow authenticated users to create orders (for counter staff)
CREATE POLICY "Authenticated users can create orders"
ON orders FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to update orders (for counter and kitchen staff)
CREATE POLICY "Authenticated users can update orders"
ON orders FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow authenticated users to delete orders if needed
CREATE POLICY "Authenticated users can delete orders"
ON orders FOR DELETE
TO authenticated
USING (true);

-- Update order_items policies as well
DROP POLICY IF EXISTS "Users can view order items" ON order_items;
DROP POLICY IF EXISTS "Users can manage order items" ON order_items;

-- Create new policies for order_items
CREATE POLICY "Public can view order items"
ON order_items FOR SELECT
TO public
USING (true);

CREATE POLICY "Authenticated users can manage order items"
ON order_items FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);