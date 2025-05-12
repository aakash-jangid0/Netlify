/*
  # Add counter dashboard schema

  1. New Tables
    - `customers`
      - Track customer information for counter operations
      - Store contact details and order history
    
    - `tables`
      - Manage restaurant tables
      - Track table status and capacity

  2. Changes to Existing Tables
    - Add counter-specific fields to orders table
    - Add preparation tracking to order_items

  3. Security
    - Enable RLS on new tables
    - Add appropriate policies for staff access
*/

-- Create customers table for counter operations
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text UNIQUE,
  email text,
  total_orders integer DEFAULT 0,
  total_spent numeric DEFAULT 0,
  last_order_date timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create tables management
CREATE TABLE IF NOT EXISTS tables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_number text NOT NULL UNIQUE,
  capacity integer NOT NULL,
  status text DEFAULT 'available',
  current_order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  occupied_since timestamptz,
  last_cleaned_at timestamptz,
  section text,
  notes text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add counter-specific columns to orders
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS customer_phone text,
  ADD COLUMN IF NOT EXISTS subtotal numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tax numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_reason text,
  ADD COLUMN IF NOT EXISTS special_requests text,
  ADD COLUMN IF NOT EXISTS estimated_completion_time timestamptz,
  ADD COLUMN IF NOT EXISTS actual_completion_time timestamptz,
  ADD COLUMN IF NOT EXISTS server_id text,
  ADD COLUMN IF NOT EXISTS kitchen_notes text;

-- Add preparation tracking to order_items
ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS preparation_status text DEFAULT 'not_started',
  ADD COLUMN IF NOT EXISTS started_at timestamptz,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS estimated_time integer, -- in minutes
  ADD COLUMN IF NOT EXISTS preparation_notes text;

-- Enable RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;

-- Add policies for customers table
CREATE POLICY "Staff can view customers"
  ON customers
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Staff can insert customers"
  ON customers
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Staff can update customers"
  ON customers
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Staff can delete customers"
  ON customers
  FOR DELETE
  TO authenticated
  USING (true);

-- Add policies for tables
CREATE POLICY "Staff can view tables"
  ON tables
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Staff can insert tables"
  ON tables
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Staff can update tables"
  ON tables
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Staff can delete tables"
  ON tables
  FOR DELETE
  TO authenticated
  USING (true);

-- Function to update customer statistics after order
CREATE OR REPLACE FUNCTION update_customer_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update customer statistics if phone number is provided
  IF NEW.customer_phone IS NOT NULL THEN
    INSERT INTO customers (phone, name, total_orders, total_spent, last_order_date)
    VALUES (
      NEW.customer_phone,
      NEW.customer_name,
      1,
      NEW.total_amount,
      NEW.created_at
    )
    ON CONFLICT (phone) DO UPDATE
    SET
      total_orders = customers.total_orders + 1,
      total_spent = customers.total_spent + NEW.total_amount,
      last_order_date = NEW.created_at,
      updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update customer stats on order
CREATE TRIGGER on_order_customer_update
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_stats();

-- Function to update table status
CREATE OR REPLACE FUNCTION update_table_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Update table status when order status changes
  IF NEW.table_number IS NOT NULL THEN
    UPDATE tables
    SET
      status = CASE
        WHEN NEW.status = 'cancelled' THEN 'available'
        WHEN NEW.status = 'delivered' THEN 'needs_cleaning'
        ELSE 'occupied'
      END,
      current_order_id = CASE
        WHEN NEW.status IN ('cancelled', 'delivered') THEN NULL
        ELSE NEW.id
      END,
      occupied_since = CASE
        WHEN NEW.status = 'pending' AND OLD.status IS NULL THEN NEW.created_at
        ELSE occupied_since
      END,
      updated_at = now()
    WHERE table_number = NEW.table_number;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update table status on order status change
CREATE TRIGGER on_order_status_change
  AFTER INSERT OR UPDATE OF status ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_table_status();