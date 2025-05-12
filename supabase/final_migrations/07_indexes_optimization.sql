/*
  # 07_indexes_optimization.sql - Indexes and Database Optimization
  
  Creates indexes and optimization functions to improve database performance.
  
  This migration handles:
  - Indexes on frequently queried columns
  - Performance optimization triggers
  - Maintenance functions
  
  Generated: 2025-05-12
*/

-- Indexes for profiles table
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles (role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles (email);

-- Indexes for orders table
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders (user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders (created_at);
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON public.orders (customer_phone);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders (payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_display_order_id ON public.orders (display_order_id);

-- Indexes for order_items table
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items (order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_name ON public.order_items (name);

-- Indexes for customers table
CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers (email);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers (phone);
CREATE INDEX IF NOT EXISTS idx_customers_status ON public.customers (status);
CREATE INDEX IF NOT EXISTS idx_customers_last_visit ON public.customers (last_visit);
CREATE INDEX IF NOT EXISTS idx_customers_total_spent ON public.customers (total_spent);

-- Indexes for staff table
CREATE INDEX IF NOT EXISTS idx_staff_user_id ON public.staff (user_id);
CREATE INDEX IF NOT EXISTS idx_staff_role ON public.staff (role);
CREATE INDEX IF NOT EXISTS idx_staff_email ON public.staff (email);
CREATE INDEX IF NOT EXISTS idx_staff_is_active ON public.staff (is_active);
CREATE INDEX IF NOT EXISTS idx_staff_department ON public.staff (department);
CREATE INDEX IF NOT EXISTS idx_staff_employee_id ON public.staff (employee_id);

-- Indexes for staff_documents table
CREATE INDEX IF NOT EXISTS idx_staff_documents_staff_id ON public.staff_documents (staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_documents_document_type ON public.staff_documents (document_type);
CREATE INDEX IF NOT EXISTS idx_staff_documents_expiry_date ON public.staff_documents (expiry_date);

-- Indexes for staff_attendance table
CREATE INDEX IF NOT EXISTS idx_staff_attendance_staff_id ON public.staff_attendance (staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_attendance_check_in ON public.staff_attendance (check_in);
CREATE INDEX IF NOT EXISTS idx_staff_attendance_status ON public.staff_attendance (status);

-- Indexes for staff_shifts table
CREATE INDEX IF NOT EXISTS idx_staff_shifts_staff_id ON public.staff_shifts (staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_shifts_shift_type ON public.staff_shifts (shift_type);
CREATE INDEX IF NOT EXISTS idx_staff_shifts_start_time ON public.staff_shifts (start_time);

-- Indexes for tables table
CREATE INDEX IF NOT EXISTS idx_tables_status ON public.tables (status);
CREATE INDEX IF NOT EXISTS idx_tables_table_number ON public.tables (table_number);

-- Indexes for menu_items table
CREATE INDEX IF NOT EXISTS idx_menu_items_category_id ON public.menu_items (category_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_is_available ON public.menu_items (is_available);
CREATE INDEX IF NOT EXISTS idx_menu_items_is_featured ON public.menu_items (is_featured);
CREATE INDEX IF NOT EXISTS idx_menu_items_name ON public.menu_items (name);
CREATE INDEX IF NOT EXISTS idx_menu_items_popularity_score ON public.menu_items (popularity_score DESC);

-- Indexes for categories table
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON public.categories (is_active);
CREATE INDEX IF NOT EXISTS idx_categories_display_order ON public.categories (display_order);

-- Indexes for invoices table
CREATE INDEX IF NOT EXISTS idx_invoices_order_id ON public.invoices (order_id);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON public.invoices (invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices (status);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_date ON public.invoices (invoice_date);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_phone ON public.invoices (customer_phone);

-- Indexes for invoice_items table
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON public.invoice_items (invoice_id);

-- Indexes for payments table
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON public.payments (invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments (order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments (status);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON public.payments (payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_payment_method ON public.payments (payment_method);

-- Optimization functions

-- Function to clean up old temporary data
CREATE OR REPLACE FUNCTION maintenance_cleanup_old_data()
RETURNS void AS $$
BEGIN
  -- Archive orders older than 1 year (move to archive tables instead of deleting in a real system)
  DELETE FROM public.orders
  WHERE created_at < (now() - interval '1 year')
  AND status IN ('completed', 'cancelled');
  
  -- Clean up old sessions, tokens, etc.
  -- (Not implemented here - depends on auth system)
  
  RETURN;
END;
$$ LANGUAGE plpgsql;

-- Function to optimize tables
CREATE OR REPLACE FUNCTION maintenance_optimize_tables()
RETURNS void AS $$
DECLARE
  table_name text;
BEGIN
  FOR table_name IN 
    SELECT tablename FROM pg_tables 
    WHERE schemaname = 'public'
  LOOP
    EXECUTE 'VACUUM ANALYZE public.' || quote_ident(table_name);
  END LOOP;
  
  RETURN;
END;
$$ LANGUAGE plpgsql;

-- Create materialized view for popular menu items (for faster menu recommendations)
CREATE MATERIALIZED VIEW IF NOT EXISTS public.popular_menu_items AS
SELECT 
  m.id,
  m.name,
  m.price,
  m.category_id,
  m.image_url,
  m.is_vegetarian,
  m.popularity_score,
  COUNT(oi.id) AS order_count,
  c.name AS category_name
FROM 
  public.menu_items m
LEFT JOIN 
  public.order_items oi ON m.name = oi.name AND oi.created_at > (now() - interval '30 days')
LEFT JOIN
  public.categories c ON m.category_id = c.id
WHERE 
  m.is_available = true
GROUP BY
  m.id, c.name
ORDER BY
  popularity_score DESC, order_count DESC
LIMIT 50;

-- Create index on the materialized view
CREATE INDEX IF NOT EXISTS idx_popular_menu_items_popularity
ON public.popular_menu_items (popularity_score DESC);

-- Create refresh function for materialized view
CREATE OR REPLACE FUNCTION refresh_popular_menu_items()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW public.popular_menu_items;
END
$$ LANGUAGE plpgsql;

-- Set up maintenance functions to run on schedule
-- Note: In a real system, this would be handled by a scheduled job outside PostgreSQL
-- or by using pg_cron extension

-- Grant permissions
GRANT EXECUTE ON FUNCTION maintenance_cleanup_old_data TO service_role;
GRANT EXECUTE ON FUNCTION maintenance_optimize_tables TO service_role;
GRANT EXECUTE ON FUNCTION refresh_popular_menu_items TO service_role;
GRANT SELECT ON public.popular_menu_items TO authenticated;
