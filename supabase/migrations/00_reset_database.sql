/*
  # 00_reset_database.sql - Database Reset Script
  
  USE WITH CAUTION: This script will reset the database to its initial state.
  Only for development and testing environments.
  
  Generated: 2025-05-12
*/

-- Drop existing tables in reverse order of dependencies
DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.invoice_items CASCADE;
DROP TABLE IF EXISTS public.invoices CASCADE;
DROP TABLE IF EXISTS public.menu_items CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.tables CASCADE;
DROP TABLE IF EXISTS public.staff_performance_reviews CASCADE;
DROP TABLE IF EXISTS public.staff_shifts CASCADE;
DROP TABLE IF EXISTS public.staff_attendance CASCADE;
DROP TABLE IF EXISTS public.staff_documents CASCADE;
DROP TABLE IF EXISTS public.staff CASCADE;
DROP TABLE IF EXISTS public.customer_activities CASCADE;
DROP TABLE IF EXISTS public.customers CASCADE;
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Drop materialized views
DROP MATERIALIZED VIEW IF EXISTS public.popular_menu_items CASCADE;

-- Drop views
DROP VIEW IF EXISTS public.active_customers_view CASCADE;
DROP VIEW IF EXISTS public.top_customers_view CASCADE;

-- Drop custom types
DROP TYPE IF EXISTS order_status CASCADE;
DROP TYPE IF EXISTS order_type CASCADE;
DROP TYPE IF EXISTS payment_method CASCADE;
DROP TYPE IF EXISTS payment_status CASCADE;
DROP TYPE IF EXISTS staff_role CASCADE;
DROP TYPE IF EXISTS shift_type CASCADE;

-- Reset sequences (if any custom sequences were created)
-- ALTER SEQUENCE IF EXISTS public.some_sequence RESTART WITH 1;
