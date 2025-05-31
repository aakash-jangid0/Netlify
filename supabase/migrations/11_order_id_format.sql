-- Database migrations for consistent order ID format
-- This migration ensures that all order IDs match the new format (#XXXXXX)
-- and updates all references to maintain consistency across the system

-- First, create a function to standardize order ID format
CREATE OR REPLACE FUNCTION standardize_order_id(order_id TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Ensure all order IDs have a consistent format with the # prefix
  -- If it doesn't have a # prefix, add one
  IF left(order_id, 1) != '#' THEN
    RETURN '#' || order_id;
  ELSE
    RETURN order_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Update existing order IDs in orders table to have consistent format
-- First ensure they have the # prefix
UPDATE orders
SET id = standardize_order_id(id)
WHERE left(id, 1) != '#';

-- Then ensure they have exactly 6 characters after the # prefix
UPDATE orders
SET id = '#' || substring(md5(random()::text), 1, 6)
WHERE length(substring(id, 2)) != 6;

-- Update invoice related tables for consistency
UPDATE invoices
SET order_id = standardize_order_id(order_id),
    display_order_id = standardize_order_id(display_order_id) 
WHERE order_id IS NOT NULL;

-- Create a trigger to ensure all new orders conform to this format
CREATE OR REPLACE FUNCTION ensure_consistent_order_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Apply the standardization to the new order ID
  NEW.id := standardize_order_id(NEW.id);
  
  -- Ensure the ID without the # has exactly 6 characters (for display purposes)
  IF length(substring(NEW.id, 2)) != 6 THEN
    -- Generate a random 6-character alphanumeric code
    NEW.id := '#' || substring(md5(random()::text), 1, 6);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_order_id_format
BEFORE INSERT OR UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION ensure_consistent_order_id();

-- Update any cross-references in other tables
UPDATE order_items
SET order_id = standardize_order_id(order_id)
WHERE order_id IS NOT NULL;

UPDATE feedback
SET order_id = standardize_order_id(order_id)
WHERE order_id IS NOT NULL;

-- Finally, create an index to optimize search by order ID
CREATE INDEX IF NOT EXISTS idx_orders_id ON orders (id);
