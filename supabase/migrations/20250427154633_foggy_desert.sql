/*
  # Add estimated completion time to orders

  1. Changes
    - Add estimated_completion_time column to orders table
    - Add actual_completion_time column for tracking
    - Add preparation_time column for initial estimates

  2. Security
    - Maintain existing RLS policies
*/

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS estimated_completion_time timestamptz,
  ADD COLUMN IF NOT EXISTS actual_completion_time timestamptz,
  ADD COLUMN IF NOT EXISTS preparation_time integer; -- in minutes

-- Update the validate_order function to handle the new fields
CREATE OR REPLACE FUNCTION validate_order()
RETURNS TRIGGER AS $$
BEGIN
  -- Existing validations
  IF NEW.customer_name IS NULL OR trim(NEW.customer_name) = '' THEN
    RAISE EXCEPTION 'Customer name is required';
  END IF;

  IF NEW.customer_phone IS NOT NULL AND NOT NEW.customer_phone ~ '^[0-9]{10}$' THEN
    RAISE EXCEPTION 'Invalid phone number format';
  END IF;

  IF NEW.total_amount < 0 THEN
    RAISE EXCEPTION 'Total amount cannot be negative';
  END IF;

  -- Set estimated completion time when order status changes to 'preparing'
  IF NEW.status = 'preparing' AND OLD.status = 'pending' THEN
    NEW.estimated_completion_time := NOW() + (COALESCE(NEW.preparation_time, 20) || ' minutes')::interval;
  END IF;

  -- Set actual completion time when order is delivered
  IF NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
    NEW.actual_completion_time := NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;