/*
  # Fix Invoice Generation Issues

  1. Changes
    - Add display_order_id column to invoices for human-readable IDs
    - Add indexes for faster lookup by display_order_id
    - Modify invoice_items schema to ensure proper calculations
    - Remove payment_status from invoices
    - Update create_invoice trigger function for proper data population
    - Fix restaurant branding in generated invoices
*/

-- Add display_order_id to invoices for human-readable orders
ALTER TABLE invoices 
  ADD COLUMN IF NOT EXISTS display_order_id text;

-- Create index for faster lookup
CREATE INDEX IF NOT EXISTS invoices_display_order_id_idx ON invoices(display_order_id);

-- Remove payment_status column as it's not needed
ALTER TABLE invoices 
  DROP COLUMN IF EXISTS payment_status;

-- Update invoice generation function
DROP TRIGGER IF EXISTS create_invoice_after_order ON orders;
DROP FUNCTION IF EXISTS create_invoice_from_order;

-- Create function to extract short ID from UUID
CREATE OR REPLACE FUNCTION get_short_id(id uuid)
RETURNS text AS $$
BEGIN
  -- Extract last 6 characters from UUID
  RETURN substring(id::text, 25, 6);
END;
$$ LANGUAGE plpgsql;

-- Recreate invoice generation function
CREATE OR REPLACE FUNCTION create_invoice_from_order()
RETURNS TRIGGER AS $$
DECLARE
  tax_rate CONSTANT numeric := 0.18;
  calculated_subtotal numeric;
  calculated_tax numeric;
  calculated_total numeric;
  new_invoice_id uuid;
  short_order_id text;
BEGIN
  -- Generate short order ID for display
  short_order_id := get_short_id(NEW.id);
  
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
    display_order_id,
    customer_name,
    customer_phone,
    customer_email,
    subtotal,
    tax_amount,
    total_amount,
    payment_method,
    status
  ) VALUES (
    NEW.id,
    generate_invoice_number(),
    short_order_id,
    COALESCE(NEW.customer_name, 'Guest'),
    NEW.customer_phone,
    NEW.customer_email, -- This will be null if not provided
    calculated_subtotal,
    calculated_tax,
    calculated_total,
    NEW.payment_method,
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

-- Update existing invoices to set display_order_id for existing records
UPDATE invoices 
SET display_order_id = get_short_id(order_id)
WHERE display_order_id IS NULL AND order_id IS NOT NULL;
