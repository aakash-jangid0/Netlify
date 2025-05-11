/*
  # Add customer_email to orders table

  1. Changes
    - Add customer_email column to orders table to fix invoice generation
*/

-- Add customer_email column to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_email text;

-- Update invoice trigger function to handle null customer_email
DROP TRIGGER IF EXISTS create_invoice_after_order ON orders;
DROP FUNCTION IF EXISTS create_invoice_from_order;

-- Recreate function with null handling for customer_email
CREATE OR REPLACE FUNCTION create_invoice_from_order()
RETURNS TRIGGER AS $$
DECLARE
  tax_rate CONSTANT numeric := 0.18;
  calculated_subtotal numeric;
  calculated_tax numeric;
  calculated_total numeric;
  new_invoice_id uuid;
BEGIN
  -- Calculate totals first
  SELECT 
    COALESCE(SUM(quantity * price), 0) as subtotal,
    COALESCE(SUM(quantity * price * tax_rate), 0) as tax,
    COALESCE(SUM(quantity * price * (1 + tax_rate)), 0) as total
  INTO calculated_subtotal, calculated_tax, calculated_total
  FROM order_items
  WHERE order_id = NEW.id;

  -- Create invoice with calculated values
  INSERT INTO invoices (
    order_id,
    invoice_number,
    customer_name,
    customer_phone,
    customer_email,
    subtotal,
    tax_amount,
    total_amount,
    payment_method,
    payment_status,
    status
  ) VALUES (
    NEW.id,
    generate_invoice_number(),
    COALESCE(NEW.customer_name, 'Guest'),
    NEW.customer_phone,
    NEW.customer_email, -- This will be null if not provided
    calculated_subtotal,
    calculated_tax,
    calculated_total,
    NEW.payment_method,
    NEW.payment_status,
    CASE 
      WHEN NEW.payment_status = 'completed' THEN 'paid'::invoice_status
      ELSE 'issued'::invoice_status
    END
  ) RETURNING id INTO new_invoice_id;

  -- Create invoice items using the returned UUID
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
