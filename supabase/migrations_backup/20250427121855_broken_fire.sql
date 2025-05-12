/*
  # Fix Counter RLS Policies

  1. Changes
    - Verify RLS is enabled on orders table
    - Drop and recreate policies with proper permissions
    - Add specific policies for counter operations
    - Add validation constraints for order data

  2. Security
    - Maintain data integrity
    - Allow counter staff operations
    - Enable public order tracking
*/

-- First verify RLS is enabled
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Public can view orders" ON orders;
DROP POLICY IF EXISTS "Authenticated users can create orders" ON orders;
DROP POLICY IF EXISTS "Authenticated users can update orders" ON orders;
DROP POLICY IF EXISTS "Authenticated users can delete orders" ON orders;

-- Create new policies for orders table
CREATE POLICY "Public can view orders"
ON orders
FOR SELECT
TO public
USING (true);

CREATE POLICY "Counter staff can create orders"
ON orders
FOR INSERT
TO authenticated
WITH CHECK (
  -- Ensure required fields are present
  customer_name IS NOT NULL AND
  total_amount >= 0 AND
  (
    -- Either table number or order type must be specified
    table_number IS NOT NULL OR 
    order_type = 'takeaway'
  )
);

CREATE POLICY "Staff can update orders"
ON orders
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (
  -- Prevent modifications to completed orders
  status != 'delivered' AND
  status != 'cancelled'
);

CREATE POLICY "Staff can delete orders"
ON orders
FOR DELETE
TO authenticated
USING (
  -- Only allow deletion of pending orders
  status = 'pending'
);

-- Add constraints to ensure data integrity
ALTER TABLE orders
  -- Ensure valid order type
  ADD CONSTRAINT valid_order_type 
  CHECK (order_type IN ('dine-in', 'takeaway')),
  
  -- Ensure table number is present for dine-in orders
  ADD CONSTRAINT table_number_required 
  CHECK (
    (order_type = 'dine-in' AND table_number IS NOT NULL) OR
    (order_type = 'takeaway')
  );

-- Create function to validate order data
CREATE OR REPLACE FUNCTION validate_order()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure customer name is present
  IF NEW.customer_name IS NULL OR trim(NEW.customer_name) = '' THEN
    RAISE EXCEPTION 'Customer name is required';
  END IF;

  -- Validate phone number format if provided
  IF NEW.customer_phone IS NOT NULL AND NOT NEW.customer_phone ~ '^[0-9]{10}$' THEN
    RAISE EXCEPTION 'Invalid phone number format';
  END IF;

  -- Validate total amount
  IF NEW.total_amount < 0 THEN
    RAISE EXCEPTION 'Total amount cannot be negative';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for order validation
DROP TRIGGER IF EXISTS validate_order_trigger ON orders;
CREATE TRIGGER validate_order_trigger
  BEFORE INSERT OR UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION validate_order();