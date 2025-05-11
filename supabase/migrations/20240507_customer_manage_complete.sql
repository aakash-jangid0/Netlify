-- Customer Management SQL Migration for Supabase (with IF NOT EXISTS checks)
BEGIN;

-- Create customers table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50),
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_visit TIMESTAMP WITH TIME ZONE,
  total_orders INTEGER DEFAULT 0,
  total_spent DECIMAL(10, 2) DEFAULT 0,
  notes TEXT,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'blocked')),
  tags TEXT[]
);

-- Create indexes only if they don't exist
DO $$
BEGIN
    -- Check if customer_email index exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_customer_email'
    ) THEN
        CREATE INDEX idx_customer_email ON public.customers(email);
    END IF;
    
    -- Check if customer_name index exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_customer_name'
    ) THEN
        CREATE INDEX idx_customer_name ON public.customers(name);
    END IF;
    
    -- Check if customer_status index exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_customer_status'
    ) THEN
        CREATE INDEX idx_customer_status ON public.customers(status);
    END IF;
    
    -- Check if customer_created_at index exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_customer_created_at'
    ) THEN
        CREATE INDEX idx_customer_created_at ON public.customers(created_at);
    END IF;
END $$;

-- Create customer_activities table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.customer_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  activity_type VARCHAR(50) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create customer_activities index if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_customer_activities_customer_id'
    ) THEN
        CREATE INDEX idx_customer_activities_customer_id ON public.customer_activities(customer_id);
    END IF;
END $$;

-- Enable Row Level Security if not already enabled
DO $$
BEGIN
    -- For customers table
    IF EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' AND tablename = 'customers'
    ) THEN
        ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
    END IF;
    
    -- For customer_activities table
    IF EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' AND tablename = 'customer_activities'
    ) THEN
        ALTER TABLE public.customer_activities ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Create RLS policies if they don't exist
DO $$
BEGIN
    -- Check for customers table policies
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'customers' AND policyname = 'Authenticated users can view customers'
    ) THEN
        CREATE POLICY "Authenticated users can view customers" 
        ON public.customers FOR SELECT 
        USING (auth.role() = 'authenticated');
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'customers' AND policyname = 'Authenticated users can insert customers'
    ) THEN
        CREATE POLICY "Authenticated users can insert customers" 
        ON public.customers FOR INSERT 
        WITH CHECK (auth.role() = 'authenticated');
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'customers' AND policyname = 'Authenticated users can update customers'
    ) THEN
        CREATE POLICY "Authenticated users can update customers" 
        ON public.customers FOR UPDATE
        USING (auth.role() = 'authenticated');
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'customers' AND policyname = 'Authenticated users can delete customers'
    ) THEN
        CREATE POLICY "Authenticated users can delete customers" 
        ON public.customers FOR DELETE
        USING (auth.role() = 'authenticated');
    END IF;
    
    -- Check for customer_activities table policies
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'customer_activities' AND policyname = 'Authenticated users can view customer activities'
    ) THEN
        CREATE POLICY "Authenticated users can view customer activities" 
        ON public.customer_activities FOR SELECT 
        USING (auth.role() = 'authenticated');
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'customer_activities' AND policyname = 'Authenticated users can insert customer activities'
    ) THEN
        CREATE POLICY "Authenticated users can insert customer activities" 
        ON public.customer_activities FOR INSERT 
        WITH CHECK (auth.role() = 'authenticated');
    END IF;
END $$;

-- Create or replace views
CREATE OR REPLACE VIEW public.active_customers_view AS
SELECT id, name, email, phone, created_at, last_visit, total_orders, total_spent
FROM public.customers
WHERE status = 'active';

CREATE OR REPLACE VIEW public.top_customers_view AS
SELECT id, name, email, phone, total_orders, total_spent
FROM public.customers
WHERE status = 'active'
ORDER BY total_spent DESC
LIMIT 50;

-- Insert sample data only if table is empty - WITH EXPLICIT CASTING FOR EMPTY ARRAY
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.customers LIMIT 1) THEN
        INSERT INTO public.customers (name, email, phone, address, created_at, last_visit, total_orders, total_spent, notes, status, tags)
        VALUES
          ('John Doe', 'john@example.com', '+91 9876543210', '123 Main St, Mumbai', 
           NOW() - INTERVAL '30 days', NOW() - INTERVAL '5 days', 12, 5600.00, 'Prefers spicy food', 'active', 
           ARRAY['regular', 'vegetarian']),
          
          ('Jane Smith', 'jane@example.com', '+91 8765432109', '456 Park Ave, Delhi', 
           NOW() - INTERVAL '60 days', NOW() - INTERVAL '15 days', 8, 3200.00, 'Allergic to nuts', 'active', 
           ARRAY['new', 'non-vegetarian']),
          
          ('Amit Kumar', 'amit@example.com', '+91 7654321098', '789 Lake Rd, Bangalore', 
           NOW() - INTERVAL '90 days', NOW() - INTERVAL '45 days', 20, 9800.00, 'Regular weekend customer', 'active', 
           ARRAY['premium', 'vegetarian']),
          
          ('Priya Sharma', 'priya@example.com', '+91 6543210987', '101 Hill St, Chennai', 
           NOW() - INTERVAL '45 days', NULL, 3, 1200.00, 'New customer', 'active', 
           ARRAY['new']),
          
          ('Raj Patel', 'raj@example.com', '+91 5432109876', '234 River Rd, Hyderabad', 
           NOW() - INTERVAL '120 days', NOW() - INTERVAL '100 days', 0, 0.00, 'Inactive account', 'inactive', 
           ARRAY[]::TEXT[]);  -- Explicitly cast empty array to TEXT[]
    END IF;
END $$;

-- Create or replace the customer statistics function
CREATE OR REPLACE FUNCTION public.get_customer_statistics()
RETURNS TABLE (
  total_customers BIGINT,
  active_customers BIGINT,
  inactive_customers BIGINT,
  blocked_customers BIGINT,
  avg_orders_per_customer NUMERIC,
  avg_spending_per_customer NUMERIC,
  new_customers_last_30_days BIGINT
) SECURITY INVOKER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM public.customers) AS total_customers,
    (SELECT COUNT(*) FROM public.customers WHERE status = 'active') AS active_customers,
    (SELECT COUNT(*) FROM public.customers WHERE status = 'inactive') AS inactive_customers,
    (SELECT COUNT(*) FROM public.customers WHERE status = 'blocked') AS blocked_customers,
    (SELECT COALESCE(AVG(total_orders), 0) FROM public.customers) AS avg_orders_per_customer,
    (SELECT COALESCE(AVG(total_spent), 0) FROM public.customers) AS avg_spending_per_customer,
    (SELECT COUNT(*) FROM public.customers WHERE created_at >= NOW() - INTERVAL '30 days') AS new_customers_last_30_days;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.customers TO anon, authenticated;
GRANT ALL ON public.customer_activities TO anon, authenticated;
GRANT ALL ON public.active_customers_view TO anon, authenticated;
GRANT ALL ON public.top_customers_view TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_customer_statistics TO anon, authenticated;

COMMIT;