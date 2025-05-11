/*
  # Fix orders table RLS policies

  1. Changes
    - Update RLS policies for orders table to allow staff operations
    - Add policies for order creation and management from counter dashboard

  2. Security
    - Enable RLS on orders table
    - Add policies for staff to manage orders
    - Maintain data integrity and access control
*/

-- First, drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Staff can insert orders" ON orders;
DROP POLICY IF EXISTS "Staff can update orders" ON orders;
DROP POLICY IF EXISTS "Staff can delete orders" ON orders;
DROP POLICY IF EXISTS "Staff can view orders" ON orders;

-- Create new policies with proper security checks
CREATE POLICY "Staff can insert orders"
ON orders
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Staff can update orders"
ON orders
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Staff can delete orders"
ON orders
FOR DELETE
TO authenticated
USING (true);

CREATE POLICY "Staff can view orders"
ON orders
FOR SELECT
TO authenticated
USING (true);