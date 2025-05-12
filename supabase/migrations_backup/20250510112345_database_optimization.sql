/*
  # Database Optimization - Fixed and Improved Version

  1. Begin with a transaction for atomicity
  2. First analyze the database structure
  3. Then perform compatible optimizations
  4. Add indexes only where needed
  5. Clean up policies safely
  6. Improved error handling
*/

BEGIN;

-- Step 1: Create a temporary schema analysis table to understand our database structure
CREATE TEMP TABLE schema_analysis AS
SELECT 
  table_name,
  column_name,
  data_type
FROM 
  information_schema.columns 
WHERE 
  table_schema = 'public'
ORDER BY 
  table_name,
  column_name;

-- Add required columns to profiles table before attempting to update them
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS total_orders int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_spent numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_visit_date timestamptz;

-- Step 1: Remove redundant and unused tables safely
DO $$
BEGIN
  -- Only drop if they exist
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'table_analytics') THEN
    DROP TABLE table_analytics CASCADE;
  END IF;
  
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'order_analytics') THEN
    DROP TABLE order_analytics CASCADE;
  END IF;
  
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'promotion_responses') THEN
    DROP TABLE promotion_responses CASCADE;
  END IF;
  
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_segments') THEN
    DROP TABLE user_segments CASCADE;
  END IF;
END $$;

-- Step 2: Only try to consolidate customer data if the customers table exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'customers') THEN
    -- Ensure phone column exists in profiles
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_name = 'profiles' AND column_name = 'phone'
    ) THEN
      ALTER TABLE profiles ADD COLUMN phone text;
    END IF;
    
    -- Update profiles with customer data where phone matches
    UPDATE profiles p
    SET
      total_orders = c.total_orders,
      total_spent = c.total_spent,
      last_visit_date = c.last_order_date
    FROM customers c
    WHERE p.phone = c.phone;
    
    -- Only drop if there are no other tables referencing it
    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.table_constraints tc 
      JOIN information_schema.constraint_column_usage ccu
      ON tc.constraint_catalog = ccu.constraint_catalog 
      AND tc.constraint_schema = ccu.constraint_schema
      AND tc.constraint_name = ccu.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY' 
      AND ccu.table_name = 'customers'
    ) THEN
      DROP TABLE customers;
    ELSE
      RAISE WARNING 'Could not drop customers table due to existing references';
    END IF;
  END IF;
END $$;

-- Step 3: Remove circular dependency between orders and invoices
DO $$
BEGIN
  -- Check for and remove circular dependency between orders and invoices
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'invoice_id'
  ) THEN
    ALTER TABLE orders DROP COLUMN invoice_id;
  END IF;
END $$;

-- Step 2: Add missing indexes based on actual table structure

-- Orders table indexes (only if columns exist)
DO $$
BEGIN
  -- Check if orders table has a user_id column before creating index
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'user_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS orders_user_id_idx ON orders(user_id);
  END IF;

  -- Check if orders table has a status column
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'status'
  ) THEN
    CREATE INDEX IF NOT EXISTS orders_status_idx ON orders(status);
  END IF;

  -- Check if orders table has a payment_status column
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'payment_status'
  ) THEN
    CREATE INDEX IF NOT EXISTS orders_payment_status_idx ON orders(payment_status);
  END IF;

  -- Check if orders table has a created_at column
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'created_at'
  ) THEN
    CREATE INDEX IF NOT EXISTS orders_created_at_idx ON orders(created_at);
  END IF;

  -- Check if orders table has a table_number column
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'table_number'
  ) THEN
    CREATE INDEX IF NOT EXISTS orders_table_number_idx ON orders(table_number);
  END IF;

  -- Check if orders table has a customer_phone column
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'customer_phone'
  ) THEN
    CREATE INDEX IF NOT EXISTS orders_customer_phone_idx ON orders(customer_phone);
  END IF;
END $$;

-- Order_items table indexes
DO $$
BEGIN
  -- Check if order_items table exists and has an order_id column
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'order_items' AND column_name = 'order_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS order_items_order_id_idx ON order_items(order_id);
  END IF;

  -- Check if order_items table has a name column
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'order_items' AND column_name = 'name'
  ) THEN
    CREATE INDEX IF NOT EXISTS order_items_name_idx ON order_items(name);
  END IF;
END $$;

-- Profiles table indexes
DO $$
BEGIN
  -- Check if profiles table has a phone column
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'phone'
  ) THEN
    CREATE INDEX IF NOT EXISTS profiles_phone_idx ON profiles(phone);
  END IF;

  -- Check if profiles table has an email column
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'email'
  ) THEN
    CREATE INDEX IF NOT EXISTS profiles_email_idx ON profiles(email);
  END IF;
END $$;

-- Invoices table indexes
DO $$
BEGIN
  -- Check if invoices table exists and has needed columns
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'invoices'
  ) THEN
    -- Check for order_id column
    IF EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'invoices' AND column_name = 'order_id'
    ) THEN
      CREATE INDEX IF NOT EXISTS invoices_order_id_idx ON invoices(order_id);
    END IF;

    -- Check for created_at column
    IF EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'invoices' AND column_name = 'created_at'
    ) THEN
      CREATE INDEX IF NOT EXISTS invoices_created_at_idx ON invoices(created_at);
    END IF;

    -- Check for status column
    IF EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'invoices' AND column_name = 'status'
    ) THEN
      CREATE INDEX IF NOT EXISTS invoices_status_idx ON invoices(status);
    END IF;

    -- Check for payment_status column
    IF EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'invoices' AND column_name = 'payment_status'
    ) THEN
      CREATE INDEX IF NOT EXISTS invoices_payment_status_idx ON invoices(payment_status);
    END IF;
  END IF;
END $$;

-- Step 4: Clean up RLS policies safely
DO $$
BEGIN
  -- Only attempt to drop policies on tables that exist
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'orders') THEN
    -- Drop potentially conflicting policies
    DROP POLICY IF EXISTS "Users can read own orders" ON orders;
    DROP POLICY IF EXISTS "Users can insert own orders" ON orders;
    DROP POLICY IF EXISTS "Staff can manage orders" ON orders;
    DROP POLICY IF EXISTS "Public can view orders" ON orders;
    DROP POLICY IF EXISTS "Authenticated users can create orders" ON orders;
    DROP POLICY IF EXISTS "Authenticated users can update orders" ON orders;
    DROP POLICY IF EXISTS "Authenticated users can delete orders" ON orders;
    DROP POLICY IF EXISTS "Staff can view orders" ON orders;
    DROP POLICY IF EXISTS "Staff can insert orders" ON orders;
    DROP POLICY IF EXISTS "Staff can update orders" ON orders;
    DROP POLICY IF EXISTS "Staff can delete orders" ON orders;
    DROP POLICY IF EXISTS "Counter staff can create orders" ON orders;
    
    -- Create consolidated policies
    CREATE POLICY "Public can view orders"
      ON orders FOR SELECT
      TO public
      USING (true);

    CREATE POLICY "Staff can manage orders"
      ON orders FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;

  -- Order items policies
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'order_items') THEN
    -- Drop potentially conflicting policies
    DROP POLICY IF EXISTS "Users can view order items" ON order_items;
    DROP POLICY IF EXISTS "Users can insert order items" ON order_items;
    DROP POLICY IF EXISTS "Users can read own order items" ON order_items;
    DROP POLICY IF EXISTS "Users can insert own order items" ON order_items;
    DROP POLICY IF EXISTS "Users can manage order items" ON order_items;
    DROP POLICY IF EXISTS "Staff can manage order items" ON order_items;
    DROP POLICY IF EXISTS "Authenticated users can manage order items" ON order_items;
    DROP POLICY IF EXISTS "Public can view order items" ON order_items;

    -- Create consolidated policies
    CREATE POLICY "Public can view order items"
      ON order_items FOR SELECT
      TO public
      USING (true);

    CREATE POLICY "Staff can manage order items"
      ON order_items FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Step 5: Create optimized trigger functions
-- Define these outside DO blocks to avoid syntax errors

-- Improved order validation function
CREATE OR REPLACE FUNCTION validate_order()
RETURNS TRIGGER AS $$
BEGIN
  -- For customer name validation
  IF TG_OP = 'INSERT' THEN
    -- For INSERT operations
    IF NEW.customer_name IS NULL OR trim(NEW.customer_name) = '' THEN
      RAISE EXCEPTION 'Customer name is required';
    END IF;
  ELSIF NEW.customer_name IS DISTINCT FROM OLD.customer_name THEN
    -- For UPDATE operations when name changes
    IF NEW.customer_name IS NULL OR trim(NEW.customer_name) = '' THEN
      RAISE EXCEPTION 'Customer name is required';
    END IF;
  END IF;

  -- For phone validation
  IF NEW.customer_phone IS NOT NULL THEN
    IF TG_OP = 'INSERT' OR NEW.customer_phone IS DISTINCT FROM OLD.customer_phone THEN
      IF NOT NEW.customer_phone ~ '^[0-9]+$' THEN
        RAISE EXCEPTION 'Invalid phone number format, must contain only digits';
      END IF;
    END IF;
  END IF;

  -- For amount validation
  IF TG_OP = 'INSERT' THEN
    IF NEW.total_amount < 0 THEN
      RAISE EXCEPTION 'Total amount cannot be negative';
    END IF;
  ELSIF NEW.total_amount IS DISTINCT FROM OLD.total_amount AND NEW.total_amount < 0 THEN
    RAISE EXCEPTION 'Total amount cannot be negative';
  END IF;

  -- Set estimated completion time only if the column exists
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'estimated_completion_time'
  ) THEN
    IF NEW.status = 'preparing' AND (TG_OP = 'INSERT' OR OLD.status <> 'preparing') THEN
      NEW.estimated_completion_time := NOW() + (COALESCE(NEW.preparation_time, 20) || ' minutes')::interval;
    END IF;
  END IF;

  -- Set actual completion time only if the column exists
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'actual_completion_time'
  ) THEN
    IF NEW.status = 'delivered' AND (TG_OP = 'INSERT' OR OLD.status <> 'delivered') THEN
      NEW.actual_completion_time := NOW();
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Improved inventory status update function
CREATE OR REPLACE FUNCTION update_inventory_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Fix conditional structure for INSERT vs UPDATE
  IF TG_OP = 'INSERT' OR NEW.quantity IS DISTINCT FROM OLD.quantity THEN
    -- Only update status when quantity is inserted or changed
    NEW.status := CASE
      WHEN NEW.quantity <= 0 THEN 'out_of_stock'
      WHEN NEW.quantity <= COALESCE(NEW.min_quantity, 5) THEN 'low_stock'
      ELSE 'in_stock'
    END;
    
    -- Always update the timestamp when relevant fields change
    NEW.updated_at := now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Improved taste profile update function to handle race conditions
CREATE OR REPLACE FUNCTION update_taste_profile()
RETURNS TRIGGER AS $$
DECLARE
  items_json jsonb;
BEGIN
  -- First, build the ordered items JSON once
  SELECT jsonb_object_agg(name, quantity) INTO items_json 
  FROM order_items 
  WHERE order_id = NEW.id;
  
  -- Only continue if items were found
  IF items_json IS NOT NULL AND jsonb_typeof(items_json) = 'object' THEN
    -- Insert with conflict handling to ensure atomicity
    INSERT INTO user_preferences (
      user_id, 
      taste_profile,
      updated_at
    ) VALUES (
      NEW.user_id,
      jsonb_build_object('items', items_json),
      NOW()
    )
    ON CONFLICT (user_id) 
    DO UPDATE SET
      taste_profile = CASE
        WHEN user_preferences.taste_profile ? 'items' THEN
          jsonb_set(
            user_preferences.taste_profile,
            '{items}',
            COALESCE(user_preferences.taste_profile->'items', '{}'::jsonb) || items_json
          )
        ELSE
          jsonb_build_object('items', items_json)
      END,
      updated_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Add proper constraints
DO $$
BEGIN
  -- Add order_type constraint if the column exists
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'order_type'
  ) THEN
    ALTER TABLE orders
      DROP CONSTRAINT IF EXISTS valid_order_type,
      ADD CONSTRAINT valid_order_type CHECK (
        order_type IS NULL OR order_type IN ('dine-in', 'takeaway')
      );

    -- Only add the table_number constraint if both columns exist
    IF EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'table_number'
    ) THEN
      ALTER TABLE orders
        DROP CONSTRAINT IF EXISTS table_number_required,
        ADD CONSTRAINT table_number_required CHECK (
          (order_type != 'dine-in') OR (order_type = 'dine-in' AND table_number IS NOT NULL)
        );
    END IF;
  END IF;

  -- Add invoice status constraint if the table and column exist
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'invoices' AND column_name = 'status'
  ) THEN
    ALTER TABLE invoices
      DROP CONSTRAINT IF EXISTS valid_invoice_status_transition,
      ADD CONSTRAINT valid_invoice_status_transition CHECK (
        status IN ('draft', 'issued', 'paid', 'cancelled', 'refunded')
      );
  END IF;

  -- Add shift time constraint if the table and columns exist
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'staff_shifts' AND column_name = 'start_time'
  ) AND EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'staff_shifts' AND column_name = 'end_time'
  ) THEN
    ALTER TABLE staff_shifts
      DROP CONSTRAINT IF EXISTS valid_shift_times,
      ADD CONSTRAINT valid_shift_times CHECK (end_time > start_time);
  END IF;

  -- Add leave date constraint if the table and columns exist
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'staff_leave' AND column_name = 'start_date'
  ) AND EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'staff_leave' AND column_name = 'end_date'
  ) THEN
    ALTER TABLE staff_leave
      DROP CONSTRAINT IF EXISTS valid_leave_dates,
      ADD CONSTRAINT valid_leave_dates CHECK (end_date >= start_date);
  END IF;
END $$;

-- Step 7: Recreate important triggers
DO $$
BEGIN
  -- Only create order validation trigger if the table exists
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'orders') THEN
    DROP TRIGGER IF EXISTS validate_order_trigger ON orders;
    CREATE TRIGGER validate_order_trigger
      BEFORE INSERT OR UPDATE ON orders
      FOR EACH ROW
      EXECUTE FUNCTION validate_order();
  END IF;

  -- Only create inventory trigger if the table exists
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'inventory') THEN
    DROP TRIGGER IF EXISTS update_inventory_status_trigger ON inventory;
    CREATE TRIGGER update_inventory_status_trigger
      BEFORE INSERT OR UPDATE OF quantity ON inventory
      FOR EACH ROW
      EXECUTE FUNCTION update_inventory_status();
  END IF;

  -- Only create taste profile trigger if both tables exist
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'orders') AND 
     EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_preferences') THEN
    DROP TRIGGER IF EXISTS on_order_update_taste_profile ON orders;
    CREATE TRIGGER on_order_update_taste_profile
      AFTER INSERT ON orders
      FOR EACH ROW
      EXECUTE FUNCTION update_taste_profile();
  END IF;
END $$;

-- Step 8: Create a view for operational insights
DO $$
BEGIN
  -- Only create the view if the orders table exists
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'orders') THEN
    CREATE OR REPLACE VIEW order_insights AS
    SELECT 
      o.id,
      o.status,
      o.payment_status,
      o.created_at,
      o.table_number,
      o.customer_name,
      o.customer_phone,
      o.total_amount,
      CASE WHEN column_exists.exists THEN o.subtotal ELSE NULL END as subtotal,
      CASE WHEN column_exists.exists THEN o.tax ELSE NULL END as tax, 
      CASE WHEN column_exists.exists THEN o.discount ELSE NULL END as discount,
      o.payment_method,
      CASE WHEN column_exists.exists THEN o.order_type ELSE NULL END as order_type,
      CASE WHEN column_exists.exists THEN o.estimated_completion_time ELSE NULL END as estimated_completion_time,
      CASE WHEN column_exists.exists THEN o.actual_completion_time ELSE NULL END as actual_completion_time,
      COUNT(oi.id) AS item_count,
      SUM(oi.quantity) AS total_items
    FROM 
      orders o
    LEFT JOIN order_items oi ON o.id = oi.order_id
    CROSS JOIN (
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'orders' 
        AND column_name IN ('subtotal', 'tax', 'discount', 'order_type', 'estimated_completion_time', 'actual_completion_time')
      ) as exists
    ) as column_exists
    GROUP BY 
      o.id, 
      o.status, 
      o.payment_status, 
      o.created_at, 
      o.table_number, 
      o.customer_name, 
      o.customer_phone, 
      o.total_amount,
      column_exists.exists,
      CASE WHEN column_exists.exists THEN o.subtotal ELSE NULL END,
      CASE WHEN column_exists.exists THEN o.tax ELSE NULL END,
      CASE WHEN column_exists.exists THEN o.discount ELSE NULL END,
      o.payment_method,
      CASE WHEN column_exists.exists THEN o.order_type ELSE NULL END,
      CASE WHEN column_exists.exists THEN o.estimated_completion_time ELSE NULL END,
      CASE WHEN column_exists.exists THEN o.actual_completion_time ELSE NULL END;
  END IF;
END $$;

-- Step 9: Create an index on user_preferences for faster taste profile updates
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_preferences') THEN
    CREATE INDEX IF NOT EXISTS user_preferences_user_id_idx ON user_preferences(user_id);
  END IF;
END $$;

-- Clean up the temporary table
DROP TABLE IF EXISTS schema_analysis;

-- End transaction
COMMIT;
