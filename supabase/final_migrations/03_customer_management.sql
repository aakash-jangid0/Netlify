/*
  # 03_customer_management.sql - Customer Management Migration
  
  Creates tables and functions related to customer management.
  
  This migration handles:
  - Customers table
  - Customer activities tracking
  - Customer-related views and functions
  - RLS policies for customer data
  
  Generated: 2025-05-12
*/

-- Create customers table
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  last_visit TIMESTAMPTZ,
  total_orders INTEGER DEFAULT 0,
  total_spent NUMERIC DEFAULT 0,
  notes TEXT,
  status TEXT DEFAULT 'active',
  tags TEXT[],
  
  -- Add constraints
  CONSTRAINT customers_email_check CHECK (email ~* '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+[.][A-Za-z]+$')
);

-- Create customer_activities table for tracking
CREATE TABLE IF NOT EXISTS public.customer_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create helper view for active customers
CREATE OR REPLACE VIEW public.active_customers_view AS
SELECT id, name, email, phone, last_visit, total_orders, total_spent
FROM public.customers
WHERE status = 'active'
ORDER BY last_visit DESC NULLS LAST;

-- Create helper view for top spending customers
CREATE OR REPLACE VIEW public.top_customers_view AS
SELECT id, name, email, phone, total_orders, total_spent
FROM public.customers
WHERE status = 'active'
ORDER BY total_spent DESC
LIMIT 50;

-- Create function to update customer statistics
CREATE OR REPLACE FUNCTION public.update_customer_statistics()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.customers
  SET 
    total_orders = (
      SELECT COUNT(*) 
      FROM public.orders 
      WHERE customer_phone = NEW.customer_phone
    ),
    total_spent = (
      SELECT COALESCE(SUM(total_amount), 0) 
      FROM public.orders 
      WHERE customer_phone = NEW.customer_phone
    ),
    last_visit = NEW.created_at
  WHERE phone = NEW.customer_phone;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update customer statistics on order creation/update
CREATE TRIGGER update_customer_stats_after_order
AFTER INSERT OR UPDATE ON public.orders
FOR EACH ROW
WHEN (NEW.customer_phone IS NOT NULL)
EXECUTE FUNCTION public.update_customer_statistics();

-- Create function to get customer statistics
CREATE OR REPLACE FUNCTION public.get_customer_statistics(customer_id UUID)
RETURNS TABLE (
  total_orders INTEGER,
  total_spent NUMERIC,
  avg_order_value NUMERIC,
  first_order_date TIMESTAMPTZ,
  last_order_date TIMESTAMPTZ,
  days_since_last_order INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.total_orders,
    c.total_spent,
    CASE WHEN c.total_orders > 0 THEN c.total_spent / c.total_orders ELSE 0 END AS avg_order_value,
    MIN(o.created_at) AS first_order_date,
    MAX(o.created_at) AS last_order_date,
    EXTRACT(DAY FROM NOW() - MAX(o.created_at))::INTEGER AS days_since_last_order
  FROM
    public.customers c
    LEFT JOIN public.orders o ON c.phone = o.customer_phone
  WHERE
    c.id = customer_id
  GROUP BY
    c.id, c.total_orders, c.total_spent;
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_activities ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for customers
CREATE POLICY "Authenticated users can view customers"
ON public.customers
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert customers"
ON public.customers
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update customers"
ON public.customers
FOR UPDATE
TO authenticated
USING (true);

-- Create RLS policies for customer_activities
CREATE POLICY "Authenticated users can view customer activities"
ON public.customer_activities
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert customer activities"
ON public.customer_activities
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Grant permissions
GRANT ALL ON public.customers TO authenticated;
GRANT ALL ON public.customer_activities TO authenticated;
GRANT ALL ON public.active_customers_view TO authenticated;
GRANT ALL ON public.top_customers_view TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_customer_statistics TO authenticated;
