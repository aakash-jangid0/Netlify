/*
  # Unprocessed Statements
  
  These statements were not categorized into any of the consolidated migrations.
  Review these statements to determine if they should be included somewhere.
  
  Generated: 2025-05-12T12:10:13.944Z
*/

-- From: 20240507_customer_manage_complete.sql
END IF;

-- From: 20240507_customer_manage_complete.sql
END $$;

-- From: 20240507_customer_manage_complete.sql
CREATE OR REPLACE VIEW public.top_customers_view AS
SELECT id, name, email, phone, total_orders, total_spent
FROM public.customers
WHERE status = 'active'
ORDER BY total_spent DESC
LIMIT 50;

-- From: 20240507_customer_manage_complete.sql
END;

-- From: 20240507_customer_manage_complete.sql
$$ LANGUAGE plpgsql;

-- From: 20240507_customer_manage_complete.sql
GRANT ALL ON public.customers TO anon, authenticated;

-- From: 20240507_customer_manage_complete.sql
GRANT ALL ON public.customer_activities TO anon, authenticated;

-- From: 20240507_customer_manage_complete.sql
GRANT ALL ON public.active_customers_view TO anon, authenticated;

-- From: 20240507_customer_manage_complete.sql
GRANT ALL ON public.top_customers_view TO anon, authenticated;

-- From: 20240507_customer_manage_complete.sql
GRANT EXECUTE ON FUNCTION public.get_customer_statistics TO anon, authenticated;

-- From: 20240507_customer_manage_complete.sql
COMMIT;

-- From: 20240511_fix_customers_rls.sql
DROP POLICY IF EXISTS "Staff can insert customers" ON customers;

-- From: 20240511_fix_customers_rls.sql
DROP POLICY IF EXISTS "Staff can update customers" ON customers;

-- From: 20240511_fix_customers_rls.sql
DROP POLICY IF EXISTS "Staff can delete customers" ON customers;

-- From: 20240511_fix_customers_rls.sql
DROP POLICY IF EXISTS "Staff can manage customers" ON customers;

-- From: 20240511_fix_customers_rls.sql
DROP POLICY IF EXISTS "Authenticated users can view customers" ON customers;

-- From: 20240511_fix_customers_rls.sql
DROP POLICY IF EXISTS "Authenticated users can insert customers" ON customers;

-- From: 20240511_fix_customers_rls.sql
DROP POLICY IF EXISTS "Authenticated users can update customers" ON customers;

-- From: 20240511_fix_customers_rls.sql
DROP POLICY IF EXISTS "Authenticated users can delete customers" ON customers;

-- From: 20240511_fix_customers_rls.sql
GRANT SELECT, INSERT, UPDATE, DELETE ON customers TO service_role;

-- From: 20240514000000_fix_staff_documents_performance.sql
END$$;

-- From: 20240515000000_add_staff_helper_functions.sql
EXCEPTION 
  WHEN undefined_table THEN
    RAISE NOTICE 'staff_documents table does not exist';

-- From: 20240515000000_add_staff_helper_functions.sql
RETURN;

-- From: 20240515000000_add_staff_helper_functions.sql
WHEN OTHERS THEN
    RAISE NOTICE 'Error fetching staff documents: %', SQLERRM;

-- From: 20240515000000_add_staff_helper_functions.sql
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- From: 20240515000000_add_staff_helper_functions.sql
EXCEPTION 
  WHEN undefined_table THEN
    RAISE NOTICE 'staff_performance_reviews table does not exist';

-- From: 20240515000000_add_staff_helper_functions.sql
WHEN OTHERS THEN
    RAISE NOTICE 'Error fetching staff performance reviews: %', SQLERRM;

-- From: 20250319075720_holy_castle.sql
RETURN new;

-- From: 20250319124105_turquoise_block.sql
ALTER TABLE user_visits ENABLE ROW LEVEL SECURITY;

-- From: 20250319124105_turquoise_block.sql
ALTER TABLE favorite_items ENABLE ROW LEVEL SECURITY;

-- From: 20250319124105_turquoise_block.sql
ALTER TABLE user_interactions ENABLE ROW LEVEL SECURITY;

-- From: 20250319130404_sparkling_block.sql
ALTER TABLE user_preferences
  ADD COLUMN IF NOT EXISTS payment_methods text[],
  ADD COLUMN IF NOT EXISTS preferred_seating text[],
  ADD COLUMN IF NOT EXISTS communication_preferences text[],
  ADD COLUMN IF NOT EXISTS dietary_notes text,
  ADD COLUMN IF NOT EXISTS favorite_servers text[],
  ADD COLUMN IF NOT EXISTS blacklisted_items text[],
  ADD COLUMN IF NOT EXISTS preferred_contact_time text[];

-- From: 20250319130404_sparkling_block.sql
ALTER TABLE user_feedback ENABLE ROW LEVEL SECURITY;

-- From: 20250319130404_sparkling_block.sql
ALTER TABLE user_segments ENABLE ROW LEVEL SECURITY;

-- From: 20250319130404_sparkling_block.sql
ALTER TABLE order_analytics ENABLE ROW LEVEL SECURITY;

-- From: 20250319130404_sparkling_block.sql
ALTER TABLE table_analytics ENABLE ROW LEVEL SECURITY;

-- From: 20250319130404_sparkling_block.sql
ALTER TABLE promotion_responses ENABLE ROW LEVEL SECURITY;

-- From: 20250324081436_proud_crystal.sql
DROP POLICY IF EXISTS "Users can insert own orders" ON orders;

-- From: 20250324081436_proud_crystal.sql
DROP POLICY IF EXISTS "Users can insert own order items" ON order_items;

-- From: 20250324133717_crystal_snowflake.sql
DROP POLICY IF EXISTS "Staff can manage orders" ON orders;

-- From: 20250324133717_crystal_snowflake.sql
DROP POLICY IF EXISTS "Staff can manage order items" ON order_items;

-- From: 20250427083816_humble_delta.sql
DROP POLICY IF EXISTS "Staff can update orders" ON orders;

-- From: 20250427083816_humble_delta.sql
DROP POLICY IF EXISTS "Staff can delete orders" ON orders;

-- From: 20250427083816_humble_delta.sql
DROP POLICY IF EXISTS "Staff can view orders" ON orders;

-- From: 20250427115045_silver_lake.sql
DROP TABLE IF EXISTS orders CASCADE;

-- From: 20250427115045_silver_lake.sql
DROP TABLE IF EXISTS profiles CASCADE;

-- From: 20250427115045_silver_lake.sql
DROP TYPE IF EXISTS payment_status CASCADE;

-- From: 20250427121441_damp_star.sql
DROP POLICY IF EXISTS "Users can insert orders" ON orders;

-- From: 20250427121441_damp_star.sql
DROP POLICY IF EXISTS "Users can update orders" ON orders;

-- From: 20250427121441_damp_star.sql
DROP POLICY IF EXISTS "Staff can insert orders" ON orders;

-- From: 20250427121441_damp_star.sql
DROP POLICY IF EXISTS "Users can manage order items" ON order_items;

-- From: 20250427121855_broken_fire.sql
DROP POLICY IF EXISTS "Authenticated users can create orders" ON orders;

-- From: 20250427121855_broken_fire.sql
DROP POLICY IF EXISTS "Authenticated users can update orders" ON orders;

-- From: 20250427121855_broken_fire.sql
DROP POLICY IF EXISTS "Authenticated users can delete orders" ON orders;

-- From: 20250427154633_foggy_desert.sql
IF NEW.customer_phone IS NOT NULL AND NOT NEW.customer_phone ~ '^[0-9]{10}$' THEN
    RAISE EXCEPTION 'Invalid phone number format';

-- From: 20250427154633_foggy_desert.sql
IF NEW.total_amount < 0 THEN
    RAISE EXCEPTION 'Total amount cannot be negative';

-- From: 20250427160434_bold_sky.sql
month text;

-- From: 20250427160434_bold_sky.sql
day text;

-- From: 20250427160434_bold_sky.sql
sequence int;

-- From: 20250427160434_bold_sky.sql
invoice_number text;

-- From: 20250427160434_bold_sky.sql
BEGIN
  year := to_char(CURRENT_DATE, 'YY');

-- From: 20250427160434_bold_sky.sql
month := to_char(CURRENT_DATE, 'MM');

-- From: 20250427160434_bold_sky.sql
day := to_char(CURRENT_DATE, 'DD');

-- From: 20250427160434_bold_sky.sql
RETURN invoice_number;

-- From: 20250428010626_weathered_frog.sql
DROP FUNCTION IF EXISTS create_invoice_from_order;

-- From: 20250428010626_weathered_frog.sql
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

-- From: 20250428010626_weathered_frog.sql
$$ LANGUAGE sql;

-- From: 20250428010843_purple_swamp.sql
BEGIN
  -- First, build the ordered items JSON once for efficiency
  SELECT jsonb_object_agg(name, quantity) INTO items_json 
  FROM order_items 
  WHERE order_id = NEW.id;

-- From: 20250428011710_hidden_morning.sql
new_invoice_id uuid;

-- From: 20250428011710_hidden_morning.sql
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

-- From: 20250428012852_shrill_math.sql
calculated_subtotal numeric;

-- From: 20250428012852_shrill_math.sql
calculated_tax numeric;

-- From: 20250428012852_shrill_math.sql
calculated_total numeric;

-- From: 20250428012852_shrill_math.sql
BEGIN
  -- Calculate totals first
  SELECT 
    COALESCE(SUM(quantity * price), 0) as subtotal,
    COALESCE(SUM(quantity * price * tax_rate), 0) as tax,
    COALESCE(SUM(quantity * price * (1 + tax_rate)), 0) as total
  INTO calculated_subtotal, calculated_tax, calculated_total
  FROM order_items
  WHERE order_id = NEW.id;

-- From: 20250503083933_solitary_glade.sql
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;

-- From: 20250503083933_solitary_glade.sql
NEW.updated_at := now();

-- From: 20250503101510_crystal_lagoon.sql
DROP POLICY IF EXISTS "Staff can manage inventory" ON inventory;

-- From: 20250505090854_nameless_peak.sql
DROP POLICY IF EXISTS "Anyone can insert inventory" ON inventory;

-- From: 20250505090854_nameless_peak.sql
DROP POLICY IF EXISTS "Anyone can update inventory" ON inventory;

-- From: 20250505090854_nameless_peak.sql
DROP POLICY IF EXISTS "Anyone can delete inventory" ON inventory;

-- From: 20250505090854_nameless_peak.sql
IF NEW.category IS NULL OR trim(NEW.category) = '' THEN
    RAISE EXCEPTION 'Category is required';

-- From: 20250505090854_nameless_peak.sql
IF NEW.unit IS NULL OR trim(NEW.unit) = '' THEN
    RAISE EXCEPTION 'Unit is required';

-- From: 20250505090854_nameless_peak.sql
IF NEW.min_quantity < 0 THEN
    RAISE EXCEPTION 'Minimum quantity cannot be negative';

-- From: 20250505090854_nameless_peak.sql
IF NEW.max_quantity < NEW.min_quantity THEN
    RAISE EXCEPTION 'Maximum quantity must be greater than minimum quantity';

-- From: 20250505090854_nameless_peak.sql
IF NEW.cost_price < 0 THEN
    RAISE EXCEPTION 'Cost price cannot be negative';

-- From: 20250505090854_nameless_peak.sql
DROP POLICY IF EXISTS "Staff can insert transactions" ON inventory_transactions;

-- From: 20250505122407_rough_salad.sql
ALTER TABLE staff_activity_logs ENABLE ROW LEVEL SECURITY;

-- From: 20250506081741_twilight_wind.sql
ALTER TABLE staff_performance ENABLE ROW LEVEL SECURITY;

-- From: 20250506081741_twilight_wind.sql
ALTER TABLE staff_training ENABLE ROW LEVEL SECURITY;

-- From: 20250506081741_twilight_wind.sql
ALTER TABLE staff_payroll ENABLE ROW LEVEL SECURITY;

-- From: 20250506081741_twilight_wind.sql
ALTER TABLE staff_leave ENABLE ROW LEVEL SECURITY;

-- From: 20250506081741_twilight_wind.sql
ALTER TABLE staff_communications ENABLE ROW LEVEL SECURITY;

-- From: 20250509_staff_documents_performance.sql
END
$$;

-- From: 20250510112345_database_optimization.sql
IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'order_analytics') THEN
    DROP TABLE order_analytics CASCADE;

-- From: 20250510112345_database_optimization.sql
IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'promotion_responses') THEN
    DROP TABLE promotion_responses CASCADE;

-- From: 20250510112345_database_optimization.sql
IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_segments') THEN
    DROP TABLE user_segments CASCADE;

-- From: 20250510112345_database_optimization.sql
ELSE
      RAISE WARNING 'Could not drop customers table due to existing references';

-- From: 20250510112345_database_optimization.sql
DROP POLICY IF EXISTS "Public can view orders" ON orders;

-- From: 20250510112345_database_optimization.sql
DROP POLICY IF EXISTS "Counter staff can create orders" ON orders;

-- From: 20250510112345_database_optimization.sql
DROP POLICY IF EXISTS "Users can insert order items" ON order_items;

-- From: 20250510112345_database_optimization.sql
DROP POLICY IF EXISTS "Users can read own order items" ON order_items;

-- From: 20250510112345_database_optimization.sql
DROP POLICY IF EXISTS "Authenticated users can manage order items" ON order_items;

-- From: 20250510112345_database_optimization.sql
DROP POLICY IF EXISTS "Public can view order items" ON order_items;

-- From: 20250510112345_database_optimization.sql
ELSIF NEW.customer_name IS DISTINCT FROM OLD.customer_name THEN
    -- For UPDATE operations when name changes
    IF NEW.customer_name IS NULL OR trim(NEW.customer_name) = '' THEN
      RAISE EXCEPTION 'Customer name is required';

-- From: 20250510112345_database_optimization.sql
ELSIF NEW.total_amount IS DISTINCT FROM OLD.total_amount AND NEW.total_amount < 0 THEN
    RAISE EXCEPTION 'Total amount cannot be negative';

-- From: 20250510112345_database_optimization.sql
BEGIN
  -- First, build the ordered items JSON once
  SELECT jsonb_object_agg(name, quantity) INTO items_json 
  FROM order_items 
  WHERE order_id = NEW.id;

-- From: 20250510153000_staff_enhancement.sql
BEGIN
  -- Add some sample documents for each staff member
  FOR staff_record IN SELECT id, full_name FROM staff LOOP
    -- ID Document
    INSERT INTO staff_documents (
      staff_id,
      document_type,
      document_name,
      document_url,
      is_verified,
      created_at
    ) VALUES (
      staff_record.id,
      'identification',
      'ID Card - ' || staff_record.full_name,
      'https://example.com/documents/id/' || REPLACE(staff_record.full_name, ' ', '_') || '.pdf',
      TRUE,
      NOW() - (RANDOM() * INTERVAL '30 days')
    );

-- From: 20250510153000_staff_enhancement.sql
END LOOP;

-- From: 20250510200000_setup_attendance_shifts.sql
EXCEPTION WHEN OTHERS THEN
      -- Safely handle column already exists errors
      RAISE NOTICE 'Column modification error in staff_attendance: %', SQLERRM;

-- From: 20250510200000_setup_attendance_shifts.sql
EXCEPTION WHEN OTHERS THEN
      -- Safely handle column already exists errors
      RAISE NOTICE 'Column modification error in staff_shifts: %', SQLERRM;

-- From: 20250510200000_setup_attendance_shifts.sql
DROP POLICY IF EXISTS "Admin can view all attendance" ON public.staff_attendance;

-- From: 20250510200000_setup_attendance_shifts.sql
DROP POLICY IF EXISTS "Admin can manage all attendance" ON public.staff_attendance;

-- From: 20250510200000_setup_attendance_shifts.sql
DROP POLICY IF EXISTS "Staff can view their own shifts" ON public.staff_shifts;

-- From: 20250510200000_setup_attendance_shifts.sql
DROP POLICY IF EXISTS "Admin can view all shifts" ON public.staff_shifts;

-- From: 20250510200000_setup_attendance_shifts.sql
DROP POLICY IF EXISTS "Admin can manage all shifts" ON public.staff_shifts;

-- From: 20250510_fix_staff_tables.sql
DROP TRIGGER IF EXISTS set_staff_updated_at ON public.staff;

-- From: 20250510_fix_staff_tables.sql
EXCEPTION
      WHEN duplicate_object THEN
        NULL; -- Constraint already exists
    END;

-- From: 20250511000001_setup_shift_scheduler.sql
EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Constraint already exists or other error: %', SQLERRM;

-- From: 20250511200000_add_customer_email_to_orders.sql
BEGIN
  -- Calculate totals first
  SELECT 
    COALESCE(SUM(quantity * price), 0) as subtotal,
    COALESCE(SUM(quantity * price * tax_rate), 0) as tax,
    COALESCE(SUM(quantity * price * (1 + tax_rate)), 0) as total
  INTO calculated_subtotal, calculated_tax, calculated_total
  FROM order_items
  WHERE order_id = NEW.id;

-- From: 20250511203000_fix_invoice_issues.sql
short_order_id text;

-- From: 20250511203000_fix_invoice_issues.sql
BEGIN
  -- Generate short order ID for display and use as reference
  short_order_id := get_short_id(NEW.id);

-- From: 20250511_add_icon_to_categories.sql
UPDATE categories SET icon = 'Soup' WHERE slug = 'appetizer';

-- From: 20250511_add_icon_to_categories.sql
UPDATE categories SET icon = 'IceCream' WHERE slug = 'dessert';

-- From: 20250511_add_icon_to_categories.sql
UPDATE categories SET icon = 'Coffee' WHERE slug = 'beverage';

-- From: 20250511_add_icon_to_categories.sql
UPDATE categories SET icon = 'SandwichIcon' WHERE slug = 'sides';

-- From: 20250511_add_icon_to_categories.sql
UPDATE categories SET icon = 'Star' WHERE slug = 'specials';

-- From: 20250512000000_fix_invoice_generation.sql
BEGIN
  -- Generate short order ID for display
  short_order_id := get_short_id(NEW.id);

-- From: 20250512000000_public_access_performance_reviews.sql
DROP POLICY IF EXISTS "Staff can view their own reviews" ON public.staff_performance_reviews;

-- From: 20250512000000_public_access_performance_reviews.sql
DROP POLICY IF EXISTS "Staff can update their own goals" ON public.staff_performance_reviews;

-- From: 20250512000000_public_access_performance_reviews.sql
GRANT SELECT, INSERT, UPDATE, DELETE ON public.staff_performance_reviews TO authenticated;

-- From: 20250512000000_public_access_performance_reviews.sql
GRANT USAGE ON SEQUENCE public.staff_performance_reviews_id_seq TO anon, authenticated;

-- From: 20250515000000_create_feedback_system.sql
customer_record RECORD;

-- From: 20250515000000_create_feedback_system.sql
BEGIN
  -- Get order details
  SELECT * INTO order_record FROM orders WHERE id = NEW.order_id;

-- From: 20250515000000_create_feedback_system.sql
IF (NEW.customer_email IS NULL OR NEW.customer_email = '') AND customer_record.email IS NOT NULL THEN
      NEW.customer_email := customer_record.email;

-- From: 20250515000000_create_feedback_system.sql
IF (NEW.customer_phone IS NULL OR NEW.customer_phone = '') AND customer_record.phone IS NOT NULL THEN
      NEW.customer_phone := customer_record.phone;

