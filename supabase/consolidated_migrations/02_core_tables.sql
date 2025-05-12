/*
  # Core Tables Migration
  
  Creates profiles, orders, and order_items tables with their RLS policies
  
  Generated: 2025-05-12T12:10:13.920Z
*/

-- Alter tables

-- From: 20250319075720_holy_castle.sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- From: 20250319075726_ancient_sea.sql
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- From: 20250319130404_sparkling_block.sql
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS referral_source text,
  ADD COLUMN IF NOT EXISTS lifetime_value numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS churn_risk numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_engagement_date timestamptz,
  ADD COLUMN IF NOT EXISTS marketing_consent boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS preferred_language text DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS dietary_restrictions_verified boolean DEFAULT false;

-- From: 20250323155046_dusty_gate.sql
ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS preparation_status text DEFAULT 'not_started',
  ADD COLUMN IF NOT EXISTS started_at timestamptz,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz;

-- From: 20250427115045_silver_lake.sql
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Create policies

-- From: 20240507_customer_manage_complete.sql
IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'customers' AND policyname = 'Authenticated users can insert customers'
    ) THEN
        CREATE POLICY "Authenticated users can insert customers" 
        ON public.customers FOR INSERT 
        WITH CHECK (auth.role() = 'authenticated');

-- From: 20240507_customer_manage_complete.sql
IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'customers' AND policyname = 'Authenticated users can update customers'
    ) THEN
        CREATE POLICY "Authenticated users can update customers" 
        ON public.customers FOR UPDATE
        USING (auth.role() = 'authenticated');

-- From: 20240507_customer_manage_complete.sql
IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'customers' AND policyname = 'Authenticated users can delete customers'
    ) THEN
        CREATE POLICY "Authenticated users can delete customers" 
        ON public.customers FOR DELETE
        USING (auth.role() = 'authenticated');

-- From: 20240507_customer_manage_complete.sql
IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'customer_activities' AND policyname = 'Authenticated users can insert customer activities'
    ) THEN
        CREATE POLICY "Authenticated users can insert customer activities" 
        ON public.customer_activities FOR INSERT 
        WITH CHECK (auth.role() = 'authenticated');

-- From: 20240511_fix_customers_rls.sql
CREATE POLICY "Authenticated users can insert customers"
ON customers FOR INSERT
TO authenticated
WITH CHECK (true);

-- From: 20240511_fix_customers_rls.sql
CREATE POLICY "Authenticated users can update customers"
ON customers FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- From: 20240511_fix_customers_rls.sql
CREATE POLICY "Authenticated users can delete customers"
ON customers FOR DELETE
TO authenticated
USING (true);

-- From: 20240514000000_fix_staff_documents_performance.sql
CREATE POLICY IF NOT EXISTS "Staff can view their own documents" 
  ON public.staff_documents FOR SELECT 
  TO authenticated
  USING (
    staff_id IN (
      SELECT id FROM public.staff WHERE user_id = auth.uid()
    )
  );

-- From: 20240514000000_fix_staff_documents_performance.sql
CREATE POLICY IF NOT EXISTS "Staff can view their own reviews" 
  ON public.staff_performance_reviews FOR SELECT 
  TO authenticated
  USING (
    staff_id IN (
      SELECT id FROM public.staff WHERE user_id = auth.uid()
    )
  );

-- From: 20250319075720_holy_castle.sql
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- From: 20250319075720_holy_castle.sql
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- From: 20250319075726_ancient_sea.sql
CREATE POLICY "Users can insert own orders"
  ON orders
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- From: 20250319075726_ancient_sea.sql
CREATE POLICY "Users can insert own order items"
  ON order_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- From: 20250319124105_turquoise_block.sql
CREATE POLICY "Users can update own preferences"
  ON user_preferences
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- From: 20250319124105_turquoise_block.sql
CREATE POLICY "Users can insert own preferences"
  ON user_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- From: 20250319124105_turquoise_block.sql
CREATE POLICY "Users can insert own visits"
  ON user_visits
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- From: 20250319124105_turquoise_block.sql
CREATE POLICY "Users can manage own favorites"
  ON favorite_items
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- From: 20250319124105_turquoise_block.sql
CREATE POLICY "Users can insert own interactions"
  ON user_interactions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- From: 20250319130404_sparkling_block.sql
CREATE POLICY "Users can manage own demographics"
  ON user_demographics FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- From: 20250319130404_sparkling_block.sql
CREATE POLICY "Users can view own feedback"
  ON user_feedback FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- From: 20250319130404_sparkling_block.sql
CREATE POLICY "Users can insert own feedback"
  ON user_feedback FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- From: 20250319130404_sparkling_block.sql
CREATE POLICY "Users can view own segments"
  ON user_segments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- From: 20250319130404_sparkling_block.sql
CREATE POLICY "Users can view own promotion responses"
  ON promotion_responses FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- From: 20250324081436_proud_crystal.sql
CREATE POLICY "Staff can manage order items"
  ON order_items
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- From: 20250324133717_crystal_snowflake.sql
CREATE POLICY "Staff can manage orders"
  ON orders
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- From: 20250324133717_crystal_snowflake.sql
CREATE POLICY "Public can view order items"
  ON order_items
  FOR SELECT
  TO public
  USING (true);

-- From: 20250427081804_cool_grass.sql
CREATE POLICY "Staff can insert customers"
  ON customers
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- From: 20250427081804_cool_grass.sql
CREATE POLICY "Staff can update customers"
  ON customers
  FOR UPDATE
  TO authenticated
  USING (true);

-- From: 20250427081804_cool_grass.sql
CREATE POLICY "Staff can delete customers"
  ON customers
  FOR DELETE
  TO authenticated
  USING (true);

-- From: 20250427081804_cool_grass.sql
CREATE POLICY "Staff can insert tables"
  ON tables
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- From: 20250427081804_cool_grass.sql
CREATE POLICY "Staff can update tables"
  ON tables
  FOR UPDATE
  TO authenticated
  USING (true);

-- From: 20250427081804_cool_grass.sql
CREATE POLICY "Staff can delete tables"
  ON tables
  FOR DELETE
  TO authenticated
  USING (true);

-- From: 20250427081942_autumn_grove.sql
CREATE POLICY "Staff can insert orders"
ON orders FOR INSERT
TO authenticated
WITH CHECK (true);

-- From: 20250427081942_autumn_grove.sql
CREATE POLICY "Staff can update orders"
ON orders FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- From: 20250427081942_autumn_grove.sql
CREATE POLICY "Staff can delete orders"
ON orders FOR DELETE
TO authenticated
USING (true);

-- From: 20250427083816_humble_delta.sql
CREATE POLICY "Staff can update orders"
ON orders
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- From: 20250427083816_humble_delta.sql
CREATE POLICY "Staff can delete orders"
ON orders
FOR DELETE
TO authenticated
USING (true);

-- From: 20250427083816_humble_delta.sql
CREATE POLICY "Staff can view orders"
ON orders
FOR SELECT
TO authenticated
USING (true);

-- From: 20250427115045_silver_lake.sql
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- From: 20250427115045_silver_lake.sql
CREATE POLICY "Users can insert orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- From: 20250427115045_silver_lake.sql
CREATE POLICY "Users can update orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- From: 20250427115045_silver_lake.sql
CREATE POLICY "Users can manage order items"
  ON order_items FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- From: 20250427121441_damp_star.sql
CREATE POLICY "Authenticated users can manage order items"
ON order_items FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- From: 20250427121855_broken_fire.sql
CREATE POLICY "Counter staff can create orders"
ON orders
FOR INSERT
TO authenticated
WITH CHECK (
  -- Ensure required fields are present
  customer_name IS NOT NULL AND
  total_amount >= 0 AND
  (
    -- Either table number or order type must be specified
    table_number IS NOT NULL OR 
    order_type = 'takeaway'
  )
);

-- From: 20250427121855_broken_fire.sql
CREATE POLICY "Staff can update orders"
ON orders
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (
  -- Prevent modifications to completed orders
  status != 'delivered' AND
  status != 'cancelled'
);

-- From: 20250427121855_broken_fire.sql
CREATE POLICY "Staff can delete orders"
ON orders
FOR DELETE
TO authenticated
USING (
  -- Only allow deletion of pending orders
  status = 'pending'
);

-- From: 20250427160434_bold_sky.sql
CREATE POLICY "Staff can manage invoices"
  ON invoices FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- From: 20250427160434_bold_sky.sql
CREATE POLICY "Staff can manage invoice items"
  ON invoice_items FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- From: 20250503083933_solitary_glade.sql
CREATE POLICY "Staff can manage inventory"
  ON inventory FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- From: 20250503083933_solitary_glade.sql
CREATE POLICY "Staff can view transactions"
  ON inventory_transactions FOR SELECT
  TO authenticated
  USING (true);

-- From: 20250503083933_solitary_glade.sql
CREATE POLICY "Staff can insert transactions"
  ON inventory_transactions FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- From: 20250503101510_crystal_lagoon.sql
CREATE POLICY "Anyone can insert inventory"
  ON inventory FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- From: 20250503101510_crystal_lagoon.sql
CREATE POLICY "Anyone can update inventory"
  ON inventory FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- From: 20250503101510_crystal_lagoon.sql
CREATE POLICY "Anyone can delete inventory"
  ON inventory FOR DELETE
  TO authenticated
  USING (true);

-- From: 20250505090854_nameless_peak.sql
CREATE POLICY "Counter staff can manage inventory"
  ON inventory
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- From: 20250505090854_nameless_peak.sql
CREATE POLICY "Public can view transactions"
  ON inventory_transactions
  FOR SELECT
  TO public
  USING (true);

-- From: 20250505090854_nameless_peak.sql
CREATE POLICY "Public can insert transactions"
  ON inventory_transactions
  FOR INSERT
  TO public
  WITH CHECK (true);

-- From: 20250505122407_rough_salad.sql
CREATE POLICY "Admins can manage all staff"
  ON staff FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff s
      WHERE s.user_id = auth.uid()
      AND s.role = 'admin'
    )
  );

-- From: 20250505122407_rough_salad.sql
CREATE POLICY "Admins can view all activity logs"
  ON staff_activity_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff s
      WHERE s.user_id = auth.uid()
      AND s.role = 'admin'
    )
  );

-- From: 20250505122407_rough_salad.sql
CREATE POLICY "Staff can record own attendance"
  ON staff_attendance FOR INSERT
  TO authenticated
  WITH CHECK (
    staff_id IN (
      SELECT id FROM staff WHERE user_id = auth.uid()
    )
  );

-- From: 20250505122407_rough_salad.sql
CREATE POLICY "Admins can manage all attendance"
  ON staff_attendance FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff s
      WHERE s.user_id = auth.uid()
      AND s.role = 'admin'
    )
  );

-- From: 20250506081741_twilight_wind.sql
CREATE POLICY "Staff can view own performance"
  ON staff_performance FOR SELECT
  TO authenticated
  USING (staff_id IN (SELECT id FROM staff WHERE user_id = auth.uid()));

-- From: 20250506081741_twilight_wind.sql
CREATE POLICY "Staff can view own training"
  ON staff_training FOR SELECT
  TO authenticated
  USING (staff_id IN (SELECT id FROM staff WHERE user_id = auth.uid()));

-- From: 20250506081741_twilight_wind.sql
CREATE POLICY "Staff can view own payroll"
  ON staff_payroll FOR SELECT
  TO authenticated
  USING (staff_id IN (SELECT id FROM staff WHERE user_id = auth.uid()));

-- From: 20250506081741_twilight_wind.sql
CREATE POLICY "Staff can manage own leave"
  ON staff_leave FOR ALL
  TO authenticated
  USING (staff_id IN (SELECT id FROM staff WHERE user_id = auth.uid()));

-- From: 20250506081741_twilight_wind.sql
CREATE POLICY "Staff can view own documents"
  ON staff_documents FOR SELECT
  TO authenticated
  USING (staff_id IN (SELECT id FROM staff WHERE user_id = auth.uid()));

-- From: 20250506081741_twilight_wind.sql
CREATE POLICY "Staff can manage own communications"
  ON staff_communications FOR ALL
  TO authenticated
  USING (sender_id IN (SELECT id FROM staff WHERE user_id = auth.uid()) OR 
         recipient_id IN (SELECT id FROM staff WHERE user_id = auth.uid()));

-- From: 20250510112345_database_optimization.sql
CREATE POLICY "Staff can manage orders"
      ON orders FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);

-- From: 20250510112345_database_optimization.sql
CREATE POLICY "Staff can manage order items"
      ON order_items FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);

-- From: 20250510153000_staff_enhancement.sql
CREATE POLICY "Admin users can manage staff"
  ON staff
  USING (auth.role() IN ('service_role', 'authenticated') AND EXISTS (
    SELECT 1 FROM staff s
    WHERE s.user_id = auth.uid() AND s.role = 'admin'
  ));

-- From: 20250510153000_staff_enhancement.sql
CREATE POLICY "Staff can view their own documents"
  ON staff_documents
  FOR SELECT
  USING (
    auth.uid()::text IN (
      SELECT user_id::text FROM staff WHERE id = staff_documents.staff_id
    )
  );

-- From: 20250510153000_staff_enhancement.sql
CREATE POLICY "Admin can view all staff documents"
  ON staff_documents
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM staff WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- From: 20250512000000_public_access_performance_reviews.sql
CREATE POLICY "Public can insert performance reviews" 
ON public.staff_performance_reviews FOR INSERT 
TO public
WITH CHECK (true);

-- From: 20250512000000_public_access_performance_reviews.sql
CREATE POLICY "Public can update performance reviews" 
ON public.staff_performance_reviews FOR UPDATE 
TO public
USING (true)
WITH CHECK (true);

-- From: 20250512000000_public_access_performance_reviews.sql
CREATE POLICY "Public can delete performance reviews" 
ON public.staff_performance_reviews FOR DELETE 
TO public
USING (true);

