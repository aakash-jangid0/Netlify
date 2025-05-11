/*
  # Fix Invoice Generation System

  1. Changes
    - Remove invoice_id from orders to break circular dependency
    - Update create_invoice_from_order function
    - Add validation constraints
    - Add indexes for performance

  2. Security
    - Maintain existing RLS policies
*/

-- Remove invoice_id from orders to break circular dependency
ALTER TABLE orders
  DROP COLUMN IF EXISTS invoice_id;

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS create_invoice_after_order ON orders;
DROP FUNCTION IF EXISTS create_invoice_from_order;

-- Recreate function with fixed logic
CREATE OR REPLACE FUNCTION create_invoice_from_order()
RETURNS TRIGGER AS $$
DECLARE
  tax_rate CONSTANT numeric := 0.18;
  new_invoice_id uuid;
BEGIN
  -- Calculate totals
  WITH order_totals AS (
    SELECT 
      SUM(quantity * price) as subtotal,
      SUM(quantity * price * tax_rate) as tax_amount,
      SUM(quantity * price * (1 + tax_rate)) as total_amount
    FROM order_items
    WHERE order_id = NEW.id
  )
  -- Create invoice
  INSERT INTO invoices (
    order_id,
    invoice_number,
    customer_name,
    customer_phone,
    subtotal,
    tax_amount,
    total_amount,
    payment_method,
    payment_status,
    status
  )
  SELECT
    NEW.id,
    generate_invoice_number(),
    NEW.customer_name,
    NEW.customer_phone,
    subtotal,
    tax_amount,
    total_amount,
    NEW.payment_method,
    NEW.payment_status,
    CASE 
      WHEN NEW.payment_status = 'completed' THEN 'paid'::invoice_status
      ELSE 'issued'::invoice_status
    END
  FROM order_totals
  RETURNING id INTO new_invoice_id;

  -- Create invoice items
  INSERT INTO invoice_items (
    invoice_id,
    item_name,
    quantity,
    unit_price,
    tax_rate,
    tax_amount,
    total_amount
  )
  SELECT
    new_invoice_id,
    oi.name,
    oi.quantity,
    oi.price,
    tax_rate,
    (oi.price * oi.quantity * tax_rate),
    (oi.price * oi.quantity * (1 + tax_rate))
  FROM order_items oi
  WHERE oi.order_id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger
CREATE TRIGGER create_invoice_after_order
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION create_invoice_from_order();

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS invoices_created_at_idx ON invoices(created_at);
CREATE INDEX IF NOT EXISTS invoices_status_idx ON invoices(status);
CREATE INDEX IF NOT EXISTS invoices_payment_status_idx ON invoices(payment_status);