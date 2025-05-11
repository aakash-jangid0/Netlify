/*
  # Fix invoice-order relationship

  1. Changes
    - Remove circular dependency between orders and invoices
    - Update create_invoice_from_order function to handle the relationship properly
    - Fix trigger to avoid recursive issues

  2. Security
    - Maintain existing RLS policies
*/

-- Drop existing trigger and function to avoid issues during schema changes
DROP TRIGGER IF EXISTS create_invoice_after_order ON orders;
DROP FUNCTION IF EXISTS create_invoice_from_order;

-- Remove the invoice_id column from orders if it exists (this creates circular dependency)
ALTER TABLE orders DROP COLUMN IF EXISTS invoice_id;

-- Recreate function with fixed logic (no circular reference)
CREATE OR REPLACE FUNCTION create_invoice_from_order()
RETURNS TRIGGER AS $$
DECLARE
  new_invoice_id uuid;
BEGIN
  -- Only create invoice if one doesn't already exist for this order
  IF NOT EXISTS (SELECT 1 FROM invoices WHERE order_id = NEW.id) THEN
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
    ) VALUES (
      NEW.id,
      generate_invoice_number(),
      NEW.customer_name,
      NEW.customer_phone,
      NEW.subtotal,
      NEW.tax,
      NEW.total_amount,
      NEW.payment_method,
      NEW.payment_status,
      CASE 
        WHEN NEW.payment_status = 'completed' THEN 'paid'::invoice_status
        ELSE 'issued'::invoice_status
      END
    ) RETURNING id INTO new_invoice_id;

    -- Create invoice items
    INSERT INTO invoice_items (
      invoice_id,
      item_name,
      quantity,
      unit_price,
      tax_amount,
      total_amount
    )
    SELECT
      new_invoice_id,
      oi.name,
      oi.quantity,
      oi.price,
      (oi.price * oi.quantity * 0.18),
      (oi.price * oi.quantity * 1.18)
    FROM order_items oi
    WHERE oi.order_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger
CREATE TRIGGER create_invoice_after_order
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION create_invoice_from_order();

-- Create convenient function to find invoice by order_id
CREATE OR REPLACE FUNCTION get_invoice_by_order(order_id uuid)
RETURNS uuid AS $$
  SELECT id FROM invoices WHERE order_id = $1 LIMIT 1;
$$ LANGUAGE sql;