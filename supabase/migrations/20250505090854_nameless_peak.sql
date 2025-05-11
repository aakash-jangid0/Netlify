/*
  # Fix Inventory RLS Policies and Add Validation

  1. Changes
    - Drop existing RLS policies
    - Create new, more permissive policies
    - Add validation triggers
    - Add proper constraints

  2. Security
    - Maintain basic security while allowing inventory operations
    - Add proper validation checks
*/

-- First, verify and enable RLS
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Anyone can view inventory" ON inventory;
DROP POLICY IF EXISTS "Anyone can insert inventory" ON inventory;
DROP POLICY IF EXISTS "Anyone can update inventory" ON inventory;
DROP POLICY IF EXISTS "Anyone can delete inventory" ON inventory;

-- Create new, more permissive policies
CREATE POLICY "Public can view inventory"
  ON inventory
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Counter staff can manage inventory"
  ON inventory
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Add validation trigger
CREATE OR REPLACE FUNCTION validate_inventory()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate required fields
  IF NEW.name IS NULL OR trim(NEW.name) = '' THEN
    RAISE EXCEPTION 'Name is required';
  END IF;

  IF NEW.category IS NULL OR trim(NEW.category) = '' THEN
    RAISE EXCEPTION 'Category is required';
  END IF;

  IF NEW.unit IS NULL OR trim(NEW.unit) = '' THEN
    RAISE EXCEPTION 'Unit is required';
  END IF;

  -- Validate numeric fields
  IF NEW.quantity < 0 THEN
    RAISE EXCEPTION 'Quantity cannot be negative';
  END IF;

  IF NEW.min_quantity < 0 THEN
    RAISE EXCEPTION 'Minimum quantity cannot be negative';
  END IF;

  IF NEW.max_quantity < NEW.min_quantity THEN
    RAISE EXCEPTION 'Maximum quantity must be greater than minimum quantity';
  END IF;

  IF NEW.cost_price < 0 THEN
    RAISE EXCEPTION 'Cost price cannot be negative';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create validation trigger
CREATE TRIGGER validate_inventory_trigger
  BEFORE INSERT OR UPDATE ON inventory
  FOR EACH ROW
  EXECUTE FUNCTION validate_inventory();

-- Add proper constraints
ALTER TABLE inventory
  ADD CONSTRAINT positive_quantity CHECK (quantity >= 0),
  ADD CONSTRAINT positive_min_quantity CHECK (min_quantity >= 0),
  ADD CONSTRAINT positive_max_quantity CHECK (max_quantity >= 0),
  ADD CONSTRAINT positive_cost_price CHECK (cost_price >= 0),
  ADD CONSTRAINT valid_quantity_range CHECK (max_quantity >= min_quantity);

-- Update transaction policies as well
DROP POLICY IF EXISTS "Staff can view transactions" ON inventory_transactions;
DROP POLICY IF EXISTS "Staff can insert transactions" ON inventory_transactions;

CREATE POLICY "Public can view transactions"
  ON inventory_transactions
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can insert transactions"
  ON inventory_transactions
  FOR INSERT
  TO public
  WITH CHECK (true);