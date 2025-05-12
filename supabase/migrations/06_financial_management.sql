/*
  # 06_financial_management.sql - Financial Management Migration
  
  Creates tables and functions related to financial operations.
  
  This migration handles:
  - Invoices
  - Invoice items
  - Payments
  - Financial reports
  - RLS policies for financial data
  
  Generated: 2025-05-12
*/

-- Create invoices table
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  invoice_number TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  customer_email TEXT,
  billing_address TEXT,
  invoice_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  due_date TIMESTAMPTZ,
  subtotal NUMERIC NOT NULL CHECK (subtotal >= 0),
  tax_amount NUMERIC NOT NULL DEFAULT 0,
  discount_amount NUMERIC DEFAULT 0,
  total_amount NUMERIC NOT NULL CHECK (total_amount >= 0),
  status TEXT DEFAULT 'pending',
  payment_method TEXT,
  notes TEXT,
  terms_and_conditions TEXT,
  is_printed BOOLEAN DEFAULT false,
  print_count INTEGER DEFAULT 0,
  last_printed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  display_order_id TEXT
);

-- Create invoice_items table
CREATE TABLE IF NOT EXISTS public.invoice_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  description TEXT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC NOT NULL CHECK (unit_price >= 0),
  tax_rate NUMERIC DEFAULT 0,
  tax_amount NUMERIC DEFAULT 0,
  discount_amount NUMERIC DEFAULT 0,
  total_amount NUMERIC NOT NULL CHECK (total_amount >= 0),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create payments table
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL CHECK (amount >= 0),
  payment_method TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  transaction_id TEXT,
  payment_date TIMESTAMPTZ DEFAULT now(),
  payment_details JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Add constraints
  CONSTRAINT payments_requires_reference CHECK (
    (invoice_id IS NOT NULL) OR (order_id IS NOT NULL)
  )
);

-- Create update triggers for timestamp maintenance
CREATE TRIGGER update_invoices_updated_at
BEFORE UPDATE ON public.invoices
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_payments_updated_at
BEFORE UPDATE ON public.payments
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Function to update invoice details when invoice items change
CREATE OR REPLACE FUNCTION update_invoice_totals()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.invoices
  SET 
    subtotal = (
      SELECT COALESCE(SUM(total_amount - tax_amount), 0) 
      FROM public.invoice_items 
      WHERE invoice_id = NEW.invoice_id
    ),
    tax_amount = (
      SELECT COALESCE(SUM(tax_amount), 0) 
      FROM public.invoice_items 
      WHERE invoice_id = NEW.invoice_id
    ),
    total_amount = (
      SELECT COALESCE(SUM(total_amount), 0) 
      FROM public.invoice_items 
      WHERE invoice_id = NEW.invoice_id
    )
  WHERE id = NEW.invoice_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_invoice_totals_on_item_change
AFTER INSERT OR UPDATE OR DELETE ON public.invoice_items
FOR EACH ROW
EXECUTE FUNCTION update_invoice_totals();

-- Function to update order payment status when payment is made
CREATE OR REPLACE FUNCTION update_order_payment_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND NEW.order_id IS NOT NULL THEN
    UPDATE public.orders
    SET payment_status = 'completed'
    WHERE id = NEW.order_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_order_status_on_payment
AFTER INSERT OR UPDATE ON public.payments
FOR EACH ROW
WHEN (NEW.status = 'completed')
EXECUTE FUNCTION update_order_payment_status();

-- Function to auto-generate invoice numbers
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.invoice_number := 'INV-' || to_char(now(), 'YYYYMM') || '-' || 
                        LPAD((SELECT COUNT(*) + 1 FROM public.invoices 
                             WHERE invoice_number LIKE 'INV-' || to_char(now(), 'YYYYMM') || '-%')::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_invoice_number_before_insert
BEFORE INSERT ON public.invoices
FOR EACH ROW
WHEN (NEW.invoice_number IS NULL)
EXECUTE FUNCTION generate_invoice_number();

-- Enable Row Level Security
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for invoices
CREATE POLICY "Authenticated users can view invoices"
ON public.invoices
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Staff can insert invoices"
ON public.invoices
FOR INSERT
TO authenticated
WITH CHECK (auth.role() = 'service_role' OR EXISTS (
  SELECT 1 FROM public.profiles
  WHERE profiles.id = auth.uid()
  AND profiles.role IN ('admin', 'staff')
));

-- Create RLS policies for invoice_items
CREATE POLICY "Authenticated users can view invoice items"
ON public.invoice_items
FOR SELECT
TO authenticated
USING (true);

-- Create RLS policies for payments
CREATE POLICY "Authenticated users can view their own payments"
ON public.payments
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.orders
  WHERE orders.id = payments.order_id
  AND orders.user_id = auth.uid()
) OR auth.role() = 'service_role' OR EXISTS (
  SELECT 1 FROM public.profiles
  WHERE profiles.id = auth.uid()
  AND profiles.role IN ('admin', 'staff')
));

CREATE POLICY "Users can insert payments for their orders"
ON public.payments
FOR INSERT
TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.orders
  WHERE orders.id = NEW.order_id
  AND orders.user_id = auth.uid()
) OR auth.role() = 'service_role');

-- Grant permissions
GRANT ALL ON public.invoices TO authenticated;
GRANT ALL ON public.invoice_items TO authenticated;
GRANT ALL ON public.payments TO authenticated;
