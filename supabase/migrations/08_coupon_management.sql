/*
  # 08_coupon_management.sql - Complete Coupon System
  
  This migration creates a comprehensive coupon system including:
  - Coupons table with all necessary fields
  - Coupon-related columns in orders table
  - Coupon usage tracking function
  - Indexes and constraints for optimal performance
  
  Consolidated from: 08_restore_coupon_columns.sql, 09_increment_coupon_usage_function.sql, 14_coupons_table.sql
  Generated: 2025-05-31
*/

-- Create coupons table
CREATE TABLE IF NOT EXISTS coupons (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount')),
    discount_value DECIMAL(10, 2) NOT NULL,
    min_order_amount DECIMAL(10, 2) DEFAULT 0,
    max_discount_amount DECIMAL(10, 2),
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    expiry_date TIMESTAMP WITH TIME ZONE NOT NULL,
    usage_limit INTEGER,
    usage_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    description TEXT,
    applies_to VARCHAR(20) DEFAULT 'all' CHECK (applies_to IN ('all', 'specific_items', 'specific_categories')),
    eligible_items JSONB,
    eligible_categories JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add coupon-related columns to orders table
ALTER TABLE public.orders 
  ADD COLUMN IF NOT EXISTS coupon_code TEXT,
  ADD COLUMN IF NOT EXISTS coupon_id INTEGER REFERENCES coupons(id),
  ADD COLUMN IF NOT EXISTS coupon_discount_amount NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS coupon_discount_type TEXT DEFAULT 'percentage',
  ADD COLUMN IF NOT EXISTS coupon_discount_value NUMERIC DEFAULT 0;

-- Create indexes for optimal performance
CREATE INDEX IF NOT EXISTS idx_coupon_code ON coupons(code);
CREATE INDEX IF NOT EXISTS orders_coupon_code_idx ON public.orders(coupon_code);
CREATE INDEX IF NOT EXISTS orders_coupon_id_idx ON public.orders(coupon_id);

-- Add constraints
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'coupon_discount_non_negative' 
    AND table_name = 'orders'
  ) THEN
    ALTER TABLE public.orders 
      ADD CONSTRAINT coupon_discount_non_negative 
      CHECK (coupon_discount_amount >= 0);
  END IF;
END $$;

-- Create increment_coupon_usage function
CREATE OR REPLACE FUNCTION increment_coupon_usage(coupon_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Increment the usage_count for the specified coupon
  UPDATE coupons 
  SET usage_count = COALESCE(usage_count, 0) + 1,
      updated_at = NOW()
  WHERE id = coupon_id;
  
  -- Verify the coupon exists, raise exception if not found
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Coupon with id % not found', coupon_id;
  END IF;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION increment_coupon_usage(UUID) TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE coupons IS 'Stores coupon information for discount management';
COMMENT ON COLUMN public.orders.coupon_code IS 'Coupon code used for this order - restored for application compatibility';
COMMENT ON COLUMN public.orders.coupon_id IS 'Foreign key reference to coupons table';
COMMENT ON COLUMN public.orders.coupon_discount_amount IS 'Amount discounted through coupon application';
COMMENT ON FUNCTION increment_coupon_usage(UUID) IS 'Increments usage count for a specific coupon when applied to an order';
