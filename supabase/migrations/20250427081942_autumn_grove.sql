/*
  # Fix orders table RLS policies

  1. Changes
    - Add RLS policy to allow authenticated users to insert orders
    - Add RLS policy to allow authenticated users to update orders
    - Add RLS policy to allow authenticated users to delete orders
    - Modify existing select policy to be more permissive for staff

  2. Security
    - Enable RLS on orders table (if not already enabled)
    - Add policies for all CRUD operations
    - Ensure authenticated users can manage orders
*/

-- Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public can view orders" ON orders;
DROP POLICY IF EXISTS "Staff can manage orders" ON orders;

-- Create new policies
CREATE POLICY "Staff can view orders"
ON orders FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Staff can insert orders"
ON orders FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Staff can update orders"
ON orders FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Staff can delete orders"
ON orders FOR DELETE
TO authenticated
USING (true);