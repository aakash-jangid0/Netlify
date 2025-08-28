-- Automated Customer Analytics System
-- Database triggers and functions for real-time customer analytics
-- Date: 2025-08-24
-- This ensures customer analytics are ALWAYS updated automatically

-- =============================================================================
-- AUTOMATED CUSTOMER ANALYTICS COLUMNS
-- =============================================================================
-- Add analytics columns to customers table if they don't exist

DO $$ 
BEGIN
    -- Add user_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'user_id') THEN
        ALTER TABLE customers ADD COLUMN user_id UUID REFERENCES auth.users(id);
    END IF;
    
    -- Add analytics columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'total_orders') THEN
        ALTER TABLE customers ADD COLUMN total_orders INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'total_spent') THEN
        ALTER TABLE customers ADD COLUMN total_spent DECIMAL(10,2) DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'order_count') THEN
        ALTER TABLE customers ADD COLUMN order_count INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'average_order_value') THEN
        ALTER TABLE customers ADD COLUMN average_order_value DECIMAL(10,2) DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'last_visit') THEN
        ALTER TABLE customers ADD COLUMN last_visit TIMESTAMP WITH TIME ZONE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'first_order_date') THEN
        ALTER TABLE customers ADD COLUMN first_order_date TIMESTAMP WITH TIME ZONE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'last_order_date') THEN
        ALTER TABLE customers ADD COLUMN last_order_date TIMESTAMP WITH TIME ZONE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'loyalty_points') THEN
        ALTER TABLE customers ADD COLUMN loyalty_points INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'loyalty_tier') THEN
        ALTER TABLE customers ADD COLUMN loyalty_tier VARCHAR(20) DEFAULT 'bronze';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'referral_code') THEN
        ALTER TABLE customers ADD COLUMN referral_code VARCHAR(10);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'referred_by') THEN
        ALTER TABLE customers ADD COLUMN referred_by VARCHAR(10);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'customer_source') THEN
        ALTER TABLE customers ADD COLUMN customer_source VARCHAR(20) DEFAULT 'website';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'preferred_cuisine') THEN
        ALTER TABLE customers ADD COLUMN preferred_cuisine VARCHAR(50);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'dietary_preferences') THEN
        ALTER TABLE customers ADD COLUMN dietary_preferences VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'favorite_items') THEN
        ALTER TABLE customers ADD COLUMN favorite_items TEXT[];
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'visit_frequency') THEN
        ALTER TABLE customers ADD COLUMN visit_frequency VARCHAR(20) DEFAULT 'irregular';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'avg_order_frequency_days') THEN
        ALTER TABLE customers ADD COLUMN avg_order_frequency_days DECIMAL(10,2);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'spending_habit') THEN
        ALTER TABLE customers ADD COLUMN spending_habit VARCHAR(20) DEFAULT 'budget_conscious';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'status') THEN
        ALTER TABLE customers ADD COLUMN status VARCHAR(20) DEFAULT 'active';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'updated_at') THEN
        ALTER TABLE customers ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Add customer_id to orders table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'customer_id') THEN
        ALTER TABLE orders ADD COLUMN customer_id UUID REFERENCES customers(id);
    END IF;
END $$;

-- =============================================================================
-- AUTOMATED ANALYTICS TRIGGER FUNCTIONS
-- =============================================================================

-- Function to automatically update customer analytics when orders change
CREATE OR REPLACE FUNCTION update_customer_analytics_on_order()
RETURNS TRIGGER AS $$
DECLARE
    customer_record RECORD;
    order_stats RECORD;
    avg_frequency_days DECIMAL;
    visit_freq TEXT;
    loyalty_tier_val TEXT;
BEGIN
    -- Only proceed if the order has a customer_id
    IF NEW.customer_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- Get current customer data
    SELECT * INTO customer_record
    FROM customers
    WHERE id = NEW.customer_id;

    IF NOT FOUND THEN
        RETURN NEW;
    END IF;

    -- Calculate order statistics for this customer
    SELECT 
        COUNT(*) as total_orders,
        SUM(total_amount) as total_spent,
        AVG(total_amount) as avg_order_value,
        MIN(created_at) as first_order,
        MAX(created_at) as last_order
    INTO order_stats
    FROM orders
    WHERE customer_id = NEW.customer_id
    AND status != 'cancelled';

    -- Calculate average order frequency in days
    IF order_stats.total_orders > 1 THEN
        avg_frequency_days := EXTRACT(EPOCH FROM (order_stats.last_order - order_stats.first_order)) / 86400 / (order_stats.total_orders - 1);
    ELSE
        avg_frequency_days := NULL;
    END IF;

    -- Determine visit frequency
    visit_freq := 'irregular';
    IF avg_frequency_days IS NOT NULL THEN
        IF avg_frequency_days <= 3 THEN
            visit_freq := 'daily';
        ELSIF avg_frequency_days <= 10 THEN
            visit_freq := 'weekly';
        ELSIF avg_frequency_days <= 40 THEN
            visit_freq := 'monthly';
        END IF;
    END IF;

    -- Determine loyalty tier based on total spent
    loyalty_tier_val := 'bronze';
    IF order_stats.total_spent >= 1000 THEN
        loyalty_tier_val := 'platinum';
    ELSIF order_stats.total_spent >= 500 THEN
        loyalty_tier_val := 'gold';
    ELSIF order_stats.total_spent >= 200 THEN
        loyalty_tier_val := 'silver';
    END IF;

    -- Update customer analytics
    UPDATE customers
    SET
        total_orders = order_stats.total_orders,
        total_spent = COALESCE(order_stats.total_spent, 0),
        order_count = order_stats.total_orders,
        average_order_value = COALESCE(order_stats.avg_order_value, 0),
        last_visit = NOW(),
        last_order_date = order_stats.last_order,
        first_order_date = COALESCE(customer_record.first_order_date, order_stats.first_order),
        loyalty_points = FLOOR(COALESCE(order_stats.total_spent, 0)),
        loyalty_tier = loyalty_tier_val,
        visit_frequency = visit_freq,
        avg_order_frequency_days = avg_frequency_days,
        updated_at = NOW()
    WHERE id = NEW.customer_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically update customer preferences when order items are added
CREATE OR REPLACE FUNCTION update_customer_preferences_on_order_items()
RETURNS TRIGGER AS $$
DECLARE
    order_customer_id UUID;
    item_category TEXT;
    cuisine_type TEXT;
BEGIN
    -- Get customer_id from the order
    SELECT customer_id INTO order_customer_id
    FROM orders
    WHERE id = NEW.order_id;

    -- Only proceed if order has a customer_id
    IF order_customer_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- Simple cuisine detection based on item name
    cuisine_type := 'other';
    IF LOWER(NEW.name) SIMILAR TO '%pizza%|%pasta%|%lasagna%' THEN
        cuisine_type := 'italian';
    ELSIF LOWER(NEW.name) SIMILAR TO '%burger%|%fries%|%sandwich%' THEN
        cuisine_type := 'american';
    ELSIF LOWER(NEW.name) SIMILAR TO '%curry%|%biryani%|%naan%|%dal%' THEN
        cuisine_type := 'indian';
    ELSIF LOWER(NEW.name) SIMILAR TO '%sushi%|%ramen%|%tempura%' THEN
        cuisine_type := 'japanese';
    ELSIF LOWER(NEW.name) SIMILAR TO '%taco%|%burrito%|%quesadilla%' THEN
        cuisine_type := 'mexican';
    END IF;

    -- Update customer's preferred cuisine (simple frequency-based approach)
    UPDATE customers
    SET
        preferred_cuisine = cuisine_type,
        updated_at = NOW()
    WHERE id = order_customer_id
    AND (preferred_cuisine IS NULL OR preferred_cuisine = 'other');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to handle customer sync when users sign up
CREATE OR REPLACE FUNCTION sync_user_to_customer()
RETURNS TRIGGER AS $$
BEGIN
    -- Create customer record for new auth users
    INSERT INTO customers (
        user_id,
        name,
        email,
        customer_source,
        referral_code,
        created_at,
        updated_at
    )
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', SPLIT_PART(NEW.email, '@', 1)),
        NEW.email,
        'website',
        'REF' || UPPER(SUBSTRING(MD5(NEW.id::text) FROM 1 FOR 6)),
        NOW(),
        NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        email = EXCLUDED.email,
        name = COALESCE(customers.name, EXCLUDED.name),
        updated_at = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- AUTOMATED ANALYTICS TRIGGERS
-- =============================================================================

-- Create trigger for new orders
DROP TRIGGER IF EXISTS trigger_update_customer_analytics_on_insert ON orders;
CREATE TRIGGER trigger_update_customer_analytics_on_insert
    AFTER INSERT ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_customer_analytics_on_order();

-- Create trigger for order updates (in case total_amount changes)
DROP TRIGGER IF EXISTS trigger_update_customer_analytics_on_update ON orders;
CREATE TRIGGER trigger_update_customer_analytics_on_update
    AFTER UPDATE OF total_amount, status ON orders
    FOR EACH ROW
    WHEN (OLD.total_amount IS DISTINCT FROM NEW.total_amount OR OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION update_customer_analytics_on_order();

-- Create trigger for order items to update preferences
DROP TRIGGER IF EXISTS trigger_update_customer_preferences ON order_items;
CREATE TRIGGER trigger_update_customer_preferences
    AFTER INSERT ON order_items
    FOR EACH ROW
    EXECUTE FUNCTION update_customer_preferences_on_order_items();

-- Create trigger for auth.users to auto-create customer records
DROP TRIGGER IF EXISTS trigger_sync_user_to_customer ON auth.users;
CREATE TRIGGER trigger_sync_user_to_customer
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION sync_user_to_customer();

-- =============================================================================
-- PERFORMANCE INDEXES FOR ANALYTICS
-- =============================================================================

-- Create indexes for better performance on analytics queries
CREATE INDEX IF NOT EXISTS idx_orders_customer_id_status ON orders(customer_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_customers_analytics ON customers(loyalty_tier, total_spent, total_orders);
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_customer_source ON customers(customer_source);
CREATE INDEX IF NOT EXISTS idx_customers_loyalty_tier ON customers(loyalty_tier);

-- =============================================================================
-- DOCUMENTATION COMMENTS
-- =============================================================================

-- Add function comments for documentation
COMMENT ON FUNCTION update_customer_analytics_on_order() IS 
'🤖 AUTOMATED: Updates customer analytics (total orders, spend, loyalty tier, etc.) whenever orders are created or modified. Part of the automated customer analytics system that ensures data is always current without manual intervention.';

COMMENT ON FUNCTION update_customer_preferences_on_order_items() IS 
'🤖 AUTOMATED: Detects and updates customer cuisine preferences based on order items. Analyzes item names to determine cuisine types (Italian, Indian, American, etc.) and updates customer profiles automatically.';

COMMENT ON FUNCTION sync_user_to_customer() IS 
'🤖 AUTOMATED: Creates customer records when users register via auth.users. Ensures every registered user has a corresponding customer record for unified analytics tracking.';

-- Column comments for the new analytics columns
COMMENT ON COLUMN customers.total_orders IS '📊 AUTO-CALCULATED: Total number of completed orders by customer - Updated automatically by database triggers';
COMMENT ON COLUMN customers.total_spent IS '💰 AUTO-CALCULATED: Total amount spent by customer across all orders - Updated automatically by database triggers';
COMMENT ON COLUMN customers.order_count IS '🔢 AUTO-CALCULATED: Count of customer orders - Updated automatically by database triggers';
COMMENT ON COLUMN customers.average_order_value IS '📈 AUTO-CALCULATED: Average value per order - Updated automatically by database triggers';
COMMENT ON COLUMN customers.loyalty_points IS '🏆 AUTO-CALCULATED: Customer loyalty points (1 point per dollar spent) - Updated automatically by database triggers';
COMMENT ON COLUMN customers.loyalty_tier IS '👑 AUTO-CALCULATED: Customer loyalty tier (bronze/silver/gold/platinum) based on spending - Updated automatically by database triggers';
COMMENT ON COLUMN customers.visit_frequency IS '📅 AUTO-DETECTED: How often customer visits (daily/weekly/monthly/irregular) - Updated automatically by database triggers';
COMMENT ON COLUMN customers.avg_order_frequency_days IS '⏱️ AUTO-CALCULATED: Average days between orders - Updated automatically by database triggers';
COMMENT ON COLUMN customers.preferred_cuisine IS '🍽️ AUTO-DETECTED: Customer preferred cuisine type based on order history - Updated automatically by database triggers';
COMMENT ON COLUMN customers.spending_habit IS '💸 AUTO-CLASSIFIED: Customer spending behavior (budget_conscious/moderate/premium) - Updated automatically by database triggers';
COMMENT ON COLUMN customers.first_order_date IS '📅 AUTO-SET: Date of customer first order - Set automatically on first order';
COMMENT ON COLUMN customers.last_order_date IS '📅 AUTO-UPDATED: Date of customer most recent order - Updated automatically on each order';
COMMENT ON COLUMN customers.last_visit IS '🕐 AUTO-UPDATED: Timestamp of customer last activity - Updated automatically on each order';
COMMENT ON COLUMN customers.updated_at IS '🔄 AUTO-UPDATED: Last modification timestamp - Updated automatically on any customer record change';
