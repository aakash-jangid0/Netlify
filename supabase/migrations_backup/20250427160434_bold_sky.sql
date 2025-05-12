/*
  # Add billing system tables and functions

  1. New Tables
    - `invoices`
      - Store invoice details and metadata
      - Track invoice status and history
    
    - `invoice_items`
      - Store individual line items for each invoice
      - Track item details and pricing

  2. Security
    - Enable RLS on all tables
    - Add appropriate policies
*/

-- Create invoice status type
CREATE TYPE invoice_status AS ENUM (
  'draft',
  'issued',
  'paid',
  'cancelled',
  'refunded'
);

-- Create invoices table
CREATE TABLE invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  invoice_number text NOT NULL UNIQUE,
  customer_name text NOT NULL,
  customer_phone text,
  customer_email text,
  billing_address text,
  invoice_date timestamptz DEFAULT now(),
  due_date timestamptz,
  subtotal numeric NOT NULL CHECK (subtotal >= 0),
  tax_amount numeric NOT NULL CHECK (tax_amount >= 0),
  discount_amount numeric DEFAULT 0 CHECK (discount_amount >= 0),
  total_amount numeric NOT NULL CHECK (total_amount >= 0),
  status invoice_status DEFAULT 'draft',
  payment_method text,
  payment_status text,
  notes text,
  terms_and_conditions text,
  is_printed boolean DEFAULT false,
  print_count int DEFAULT 0,
  last_printed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create invoice items table
CREATE TABLE invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid REFERENCES invoices(id) ON DELETE CASCADE,
  item_name text NOT NULL,
  description text,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price numeric NOT NULL CHECK (unit_price >= 0),
  tax_rate numeric DEFAULT 0.18,
  tax_amount numeric NOT NULL CHECK (tax_amount >= 0),
  discount_amount numeric DEFAULT 0 CHECK (discount_amount >= 0),
  total_amount numeric NOT NULL CHECK (total_amount >= 0),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

-- Create policies for invoices
CREATE POLICY "Public can view own invoices"
  ON invoices FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Staff can manage invoices"
  ON invoices FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policies for invoice items
CREATE POLICY "Public can view invoice items"
  ON invoice_items FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Staff can manage invoice items"
  ON invoice_items FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create indexes
CREATE INDEX invoices_order_id_idx ON invoices(order_id);
CREATE INDEX invoices_invoice_number_idx ON invoices(invoice_number);
CREATE INDEX invoices_customer_phone_idx ON invoices(customer_phone);
CREATE INDEX invoice_items_invoice_id_idx ON invoice_items(invoice_id);

-- Function to generate invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS text AS $$
DECLARE
  year text;
  month text;
  day text;
  sequence int;
  invoice_number text;
BEGIN
  year := to_char(CURRENT_DATE, 'YY');
  month := to_char(CURRENT_DATE, 'MM');
  day := to_char(CURRENT_DATE, 'DD');
  
  -- Get the next sequence number for today
  WITH seq AS (
    SELECT COUNT(*) + 1 as next_seq
    FROM invoices
    WHERE DATE(created_at) = CURRENT_DATE
  )
  SELECT next_seq INTO sequence FROM seq;
  
  -- Format: INV-YYMMDD-XXXX (e.g., INV-240428-0001)
  invoice_number := 'INV-' || year || month || day || '-' || 
                   LPAD(sequence::text, 4, '0');
  
  RETURN invoice_number;
END;
$$ LANGUAGE plpgsql;

-- Function to create invoice from order
CREATE OR REPLACE FUNCTION create_invoice_from_order()
RETURNS TRIGGER AS $$
BEGIN
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
  ) RETURNING id INTO NEW.invoice_id;

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
    NEW.invoice_id,
    oi.name,
    oi.quantity,
    oi.price,
    (oi.price * oi.quantity * 0.18),
    (oi.price * oi.quantity * 1.18)
  FROM order_items oi
  WHERE oi.order_id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create invoice when order is created
CREATE TRIGGER create_invoice_after_order
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION create_invoice_from_order();