/*
  # Add inventory management schema

  1. New Tables
    - `inventory`
      - Track inventory items and stock levels
      - Monitor expiry dates and reorder points
    
    - `inventory_transactions`
      - Record all inventory movements
      - Track stock adjustments and reasons

  2. Security
    - Enable RLS on all tables
    - Add appropriate policies
*/

-- Create inventory table
CREATE TABLE inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  quantity numeric NOT NULL DEFAULT 0,
  unit text NOT NULL,
  min_quantity numeric NOT NULL DEFAULT 0,
  max_quantity numeric NOT NULL DEFAULT 0,
  cost_price numeric NOT NULL DEFAULT 0,
  supplier text,
  last_restocked timestamptz,
  expiry_date timestamptz,
  status text DEFAULT 'in_stock',
  storage_location text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create inventory transactions table
CREATE TABLE inventory_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_id uuid REFERENCES inventory(id) ON DELETE CASCADE,
  transaction_type text NOT NULL,
  quantity numeric NOT NULL,
  previous_quantity numeric NOT NULL,
  new_quantity numeric NOT NULL,
  unit_cost numeric,
  total_cost numeric,
  reference_number text,
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Staff can view inventory"
  ON inventory FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Staff can manage inventory"
  ON inventory FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Staff can view transactions"
  ON inventory_transactions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Staff can insert transactions"
  ON inventory_transactions FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create indexes
CREATE INDEX inventory_category_idx ON inventory(category);
CREATE INDEX inventory_status_idx ON inventory(status);
CREATE INDEX inventory_supplier_idx ON inventory(supplier);
CREATE INDEX inventory_expiry_date_idx ON inventory(expiry_date);
CREATE INDEX inventory_transactions_type_idx ON inventory_transactions(transaction_type);
CREATE INDEX inventory_transactions_created_at_idx ON inventory_transactions(created_at);

-- Function to update inventory status based on quantity
CREATE OR REPLACE FUNCTION update_inventory_status()
RETURNS TRIGGER AS $$
BEGIN
  NEW.status := CASE
    WHEN NEW.quantity <= 0 THEN 'out_of_stock'
    WHEN NEW.quantity <= NEW.min_quantity THEN 'low_stock'
    ELSE 'in_stock'
  END;
  
  NEW.updated_at := now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updating inventory status
CREATE TRIGGER update_inventory_status_trigger
  BEFORE INSERT OR UPDATE OF quantity ON inventory
  FOR EACH ROW
  EXECUTE FUNCTION update_inventory_status();

-- Function to record inventory transactions
CREATE OR REPLACE FUNCTION record_inventory_transaction()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.quantity != OLD.quantity THEN
    INSERT INTO inventory_transactions (
      inventory_id,
      transaction_type,
      quantity,
      previous_quantity,
      new_quantity,
      unit_cost,
      total_cost,
      created_by
    ) VALUES (
      NEW.id,
      CASE 
        WHEN NEW.quantity > OLD.quantity THEN 'stock_in'
        ELSE 'stock_out'
      END,
      ABS(NEW.quantity - OLD.quantity),
      OLD.quantity,
      NEW.quantity,
      NEW.cost_price,
      ABS(NEW.quantity - OLD.quantity) * NEW.cost_price,
      auth.uid()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for recording inventory transactions
CREATE TRIGGER record_inventory_transaction_trigger
  AFTER UPDATE OF quantity ON inventory
  FOR EACH ROW
  EXECUTE FUNCTION record_inventory_transaction();