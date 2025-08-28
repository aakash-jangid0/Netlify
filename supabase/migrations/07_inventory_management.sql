-- Inventory Management Tables
-- Inventory, Inventory Transactions
-- Date: 2025-08-24

CREATE TABLE IF NOT EXISTS inventory (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  quantity numeric NOT NULL DEFAULT 0,
  unit text NOT NULL,
  min_quantity numeric NOT NULL DEFAULT 0,
  max_quantity numeric NOT NULL DEFAULT 0,
  cost_price numeric NOT NULL DEFAULT 0,
  supplier text,
  last_restocked timestamp with time zone,
  expiry_date timestamp with time zone,
  status text DEFAULT 'in_stock'::text,
  storage_location text,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS inventory_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  inventory_id uuid,
  transaction_type text NOT NULL,
  quantity numeric NOT NULL,
  previous_quantity numeric NOT NULL,
  new_quantity numeric NOT NULL,
  unit_cost numeric,
  total_cost numeric,
  reference_number text,
  notes text,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);
